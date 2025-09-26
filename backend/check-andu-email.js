// Check Andu Eagle's email
const { Pool } = require('pg');

const pool = new Pool({
  user: 'vistapro_user',
  password: 'vistapro_password',
  host: 'localhost',
  port: 5433,
  database: 'vistapro_dev',
  ssl: false
});

async function checkAnduEmail() {
  try {
    console.log('🔍 Checking Andu Eagle\'s email...');
    
    const result = await pool.query(`
      SELECT id, unique_id, first_name, last_name, email, role
      FROM users 
      WHERE unique_id = 'SM000005'
    `);
    
    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log(`✅ Found user: ${user.first_name} ${user.last_name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   ID: ${user.id}`);
    } else {
      console.log('❌ User not found');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkAnduEmail();
