// Add OTP columns to users table in production database
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function addOTPColumns() {
  try {
    console.log('🔧 Adding OTP columns to users table...');
    
    // Check if columns already exist
    const checkColumns = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('otp_enabled', 'email_verified', 'otp_grace_period_end', 'email_update_required')
    `);
    
    const existingColumns = checkColumns.rows.map(row => row.column_name);
    console.log('Existing OTP columns:', existingColumns);
    
    // Add missing columns
    const columnsToAdd = [
      { name: 'email_verified', type: 'BOOLEAN DEFAULT FALSE' },
      { name: 'otp_enabled', type: 'BOOLEAN DEFAULT FALSE' },
      { name: 'otp_grace_period_end', type: 'TIMESTAMP' },
      { name: 'email_update_required', type: 'BOOLEAN DEFAULT FALSE' }
    ];
    
    for (const column of columnsToAdd) {
      if (!existingColumns.includes(column.name)) {
        try {
          await pool.query(`
            ALTER TABLE users 
            ADD COLUMN ${column.name} ${column.type};
          `);
          console.log(`✅ Added column ${column.name} to users table`);
        } catch (error) {
          console.log(`⚠️  Could not add column ${column.name}:`, error.message);
        }
      } else {
        console.log(`✅ Column ${column.name} already exists`);
      }
    }
    
    // Set grace period for existing users (2 weeks from now)
    try {
      const gracePeriodEnd = new Date();
      gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 14); // 2 weeks
      
      await pool.query(`
        UPDATE users 
        SET otp_grace_period_end = $1, email_update_required = TRUE
        WHERE otp_grace_period_end IS NULL
      `, [gracePeriodEnd]);
      
      console.log('✅ Set grace period for existing users');
    } catch (error) {
      console.log('⚠️  Could not set grace period:', error.message);
    }
    
    console.log('🎉 OTP columns migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Error adding OTP columns:', error);
  } finally {
    await pool.end();
  }
}

addOTPColumns();
