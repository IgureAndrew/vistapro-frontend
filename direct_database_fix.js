// direct_database_fix.js
// This script directly connects to the production database to fix schema issues
// Run this on the production server or with production database access

require('dotenv').config();
const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function fixDatabaseSchema() {
  console.log('🚀 Starting direct database schema fix...');
  
  try {
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful');
    
    // 1. Create marketer_guarantor_form table if it doesn't exist
    console.log('🔄 Creating marketer_guarantor_form table...');
    await pool.query(`
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
    `);
    console.log('✅ marketer_guarantor_form table created');

    // 2. Create marketer_commitment_form table if it doesn't exist
    console.log('🔄 Creating marketer_commitment_form table...');
    await pool.query(`
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
    `);
    console.log('✅ marketer_commitment_form table created');

    // 3. Add missing columns to orders table
    console.log('🔄 Adding device columns to orders table...');
    
    // Check if device_name column exists
    const deviceNameCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'device_name'
      );
    `);
    
    if (!deviceNameCheck.rows[0].exists) {
      await pool.query('ALTER TABLE orders ADD COLUMN device_name VARCHAR(255);');
      console.log('✅ Added device_name column to orders table');
    } else {
      console.log('✅ device_name column already exists in orders table');
    }
    
    // Check if device_model column exists
    const deviceModelCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'device_model'
      );
    `);
    
    if (!deviceModelCheck.rows[0].exists) {
      await pool.query('ALTER TABLE orders ADD COLUMN device_model VARCHAR(255);');
      console.log('✅ Added device_model column to orders table');
    } else {
      console.log('✅ device_model column already exists in orders table');
    }
    
    // Check if device_type column exists
    const deviceTypeCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'device_type'
      );
    `);
    
    if (!deviceTypeCheck.rows[0].exists) {
      await pool.query('ALTER TABLE orders ADD COLUMN device_type VARCHAR(50);');
      console.log('✅ Added device_type column to orders table');
    } else {
      console.log('✅ device_type column already exists in orders table');
    }

    // 4. Create verification_submissions table if it doesn't exist
    console.log('🔄 Creating verification_submissions table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS verification_submissions (
        id SERIAL PRIMARY KEY,
        marketer_id INTEGER NOT NULL,
        admin_id INTEGER NOT NULL,
        super_admin_id INTEGER NOT NULL,
        submission_status VARCHAR(50) NOT NULL DEFAULT 'pending_admin_review',
        admin_reviewed_at TIMESTAMP,
        superadmin_reviewed_at TIMESTAMP,
        masteradmin_approved_at TIMESTAMP,
        rejection_reason TEXT,
        rejected_by VARCHAR(50),
        rejected_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ verification_submissions table created');

    // 5. Create verification_workflow_logs table if it doesn't exist
    console.log('🔄 Creating verification_workflow_logs table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS verification_workflow_logs (
        id SERIAL PRIMARY KEY,
        marketer_id INTEGER NOT NULL,
        admin_id INTEGER,
        super_admin_id INTEGER,
        master_admin_id INTEGER,
        action VARCHAR(100) NOT NULL,
        status VARCHAR(50) NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ verification_workflow_logs table created');

    // 6. Reset Bayo Lawal's verification status
    console.log('🔄 Resetting Bayo Lawal verification status...');
    const resetResult = await pool.query(`
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
    
    if (resetResult.rows.length > 0) {
      console.log('✅ Bayo Lawal verification status reset:', resetResult.rows[0]);
    } else {
      console.log('⚠️  Bayo Lawal user not found or already reset');
    }

    // 7. Delete existing form submissions for Bayo Lawal
    console.log('🔄 Deleting existing Bayo Lawal form submissions...');
    
    // Delete from marketer_biodata
    const biodataDelete = await pool.query(`
      DELETE FROM marketer_biodata WHERE marketer_unique_id = 'DSR00336'
      RETURNING id;
    `);
    console.log(`✅ Deleted ${biodataDelete.rows.length} biodata records for Bayo Lawal`);
    
    // Delete from marketer_guarantor_form
    const guarantorDelete = await pool.query(`
      DELETE FROM marketer_guarantor_form WHERE marketer_id = (SELECT id FROM users WHERE unique_id = 'DSR00336')
      RETURNING id;
    `);
    console.log(`✅ Deleted ${guarantorDelete.rows.length} guarantor records for Bayo Lawal`);
    
    // Delete from marketer_commitment_form
    const commitmentDelete = await pool.query(`
      DELETE FROM marketer_commitment_form WHERE marketer_id = (SELECT id FROM users WHERE unique_id = 'DSR00336')
      RETURNING id;
    `);
    console.log(`✅ Deleted ${commitmentDelete.rows.length} commitment records for Bayo Lawal`);
    
    // Delete from verification_submissions
    const verificationDelete = await pool.query(`
      DELETE FROM verification_submissions WHERE marketer_id = (SELECT id FROM users WHERE unique_id = 'DSR00336')
      RETURNING id;
    `);
    console.log(`✅ Deleted ${verificationDelete.rows.length} verification submission records for Bayo Lawal`);

    console.log('🎉 Database schema fix completed successfully!');
    console.log('✅ All missing tables and columns have been created');
    console.log('✅ Bayo Lawal verification has been completely reset');
    console.log('✅ The verification process should now work properly');
    
  } catch (error) {
    console.error('❌ Error fixing database schema:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the fix
if (require.main === module) {
  fixDatabaseSchema()
    .then(() => {
      console.log('🎉 Database fix completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Database fix failed:', error);
      process.exit(1);
    });
}

module.exports = { fixDatabaseSchema };
