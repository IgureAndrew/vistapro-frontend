// Check for test users with known passwords
const { Pool } = require('pg');

const pool = new Pool({
  user: 'vistapro_user',
  password: 'vistapro_password',
  host: 'localhost',
  port: 5433,
  database: 'vistapro_dev',
  ssl: false
});

async function checkTestUsers() {
  try {
    console.log('🔍 Checking for test users...');
    
    const result = await pool.query(`
      SELECT id, unique_id, first_name, last_name, email, role, password
      FROM users 
      WHERE role = 'SuperAdmin'
      ORDER BY id
    `);
    
    console.log(`Found ${result.rows.length} SuperAdmin users:`);
    result.rows.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.first_name} ${user.last_name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Unique ID: ${user.unique_id}`);
      console.log(`   Password hash: ${user.password ? user.password.substring(0, 20) + '...' : 'NULL'}`);
    });
    
    // Let's also check if there are any users with simple passwords
    const simplePasswordResult = await pool.query(`
      SELECT id, unique_id, first_name, last_name, email, role
      FROM users 
      WHERE password = 'password123' OR password = 'password' OR password = '123456'
      ORDER BY id
    `);
    
    if (simplePasswordResult.rows.length > 0) {
      console.log('\n🔑 Users with simple passwords:');
      simplePasswordResult.rows.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.first_name} ${user.last_name} (${user.email})`);
      });
    } else {
      console.log('\n❌ No users with simple passwords found');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkTestUsers();
