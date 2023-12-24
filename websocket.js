const clients = {};
const wsPort = 3002;
const { WebSocketServer } = require("ws");
const wss = new WebSocketServer({ port: wsPort });

wss.on("connection", async (ws, req) => {
  ws.send("success");
  ws.on("message", (message) => {
    console.log("接受到message", message.toString());
  });
  ws.on("close", async () => {
    console.log("socket连接关闭");
  });
  ws.on("error", async (error) => {
    console.log(error, "socket连接异常");
  });
});
// 在 WebSocket 服务器上添加监听器
wss.on("listening", () => {
  console.log(`WebSocket server is listening on port ${wsPort}`);
});
