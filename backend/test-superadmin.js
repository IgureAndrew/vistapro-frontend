const jwt = require('jsonwebtoken');

async function testSuperAdmin() {
  try {
    console.log('🧪 Testing with real SuperAdmin: andu@gmail.com (ID: 232)...\n');

    const JWT_SECRET = process.env.JWT_SECRET || 'd025759c2e4401b031c3a1ebde2dc98ebdf8d0f878ef4c376453dcfbd7955536';

    // Generate token for andu@gmail.com (SuperAdmin)
    const token = jwt.sign(
      { id: 232, email: 'andu@gmail.com', role: 'SuperAdmin' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log('Token generated successfully');

    // Test superadmin endpoint
    const response = await fetch('http://localhost:5005/api/super-admin/account', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('\n✅ SUCCESS! SuperAdmin account endpoint is working!');
      console.log('Account data:', {
        displayName: data.account?.displayName || 'Not set',
        email: data.account?.email || 'Not set',
        phone: data.account?.phone || 'Not set',
        profile_image: data.account?.profile_image || 'Not set'
      });
    } else {
      console.log('\n❌ FAILED:', data.message);
    }

  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testSuperAdmin();
