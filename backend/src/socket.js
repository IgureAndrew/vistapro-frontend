// src/socket.js
const { Server } = require('socket.io');

let io;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: [
        'https://vistapro.ng',      // your production frontend (no www)
        'https://www.vistapro.ng',  // keep if you also host with www
        'https://vistapro-frontend.vercel.app',  // Vercel deployment
        'http://localhost:5173'     // local dev
      ],
      methods: ['GET', 'POST', 'OPTIONS'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log(`New client connected: ${socket.id}`);

    socket.on('register', (uniqueId) => {
      socket.join(uniqueId);
      console.log(`Socket ${socket.id} joined room ${uniqueId}`);
    });

    // Real-time messaging events
    socket.on('join_conversation', (data) => {
      const { userId, contactId } = data;
      const roomName = `conversation_${Math.min(userId, contactId)}_${Math.max(userId, contactId)}`;
      socket.join(roomName);
      console.log(`Socket ${socket.id} joined conversation room: ${roomName}`);
    });

    socket.on('leave_conversation', (data) => {
      const { userId, contactId } = data;
      const roomName = `conversation_${Math.min(userId, contactId)}_${Math.max(userId, contactId)}`;
      socket.leave(roomName);
      console.log(`Socket ${socket.id} left conversation room: ${roomName}`);
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

function getIo() {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
}

module.exports = { initSocket, getIo };
