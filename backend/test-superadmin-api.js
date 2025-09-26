// Test SuperAdmin API endpoint
const axios = require('axios');

async function testSuperAdminAPI() {
  try {
    console.log('🧪 Testing SuperAdmin API endpoint...');
    
    // First, get a SuperAdmin user and token
    const loginResponse = await axios.post('http://localhost:5007/api/auth/login', {
      email: 'superadmin@vistapro.com', // You may need to adjust this
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    const user = loginResponse.data.user;
    
    console.log('✅ Login successful:', user.role, user.unique_id);
    
    // Test the SuperAdmin orders endpoint
    const ordersResponse = await axios.get('http://localhost:5007/api/super-admin/orders/history', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('📊 Orders response:', {
      success: ordersResponse.data.success,
      ordersCount: ordersResponse.data.orders?.length || 0,
      stats: ordersResponse.data.stats
    });
    
    if (ordersResponse.data.orders && ordersResponse.data.orders.length > 0) {
      console.log('\n📋 Sample orders:');
      ordersResponse.data.orders.slice(0, 3).forEach(order => {
        console.log(`  - Order ${order.id}: ${order.marketer_name} (${order.marketer_unique_id}) -> Admin: ${order.admin_name} (${order.admin_unique_id})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error testing API:', error.response?.data || error.message);
  }
}

testSuperAdminAPI();
