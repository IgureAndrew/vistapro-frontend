console.log('🚀 Testing server startup...');

try {
  const app = require('./src/app');
  console.log('✅ App loaded successfully');
  
  const { connectDB } = require('./src/config/database');
  console.log('✅ Database config loaded successfully');
  
  const http = require('http');
  const server = http.createServer(app);
  
  console.log('✅ HTTP server created');
  
  const PORT = process.env.PORT || 5007;
  
  connectDB()
    .then(() => {
      console.log('✅ Database connected successfully');
      server.listen(PORT, () => {
        console.log(`✅ Server running on port ${PORT}`);
      });
    })
    .catch(err => {
      console.error('❌ Database connection failed:', err);
      process.exit(1);
    });
    
} catch (error) {
  console.error('❌ Error during startup:', error);
  process.exit(1);
}
