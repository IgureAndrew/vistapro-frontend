const axios = require('axios');
require('dotenv').config();

async function runProductionFix() {
  try {
    console.log('🔧 Running production database fix...');
    
    // You need to replace this with a valid MasterAdmin token
    // Get it from browser network tab when logged in as MasterAdmin
    const token = process.env.MASTER_ADMIN_TOKEN;
    
    if (!token) {
      console.log('❌ Please set MASTER_ADMIN_TOKEN environment variable');
      console.log('💡 Get token from browser network tab when logged in as MasterAdmin');
      console.log('💡 Or run: export MASTER_ADMIN_TOKEN=your-token-here');
      return;
    }
    
    console.log('🚀 Calling production fix API...');
    
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
    
    console.log('✅ Production fix completed successfully!');
    console.log('📊 Summary:', JSON.stringify(response.data.summary, null, 2));
    
    if (response.data.results && response.data.results.length > 0) {
      console.log('\n📋 Detailed Results:');
      response.data.results.forEach((result, index) => {
        console.log(`${index + 1}. ${result.marketer} (${result.uniqueId}): ${result.status}`);
        if (result.status === 'fixed' && result.oldFlags && result.newFlags) {
          console.log(`   Old: bio=${result.oldFlags.bio_submitted}, guarantor=${result.oldFlags.guarantor_submitted}, commitment=${result.oldFlags.commitment_submitted}`);
          console.log(`   New: bio=${result.newFlags.bioSubmitted}, guarantor=${result.newFlags.guarantorSubmitted}, commitment=${result.newFlags.commitmentSubmitted}`);
        }
        if (result.error) {
          console.log(`   Error: ${result.error}`);
        }
      });
    }
    
    console.log('\n🎉 Production database fix completed!');
    console.log('✅ Admin dashboard should now show correct form details');
    
  } catch (error) {
    console.error('❌ Error running production fix:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('🔑 Authentication failed. Please check your MasterAdmin token.');
      console.log('💡 Get a fresh token from browser network tab');
    } else if (error.response?.status === 403) {
      console.log('🚫 Access denied. Please ensure you have MasterAdmin role.');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('🌐 Connection refused. Please check if the backend is running.');
    } else if (error.code === 'ECONNABORTED') {
      console.log('⏰ Request timeout. The fix might still be running in the background.');
    }
  }
}

// Run the production fix
runProductionFix();
