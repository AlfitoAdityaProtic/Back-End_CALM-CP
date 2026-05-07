// socket.js

let io;

const initSocket = (server) => {
  const { Server } = require("socket.io");

  io = new Server(server, {
    cors: {
      origin: [
        "http://localhost:5173",
        "https://mycalmspace.online",
        "https://www.mycalmspace.online",
      ],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("join_admin_dashboard", () => {
      socket.join("admin_dashboard");
      console.log("Admin joined dashboard room");
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error("Socket.io belum diinisialisasi");
  }

  return io;
};

module.exports = {
  initSocket,
  getIO,
};
