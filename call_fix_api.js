const axios = require('axios');

// API endpoint
const API_URL = 'https://vistapro-backend.onrender.com/api/verification/fix-all-user-flags';

// You'll need to replace this with a valid MasterAdmin token
const MASTER_ADMIN_TOKEN = 'YOUR_MASTER_ADMIN_TOKEN_HERE';

async function callFixAPI() {
  try {
    console.log('🔧 Calling fix-all-user-flags API endpoint...');
    
    const response = await axios.post(API_URL, {}, {
      headers: {
        'Authorization': `Bearer ${MASTER_ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ API call successful!');
    console.log('📊 Summary:', response.data.summary);
    console.log('📋 Results:', response.data.results);
    
  } catch (error) {
    console.error('❌ API call failed:', error.response?.data || error.message);
  }
}

// Instructions for the user
console.log('📝 To fix the production data:');
console.log('1. Get a MasterAdmin token from the production system');
console.log('2. Replace YOUR_MASTER_ADMIN_TOKEN_HERE with the actual token');
console.log('3. Run: node call_fix_api.js');
console.log('');
console.log('Or call the API directly using Postman/curl:');
console.log(`POST ${API_URL}`);
console.log('Headers: Authorization: Bearer YOUR_MASTER_ADMIN_TOKEN');
console.log('Body: {}');

// Uncomment the line below after setting the token
// callFixAPI();
