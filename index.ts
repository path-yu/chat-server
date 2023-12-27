// server.js
import {
  WebSocketClient,
  WebSocketServer,
} from "https://deno.land/x/websocket@v0.1.4/mod.ts";
import { db } from "./firebase.ts";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "https://www.gstatic.com/firebasejs/9.8.1/firebase-firestore.js";
interface MyWebSocket extends WebSocketClient {
  userId: string;
  chatsId: string[];
}
const connectedClients = new Map<string, MyWebSocket>();

const port = 8080;

// send a message to all connected clients
function sendMessage(message: string, clientId: string) {
  const client = connectedClients.get(clientId);
  if (client && !client.isClosed) {
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
const wss = new WebSocketServer(8081);
// 在 WebSocket 服务器上添加监听器

wss.on("connection", async function (ws: MyWebSocket, url) {
  const userId = new URLSearchParams(url.split("?")[1]).get("userId")!;
  if (!userId) {
    return ws.close(1008, "userId params is required");
  }
  const user = await getDoc(doc(db, "Users", userId));
  ws.chatsId = user.data()["chats"];
  ws.userId = userId;
  connectedClients.set(userId, ws);
  console.log(`New client connected: ${userId}`);

  await updateDoc(doc(db, "Users", userId), {
    online: true,
  });
  sendJoinOrLeaveEvent(ws.chatsId, "userJoinedConnected", userId);
  ws.on("message", function (message: string) {
    const data = JSON.parse(message);
    console.log(data);

    if (data["type"] === "isTyping") {
      sendMessage(
        JSON.stringify({
          type: "isTyping",
          value: data["value"],
        }),
        data["receiveUid"]
      );
    }
    if (connectedClients.has(userId)) {
      return;
    }
  });
  ws.on("close", async function () {
    console.log(`disconnected Client ${ws.userId} `);
    connectedClients.delete(ws.userId);
    await updateDoc(doc(db, "Users", userId), {
      online: false,
    });
    sendJoinOrLeaveEvent(ws.chatsId, "userDisconnected", userId);
  });
});

console.log("WebSocketServer at http://localhost:" + port);
