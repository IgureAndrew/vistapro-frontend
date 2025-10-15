// Direct script to create user_otps table in production database
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function createUserOtpsTable() {
  try {
    console.log('📋 Creating user_otps table...');
    
    // Check if table already exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_otps'
      );
    `);
    
    if (tableCheck.rows[0].exists) {
      console.log('✅ user_otps table already exists');
      await pool.end();
      return;
    }
    
    console.log('🔄 Creating user_otps table...');
    
    // Create the table
    await pool.query(`
      CREATE TABLE user_otps (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        otp_code VARCHAR(6) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        used_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    console.log('✅ Created user_otps table');
    
    // Create indexes for better query performance
    try {
      await pool.query('CREATE INDEX IF NOT EXISTS idx_user_otps_user_id ON user_otps(user_id);');
      await pool.query('CREATE INDEX IF NOT EXISTS idx_user_otps_expires_at ON user_otps(expires_at);');
      await pool.query('CREATE INDEX IF NOT EXISTS idx_user_otps_created_at ON user_otps(created_at DESC);');
      await pool.query('CREATE INDEX IF NOT EXISTS idx_user_otps_used ON user_otps(used);');
      console.log('✅ Created indexes for user_otps table');
    } catch (error) {
      console.log('⚠️  Could not create indexes for user_otps:', error.message);
    }
    
    console.log('🎉 user_otps table created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating user_otps table:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the migration
createUserOtpsTable().catch(err => {
  console.error('Fatal error during user_otps table creation:', err);
  process.exit(1);
});
