// force_reset_bayo.js
// Force reset Bayo Lawal's verification status completely

require('dotenv').config();
const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function forceResetBayo() {
  console.log('🚨 FORCE RESET: Bayo Lawal verification status...');
  
  try {
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful');
    
    // 1. Force reset user verification flags
    console.log('🔄 Force resetting user verification flags...');
    const userReset = await pool.query(`
      UPDATE users 
      SET 
        bio_submitted = false,
        guarantor_submitted = false,
        commitment_submitted = false,
        overall_verification_status = NULL,
        updated_at = CURRENT_TIMESTAMP
      WHERE unique_id = 'DSR00336' OR email = 'bayolawal@gmail.com'
      RETURNING id, unique_id, first_name, last_name, bio_submitted, guarantor_submitted, commitment_submitted, overall_verification_status;
    `);
    
    if (userReset.rows.length > 0) {
      console.log('✅ User verification flags reset:', userReset.rows[0]);
    } else {
      console.log('⚠️  Bayo Lawal user not found');
    }
    
    // 2. Delete ALL form submissions
    console.log('🔄 Deleting ALL form submissions...');
    
    // Delete biodata
    const biodataDelete = await pool.query(`
      DELETE FROM marketer_biodata WHERE marketer_unique_id = 'DSR00336'
      RETURNING id;
    `);
    console.log(`✅ Deleted ${biodataDelete.rows.length} biodata records`);
    
    // Delete guarantor
    const guarantorDelete = await pool.query(`
      DELETE FROM marketer_guarantor_form WHERE marketer_id = (SELECT id FROM users WHERE unique_id = 'DSR00336')
      RETURNING id;
    `);
    console.log(`✅ Deleted ${guarantorDelete.rows.length} guarantor records`);
    
    // Delete commitment
    const commitmentDelete = await pool.query(`
      DELETE FROM marketer_commitment_form WHERE marketer_id = (SELECT id FROM users WHERE unique_id = 'DSR00336')
      RETURNING id;
    `);
    console.log(`✅ Deleted ${commitmentDelete.rows.length} commitment records`);
    
    // Delete verification submissions
    const verificationDelete = await pool.query(`
      DELETE FROM verification_submissions WHERE marketer_id = (SELECT id FROM users WHERE unique_id = 'DSR00336')
      RETURNING id;
    `);
    console.log(`✅ Deleted ${verificationDelete.rows.length} verification submission records`);
    
    // Delete workflow logs
    const workflowDelete = await pool.query(`
      DELETE FROM verification_workflow_logs WHERE marketer_id = (SELECT id FROM users WHERE unique_id = 'DSR00336')
      RETURNING id;
    `);
    console.log(`✅ Deleted ${workflowDelete.rows.length} workflow log records`);
    
    // 3. Verify the reset
    console.log('\n🔍 Verifying reset...');
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
      console.log('✅ Verification complete - Bayo Lawal status:');
      console.log('  Bio Submitted:', user.bio_submitted);
      console.log('  Guarantor Submitted:', user.guarantor_submitted);
      console.log('  Commitment Submitted:', user.commitment_submitted);
      console.log('  Overall Verification Status:', user.overall_verification_status);
      console.log('  Updated At:', user.updated_at);
      
      // Check if all forms are truly empty
      const biodataCheck = await pool.query(`SELECT COUNT(*) FROM marketer_biodata WHERE marketer_unique_id = 'DSR00336'`);
      const guarantorCheck = await pool.query(`SELECT COUNT(*) FROM marketer_guarantor_form WHERE marketer_id = (SELECT id FROM users WHERE unique_id = 'DSR00336')`);
      const commitmentCheck = await pool.query(`SELECT COUNT(*) FROM marketer_commitment_form WHERE marketer_id = (SELECT id FROM users WHERE unique_id = 'DSR00336')`);
      const verificationCheck = await pool.query(`SELECT COUNT(*) FROM verification_submissions WHERE marketer_id = (SELECT id FROM users WHERE unique_id = 'DSR00336')`);
      
      console.log('\n📊 Form submission counts:');
      console.log('  Biodata records:', biodataCheck.rows[0].count);
      console.log('  Guarantor records:', guarantorCheck.rows[0].count);
      console.log('  Commitment records:', commitmentCheck.rows[0].count);
      console.log('  Verification submission records:', verificationCheck.rows[0].count);
      
      if (user.bio_submitted === false && 
          user.guarantor_submitted === false && 
          user.commitment_submitted === false && 
          user.overall_verification_status === null &&
          biodataCheck.rows[0].count === '0' &&
          guarantorCheck.rows[0].count === '0' &&
          commitmentCheck.rows[0].count === '0' &&
          verificationCheck.rows[0].count === '0') {
        console.log('\n🎉 SUCCESS: Bayo Lawal verification has been completely reset!');
        console.log('✅ He should now see "Complete KYC Forms" instead of "Admin Review"');
      } else {
        console.log('\n⚠️  WARNING: Reset may not be complete. Some data still exists.');
      }
    }
    
  } catch (error) {
    console.error('❌ Error force resetting Bayo:', error);
  } finally {
    await pool.end();
  }
}

// Run the force reset
forceResetBayo();
