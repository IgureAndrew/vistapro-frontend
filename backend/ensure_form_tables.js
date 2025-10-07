const { Pool } = require('pg');
require('dotenv').config();

async function ensureFormTables() {
  let pool;
  
  try {
    console.log('🔍 Ensuring form tables exist...');
    
    // Create database connection
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: false
    });
    
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful');
    
    // Check if marketer_guarantor_form table exists
    console.log('\n📋 Checking marketer_guarantor_form table...');
    const guarantorTableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'marketer_guarantor_form'
      );
    `);
    
    if (!guarantorTableCheck.rows[0].exists) {
      console.log('❌ marketer_guarantor_form table does not exist, creating...');
      
      await pool.query(`
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
      `);
      
      console.log('✅ marketer_guarantor_form table created');
    } else {
      console.log('✅ marketer_guarantor_form table exists');
    }
    
    // Check if marketer_commitment_form table exists
    console.log('\n📋 Checking marketer_commitment_form table...');
    const commitmentTableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'marketer_commitment_form'
      );
    `);
    
    if (!commitmentTableCheck.rows[0].exists) {
      console.log('❌ marketer_commitment_form table does not exist, creating...');
      
      await pool.query(`
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
      `);
      
      console.log('✅ marketer_commitment_form table created');
    } else {
      console.log('✅ marketer_commitment_form table exists');
    }
    
    // Check if marketer_biodata table exists
    console.log('\n📋 Checking marketer_biodata table...');
    const biodataTableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'marketer_biodata'
      );
    `);
    
    if (!biodataTableCheck.rows[0].exists) {
      console.log('❌ marketer_biodata table does not exist, creating...');
      
      await pool.query(`
        CREATE TABLE marketer_biodata (
          id SERIAL PRIMARY KEY,
          marketer_unique_id VARCHAR(255) NOT NULL,
          name VARCHAR(255),
          address TEXT,
          phone VARCHAR(20),
          religion VARCHAR(100),
          date_of_birth DATE,
          marital_status VARCHAR(50),
          state_of_origin VARCHAR(100),
          state_of_residence VARCHAR(100),
          mothers_maiden_name VARCHAR(255),
          school_attended VARCHAR(255),
          means_of_identification VARCHAR(100),
          id_document_url TEXT,
          last_place_of_work VARCHAR(255),
          job_description TEXT,
          reason_for_quitting TEXT,
          medical_condition TEXT,
          next_of_kin_name VARCHAR(255),
          next_of_kin_phone VARCHAR(20),
          next_of_kin_address TEXT,
          next_of_kin_relationship VARCHAR(100),
          bank_name VARCHAR(255),
          account_name VARCHAR(255),
          account_number VARCHAR(50),
          passport_photo_url TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      console.log('✅ marketer_biodata table created');
    } else {
      console.log('✅ marketer_biodata table exists');
    }
    
    console.log('\n🎉 All form tables are now ensured to exist!');
    
  } catch (error) {
    console.error('❌ Error ensuring form tables:', error.message);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

// Run the function
ensureFormTables();
