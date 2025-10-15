const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

// Emergency database schema fix endpoint
router.post('/fix-schema', async (req, res) => {
  let pool;
  
  try {
    console.log('🔧 Running emergency database schema fix...');
    
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
    
    const addedColumns = [];
    
    for (const column of columnsToAdd) {
      try {
        await pool.query(`
          ALTER TABLE users 
          ADD COLUMN IF NOT EXISTS ${column.name} ${column.type};
        `);
        addedColumns.push(column.name);
        console.log(`✅ Added column ${column.name} to users table`);
      } catch (error) {
        if (error.code !== '42701') { // Column already exists
          console.log(`⚠️  Could not add column ${column.name}:`, error.message);
        } else {
          console.log(`✅ Column ${column.name} already exists`);
          addedColumns.push(`${column.name} (already exists)`);
        }
      }
    }
    
    // Create otp_notifications table if it doesn't exist
    console.log('🔧 Creating otp_notifications table...');
    let otpNotificationsCreated = false;
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
      
      otpNotificationsCreated = true;
      console.log('✅ otp_notifications table created');
    } catch (error) {
      console.log('⚠️  Error creating otp_notifications table:', error.message);
    }
    
    console.log('🎉 Database schema fix completed successfully!');
    
    res.json({
      success: true,
      message: 'Database schema fix completed successfully',
      addedColumns,
      otpNotificationsCreated,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error in database schema fix:', error.message);
    res.status(500).json({
      success: false,
      message: 'Database schema fix failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  } finally {
    if (pool) {
      await pool.end();
    }
  }
});

module.exports = router;
