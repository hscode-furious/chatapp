import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
  },
});

const userSocket = {};

export const getReceiverSocketId = (userId) => {
  return userSocket[userId];
};

io.on("connection", (socket) => {
  console.log("user connected", socket.id);

  const userId = socket.handshake.query.userId;
  
  // Validate userId exists before storing
  if (userId) {
    userSocket[userId] = socket.id;
    console.log(`User ${userId} connected with socket ${socket.id}`);
  } else {
    console.warn("Connection attempt without userId");
    socket.disconnect();
    return;
  }
  
  io.emit("getOnlineUsers", Object.keys(userSocket));

  socket.on("disconnect", () => {
    console.log("user disconnected", socket.id);
    if (userId) {
      delete userSocket[userId];
      io.emit("getOnlineUsers", Object.keys(userSocket));
    }
  });
});
export { app, server, io };