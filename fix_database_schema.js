const { Pool } = require('pg');

async function fixDatabaseSchema() {
  let pool;
  
  try {
    console.log('🔧 Running direct database schema fix...');
    
    // Create database connection
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful');
    
    // Add missing columns to users table
    console.log('🔧 Adding missing columns to users table...');
    
    const columnsToAdd = [
      { name: 'email_verification_token', type: 'VARCHAR(255)' },
      { name: 'email_verification_expires', type: 'TIMESTAMP' },
      { name: 'password_reset_token', type: 'VARCHAR(255)' },
      { name: 'password_reset_expires', type: 'TIMESTAMP' },
      { name: 'email_verified', type: 'BOOLEAN DEFAULT FALSE' },
      { name: 'otp_enabled', type: 'BOOLEAN DEFAULT FALSE' },
      { name: 'otp_grace_period_end', type: 'TIMESTAMP' },
      { name: 'email_update_required', type: 'BOOLEAN DEFAULT FALSE' },
      { name: 'last_reminder_sent', type: 'TIMESTAMP DEFAULT NULL' }
    ];
    
    for (const column of columnsToAdd) {
      try {
        await pool.query(`
          ALTER TABLE users 
          ADD COLUMN IF NOT EXISTS ${column.name} ${column.type};
        `);
        console.log(`✅ Added column ${column.name} to users table`);
      } catch (error) {
        if (error.code !== '42701') { // Column already exists
          console.log(`⚠️  Could not add column ${column.name}:`, error.message);
        } else {
          console.log(`✅ Column ${column.name} already exists`);
        }
      }
    }
    
    // Create otp_notifications table if it doesn't exist
    console.log('🔧 Creating otp_notifications table...');
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS otp_notifications (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          type VARCHAR(100) NOT NULL,
          message TEXT NOT NULL,
          metadata JSONB DEFAULT '{}',
          priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
          read BOOLEAN DEFAULT FALSE,
          read_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);
      
      // Create indexes
      await pool.query('CREATE INDEX IF NOT EXISTS idx_otp_notifications_user_id ON otp_notifications(user_id);');
      await pool.query('CREATE INDEX IF NOT EXISTS idx_otp_notifications_type ON otp_notifications(type);');
      await pool.query('CREATE INDEX IF NOT EXISTS idx_otp_notifications_priority ON otp_notifications(priority);');
      await pool.query('CREATE INDEX IF NOT EXISTS idx_otp_notifications_read ON otp_notifications(read);');
      await pool.query('CREATE INDEX IF NOT EXISTS idx_otp_notifications_created_at ON otp_notifications(created_at DESC);');
      
      console.log('✅ otp_notifications table created');
    } catch (error) {
      console.log('⚠️  Error creating otp_notifications table:', error.message);
    }
    
    // Set grace period for existing users if not already set
    try {
      const gracePeriodEnd = new Date();
      gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 14); // 2 weeks
      
      const result = await pool.query(`
        UPDATE users 
        SET otp_grace_period_end = $1, email_update_required = TRUE
        WHERE otp_grace_period_end IS NULL
        RETURNING id
      `, [gracePeriodEnd]);
      
      console.log(`✅ Set grace period for ${result.rows.length} users`);
    } catch (error) {
      console.log('⚠️  Could not set grace period:', error.message);
    }
    
    console.log('🎉 Database schema fix completed successfully!');
    
  } catch (error) {
    console.error('❌ Error in database schema fix:', error.message);
    throw error;
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

// Run the fix if this script is executed directly
if (require.main === module) {
  fixDatabaseSchema()
    .then(() => {
      console.log('✅ Database schema fix completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Database schema fix failed:', error);
      process.exit(1);
    });
}

module.exports = fixDatabaseSchema;
