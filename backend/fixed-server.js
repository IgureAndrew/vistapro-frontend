// Fixed server startup with proper error handling
console.log('🚀 Starting fixed development server...');

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  console.error('Stack:', error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

try {
  console.log('1. Loading environment...');
  require('dotenv').config();
  
  console.log('2. Loading app...');
  const app = require('./src/app');
  
  console.log('3. Loading database...');
  const { connectDB } = require('./src/config/database');
  
  console.log('4. Loading socket...');
  const http = require('http');
  const { initSocket } = require('./src/socket');
  
  console.log('5. Creating server...');
  const server = http.createServer(app);
  const io = initSocket(server);
  
  console.log('6. Setting up socket events...');
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
  
  console.log('7. Connecting to database...');
  connectDB()
    .then(() => {
      console.log('8. Starting server...');
      const PORT = process.env.PORT || 5005;
      
      server.listen(PORT, '0.0.0.0', () => {
        console.log(`✅ Server running on port ${PORT}`);
        console.log(`✅ Server is ready to accept connections!`);
        console.log(`✅ API available at: http://localhost:${PORT}/api`);
        console.log(`✅ SuperAdmin orders: http://localhost:${PORT}/api/super-admin/orders/history`);
      });
      
      // Add error handling for server
      server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
          console.error(`❌ Port ${PORT} is already in use`);
        } else {
          console.error('❌ Server error:', error);
        }
        process.exit(1);
      });
      
      // Add health check endpoint
      app.get('/health', (req, res) => {
        res.json({ status: 'OK', timestamp: new Date().toISOString() });
      });
      
    })
    .catch((error) => {
      console.error('❌ Database connection failed:', error);
      process.exit(1);
    });
    
} catch (error) {
  console.error('❌ Error during startup:', error);
  console.error('Stack:', error.stack);
  process.exit(1);
}
