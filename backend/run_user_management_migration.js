const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

/**
 * Run User Management Migration
 * 
 * This script adds the necessary database fields for user management:
 * - Lock/unlock functionality
 * - Soft delete and hard delete
 * - Audit logging
 * 
 * Usage: node run_user_management_migration.js
 */

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  const client = await pool.connect();

  try {
    console.log('🚀 Starting User Management Migration...\n');

    // Read migration file
    const migrationPath = path.join(__dirname, 'migrations', '0027_add_user_management_fields.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration file loaded successfully\n');

    // Run migration
    await client.query('BEGIN');
    console.log('🔄 Executing migration...');
    
    await client.query(migrationSQL);
    
    await client.query('COMMIT');
    console.log('✅ Migration completed successfully!\n');

    // Verify migration
    console.log('🔍 Verifying migration...\n');
    
    // Check if new columns exist
    const columnsCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('is_locked', 'lock_reason', 'locked_by', 'locked_at', 'is_deleted', 'deleted_by', 'deleted_at', 'deletion_type')
      ORDER BY column_name;
    `);

    console.log('✅ New columns in users table:');
    columnsCheck.rows.forEach(row => {
      console.log(`   - ${row.column_name}`);
    });

    // Check if audit table exists
    const auditTableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'user_management_audit'
      );
    `);

    if (auditTableCheck.rows[0].exists) {
      console.log('\n✅ user_management_audit table created successfully');
    }

    // Check indexes
    const indexesCheck = await client.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'users' 
      AND indexname LIKE 'idx_users_%'
      ORDER BY indexname;
    `);

    console.log('\n✅ New indexes created:');
    indexesCheck.rows.forEach(row => {
      console.log(`   - ${row.indexname}`);
    });

    console.log('\n🎉 User Management system is ready to use!');
    console.log('\n📋 Next steps:');
    console.log('   1. Deploy backend with new API endpoints');
    console.log('   2. Deploy frontend with UserManagement component');
    console.log('   3. Test the system as MasterAdmin');
    console.log('   4. Review USER_MANAGEMENT_IMPLEMENTATION.md for details\n');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migration
runMigration().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});

