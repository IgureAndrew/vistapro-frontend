const axios = require('axios');

async function testUserSummary() {
  try {
    // Test with a known user ID from the orders
    const testUserId = 1;
    console.log('🧪 Testing user summary API with user ID:', testUserId);
    
    const response = await axios.get(`http://localhost:5007/api/manage-orders/user-summary/${testUserId}`, {
      headers: { 'Authorization': 'Bearer test-token' }
    });
    
    console.log('✅ API Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('❌ API Error:', error.response?.data || error.message);
    console.log('Status:', error.response?.status);
  }
}

testUserSummary();
