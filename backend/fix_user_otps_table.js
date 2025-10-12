// Direct fix for user_otps table - run this to create the missing table
const { Pool } = require('pg');

// Use production database connection
const pool = new Pool({
  connectionString: 'postgresql://vistapro_user:VistaPro2024!@dpg-d1f2q0i2i3kq1e8qj3hg-a/vistapro_db',
  ssl: {
    rejectUnauthorized: false
  }
});

async function fixUserOtpsTable() {
  try {
    console.log('🔧 Fixing user_otps table...');
    
    // Check if table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_otps'
      );
    `);
    
    console.log('Table exists:', tableCheck.rows[0].exists);
    
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
    
    // Create indexes
    try {
      await pool.query('CREATE INDEX IF NOT EXISTS idx_user_otps_user_id ON user_otps(user_id);');
      await pool.query('CREATE INDEX IF NOT EXISTS idx_user_otps_expires_at ON user_otps(expires_at);');
      await pool.query('CREATE INDEX IF NOT EXISTS idx_user_otps_created_at ON user_otps(created_at DESC);');
      await pool.query('CREATE INDEX IF NOT EXISTS idx_user_otps_used ON user_otps(used);');
      console.log('✅ Created indexes');
    } catch (error) {
      console.log('⚠️ Index creation error:', error.message);
    }
    
    console.log('🎉 user_otps table fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

fixUserOtpsTable();
