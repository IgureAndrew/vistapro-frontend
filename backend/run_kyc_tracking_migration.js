// run_kyc_tracking_migration.js
// Run the KYC tracking system migration

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://vistapro_user:CHtvHVOsBXyVft3LZBnhqSHIFjTSHGem@dpg-d0stpo15pdvs7392u0j0-a.oregon-postgres.render.com/vistapro_qotw',
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Running KYC Tracking System Migration...\n');
    
    await client.query('BEGIN');
    
    // Read the migration file
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'migrations/0028_add_kyc_tracking_system.sql'),
      'utf8'
    );
    
    // Execute the migration
    await client.query(migrationSQL);
    
    await client.query('COMMIT');
    
    console.log('✅ Migration completed successfully!\n');
    
    // Verify the migration
    console.log('🔍 Verifying migration...\n');
    
    // Check if kyc_audit_log table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'kyc_audit_log'
      );
    `);
    
    if (tableCheck.rows[0].exists) {
      console.log('✅ kyc_audit_log table created');
    } else {
      console.log('❌ kyc_audit_log table not found');
    }
    
    // Check if triggers exist
    const triggerCheck = await pool.query(`
      SELECT trigger_name 
      FROM information_schema.triggers 
      WHERE trigger_name LIKE 'trigger_update_status%';
    `);
    
    console.log(`✅ Created ${triggerCheck.rows.length} trigger(s):`);
    triggerCheck.rows.forEach(row => {
      console.log(`   - ${row.trigger_name}`);
    });
    
    // Check if functions exist
    const functionCheck = await pool.query(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_name IN ('check_and_update_submission_status', 'log_kyc_action');
    `);
    
    console.log(`\n✅ Created ${functionCheck.rows.length} function(s):`);
    functionCheck.rows.forEach(row => {
      console.log(`   - ${row.routine_name}`);
    });
    
    // Check if view exists
    const viewCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_name = 'kyc_tracking_view';
    `);
    
    if (viewCheck.rows.length > 0) {
      console.log('✅ kyc_tracking_view created');
    } else {
      console.log('❌ kyc_tracking_view not found');
    }
    
    console.log('\n\n✅ KYC Tracking System Migration Complete!');
    console.log('\n📊 What was added:');
    console.log('   1. kyc_audit_log table for comprehensive tracking');
    console.log('   2. Automatic status update triggers');
    console.log('   3. log_kyc_action function for audit logging');
    console.log('   4. kyc_tracking_view for easy queries');
    console.log('   5. Tracking fields in verification_submissions table');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();

