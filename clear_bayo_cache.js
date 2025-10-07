// clear_bayo_cache.js
// Clear any cached data for Bayo Lawal and force a complete reset

require('dotenv').config();
const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function clearBayoCache() {
  console.log('🧹 CLEARING: Bayo Lawal cache and forcing complete reset...');
  
  try {
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful');
    
    // 1. Check current status
    console.log('🔍 Checking current status...');
    const currentStatus = await pool.query(`
      SELECT 
        id, unique_id, first_name, last_name, email,
        bio_submitted, guarantor_submitted, commitment_submitted, 
        overall_verification_status, created_at, updated_at
      FROM users 
      WHERE unique_id = 'DSR00336'
    `);
    
    if (currentStatus.rows.length > 0) {
      const user = currentStatus.rows[0];
      console.log('📊 Current status:');
      console.log('  Bio Submitted:', user.bio_submitted);
      console.log('  Guarantor Submitted:', user.guarantor_submitted);
      console.log('  Commitment Submitted:', user.commitment_submitted);
      console.log('  Overall Verification Status:', user.overall_verification_status);
    }
    
    // 2. Force reset with explicit NULL values
    console.log('🔄 Force resetting with explicit NULL values...');
    const resetResult = await pool.query(`
      UPDATE users 
      SET 
        bio_submitted = false,
        guarantor_submitted = false,
        commitment_submitted = false,
        overall_verification_status = NULL,
        updated_at = CURRENT_TIMESTAMP
      WHERE unique_id = 'DSR00336'
      RETURNING id, unique_id, first_name, last_name, bio_submitted, guarantor_submitted, commitment_submitted, overall_verification_status;
    `);
    
    console.log('✅ Reset result:', resetResult.rows[0]);
    
    // 3. Delete ALL related data
    console.log('🗑️  Deleting ALL related data...');
    
    // Delete from all possible tables
    const tablesToClean = [
      { table: 'marketer_biodata', condition: "marketer_unique_id = 'DSR00336'" },
      { table: 'marketer_guarantor_form', condition: "marketer_id = (SELECT id FROM users WHERE unique_id = 'DSR00336')" },
      { table: 'marketer_commitment_form', condition: "marketer_id = (SELECT id FROM users WHERE unique_id = 'DSR00336')" },
      { table: 'verification_submissions', condition: "marketer_id = (SELECT id FROM users WHERE unique_id = 'DSR00336')" },
      { table: 'verification_workflow_logs', condition: "marketer_id = (SELECT id FROM users WHERE unique_id = 'DSR00336')" },
      { table: 'admin_verification_details', condition: "marketer_id = (SELECT id FROM users WHERE unique_id = 'DSR00336')" }
    ];
    
    for (const tableInfo of tablesToClean) {
      try {
        const deleteResult = await pool.query(`DELETE FROM ${tableInfo.table} WHERE ${tableInfo.condition} RETURNING id;`);
        console.log(`✅ Deleted ${deleteResult.rows.length} records from ${tableInfo.table}`);
      } catch (error) {
        console.log(`⚠️  Could not delete from ${tableInfo.table}:`, error.message);
      }
    }
    
    // 4. Verify complete reset
    console.log('🔍 Verifying complete reset...');
    const verifyResult = await pool.query(`
      SELECT 
        id, unique_id, first_name, last_name, email,
        bio_submitted, guarantor_submitted, commitment_submitted, 
        overall_verification_status, updated_at
      FROM users 
      WHERE unique_id = 'DSR00336'
    `);
    
    if (verifyResult.rows.length > 0) {
      const user = verifyResult.rows[0];
      console.log('✅ Final verification status:');
      console.log('  Bio Submitted:', user.bio_submitted);
      console.log('  Guarantor Submitted:', user.guarantor_submitted);
      console.log('  Commitment Submitted:', user.commitment_submitted);
      console.log('  Overall Verification Status:', user.overall_verification_status);
      console.log('  Updated At:', user.updated_at);
      
      // Check all form tables
      const formChecks = [
        { name: 'Biodata', query: "SELECT COUNT(*) FROM marketer_biodata WHERE marketer_unique_id = 'DSR00336'" },
        { name: 'Guarantor', query: "SELECT COUNT(*) FROM marketer_guarantor_form WHERE marketer_id = (SELECT id FROM users WHERE unique_id = 'DSR00336')" },
        { name: 'Commitment', query: "SELECT COUNT(*) FROM marketer_commitment_form WHERE marketer_id = (SELECT id FROM users WHERE unique_id = 'DSR00336')" },
        { name: 'Verification Submissions', query: "SELECT COUNT(*) FROM verification_submissions WHERE marketer_id = (SELECT id FROM users WHERE unique_id = 'DSR00336')" }
      ];
      
      console.log('\n📊 Form table counts:');
      for (const check of formChecks) {
        try {
          const result = await pool.query(check.query);
          console.log(`  ${check.name}: ${result.rows[0].count} records`);
        } catch (error) {
          console.log(`  ${check.name}: Error - ${error.message}`);
        }
      }
      
      // Final status check
      if (user.bio_submitted === false && 
          user.guarantor_submitted === false && 
          user.commitment_submitted === false && 
          user.overall_verification_status === null) {
        console.log('\n🎉 SUCCESS: Bayo Lawal verification has been completely reset!');
        console.log('✅ The progress tracker should now show "Complete KYC Forms" instead of "Admin Review"');
        console.log('✅ Bayo should be able to start fresh with the verification process');
      } else {
        console.log('\n⚠️  WARNING: Reset may not be complete. Some flags are still set.');
      }
    }
    
  } catch (error) {
    console.error('❌ Error clearing Bayo cache:', error);
  } finally {
    await pool.end();
  }
}

// Run the cache clear
clearBayoCache();
