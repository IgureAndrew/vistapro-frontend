const jwt = require('jsonwebtoken');
const { exec } = require('child_process');
require('dotenv').config({ path: './config.env' });

async function testAdminAccount() {
  try {
    console.log('🧪 Testing with real Admin: andrei@gmail.com (ID: 184)...\n');

    const JWT_SECRET = process.env.JWT_SECRET || 'd025759c2e4401b031c3a1ebde2dc98ebdf8d0f878ef4c376453dcfbd7955536';

    // Generate token for andrei@gmail.com (Admin)
    const token = jwt.sign(
      { id: 184, email: 'andrei@gmail.com', role: 'Admin' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log('Token generated successfully');

    // Test admin endpoint using PowerShell
    const command = `powershell -Command "Invoke-WebRequest -Uri 'http://localhost:5005/api/admin/account' -Method GET -Headers @{Authorization='Bearer ${token}'; 'Content-Type'='application/json'} | Select-Object -ExpandProperty Content"`;
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Error testing admin account:', error);
        return;
      }
      
      try {
        const data = JSON.parse(stdout);
        console.log('Response data:', JSON.stringify(data, null, 2));

        if (data.success) {
          console.log('✅ SUCCESS! Admin account endpoint is working!');
          console.log('Account data:', {
            displayName: data.account.displayName,
            email: data.account.email,
            phone: data.account.phone || 'Not set',
            profile_image: data.account.profile_image || 'Not set'
          });
        } else {
          console.log('❌ FAILED:', data.message || 'Unknown error');
        }
      } catch (parseError) {
        console.error('❌ Error parsing response:', parseError);
        console.log('Raw response:', stdout);
      }
    });

  } catch (error) {
    console.error('❌ Error testing admin account:', error);
  }
}

testAdminAccount();
