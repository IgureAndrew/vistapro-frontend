#!/usr/bin/env node

// Working development startup script
console.log('🚀 Starting WORKING development server...');

// Set environment variables
process.env.JWT_SECRET = "d025759c2e4401b031c3a1ebde2dc98ebdf8d0f878ef4c376453dcfbd7955536";
process.env.DB_USER = "vistapro_user";
process.env.DB_PASSWORD = "vistapro_password";
process.env.DB_HOST = "localhost";
process.env.DB_PORT = "5433";
process.env.DB_NAME = "vistapro_dev";
process.env.PORT = "5007";
process.env.NODE_ENV = "development";
process.env.MASTER_ADMIN_SECRET_KEY = "7336EB1D45315";

console.log('✅ Environment variables set');
console.log('✅ PORT:', process.env.PORT);

// Handle uncaught exceptions
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

try {
  console.log('1. Loading server.js...');
  require('./server.js');
  console.log('2. Server.js loaded successfully');
  
  // Keep the process alive
  console.log('3. Process will stay alive...');
  
} catch (error) {
  console.error('❌ Error loading server.js:', error);
  console.error('Stack:', error.stack);
  process.exit(1);
}
