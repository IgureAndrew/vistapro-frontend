const { Pool } = require('pg');
require('dotenv').config();

// Production database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function runCompleteProductionFix() {
  try {
    console.log('🔧 Starting complete production database fix...');
    
    // Step 1: Create marketer_guarantor_form table
    console.log('📋 Step 1: Creating marketer_guarantor_form table...');
    const createGuarantorTable = `
      CREATE TABLE IF NOT EXISTS marketer_guarantor_form (
        id SERIAL PRIMARY KEY,
        marketer_id INTEGER NOT NULL,
        is_candidate_well_known BOOLEAN,
        relationship TEXT,
        known_duration INTEGER,
        occupation TEXT,
        id_document_url TEXT,
        passport_photo_url TEXT,
        signature_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    await pool.query(createGuarantorTable);
    console.log('✅ marketer_guarantor_form table created');
    
    // Step 2: Create marketer_commitment_form table
    console.log('📋 Step 2: Creating marketer_commitment_form table...');
    const createCommitmentTable = `
      CREATE TABLE IF NOT EXISTS marketer_commitment_form (
        id SERIAL PRIMARY KEY,
        marketer_id INTEGER NOT NULL,
        promise_accept_false_documents BOOLEAN NOT NULL,
        promise_not_request_irrelevant_info BOOLEAN NOT NULL,
        promise_not_charge_customer_fees BOOLEAN NOT NULL,
        promise_not_modify_contract_info BOOLEAN NOT NULL,
        promise_not_sell_unapproved_phones BOOLEAN NOT NULL,
        promise_not_make_unofficial_commitment BOOLEAN NOT NULL,
        promise_not_operate_customer_account BOOLEAN NOT NULL,
        promise_accept_fraud_firing BOOLEAN NOT NULL,
        promise_not_share_company_info BOOLEAN NOT NULL,
        promise_ensure_loan_recovery BOOLEAN NOT NULL,
        promise_abide_by_system BOOLEAN NOT NULL,
        direct_sales_rep_name VARCHAR(255),
        direct_sales_rep_signature_url TEXT,
        date_signed TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    await pool.query(createCommitmentTable);
    console.log('✅ marketer_commitment_form table created');
    
    // Step 3: Create admin_verification_details table
    console.log('📋 Step 3: Creating admin_verification_details table...');
    const createAdminVerificationTable = `
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
    
    await pool.query(createAdminVerificationTable);
    console.log('✅ admin_verification_details table created');
    
    // Step 4: Add foreign key constraints
    console.log('📋 Step 4: Adding foreign key constraints...');
    
    const constraints = [
      {
        name: 'fk_guarantor_marketer',
        query: 'ALTER TABLE marketer_guarantor_form ADD CONSTRAINT fk_guarantor_marketer FOREIGN KEY (marketer_id) REFERENCES users(id) ON DELETE CASCADE;'
      },
      {
        name: 'fk_commitment_marketer',
        query: 'ALTER TABLE marketer_commitment_form ADD CONSTRAINT fk_commitment_marketer FOREIGN KEY (marketer_id) REFERENCES users(id) ON DELETE CASCADE;'
      },
      {
        name: 'fk_admin_verification_submission',
        query: 'ALTER TABLE admin_verification_details ADD CONSTRAINT fk_admin_verification_submission FOREIGN KEY (verification_submission_id) REFERENCES verification_submissions(id) ON DELETE CASCADE;'
      },
      {
        name: 'fk_admin_verification_admin',
        query: 'ALTER TABLE admin_verification_details ADD CONSTRAINT fk_admin_verification_admin FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE;'
      }
    ];
    
    for (const constraint of constraints) {
      try {
        await pool.query(constraint.query);
        console.log(`✅ ${constraint.name} constraint added`);
      } catch (error) {
        if (error.code === '42710') {
          console.log(`⚠️  ${constraint.name} constraint already exists, skipping...`);
        } else {
          console.log(`❌ Error adding ${constraint.name}:`, error.message);
        }
      }
    }
    
    // Step 5: Create indexes
    console.log('📋 Step 5: Creating indexes...');
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_guarantor_marketer ON marketer_guarantor_form(marketer_id);',
      'CREATE INDEX IF NOT EXISTS idx_commitment_marketer ON marketer_commitment_form(marketer_id);',
      'CREATE INDEX IF NOT EXISTS idx_admin_verification_submission ON admin_verification_details(verification_submission_id);',
      'CREATE INDEX IF NOT EXISTS idx_admin_verification_admin ON admin_verification_details(admin_id);',
      'CREATE INDEX IF NOT EXISTS idx_admin_verification_date ON admin_verification_details(admin_verification_date);'
    ];
    
    for (const indexQuery of indexes) {
      await pool.query(indexQuery);
    }
    console.log('✅ Indexes created');
    
    // Step 6: Fix user form flags
    console.log('📋 Step 6: Fixing user form flags...');
    
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
    
    console.log(`\n🎉 Complete production fix completed!`);
    console.log(`✅ Fixed: ${fixedCount} marketers`);
    console.log(`❌ Errors: ${errorCount} marketers`);
    console.log(`📊 Total processed: ${marketersResult.rows.length} marketers`);
    
    // Step 7: Verify tables exist
    console.log('\n📋 Step 7: Verifying tables exist...');
    const tablesToCheck = [
      'marketer_guarantor_form',
      'marketer_commitment_form', 
      'admin_verification_details',
      'verification_submissions'
    ];
    
    for (const tableName of tablesToCheck) {
      try {
        const result = await pool.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          );
        `, [tableName]);
        
        if (result.rows[0].exists) {
          console.log(`✅ Table ${tableName} exists`);
        } else {
          console.log(`❌ Table ${tableName} does not exist`);
        }
      } catch (error) {
        console.log(`❌ Error checking table ${tableName}:`, error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Error running complete production fix:', error);
  } finally {
    await pool.end();
  }
}

// Run the complete fix
runCompleteProductionFix();
