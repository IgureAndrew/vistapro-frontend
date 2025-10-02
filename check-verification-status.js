// Check user verification status and filtering
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://vistapro_user:CHtvHVOsBXyVft3LZBnhqSHIFjTSHGem@dpg-d0stpo15pdvs7392u0j0-a.oregon-postgres.render.com/vistapro_qotw?sslmode=require"
});

async function checkVerificationStatus() {
  try {
    console.log('🔍 Checking user verification status...');
    
    const client = await pool.connect();
    
    // Check users by verification status
    const usersByVerification = await client.query(`
      SELECT 
        COALESCE(overall_verification_status, 'null') as verification_status, 
        COUNT(*) as count 
      FROM users 
      GROUP BY overall_verification_status 
      ORDER BY count DESC
    `);
    console.log('\n✅ Users by verification status:');
    usersByVerification.rows.forEach(row => {
      console.log(`  ${row.verification_status}: ${row.count}`);
    });
    
    // Check users by locked status
    const usersByLocked = await client.query(`
      SELECT 
        COALESCE(locked::text, 'null') as locked_status, 
        COUNT(*) as count 
      FROM users 
      GROUP BY locked 
      ORDER BY locked
    `);
    console.log('\n🔒 Users by locked status:');
    usersByLocked.rows.forEach(row => {
      console.log(`  Locked: ${row.locked_status}: ${row.count}`);
    });
    
    // Check users by deleted status
    const usersByDeleted = await client.query(`
      SELECT 
        CASE 
          WHEN deleted_at IS NULL THEN 'not_deleted'
          ELSE 'deleted'
        END as deleted_status,
        COUNT(*) as count 
      FROM users 
      GROUP BY (deleted_at IS NULL)
      ORDER BY deleted_status
    `);
    console.log('\n🗑️ Users by deleted status:');
    usersByDeleted.rows.forEach(row => {
      console.log(`  ${row.deleted_status}: ${row.count}`);
    });
    
    // Check if there are any users with missing required fields
    const usersWithMissingFields = await client.query(`
      SELECT 
        COUNT(*) as count,
        SUM(CASE WHEN first_name IS NULL THEN 1 ELSE 0 END) as missing_first_name,
        SUM(CASE WHEN last_name IS NULL THEN 1 ELSE 0 END) as missing_last_name,
        SUM(CASE WHEN email IS NULL THEN 1 ELSE 0 END) as missing_email
      FROM users
    `);
    console.log('\n❓ Users with missing fields:');
    console.log(`  Total: ${usersWithMissingFields.rows[0].count}`);
    console.log(`  Missing first_name: ${usersWithMissingFields.rows[0].missing_first_name}`);
    console.log(`  Missing last_name: ${usersWithMissingFields.rows[0].missing_last_name}`);
    console.log(`  Missing email: ${usersWithMissingFields.rows[0].missing_email}`);
    
    // Check users that would be counted in dashboard (likely filtered)
    const dashboardUsers = await client.query(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE deleted_at IS NULL 
      AND locked IS NOT TRUE
    `);
    console.log(`\n📊 Users that should appear in dashboard (not deleted, not locked): ${dashboardUsers.rows[0].count}`);
    
    client.release();
    await pool.end();
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
    process.exit(1);
  }
}

checkVerificationStatus();
