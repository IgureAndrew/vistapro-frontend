// fix_production_database.js
// This script fixes the production database by running all necessary migrations
// and ensuring all tables and columns exist

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runMigration(migrationName, sqlContent) {
  try {
    console.log(`🔄 Running migration: ${migrationName}`);
    await pool.query(sqlContent);
    console.log(`✅ Migration completed: ${migrationName}`);
    return true;
  } catch (error) {
    console.error(`❌ Migration failed: ${migrationName}`, error.message);
    return false;
  }
}

async function checkTableExists(tableName) {
  try {
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      );
    `, [tableName]);
    return result.rows[0].exists;
  } catch (error) {
    console.error(`Error checking table ${tableName}:`, error.message);
    return false;
  }
}

async function checkColumnExists(tableName, columnName) {
  try {
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = $1 AND column_name = $2
      );
    `, [tableName, columnName]);
    return result.rows[0].exists;
  } catch (error) {
    console.error(`Error checking column ${tableName}.${columnName}:`, error.message);
    return false;
  }
}

async function fixProductionDatabase() {
  console.log('🚀 Starting production database fix...');
  
  try {
    // 1. Create marketer_guarantor_form table if it doesn't exist
    const guarantorTableExists = await checkTableExists('marketer_guarantor_form');
    if (!guarantorTableExists) {
      const guarantorSQL = `
        CREATE TABLE marketer_guarantor_form (
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
      await runMigration('Create marketer_guarantor_form table', guarantorSQL);
    } else {
      console.log('✅ marketer_guarantor_form table already exists');
    }

    // 2. Create marketer_commitment_form table if it doesn't exist
    const commitmentTableExists = await checkTableExists('marketer_commitment_form');
    if (!commitmentTableExists) {
      const commitmentSQL = `
        CREATE TABLE marketer_commitment_form (
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
      await runMigration('Create marketer_commitment_form table', commitmentSQL);
    } else {
      console.log('✅ marketer_commitment_form table already exists');
    }

    // 3. Add missing columns to orders table
    const deviceNameExists = await checkColumnExists('orders', 'device_name');
    if (!deviceNameExists) {
      const addDeviceColumnsSQL = `
        ALTER TABLE orders ADD COLUMN device_name VARCHAR(255);
        ALTER TABLE orders ADD COLUMN device_model VARCHAR(255);
        ALTER TABLE orders ADD COLUMN device_type VARCHAR(50);
        ALTER TABLE orders ADD COLUMN dealer_cost_price NUMERIC(10,2);
        ALTER TABLE orders ADD COLUMN marketer_selling_price NUMERIC(10,2);
        ALTER TABLE orders ADD COLUMN sold_amount NUMERIC(10,2);
        ALTER TABLE orders ADD COLUMN customer_phone VARCHAR(50);
        ALTER TABLE orders ADD COLUMN customer_address TEXT;
        ALTER TABLE orders ADD COLUMN bnpl_platform VARCHAR(50);
        ALTER TABLE orders ADD COLUMN sale_date TIMESTAMP;
      `;
      await runMigration('Add device columns to orders table', addDeviceColumnsSQL);
    } else {
      console.log('✅ Device columns already exist in orders table');
    }

    // 4. Create verification_submissions table if it doesn't exist
    const verificationTableExists = await checkTableExists('verification_submissions');
    if (!verificationTableExists) {
      const verificationSQL = `
        CREATE TABLE verification_submissions (
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
      `;
      await runMigration('Create verification_submissions table', verificationSQL);
    } else {
      console.log('✅ verification_submissions table already exists');
    }

    // 5. Create verification_workflow_logs table if it doesn't exist
    const workflowLogsTableExists = await checkTableExists('verification_workflow_logs');
    if (!workflowLogsTableExists) {
      const workflowLogsSQL = `
        CREATE TABLE verification_workflow_logs (
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
      `;
      await runMigration('Create verification_workflow_logs table', workflowLogsSQL);
    } else {
      console.log('✅ verification_workflow_logs table already exists');
    }

    // 6. Reset Bayo Lawal's verification status to start fresh
    console.log('🔄 Resetting Bayo Lawal verification status...');
    const resetBayoSQL = `
      UPDATE users 
      SET 
        bio_submitted = false,
        guarantor_submitted = false,
        commitment_submitted = false,
        overall_verification_status = NULL,
        updated_at = CURRENT_TIMESTAMP
      WHERE unique_id = 'DSR00336' OR email = 'bayolawal@gmail.com';
    `;
    await runMigration('Reset Bayo Lawal verification status', resetBayoSQL);

    // 7. Delete any existing form submissions for Bayo Lawal
    const deleteBayoFormsSQL = `
      DELETE FROM marketer_biodata WHERE marketer_unique_id = 'DSR00336';
      DELETE FROM marketer_guarantor_form WHERE marketer_id = (SELECT id FROM users WHERE unique_id = 'DSR00336');
      DELETE FROM marketer_commitment_form WHERE marketer_id = (SELECT id FROM users WHERE unique_id = 'DSR00336');
      DELETE FROM verification_submissions WHERE marketer_id = (SELECT id FROM users WHERE unique_id = 'DSR00336');
    `;
    await runMigration('Delete existing Bayo Lawal form submissions', deleteBayoFormsSQL);

    console.log('✅ Production database fix completed successfully!');
    console.log('🎯 Bayo Lawal can now start fresh with verification forms');
    
  } catch (error) {
    console.error('❌ Error fixing production database:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the fix
if (require.main === module) {
  fixProductionDatabase()
    .then(() => {
      console.log('🎉 Database fix completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Database fix failed:', error);
      process.exit(1);
    });
}

module.exports = { fixProductionDatabase };
