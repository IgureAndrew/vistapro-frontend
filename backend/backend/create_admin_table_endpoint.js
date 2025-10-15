const { Pool } = require('pg');

// Production database configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function createAdminVerificationTableEndpoint(req, res) {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Creating admin_verification_details table via endpoint...');
    
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
      return res.json({
        success: true,
        message: 'admin_verification_details table already exists',
        tableExists: true
      });
    }
    
    console.log('🔄 Creating admin_verification_details table...');
    
    // Create the table
    await client.query(`
      CREATE TABLE admin_verification_details (
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
    
    console.log('✅ admin_verification_details table created successfully');
    
    // Add foreign key constraints
    try {
      await client.query(`
        ALTER TABLE admin_verification_details 
        ADD CONSTRAINT fk_admin_verification_submission 
        FOREIGN KEY (verification_submission_id) REFERENCES verification_submissions(id) ON DELETE CASCADE;
      `);
      console.log('✅ Foreign key constraint for verification_submission_id added');
    } catch (error) {
      if (error.code !== '42710') { // Constraint already exists
        console.log('⚠️  Could not add foreign key constraint for verification_submission_id:', error.message);
      }
    }
    
    try {
      await client.query(`
        ALTER TABLE admin_verification_details 
        ADD CONSTRAINT fk_admin_verification_admin 
        FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE;
      `);
      console.log('✅ Foreign key constraint for admin_id added');
    } catch (error) {
      if (error.code !== '42710') { // Constraint already exists
        console.log('⚠️  Could not add foreign key constraint for admin_id:', error.message);
      }
    }
    
    try {
      await client.query(`
        ALTER TABLE admin_verification_details 
        ADD CONSTRAINT fk_admin_verification_marketer 
        FOREIGN KEY (marketer_id) REFERENCES users(id) ON DELETE CASCADE;
      `);
      console.log('✅ Foreign key constraint for marketer_id added');
    } catch (error) {
      if (error.code !== '42710') { // Constraint already exists
        console.log('⚠️  Could not add foreign key constraint for marketer_id:', error.message);
      }
    }
    
    // Create indexes
    try {
      await client.query('CREATE INDEX IF NOT EXISTS idx_admin_verification_submission ON admin_verification_details(verification_submission_id);');
      await client.query('CREATE INDEX IF NOT EXISTS idx_admin_verification_admin ON admin_verification_details(admin_id);');
      await client.query('CREATE INDEX IF NOT EXISTS idx_admin_verification_marketer ON admin_verification_details(marketer_id);');
      await client.query('CREATE INDEX IF NOT EXISTS idx_admin_verification_date ON admin_verification_details(admin_verification_date);');
      console.log('✅ Indexes created successfully');
    } catch (error) {
      console.log('⚠️  Could not create indexes:', error.message);
    }
    
    console.log('🎉 admin_verification_details table setup completed successfully!');
    
    res.json({
      success: true,
      message: 'admin_verification_details table created successfully',
      tableExists: false,
      created: true
    });
    
  } catch (error) {
    console.error('❌ Error creating admin_verification_details table:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create admin_verification_details table',
      error: error.message
    });
  } finally {
    client.release();
  }
}

module.exports = createAdminVerificationTableEndpoint;
