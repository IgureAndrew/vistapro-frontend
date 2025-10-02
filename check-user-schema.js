// Check user table schema and data
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://vistapro_user:CHtvHVOsBXyVft3LZBnhqSHIFjTSHGem@dpg-d0stpo15pdvs7392u0j0-a.oregon-postgres.render.com/vistapro_qotw?sslmode=require"
});

async function checkUserSchema() {
  try {
    console.log('🔍 Checking user table schema...');
    
    const client = await pool.connect();
    
    // Get table schema
    const schema = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 User table columns:');
    schema.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    // Check total user count
    const totalUsers = await client.query('SELECT COUNT(*) as count FROM users');
    console.log(`\n📊 Total users: ${totalUsers.rows[0].count}`);
    
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
    
    // Check if there's an is_verified column
    const hasVerified = schema.rows.some(row => row.column_name === 'is_verified');
    if (hasVerified) {
      const verifiedUsers = await client.query(`
        SELECT 
          is_verified, 
          COUNT(*) as count 
        FROM users 
        GROUP BY is_verified 
        ORDER BY is_verified
      `);
      console.log('\n✅ Users by verification status:');
      verifiedUsers.rows.forEach(row => {
        console.log(`  Verified: ${row.is_verified}: ${row.count}`);
      });
    }
    
    // Check recent users
    const recentUsers = await client.query(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE created_at > NOW() - INTERVAL '7 days'
    `);
    console.log(`\n🆕 Recent users (last 7 days): ${recentUsers.rows[0].count}`);
    
    // Check users created today
    const todayUsers = await client.query(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE DATE(created_at) = CURRENT_DATE
    `);
    console.log(`\n📅 Users created today: ${todayUsers.rows[0].count}`);
    
    client.release();
    await pool.end();
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
    process.exit(1);
  }
}

checkUserSchema();
