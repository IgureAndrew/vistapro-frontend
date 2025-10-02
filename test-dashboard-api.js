// Test the dashboard API endpoint directly
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://vistapro_user:CHtvHVOsBXyVft3LZBnhqSHIFjTSHGem@dpg-d0stpo15pdvs7392u0j0-a.oregon-postgres.render.com/vistapro_qotw?sslmode=require"
});

async function testDashboardAPI() {
  try {
    console.log('🔍 Testing dashboard API logic...');
    
    const client = await pool.connect();
    
    // Simulate the exact query from getDashboardSummary
    const totalUsersQuery = 'SELECT COUNT(*) AS total FROM users';
    const totalUsersResult = await client.query(totalUsersQuery);
    
    console.log(`📊 Total users from API query: ${totalUsersResult.rows[0].total}`);
    
    // Check if there are any filters being applied
    const usersWithDeletedAt = await client.query(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE deleted_at IS NOT NULL
    `);
    
    const usersWithLocked = await client.query(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE locked = true
    `);
    
    console.log(`🗑️ Users with deleted_at: ${usersWithDeletedAt.rows[0].count}`);
    console.log(`🔒 Users with locked = true: ${usersWithLocked.rows[0].count}`);
    
    // Check if there's a different query being used
    const allUsers = await client.query('SELECT id, unique_id, first_name, last_name, role, created_at, deleted_at, locked FROM users ORDER BY created_at DESC LIMIT 10');
    
    console.log('\n👥 Sample users (last 10):');
    allUsers.rows.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.unique_id} - ${user.first_name} ${user.last_name} (${user.role}) - Created: ${user.created_at} - Deleted: ${user.deleted_at} - Locked: ${user.locked}`);
    });
    
    // Check if there's a verification status filter
    const usersByVerification = await client.query(`
      SELECT 
        overall_verification_status,
        COUNT(*) as count
      FROM users 
      GROUP BY overall_verification_status
      ORDER BY count DESC
    `);
    
    console.log('\n✅ Users by verification status:');
    usersByVerification.rows.forEach(row => {
      console.log(`  ${row.overall_verification_status || 'null'}: ${row.count}`);
    });
    
    // Check if there's a role filter
    const usersByRole = await client.query(`
      SELECT 
        role,
        COUNT(*) as count
      FROM users 
      GROUP BY role
      ORDER BY count DESC
    `);
    
    console.log('\n👥 Users by role:');
    usersByRole.rows.forEach(row => {
      console.log(`  ${row.role}: ${row.count}`);
    });
    
    client.release();
    await pool.end();
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
    process.exit(1);
  }
}

testDashboardAPI();
