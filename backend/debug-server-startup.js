// Debug server startup
console.log('🧪 Debug server startup...');

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

// Test database connection first
const { connectDB } = require('./src/config/database');

console.log('1. Testing database connection...');
connectDB()
  .then(() => {
    console.log('✅ Database connection successful');
    console.log('2. Loading server.js...');
    
    try {
      require('./server.js');
      console.log('✅ Server.js loaded successfully');
    } catch (error) {
      console.error('❌ Error loading server.js:', error);
      console.error('Stack:', error.stack);
    }
  })
  .catch((error) => {
    console.error('❌ Database connection failed:', error);
    console.error('Stack:', error.stack);
  });
