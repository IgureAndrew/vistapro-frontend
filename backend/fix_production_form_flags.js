const { Pool } = require('pg');
require('dotenv').config();

// Production database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

/**
 * Fix user form flags for all marketers based on actual form submissions
 */
async function fixAllUserFormFlags() {
  try {
    console.log('🔧 Starting to fix user form flags for all marketers in PRODUCTION...');
    
    // Get all marketers
    const marketersResult = await pool.query(
      'SELECT id, unique_id, first_name, last_name FROM users WHERE role = $1',
      ['Marketer']
    );
    
    console.log(`📊 Found ${marketersResult.rows.length} marketers to check`);
    
    let fixedCount = 0;
    let errorCount = 0;
    
    for (const marketer of marketersResult.rows) {
      try {
        console.log(`\n🔍 Checking marketer: ${marketer.first_name} ${marketer.last_name} (${marketer.unique_id})`);
        
        // Check if forms actually exist in database
        const biodataCheck = await pool.query(
          'SELECT COUNT(*) as count FROM marketer_biodata WHERE marketer_unique_id = $1',
          [marketer.unique_id]
        );
        
        const guarantorCheck = await pool.query(
          'SELECT COUNT(*) as count FROM marketer_guarantor_form WHERE marketer_id = $1',
          [marketer.id]
        );
        
        const commitmentCheck = await pool.query(
          'SELECT COUNT(*) as count FROM marketer_commitment_form WHERE marketer_id = $1',
          [marketer.id]
        );
        
        const bioSubmitted = parseInt(biodataCheck.rows[0].count) > 0;
        const guarantorSubmitted = parseInt(guarantorCheck.rows[0].count) > 0;
        const commitmentSubmitted = parseInt(commitmentCheck.rows[0].count) > 0;
        
        console.log(`📋 Form existence:`, { bioSubmitted, guarantorSubmitted, commitmentSubmitted });
        
        // Get current user flags
        const currentUserResult = await pool.query(
          'SELECT bio_submitted, guarantor_submitted, commitment_submitted FROM users WHERE id = $1',
          [marketer.id]
        );
        
        const currentFlags = currentUserResult.rows[0];
        console.log(`🏷️ Current flags:`, currentFlags);
        
        // Check if flags need updating
        const needsUpdate = 
          currentFlags.bio_submitted !== bioSubmitted ||
          currentFlags.guarantor_submitted !== guarantorSubmitted ||
          currentFlags.commitment_submitted !== commitmentSubmitted;
        
        if (needsUpdate) {
          console.log(`🔄 Updating flags for ${marketer.first_name} ${marketer.last_name}...`);
          
          // Update user flags to match actual form existence
          const updateResult = await pool.query(
            `UPDATE users 
             SET bio_submitted = $1, 
                 guarantor_submitted = $2, 
                 commitment_submitted = $3,
                 updated_at = NOW()
             WHERE id = $4
             RETURNING *`,
            [bioSubmitted, guarantorSubmitted, commitmentSubmitted, marketer.id]
          );
          
          if (updateResult.rows.length > 0) {
            console.log(`✅ Flags updated for ${marketer.first_name} ${marketer.last_name}`);
            fixedCount++;
          } else {
            console.log(`❌ Failed to update flags for ${marketer.first_name} ${marketer.last_name}`);
            errorCount++;
          }
        } else {
          console.log(`✅ Flags already correct for ${marketer.first_name} ${marketer.last_name}`);
        }
        
      } catch (error) {
        console.error(`❌ Error processing marketer ${marketer.first_name} ${marketer.last_name}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\n🎉 Fix completed!`);
    console.log(`✅ Fixed: ${fixedCount} marketers`);
    console.log(`❌ Errors: ${errorCount} marketers`);
    console.log(`📊 Total processed: ${marketersResult.rows.length} marketers`);
    
  } catch (error) {
    console.error('❌ Error fixing user form flags:', error);
  } finally {
    await pool.end();
  }
}

// Run the fix
fixAllUserFormFlags();
