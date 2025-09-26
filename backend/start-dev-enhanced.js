// Enhanced Development Server Startup Script
// This script provides better error handling and graceful shutdown

require('dotenv').config();

// Set environment variables with fallbacks
process.env.JWT_SECRET = process.env.JWT_SECRET || "d025759c2e4401b031c3a1ebde2dc98ebdf8d0f878ef4c376453dcfbd7955536";
process.env.DB_USER = process.env.DB_USER || "vistapro_user";
process.env.DB_PASSWORD = process.env.DB_PASSWORD || "vistapro_password";
process.env.DB_HOST = process.env.DB_HOST || "localhost";
process.env.DB_PORT = process.env.DB_PORT || "5433";
process.env.DB_NAME = process.env.DB_NAME || "vistapro_dev";
process.env.PORT = process.env.PORT || "5007";
process.env.NODE_ENV = process.env.NODE_ENV || "development";
process.env.MASTER_ADMIN_SECRET_KEY = process.env.MASTER_ADMIN_SECRET_KEY || "7336EB1D45315";

console.log('🚀 Starting enhanced development server...');
console.log(`✅ JWT_SECRET: ${process.env.JWT_SECRET ? 'Set' : 'Not Set'}`);
console.log(`✅ DB_USER: ${process.env.DB_USER}`);
console.log(`✅ PORT: ${process.env.PORT}`);
console.log(`✅ NODE_ENV: ${process.env.NODE_ENV}`);

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the actual server
try {
  require('./server');
} catch (error) {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
}
