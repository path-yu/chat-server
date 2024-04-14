// server.js

import { Application, Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { db } from "./firebase.ts";
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "https://www.gstatic.com/firebasejs/9.8.1/firebase-firestore.js";
import { AccessToken } from "npm:livekit-server-sdk";
interface MyWebSocket extends WebSocket {
  userId: string;
  chatsId: string[];
}
interface RTCWebSocket extends WebSocket {
  userId: string;
  chatId: string;
}
const connectedClients = new Map<string, MyWebSocket>();
const app = new Application();
const port = 8080;
const router = new Router();

// send a message to all connected clients
function sendMessage(message: string, clientId: string) {
  const client = connectedClients.get(clientId);
  if (client) {
    client.send(message);
  }
}
const allUser = await getDocs(collection(db, "Users"));
allUser.forEach((user: any) => {
  updateDoc(doc(db, "Users", user.id), {
    online: false,
  });
}, null);
function sendJoinOrLeaveEvent(chatsId: string[], type: string, userId: string) {
  chatsId.forEach((chatId) => {
    const chat = getDoc(doc(db, "chats", chatId));
    chat.then((chat) => {
      const chatData = chat.data();
      if (chatData) {
        const chatIds = [];
        const receiveUid =
          userId === chatData["uid"] ? chatData["targetUid"] : chatData["uid"];
        if (connectedClients.get(receiveUid)) {
          chatIds.push(chat.id);
        }
        sendMessage(
          JSON.stringify({
            type,
            chatIds,
          }),
          receiveUid
        );
      }
    });
  });
}
// 在 WebSocket 服务器上添加监听器
router.get("/start_web_socket", async (ctx) => {
  const upgrade = ctx.request.headers.get("upgrade") || "";
  if (upgrade.toLowerCase() != "websocket") {
    return (ctx.response.body = {
      message: "request isn't trying to upgrade to websocket.",
    });
  }
  const socket = (await ctx.upgrade()) as MyWebSocket;
  const userId = ctx.request.url.searchParams.get("userId")!;
  if (!userId) {
    return socket.close(1008, "userId params is required");
  }
  const user = await getDoc(doc(db, "Users", userId));

  if (!user.data()?.["chats"]) {
    return socket.close(1008, "no chat data");
  }
  socket.chatsId = user.data()["chats"];
  socket.userId = userId;
  connectedClients.set(userId, socket);
  console.log(`New client connected: ${userId}`);

  await updateDoc(doc(db, "Users", userId), {
    online: true,
  });
  sendJoinOrLeaveEvent(socket.chatsId, "userJoinedConnected", userId);

  // broadcast the active users list when a new user logs in
  socket.onopen = () => {
    console.log("open");
  };

  // when a client disconnects, remove them from the connected clients list
  // and broadcast the active users list
  socket.onclose = async () => {
    console.log(`disconnected Client ${socket.userId} `);
    connectedClients.delete(socket.userId);
    await updateDoc(doc(db, "Users", userId), {
      online: false,
    });
    sendJoinOrLeaveEvent(socket.chatsId, "userDisconnected", userId);
  };

  // broadcast new message if someone sent one
  socket.onmessage = (message) => {
    if (!connectedClients.has(userId)) {
      return;
    }
    const data = JSON.parse(message.data);
    if (data["type"] === "isTyping") {
      sendMessage(
        JSON.stringify({
          type: "isTyping",
          value: data["value"],
        }),
        data["receiveUid"]
      );
    }
    if (data["type"] === "newCall") {
      sendMessage(
        JSON.stringify({
          type: "newCall",
          value: data["value"],
          receiveUid: data["receiveUid"],
        }),
        data["receiveUid"]
      );
    }
    if (data["type"] == "changeCallStatus") {
      sendMessage(
        JSON.stringify({
          type: "changeCallStatus",
          value: data["value"],
          receiveUid: data["receiveUid"],
        }),
        data["receiveUid"]
      );
    }
    if (data["type"] === "endCall") {
      sendMessage(
        JSON.stringify({
          type: "endCall",
          value: data["value"],
          receiveUid: data["receiveUid"],
        }),
        data["receiveUid"]
      );
    }
  };
});

router.get("/getToken", (ctx) => {
  // client joins
  const roomName = ctx.request.url.searchParams.get("roomName") || "roomName";
  const participantName =
    ctx.request.url.searchParams.get("participantName") ||
    "quickstart-username";

  const at = new AccessToken(
    "APIFD3tjkTryJj9",
    "5yEOI00VP86QDg0GXUQJhTTMNP1ErIq0aIg19nExKFB",
    {
      identity: participantName,
    }
  );
  at.addGrant({ roomJoin: true, room: roomName });
  ctx.response.body = at.toJwt();
});
app.use(oakCors()); // Enable CORS for All Routes
app.use(router.routes());
app.use(router.allowedMethods());

console.info("CORS-enabled web server listening on port 8000");
console.log("Listening at http://localhost:" + port);
await app.listen({ port });
