// Quick script to check user count in production database
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://vistapro_user:CHtvHVOsBXyVft3LZBnhqSHIFjTSHGem@dpg-d0stpo15pdvs7392u0j0-a.oregon-postgres.render.com/vistapro_qotw?sslmode=require"
});

async function checkUserCount() {
  try {
    console.log('🔍 Connecting to production database...');
    
    // Test connection
    const client = await pool.connect();
    console.log('✅ Connected to database successfully');
    
    // Check total user count
    const totalUsers = await client.query('SELECT COUNT(*) as count FROM users');
    console.log(`📊 Total users in database: ${totalUsers.rows[0].count}`);
    
    // Check users by status
    const usersByStatus = await client.query(`
      SELECT 
        COALESCE(status, 'null') as status, 
        COUNT(*) as count 
      FROM users 
      GROUP BY status 
      ORDER BY count DESC
    `);
    console.log('\n📈 Users by status:');
    usersByStatus.rows.forEach(row => {
      console.log(`  ${row.status}: ${row.count}`);
    });
    
    // Check users by role
    const usersByRole = await client.query(`
      SELECT 
        COALESCE(role, 'null') as role, 
        COUNT(*) as count 
      FROM users 
      GROUP BY role 
      ORDER BY count DESC
    `);
    console.log('\n👥 Users by role:');
    usersByRole.rows.forEach(row => {
      console.log(`  ${row.role}: ${row.count}`);
    });
    
    // Check recent users (last 7 days)
    const recentUsers = await client.query(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE created_at > NOW() - INTERVAL '7 days'
    `);
    console.log(`\n🆕 Recent users (last 7 days): ${recentUsers.rows[0].count}`);
    
    // Check if there are any deleted users
    const deletedUsers = await client.query(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE deleted_at IS NOT NULL
    `);
    console.log(`🗑️ Deleted users: ${deletedUsers.rows[0].count}`);
    
    // Check users created today
    const todayUsers = await client.query(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE DATE(created_at) = CURRENT_DATE
    `);
    console.log(`📅 Users created today: ${todayUsers.rows[0].count}`);
    
    client.release();
    await pool.end();
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
    process.exit(1);
  }
}

checkUserCount();
