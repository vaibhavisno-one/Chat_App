import { Server } from "socket.io";
import http from "http";
import express from "express";
import User from "../models/user.model.js"; // Needed to fetch user's team on initial connection

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    methods: ["GET", "POST"],
  },
});

const userSocketMap = {}; // { userId: socketId }

export const getReceiverSocketId = (receiverId) => {
  return userSocketMap[receiverId];
};

io.on("connection", async (socket) => {
  console.log("A user connected:", socket.id);
  const userId = socket.handshake.query.userId;

  if (userId && userId !== "undefined") {
    userSocketMap[userId] = socket.id;
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
    console.log(`User ${userId} connected, socket ID: ${socket.id}. Online users:`, Object.keys(userSocketMap));

    // --- Automatic room joining on connection based on user's current team ---
    try {
      const user = await User.findById(userId).select("team"); // Fetch user with their team ID
      if (user && user.team) {
        const teamId = user.team.toString();
        socket.join(teamId);
        socket.currentTeamRoom = teamId; // Store current team room on socket object
        console.log(`Socket ${socket.id} for user ${userId} automatically joined room ${teamId}`);
      }
    } catch (error) {
      console.error(`Error fetching user ${userId} for auto room joining:`, error.message);
    }
    // --- End automatic room joining ---
  }

  socket.on("joinTeamRoom", (teamId) => {
    if (socket.currentTeamRoom && socket.currentTeamRoom !== teamId) {
      socket.leave(socket.currentTeamRoom); // Leave previous room if any
      console.log(`Socket ${socket.id} left room ${socket.currentTeamRoom}`);
    }
    socket.join(teamId);
    socket.currentTeamRoom = teamId; // Store current team for this socket
    console.log(`Socket ${socket.id} joined room ${teamId}`);
  });

  socket.on("leaveTeamRoom", (teamId) => {
    socket.leave(teamId);
    if (socket.currentTeamRoom === teamId) {
      socket.currentTeamRoom = null; // Clear stored team room
    }
    console.log(`Socket ${socket.id} left room ${teamId}`);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    if (userId && userId !== "undefined") {
      delete userSocketMap[userId];
      io.emit("getOnlineUsers", Object.keys(userSocketMap));
      console.log(`User ${userId} disconnected. Online users:`, Object.keys(userSocketMap));
    }
    // No need to explicitly leave 'socket.currentTeamRoom' here if relying on Socket.IO's auto-cleanup on disconnect.
    // However, if managing room state more explicitly, you might do it here.
    // Socket.IO automatically removes the socket from all rooms it was part of upon disconnection.
  });
});

export { io, server, app };
