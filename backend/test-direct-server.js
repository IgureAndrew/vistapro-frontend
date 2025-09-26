// Test direct server startup
console.log('🧪 Testing direct server startup...');

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

// Keep the process alive
process.stdin.resume();

try {
  console.log('1. Loading server.js...');
  require('./server.js');
  console.log('2. Server.js loaded successfully');
  
  // Keep the process alive
  setInterval(() => {
    console.log('🔄 Process still alive...');
  }, 5000);
  
} catch (error) {
  console.error('❌ Error loading server.js:', error);
  process.exit(1);
}
