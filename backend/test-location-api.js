const { Pool } = require('pg');

async function testLocationAPI() {
  const pool = new Pool({
    host: 'localhost',
    port: 5433,
    user: 'vistapro_user',
    password: 'vistapro_password',
    database: 'vistapro_dev',
    ssl: false
  });

  try {
    console.log('🔍 Testing location API logic...');
    
    // Test the exact query from the API endpoint
    const location = 'Oyo';
    const currentUserId = 232; // Andu Eagle's ID from the previous output
    
    const { rows } = await pool.query(`
      SELECT 
        id,
        unique_id,
        CONCAT(first_name, ' ', last_name) as name,
        role,
        location
      FROM users 
      WHERE location = $1 
        AND id != $2
        AND role IN ('Marketer', 'Admin', 'SuperAdmin')
        AND deleted = FALSE
        AND locked = FALSE
      ORDER BY role, first_name, last_name
    `, [location, currentUserId]);
    
    console.log(`\n📍 Users in ${location} (excluding user ${currentUserId}):`);
    console.table(rows);
    
    if (rows.length === 0) {
      console.log('❌ No users found! Let me check what users exist in Oyo...');
      
      const allOyoUsers = await pool.query(`
        SELECT id, unique_id, first_name, last_name, role, location, deleted, locked
        FROM users 
        WHERE location = $1
        ORDER BY role, first_name, last_name
      `, [location]);
      
      console.log('\n👥 All users in Oyo:');
      console.table(allOyoUsers.rows);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

testLocationAPI();
