const { Pool } = require('pg');
require('dotenv').config();

// Database configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function createAdminVerificationTable() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking if admin_verification_details table exists...');
    
    // Check if table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'admin_verification_details'
      );
    `);
    
    if (tableCheck.rows[0].exists) {
      console.log('✅ admin_verification_details table already exists');
      return;
    }
    
    console.log('🔄 Creating admin_verification_details table...');
    
    // Create the table
    await client.query(`
      CREATE TABLE admin_verification_details (
        id SERIAL PRIMARY KEY,
        verification_submission_id INTEGER NOT NULL,
        admin_id INTEGER NOT NULL,
        marketer_id INTEGER NOT NULL,
        
        -- Location verification
        marketer_address TEXT NOT NULL,
        landmark_description TEXT,
        location_photo_url TEXT,
        
        -- Admin and Marketer together
        admin_marketer_photo_url TEXT,
        
        -- Additional verification details
        verification_notes TEXT,
        admin_verification_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        
        -- Document uploads
        additional_documents JSONB,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('✅ Created admin_verification_details table');
    
    // Add foreign key constraints
    console.log('🔄 Adding foreign key constraints...');
    
    try {
      await client.query(`
        ALTER TABLE admin_verification_details 
        ADD CONSTRAINT fk_admin_verification_submission 
        FOREIGN KEY (verification_submission_id) REFERENCES verification_submissions(id) ON DELETE CASCADE;
      `);
      console.log('✅ Added verification_submission_id foreign key');
    } catch (error) {
      if (error.code !== '42710') { // Constraint already exists
        console.log('⚠️ Could not add verification_submission_id foreign key:', error.message);
      }
    }
    
    try {
      await client.query(`
        ALTER TABLE admin_verification_details 
        ADD CONSTRAINT fk_admin_verification_admin 
        FOREIGN KEY (admin_id) REFERENCES users(id);
      `);
      console.log('✅ Added admin_id foreign key');
    } catch (error) {
      if (error.code !== '42710') { // Constraint already exists
        console.log('⚠️ Could not add admin_id foreign key:', error.message);
      }
    }
    
    try {
      await client.query(`
        ALTER TABLE admin_verification_details 
        ADD CONSTRAINT fk_admin_verification_marketer 
        FOREIGN KEY (marketer_id) REFERENCES users(id);
      `);
      console.log('✅ Added marketer_id foreign key');
    } catch (error) {
      if (error.code !== '42710') { // Constraint already exists
        console.log('⚠️ Could not add marketer_id foreign key:', error.message);
      }
    }
    
    // Create indexes
    console.log('🔄 Creating indexes...');
    
    try {
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_admin_verification_submission 
        ON admin_verification_details(verification_submission_id);
      `);
      console.log('✅ Created verification_submission_id index');
    } catch (error) {
      console.log('⚠️ Could not create verification_submission_id index:', error.message);
    }
    
    try {
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_admin_verification_admin 
        ON admin_verification_details(admin_id);
      `);
      console.log('✅ Created admin_id index');
    } catch (error) {
      console.log('⚠️ Could not create admin_id index:', error.message);
    }
    
    try {
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_admin_verification_marketer 
        ON admin_verification_details(marketer_id);
      `);
      console.log('✅ Created marketer_id index');
    } catch (error) {
      console.log('⚠️ Could not create marketer_id index:', error.message);
    }
    
    console.log('🎉 admin_verification_details table created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating admin_verification_details table:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the migration
createAdminVerificationTable()
  .then(() => {
    console.log('✅ Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });
