// call_fix_endpoint.js
// This script calls the admin endpoint to fix the database schema

const axios = require('axios');

async function callFixEndpoint() {
  try {
    console.log('🚀 Calling admin fix-database-schema endpoint...');
    
    // You'll need to replace this with a valid admin token
    const adminToken = 'YOUR_ADMIN_TOKEN_HERE';
    
    const response = await axios.post(
      'https://vistapro-backend.onrender.com/api/admin/fix-database-schema',
      {},
      {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Database schema fix successful!');
    console.log('Response:', response.data);
    
  } catch (error) {
    console.error('❌ Error calling fix endpoint:', error.response?.data || error.message);
  }
}

// Run the script
callFixEndpoint();
