// Check users table structure
const { Pool } = require('pg');

const pool = new Pool({
  user: 'vistapro_user',
  password: 'vistapro_password',
  host: 'localhost',
  port: 5433,
  database: 'vistapro_dev',
  ssl: false
});

async function checkUsersStructure() {
  try {
    console.log('🔍 Checking users table structure...');
    
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Users table columns:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });
    
    // Check if admin_id and super_admin_id exist
    const hasAdminId = result.rows.some(row => row.column_name === 'admin_id');
    const hasSuperAdminId = result.rows.some(row => row.column_name === 'super_admin_id');
    
    console.log(`\n🔗 admin_id column exists: ${hasAdminId}`);
    console.log(`🔗 super_admin_id column exists: ${hasSuperAdminId}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkUsersStructure();
