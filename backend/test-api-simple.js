// Test API using built-in modules
const http = require('http');

function makeRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
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
    console.log('🧪 Testing SuperAdmin API endpoint...');
    
    // Test the health endpoint first
    const healthResponse = await makeRequest({
      hostname: 'localhost',
      port: 5007,
      path: '/health',
      method: 'GET'
    });
    
    console.log('✅ Health check:', healthResponse.status, healthResponse.data);
    
    // Test the SuperAdmin orders endpoint (this will fail without auth, but we can see the response)
    const ordersResponse = await makeRequest({
      hostname: 'localhost',
      port: 5007,
      path: '/api/super-admin/orders/history',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📊 Orders endpoint response:', ordersResponse.status, ordersResponse.data);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAPI();
