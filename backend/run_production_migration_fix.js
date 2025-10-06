const { Pool } = require('pg');
require('dotenv').config();

// Production database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function runMigrationAndFix() {
  try {
    console.log('🔧 Starting production migration and data fix...');
    
    // Step 1: Create admin_verification_details table
    console.log('📋 Step 1: Creating admin_verification_details table...');
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS admin_verification_details (
        id SERIAL PRIMARY KEY,
        verification_submission_id INTEGER NOT NULL,
        admin_id INTEGER NOT NULL,
        admin_verification_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        verification_notes TEXT,
        location_photo_url TEXT,
        admin_marketer_photo_url TEXT,
        landmark_description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    await pool.query(createTableQuery);
    console.log('✅ admin_verification_details table created');
    
    // Step 2: Add foreign key constraints
    console.log('📋 Step 2: Adding foreign key constraints...');
    try {
      await pool.query(`
        ALTER TABLE admin_verification_details 
        ADD CONSTRAINT fk_admin_verification_submission 
        FOREIGN KEY (verification_submission_id) REFERENCES verification_submissions(id) ON DELETE CASCADE;
      `);
      console.log('✅ Foreign key constraint added for verification_submission_id');
    } catch (error) {
      if (error.code === '42710') {
        console.log('⚠️  Foreign key constraint already exists, skipping...');
      } else {
        throw error;
      }
    }
    
    try {
      await pool.query(`
        ALTER TABLE admin_verification_details 
        ADD CONSTRAINT fk_admin_verification_admin 
        FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE;
      `);
      console.log('✅ Foreign key constraint added for admin_id');
    } catch (error) {
      if (error.code === '42710') {
        console.log('⚠️  Foreign key constraint already exists, skipping...');
      } else {
        throw error;
      }
    }
    
    // Step 3: Create indexes
    console.log('📋 Step 3: Creating indexes...');
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_admin_verification_details_submission ON admin_verification_details(verification_submission_id);',
      'CREATE INDEX IF NOT EXISTS idx_admin_verification_details_admin ON admin_verification_details(admin_id);',
      'CREATE INDEX IF NOT EXISTS idx_admin_verification_details_date ON admin_verification_details(admin_verification_date);'
    ];
    
    for (const indexQuery of indexes) {
      await pool.query(indexQuery);
    }
    console.log('✅ Indexes created');
    
    // Step 4: Fix user form flags
    console.log('📋 Step 4: Fixing user form flags...');
    
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
    
    console.log(`\n🎉 Migration and fix completed!`);
    console.log(`✅ Fixed: ${fixedCount} marketers`);
    console.log(`❌ Errors: ${errorCount} marketers`);
    console.log(`📊 Total processed: ${marketersResult.rows.length} marketers`);
    
  } catch (error) {
    console.error('❌ Error running migration and fix:', error);
  } finally {
    await pool.end();
  }
}

// Run the migration and fix
runMigrationAndFix();
