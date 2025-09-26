// Test app loading
console.log('🧪 Testing app loading...');

try {
  console.log('1. Loading dotenv...');
  require('dotenv').config();
  console.log('✅ Dotenv loaded');

  console.log('2. Loading app...');
  const app = require('./src/app');
  console.log('✅ App loaded successfully');

  console.log('3. Testing superAdminController...');
  const superAdminController = require('./src/controllers/superAdminController');
  console.log('✅ SuperAdminController loaded successfully');

  console.log('4. Testing superAdminRoutes...');
  const superAdminRoutes = require('./src/routes/superAdminRoutes');
  console.log('✅ SuperAdminRoutes loaded successfully');

  console.log('✅ All tests passed!');
  process.exit(0);

} catch (error) {
  console.error('❌ Error during app loading:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}
