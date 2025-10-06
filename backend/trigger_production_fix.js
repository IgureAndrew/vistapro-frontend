const axios = require('axios');

async function triggerProductionFix() {
  try {
    console.log('🔧 Triggering production database fix via API...');
    
    // First, let's try to get a token by making a login request
    console.log('🔑 Attempting to get authentication token...');
    
    // You'll need to replace these with actual MasterAdmin credentials
    const loginData = {
      email: process.env.MASTER_ADMIN_EMAIL || 'admin@vistapro.ng',
      password: process.env.MASTER_ADMIN_PASSWORD || 'admin123'
    };
    
    try {
      const loginResponse = await axios.post(
        'https://vistapro-backend.onrender.com/api/auth/login',
        loginData,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );
      
      if (loginResponse.data.success && loginResponse.data.token) {
        const token = loginResponse.data.token;
        console.log('✅ Authentication successful');
        
        // Now call the fix API
        console.log('🚀 Calling production fix API...');
        
        const fixResponse = await axios.post(
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
        
        console.log('✅ Production fix completed successfully!');
        console.log('📊 Summary:', JSON.stringify(fixResponse.data.summary, null, 2));
        
        if (fixResponse.data.results && fixResponse.data.results.length > 0) {
          console.log('\n📋 Detailed Results:');
          fixResponse.data.results.forEach((result, index) => {
            console.log(`${index + 1}. ${result.marketer} (${result.uniqueId}): ${result.status}`);
          });
        }
        
        console.log('\n🎉 Production database fix completed!');
        console.log('✅ Admin dashboard should now show correct form details');
        
      } else {
        console.log('❌ Login failed:', loginResponse.data.message);
        console.log('💡 Please check your MasterAdmin credentials');
      }
      
    } catch (loginError) {
      console.log('❌ Login error:', loginError.response?.data || loginError.message);
      console.log('💡 Please set MASTER_ADMIN_EMAIL and MASTER_ADMIN_PASSWORD environment variables');
    }
    
  } catch (error) {
    console.error('❌ Error triggering production fix:', error.message);
  }
}

// Run the fix
triggerProductionFix();
