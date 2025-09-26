// Test the SuperAdmin orders API endpoint
const fetch = require('node-fetch');

async function testSuperAdminAPI() {
  try {
    console.log('🔍 Testing SuperAdmin orders API...');
    
    // First, let's get a JWT token for Andu Eagle (SuperAdmin)
    const loginResponse = await fetch('http://localhost:5007/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        unique_id: 'SM000005', // Andu Eagle's unique_id
        password: 'password123' // Assuming default password
      })
    });
    
    if (!loginResponse.ok) {
      console.log('❌ Login failed, trying with different credentials...');
      
      // Try with email instead
      const emailLoginResponse = await fetch('http://localhost:5007/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'andu@example.com', // Try email
          password: 'password123'
        })
      });
      
      if (!emailLoginResponse.ok) {
        console.log('❌ Both login attempts failed');
        const errorText = await emailLoginResponse.text();
        console.log('Error:', errorText);
        return;
      }
      
      const loginData = await emailLoginResponse.json();
      console.log('✅ Login successful with email');
      
      // Test the SuperAdmin orders endpoint
      const ordersResponse = await fetch('http://localhost:5007/api/superadmin/orders', {
        headers: {
          'Authorization': `Bearer ${loginData.token}`
        }
      });
      
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        console.log('✅ SuperAdmin orders API working!');
        console.log(`📊 Found ${ordersData.orders.length} orders`);
        console.log(`📈 Total Revenue: ₦${ordersData.stats.totalRevenue}`);
        console.log(`📱 Total Devices: ${ordersData.stats.totalDevices}`);
        
        if (ordersData.orders.length > 0) {
          console.log('\n📋 Sample orders:');
          ordersData.orders.slice(0, 3).forEach((order, index) => {
            console.log(`  ${index + 1}. ${order.marketer_name} - ₦${order.sold_amount} (${order.status})`);
          });
        }
      } else {
        console.log('❌ Orders API failed');
        const errorText = await ordersResponse.text();
        console.log('Error:', errorText);
      }
      
    } else {
      const loginData = await loginResponse.json();
      console.log('✅ Login successful with unique_id');
      
      // Test the SuperAdmin orders endpoint
      const ordersResponse = await fetch('http://localhost:5007/api/superadmin/orders', {
        headers: {
          'Authorization': `Bearer ${loginData.token}`
        }
      });
      
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        console.log('✅ SuperAdmin orders API working!');
        console.log(`📊 Found ${ordersData.orders.length} orders`);
        console.log(`📈 Total Revenue: ₦${ordersData.stats.totalRevenue}`);
        console.log(`📱 Total Devices: ${ordersData.stats.totalDevices}`);
        
        if (ordersData.orders.length > 0) {
          console.log('\n📋 Sample orders:');
          ordersData.orders.slice(0, 3).forEach((order, index) => {
            console.log(`  ${index + 1}. ${order.marketer_name} - ₦${order.sold_amount} (${order.status})`);
          });
        }
      } else {
        console.log('❌ Orders API failed');
        const errorText = await ordersResponse.text();
        console.log('Error:', errorText);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testSuperAdminAPI();
