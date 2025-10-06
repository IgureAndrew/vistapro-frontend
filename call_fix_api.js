const axios = require('axios');
require('dotenv').config();

async function callFixAPI() {
  try {
    console.log('🔧 Calling production fix API...');
    
    // You'll need to get a valid MasterAdmin token
    // For now, we'll use a placeholder - you'll need to replace this with actual token
    const token = process.env.MASTER_ADMIN_TOKEN || 'your-master-admin-token-here';
    
    if (token === 'your-master-admin-token-here') {
      console.log('❌ Please set MASTER_ADMIN_TOKEN environment variable with a valid MasterAdmin token');
      console.log('💡 You can get a token by logging in as MasterAdmin and checking the browser network tab');
      return;
    }
    
    const response = await axios.post(
      'https://vistapro-backend.onrender.com/api/verification/run-complete-fix',
      {},
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 300000 // 5 minutes timeout
      }
    );
    
    console.log('✅ API call successful!');
    console.log('📊 Summary:', response.data.summary);
    console.log('📋 Results:', response.data.results);
    
  } catch (error) {
    console.error('❌ Error calling fix API:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('🔑 Authentication failed. Please check your MasterAdmin token.');
    } else if (error.response?.status === 403) {
      console.log('🚫 Access denied. Please ensure you have MasterAdmin role.');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('🌐 Connection refused. Please check if the backend is running.');
    }
  }
}

// Run the API call
callFixAPI();