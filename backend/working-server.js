#!/usr/bin/env node

// Working server with proper process management
console.log('🚀 Starting working development server...');

// Set environment variables
process.env.JWT_SECRET = "d025759c2e4401b031c3a1ebde2dc98ebdf8d0f878ef4c376453dcfbd7955536";
process.env.DB_USER = "vistapro_user";
process.env.DB_PASSWORD = "vistapro_password";
process.env.DB_HOST = "localhost";
process.env.DB_PORT = "5433";
process.env.DB_NAME = "vistapro_dev";
process.env.PORT = "5005";
process.env.NODE_ENV = "development";
process.env.MASTER_ADMIN_SECRET_KEY = "7336EB1D45315";

// Handle all uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  console.error('Stack:', error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Keep the process alive
process.stdin.resume();

async function startServer() {
  try {
    console.log('1. Loading app...');
    const app = require('./src/app');
    
    console.log('2. Loading database...');
    const { connectDB } = require('./src/config/database');
    
    console.log('3. Loading socket...');
    const http = require('http');
    const { initSocket } = require('./src/socket');
    
    console.log('4. Creating server...');
    const server = http.createServer(app);
    const io = initSocket(server);
    
    console.log('5. Setting up socket events...');
    io.on("connection", (socket) => {
      console.log(`New client connected: ${socket.id}`);
      
      socket.on("send-message", (messageData) => {
        io.emit("receive-message", messageData);
      });
      
      socket.on("disconnect", () => {
        console.log(`Client disconnected: ${socket.id}`);
      });
    });
    
    // Socket room joining
    io.on("connection", socket => {
      const { userUniqueId } = socket.handshake.query;
      if (userUniqueId) {
        socket.join(`marketer:${userUniqueId}`);
      }
    });
    
    app.set("socketio", io);
    
    console.log('6. Connecting to database...');
    await connectDB();
    console.log('✅ Database connected');
    
    console.log('7. Starting server...');
    const PORT = process.env.PORT || 5005;
    
    return new Promise((resolve, reject) => {
      server.listen(PORT, '0.0.0.0', () => {
        console.log(`✅ Server running on port ${PORT}`);
        console.log(`✅ Server is ready to accept connections!`);
        console.log(`✅ API available at: http://localhost:${PORT}/api`);
        console.log(`✅ Health check: http://localhost:${PORT}/health`);
        console.log(`✅ SuperAdmin orders: http://localhost:${PORT}/api/super-admin/orders/history`);
        resolve(server);
      });
      
      server.on('error', (error) => {
        console.error('❌ Server error:', error);
        if (error.code === 'EADDRINUSE') {
          console.error(`❌ Port ${PORT} is already in use`);
        }
        reject(error);
      });
    });
    
  } catch (error) {
    console.error('❌ Error during startup:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Start the server
startServer().then((server) => {
  console.log('🎉 Server started successfully!');
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('🛑 Shutting down server...');
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  });
  
  process.on('SIGTERM', () => {
    console.log('🛑 Shutting down server...');
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  });
}).catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});
