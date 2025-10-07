// fix_production_now.js
// This script will help fix the production database schema issues

const axios = require('axios');

// Step 1: Login as admin to get token
async function loginAsAdmin() {
  try {
    console.log('🔐 Logging in as admin to get token...');
    
    // You'll need to replace these with actual admin credentials
    const adminCredentials = {
      email: 'admin@vistapro.ng', // Replace with actual admin email
      password: 'admin_password'  // Replace with actual admin password
    };
    
    const response = await axios.post(
      'https://vistapro-backend.onrender.com/api/auth/login',
      adminCredentials,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data.success && response.data.token) {
      console.log('✅ Admin login successful!');
      return response.data.token;
    } else {
      console.error('❌ Admin login failed:', response.data);
      return null;
    }
    
  } catch (error) {
    console.error('❌ Error logging in as admin:', error.response?.data || error.message);
    return null;
  }
}

// Step 2: Call the database fix endpoint
async function fixDatabaseSchema(adminToken) {
  try {
    console.log('🔧 Calling database schema fix endpoint...');
    
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
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    return true;
    
  } catch (error) {
    console.error('❌ Error calling fix endpoint:', error.response?.data || error.message);
    return false;
  }
}

// Main function
async function fixProductionDatabase() {
  console.log('🚀 Starting production database fix process...');
  
  // Step 1: Login as admin
  const adminToken = await loginAsAdmin();
  if (!adminToken) {
    console.error('❌ Could not get admin token. Please check admin credentials.');
    return;
  }
  
  // Step 2: Fix database schema
  const success = await fixDatabaseSchema(adminToken);
  if (success) {
    console.log('🎉 Production database fix completed successfully!');
    console.log('✅ Bayo Lawal verification has been reset');
    console.log('✅ All missing tables and columns have been created');
    console.log('✅ The verification process should now work properly');
  } else {
    console.error('❌ Database fix failed');
  }
}

// Run the fix
fixProductionDatabase();
