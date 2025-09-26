#!/usr/bin/env node

// Development startup script with environment variables
process.env.JWT_SECRET = "d025759c2e4401b031c3a1ebde2dc98ebdf8d0f878ef4c376453dcfbd7955536";
process.env.DB_USER = "vistapro_user";
process.env.DB_PASSWORD = "vistapro_password";
process.env.DB_HOST = "localhost";
process.env.DB_PORT = "5433";
process.env.DB_NAME = "vistapro_dev";
process.env.PORT = "5007";
process.env.NODE_ENV = "development";
process.env.MASTER_ADMIN_SECRET_KEY = "7336EB1D45315";

console.log('🚀 Starting development server with environment variables...');
console.log('✅ JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'Missing');
console.log('✅ DB_USER:', process.env.DB_USER);
console.log('✅ PORT:', process.env.PORT);
console.log('✅ NODE_ENV:', process.env.NODE_ENV);

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

// Start the server
require('./server.js');
