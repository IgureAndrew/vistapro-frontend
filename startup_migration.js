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
      'marketer_biodata',
      'marketer_guarantor_form',
      'marketer_commitment_form', 
      'admin_verification_details',
      'verification_submissions',
      'verification_workflow_logs',
      'additional_pickup_requests',
      'product_activity_logs',
      'target_types',
      'targets',
      'target_percentage_mappings'
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
            marketer_id INTEGER NOT NULL,
            marketer_address TEXT NOT NULL,
            landmark_description TEXT,
            location_photo_url TEXT,
            admin_marketer_photo_url TEXT,
            verification_notes TEXT,
            admin_verification_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            additional_documents JSONB,
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
        
        try {
          await pool.query(`
            ALTER TABLE admin_verification_details 
            ADD CONSTRAINT fk_admin_verification_marketer 
            FOREIGN KEY (marketer_id) REFERENCES users(id) ON DELETE CASCADE;
          `);
        } catch (error) {
          if (error.code !== '42710') { // Constraint already exists
            console.log('⚠️  Could not add foreign key constraint for admin verification marketer');
          }
        }
        
        // Create indexes
        try {
          await pool.query('CREATE INDEX IF NOT EXISTS idx_admin_verification_submission ON admin_verification_details(verification_submission_id);');
          await pool.query('CREATE INDEX IF NOT EXISTS idx_admin_verification_admin ON admin_verification_details(admin_id);');
          await pool.query('CREATE INDEX IF NOT EXISTS idx_admin_verification_marketer ON admin_verification_details(marketer_id);');
          await pool.query('CREATE INDEX IF NOT EXISTS idx_admin_verification_date ON admin_verification_details(admin_verification_date);');
        } catch (error) {
          console.log('⚠️  Could not create indexes for admin verification table');
        }
        
        console.log('✅ admin_verification_details table created');
      }
      
      // Create verification_submissions table
      if (missingTables.includes('verification_submissions')) {
        console.log('📋 Creating verification_submissions table...');
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
        
        // Add foreign key constraints
        try {
          await pool.query(`
            ALTER TABLE verification_submissions 
            ADD CONSTRAINT fk_verification_marketer 
            FOREIGN KEY (marketer_id) REFERENCES users(id) ON DELETE CASCADE;
          `);
        } catch (error) {
          if (error.code !== '42710') {
            console.log('⚠️  Could not add foreign key constraint for verification_submissions');
          }
        }
        
        // Create indexes
        try {
          await pool.query('CREATE INDEX IF NOT EXISTS idx_verification_marketer ON verification_submissions(marketer_id);');
          await pool.query('CREATE INDEX IF NOT EXISTS idx_verification_admin ON verification_submissions(admin_id);');
          await pool.query('CREATE INDEX IF NOT EXISTS idx_verification_status ON verification_submissions(submission_status);');
        } catch (error) {
          console.log('⚠️  Could not create indexes for verification_submissions');
        }
        
        console.log('✅ verification_submissions table created');
      }
      
      // Create verification_workflow_logs table
      if (missingTables.includes('verification_workflow_logs')) {
        console.log('📋 Creating verification_workflow_logs table...');
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
        
        // Add foreign key constraints
        try {
          await pool.query(`
            ALTER TABLE verification_workflow_logs 
            ADD CONSTRAINT fk_workflow_logs_marketer 
            FOREIGN KEY (marketer_id) REFERENCES users(id) ON DELETE CASCADE;
          `);
        } catch (error) {
          if (error.code !== '42710') {
            console.log('⚠️  Could not add foreign key constraint for verification_workflow_logs');
          }
        }
        
        // Create indexes
        try {
          await pool.query('CREATE INDEX IF NOT EXISTS idx_workflow_logs_marketer ON verification_workflow_logs(marketer_id);');
          await pool.query('CREATE INDEX IF NOT EXISTS idx_workflow_logs_action ON verification_workflow_logs(action);');
          await pool.query('CREATE INDEX IF NOT EXISTS idx_workflow_logs_status ON verification_workflow_logs(status);');
        } catch (error) {
          console.log('⚠️  Could not create indexes for verification_workflow_logs');
        }
        
        console.log('✅ verification_workflow_logs table created');
      }
      
      // Create additional_pickup_requests table
      if (missingTables.includes('additional_pickup_requests')) {
        console.log('📋 Creating additional_pickup_requests table...');
        await pool.query(`
          CREATE TABLE IF NOT EXISTS additional_pickup_requests (
            id SERIAL PRIMARY KEY,
            marketer_id INTEGER NOT NULL UNIQUE,
            status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
            requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            reviewed_by INTEGER,
            reviewed_at TIMESTAMP,
            review_notes TEXT,
            order_confirmation_required BOOLEAN NOT NULL DEFAULT TRUE,
            units_remaining INTEGER,
            completion_status VARCHAR(20) DEFAULT 'pending' CHECK (completion_status IN ('pending', 'in_progress', 'completed')),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `);
        
        // Add foreign key constraints
        try {
          await pool.query(`
            ALTER TABLE additional_pickup_requests 
            ADD CONSTRAINT fk_additional_pickup_marketer 
            FOREIGN KEY (marketer_id) REFERENCES users(id) ON DELETE CASCADE;
          `);
        } catch (error) {
          if (error.code !== '42710') { // Constraint already exists
            console.log('⚠️  Could not add foreign key constraint for additional pickup marketer');
          }
        }
        
        try {
          await pool.query(`
            ALTER TABLE additional_pickup_requests 
            ADD CONSTRAINT fk_additional_pickup_reviewer 
            FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL;
          `);
        } catch (error) {
          if (error.code !== '42710') { // Constraint already exists
            console.log('⚠️  Could not add foreign key constraint for additional pickup reviewer');
          }
        }
        
        // Create indexes
        try {
          await pool.query('CREATE INDEX IF NOT EXISTS idx_additional_pickup_marketer ON additional_pickup_requests(marketer_id);');
          await pool.query('CREATE INDEX IF NOT EXISTS idx_additional_pickup_status ON additional_pickup_requests(status);');
          await pool.query('CREATE INDEX IF NOT EXISTS idx_additional_pickup_requested_at ON additional_pickup_requests(requested_at);');
        } catch (error) {
          console.log('⚠️  Could not create indexes for additional_pickup_requests');
        }
        
        console.log('✅ additional_pickup_requests table created');
      }
      
      // Create product_activity_logs table if missing
      if (missingTables.includes('product_activity_logs')) {
        console.log('📋 Creating product_activity_logs table...');
        await pool.query(`
          CREATE TABLE IF NOT EXISTS product_activity_logs (
            id SERIAL PRIMARY KEY,
            product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
            action_type VARCHAR(50) NOT NULL,
            actor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
            actor_name VARCHAR(255),
            actor_role VARCHAR(50),
            old_values JSONB,
            new_values JSONB,
            quantity_change INTEGER DEFAULT 0,
            description TEXT,
            created_at TIMESTAMP DEFAULT NOW()
          );
        `);
        
        // Create indexes for better query performance
        try {
          await pool.query('CREATE INDEX IF NOT EXISTS idx_product_activity_product_id ON product_activity_logs(product_id);');
          await pool.query('CREATE INDEX IF NOT EXISTS idx_product_activity_created_at ON product_activity_logs(created_at DESC);');
          await pool.query('CREATE INDEX IF NOT EXISTS idx_product_activity_actor ON product_activity_logs(actor_id);');
          await pool.query('CREATE INDEX IF NOT EXISTS idx_product_activity_action_type ON product_activity_logs(action_type);');
        } catch (error) {
          console.log('⚠️  Could not create indexes for product_activity_logs');
        }
        
        console.log('✅ product_activity_logs table created');
      }
      
      // Create target management tables if missing
      if (missingTables.includes('target_types')) {
        console.log('🔧 Creating target_types table...');
        await pool.query(`
          CREATE TABLE IF NOT EXISTS target_types (
            id SERIAL PRIMARY KEY,
            name VARCHAR(50) UNIQUE NOT NULL,
            description TEXT,
            metric_unit VARCHAR(20) NOT NULL,
            supports_bnpl BOOLEAN DEFAULT false,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT NOW()
          );
        `);
        
        // Insert default target types
        await pool.query(`
          INSERT INTO target_types (name, description, metric_unit, supports_bnpl) VALUES
          ('orders', 'Number of orders to complete', 'count', false),
          ('sales', 'Sales revenue target', 'currency', true),
          ('customers', 'Number of new customers', 'count', false),
          ('conversion_rate', 'Order conversion rate', 'percentage', false),
          ('recruitment', 'Number of new marketers recruited', 'count', false)
          ON CONFLICT (name) DO NOTHING;
        `);
        
        console.log('✅ target_types table created');
      }
      
      if (missingTables.includes('targets')) {
        console.log('🔧 Creating targets table...');
        await pool.query(`
          CREATE TABLE IF NOT EXISTS targets (
            id SERIAL PRIMARY KEY,
            user_id VARCHAR(50) NOT NULL REFERENCES users(unique_id) ON DELETE CASCADE,
            target_type_id INTEGER NOT NULL REFERENCES target_types(id),
            target_value DECIMAL(15,2) NOT NULL CHECK (target_value > 0),
            period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
            period_start DATE NOT NULL,
            period_end DATE NOT NULL,
            bnpl_platform VARCHAR(50),
            is_active BOOLEAN DEFAULT true,
            created_by VARCHAR(50) REFERENCES users(unique_id),
            notes TEXT,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          );
        `);
        
        // Create indexes
        try {
          await pool.query('CREATE INDEX IF NOT EXISTS idx_targets_user_id ON targets(user_id);');
          await pool.query('CREATE INDEX IF NOT EXISTS idx_targets_type_id ON targets(target_type_id);');
          await pool.query('CREATE INDEX IF NOT EXISTS idx_targets_period ON targets(period_start, period_end);');
          await pool.query('CREATE INDEX IF NOT EXISTS idx_targets_bnpl_platform ON targets(bnpl_platform);');
        } catch (error) {
          console.log('⚠️  Could not create indexes for targets');
        }
        
        // Add constraint for BNPL platform values
        try {
          await pool.query(`
            ALTER TABLE targets ADD CONSTRAINT IF NOT EXISTS chk_bnpl_platform 
            CHECK (bnpl_platform IS NULL OR bnpl_platform IN ('WATU', 'EASYBUY', 'PALMPAY', 'CREDLOCK'));
          `);
        } catch (error) {
          console.log('⚠️  Could not add BNPL platform constraint');
        }
        
        console.log('✅ targets table created');
      }
      
      // Create target_percentage_mappings table if missing
      if (missingTables.includes('target_percentage_mappings')) {
        console.log('🔧 Creating target_percentage_mappings table...');
        
        await pool.query(`
          CREATE TABLE IF NOT EXISTS target_percentage_mappings (
            id SERIAL PRIMARY KEY,
            percentage INTEGER NOT NULL CHECK (percentage > 0 AND percentage <= 100),
            orders_count INTEGER NOT NULL CHECK (orders_count > 0),
            target_type VARCHAR(50) DEFAULT 'orders',
            bnpl_platform VARCHAR(50),
            location VARCHAR(100),
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW(),
            CONSTRAINT unique_percentage_target_type_platform_location 
              UNIQUE (percentage, target_type, bnpl_platform, location)
          );
        `);
        
        // Create indexes
        try {
          await pool.query('CREATE INDEX IF NOT EXISTS idx_target_percentage_mappings_percentage ON target_percentage_mappings(percentage);');
          await pool.query('CREATE INDEX IF NOT EXISTS idx_target_percentage_mappings_target_type ON target_percentage_mappings(target_type);');
          await pool.query('CREATE INDEX IF NOT EXISTS idx_target_percentage_mappings_bnpl_platform ON target_percentage_mappings(bnpl_platform);');
          await pool.query('CREATE INDEX IF NOT EXISTS idx_target_percentage_mappings_location ON target_percentage_mappings(location);');
          await pool.query('CREATE INDEX IF NOT EXISTS idx_target_percentage_mappings_active ON target_percentage_mappings(is_active);');
        } catch (error) {
          console.log('⚠️  Could not create indexes for target_percentage_mappings');
        }
        
        // Insert default percentage mappings for orders
        await pool.query(`
          INSERT INTO target_percentage_mappings (percentage, orders_count, target_type, is_active) VALUES
          (10, 15, 'orders', true),
          (20, 25, 'orders', true),
          (30, 35, 'orders', true),
          (40, 45, 'orders', true),
          (50, 60, 'orders', true),
          (60, 75, 'orders', true),
          (70, 90, 'orders', true),
          (80, 110, 'orders', true),
          (90, 135, 'orders', true),
          (100, 150, 'orders', true)
          ON CONFLICT (percentage, target_type, bnpl_platform, location) DO NOTHING;
        `);
        
        // Insert default percentage mappings for sales
        await pool.query(`
          INSERT INTO target_percentage_mappings (percentage, orders_count, target_type, is_active) VALUES
          (10, 15000, 'sales', true),
          (20, 25000, 'sales', true),
          (30, 35000, 'sales', true),
          (40, 45000, 'sales', true),
          (50, 60000, 'sales', true),
          (60, 75000, 'sales', true),
          (70, 90000, 'sales', true),
          (80, 110000, 'sales', true),
          (90, 135000, 'sales', true),
          (100, 150000, 'sales', true)
          ON CONFLICT (percentage, target_type, bnpl_platform, location) DO NOTHING;
        `);
        
        // Insert default percentage mappings for recruitment
        await pool.query(`
          INSERT INTO target_percentage_mappings (percentage, orders_count, target_type, is_active) VALUES
          (10, 2, 'recruitment', true),
          (20, 4, 'recruitment', true),
          (30, 6, 'recruitment', true),
          (40, 8, 'recruitment', true),
          (50, 10, 'recruitment', true),
          (60, 12, 'recruitment', true),
          (70, 14, 'recruitment', true),
          (80, 16, 'recruitment', true),
          (90, 18, 'recruitment', true),
          (100, 20, 'recruitment', true)
          ON CONFLICT (percentage, target_type, bnpl_platform, location) DO NOTHING;
        `);
        
        console.log('✅ target_percentage_mappings table created');
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
