// Simple API test using built-in modules
const http = require('http');

function makeRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const jsonBody = JSON.parse(body);
          resolve({ status: res.statusCode, data: jsonBody });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testAPI() {
  try {
    console.log('🔍 Testing SuperAdmin API...');
    
    // Test login
    const loginOptions = {
      hostname: 'localhost',
      port: 5007,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    const loginData = {
      email: 'andu@gmail.com',
      password: 'Andu0072121$$$$'
    };
    
    console.log('📝 Attempting login...');
    const loginResult = await makeRequest(loginOptions, loginData);
    
    if (loginResult.status === 200) {
      console.log('✅ Login successful!');
      const token = loginResult.data.token;
      
      // Test SuperAdmin orders
      const ordersOptions = {
        hostname: 'localhost',
        port: 5007,
        path: '/api/super-admin/orders/history',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      console.log('📊 Fetching SuperAdmin orders...');
      const ordersResult = await makeRequest(ordersOptions);
      
      if (ordersResult.status === 200) {
        console.log('✅ SuperAdmin orders API working!');
        console.log(`📈 Found ${ordersResult.data.orders.length} orders`);
        console.log(`💰 Total Revenue: ₦${ordersResult.data.stats.totalRevenue}`);
        console.log(`📱 Total Devices: ${ordersResult.data.stats.totalDevices}`);
        
        if (ordersResult.data.orders.length > 0) {
          console.log('\n📋 Sample orders:');
          ordersResult.data.orders.slice(0, 3).forEach((order, index) => {
            console.log(`  ${index + 1}. ${order.marketer_name} - ₦${order.sold_amount} (${order.status})`);
            console.log(`     Admin: ${order.admin_name}`);
          });
        }
      } else {
        console.log('❌ Orders API failed:', ordersResult.status);
        console.log('Response:', ordersResult.data);
      }
    } else {
      console.log('❌ Login failed:', loginResult.status);
      console.log('Response:', loginResult.data);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAPI();
