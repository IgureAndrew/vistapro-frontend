const { Pool } = require('pg');

async function runStartupMigration() {
  let pool;
  
  try {
    console.log('🔧 Running startup migration...');
    
    // Create database connection
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful');
    
    // Check if tables exist
    const tablesToCheck = [
      'marketer_guarantor_form',
      'marketer_commitment_form', 
      'admin_verification_details'
    ];
    
    let missingTables = [];
    
    for (const tableName of tablesToCheck) {
      try {
        const result = await pool.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          );
        `, [tableName]);
        
        if (!result.rows[0].exists) {
          missingTables.push(tableName);
          console.log(`⚠️  Table ${tableName} is missing`);
        } else {
          console.log(`✅ Table ${tableName} exists`);
        }
      } catch (error) {
        console.log(`❌ Error checking table ${tableName}:`, error.message);
        missingTables.push(tableName);
      }
    }
    
    if (missingTables.length > 0) {
      console.log(`🔄 Creating ${missingTables.length} missing tables...`);
      
      // Create marketer_guarantor_form table
      if (missingTables.includes('marketer_guarantor_form')) {
        console.log('📋 Creating marketer_guarantor_form table...');
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
        
        // Add foreign key constraint
        try {
          await pool.query(`
            ALTER TABLE marketer_guarantor_form 
            ADD CONSTRAINT fk_guarantor_marketer 
            FOREIGN KEY (marketer_id) REFERENCES users(id) ON DELETE CASCADE;
          `);
        } catch (error) {
          if (error.code !== '42710') { // Constraint already exists
            console.log('⚠️  Could not add foreign key constraint for guarantor table');
          }
        }
        
        // Create index
        try {
          await pool.query('CREATE INDEX IF NOT EXISTS idx_guarantor_marketer ON marketer_guarantor_form(marketer_id);');
        } catch (error) {
          console.log('⚠️  Could not create index for guarantor table');
        }
        
        console.log('✅ marketer_guarantor_form table created');
      }
      
      // Create marketer_commitment_form table
      if (missingTables.includes('marketer_commitment_form')) {
        console.log('📋 Creating marketer_commitment_form table...');
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
        
        // Add foreign key constraint
        try {
          await pool.query(`
            ALTER TABLE marketer_commitment_form 
            ADD CONSTRAINT fk_commitment_marketer 
            FOREIGN KEY (marketer_id) REFERENCES users(id) ON DELETE CASCADE;
          `);
        } catch (error) {
          if (error.code !== '42710') { // Constraint already exists
            console.log('⚠️  Could not add foreign key constraint for commitment table');
          }
        }
        
        // Create index
        try {
          await pool.query('CREATE INDEX IF NOT EXISTS idx_commitment_marketer ON marketer_commitment_form(marketer_id);');
        } catch (error) {
          console.log('⚠️  Could not create index for commitment table');
        }
        
        console.log('✅ marketer_commitment_form table created');
      }
      
      // Create admin_verification_details table
      if (missingTables.includes('admin_verification_details')) {
        console.log('📋 Creating admin_verification_details table...');
        await pool.query(`
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
        `);
        
        // Add foreign key constraints
        try {
          await pool.query(`
            ALTER TABLE admin_verification_details 
            ADD CONSTRAINT fk_admin_verification_submission 
            FOREIGN KEY (verification_submission_id) REFERENCES verification_submissions(id) ON DELETE CASCADE;
          `);
        } catch (error) {
          if (error.code !== '42710') { // Constraint already exists
            console.log('⚠️  Could not add foreign key constraint for admin verification submission');
          }
        }
        
        try {
          await pool.query(`
            ALTER TABLE admin_verification_details 
            ADD CONSTRAINT fk_admin_verification_admin 
            FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE;
          `);
        } catch (error) {
          if (error.code !== '42710') { // Constraint already exists
            console.log('⚠️  Could not add foreign key constraint for admin verification admin');
          }
        }
        
        // Create indexes
        try {
          await pool.query('CREATE INDEX IF NOT EXISTS idx_admin_verification_submission ON admin_verification_details(verification_submission_id);');
          await pool.query('CREATE INDEX IF NOT EXISTS idx_admin_verification_admin ON admin_verification_details(admin_id);');
          await pool.query('CREATE INDEX IF NOT EXISTS idx_admin_verification_date ON admin_verification_details(admin_verification_date);');
        } catch (error) {
          console.log('⚠️  Could not create indexes for admin verification table');
        }
        
        console.log('✅ admin_verification_details table created');
      }
      
      console.log('🎉 Startup migration completed successfully!');
      console.log('✅ All missing tables have been created');
      
    } else {
      console.log('✅ All required tables already exist');
    }
    
  } catch (error) {
    console.error('❌ Error in startup migration:', error.message);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

module.exports = runStartupMigration;
