const jwt = require('jsonwebtoken');
const { pool } = require('./src/config/database');

async function testAccountEndpoints() {
  try {
    console.log('🧪 Testing Account Endpoints for All Roles...\n');

    // Test data for different roles
    const testUsers = [
      { id: 10, email: 'leo@gmail.com', role: 'Marketer' },
      { id: 1, email: 'andrewoigure@gmail.com', role: 'MasterAdmin' },
      { id: 2, email: 'andu@gmail.com', role: 'SuperAdmin' },
      { id: 3, email: 'admin@test.com', role: 'Admin' },
      { id: 4, email: 'dealer@test.com', role: 'Dealer' }
    ];

    const JWT_SECRET = process.env.JWT_SECRET || 'd025759c2e4401b031c3a1ebde2dc98ebdf8d0f878ef4c376453dcfbd7955536';

    for (const user of testUsers) {
      console.log(`\n🔍 Testing ${user.role} (${user.email})...`);
      
      // Generate token
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Test the appropriate endpoint
      let endpoint;
      switch (user.role) {
        case 'Marketer':
          endpoint = '/api/marketer/account';
          break;
        case 'SuperAdmin':
          endpoint = '/api/super-admin/account';
          break;
        case 'Admin':
          endpoint = '/api/admin/account';
          break;
        case 'Dealer':
          endpoint = '/api/dealer/account';
          break;
        default:
          console.log(`⚠️  Skipping ${user.role} - no specific endpoint`);
          continue;
      }

      try {
        const response = await fetch(`http://localhost:5005${endpoint}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();
        
        if (response.ok) {
          console.log(`✅ ${user.role} endpoint working:`, {
            success: data.success,
            hasAccount: !!data.account,
            displayName: data.account?.displayName || 'Not set',
            email: data.account?.email || 'Not set'
          });
        } else {
          console.log(`❌ ${user.role} endpoint failed:`, data.message);
        }
      } catch (error) {
        console.log(`❌ ${user.role} endpoint error:`, error.message);
      }
    }

    console.log('\n🎉 Account endpoint testing completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await pool.end();
  }
}

testAccountEndpoints();
