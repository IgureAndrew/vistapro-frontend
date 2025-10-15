// Add OTP migration endpoint to run from backend
const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

app.use(express.json());

// OTP Migration endpoint
app.post('/api/migrate/otp-columns', async (req, res) => {
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
    
    const addedColumns = [];
    
    for (const column of columnsToAdd) {
      if (!existingColumns.includes(column.name)) {
        try {
          await pool.query(`
            ALTER TABLE users 
            ADD COLUMN ${column.name} ${column.type};
          `);
          console.log(`✅ Added column ${column.name} to users table`);
          addedColumns.push(column.name);
        } catch (error) {
          console.log(`⚠️  Could not add column ${column.name}:`, error.message);
        }
      } else {
        console.log(`✅ Column ${column.name} already exists`);
      }
    }
    
    // Set grace period for existing users (2 weeks from now)
    let gracePeriodSet = false;
    try {
      const gracePeriodEnd = new Date();
      gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 14); // 2 weeks
      
      const updateResult = await pool.query(`
        UPDATE users 
        SET otp_grace_period_end = $1, email_update_required = TRUE
        WHERE otp_grace_period_end IS NULL
      `, [gracePeriodEnd]);
      
      console.log(`✅ Set grace period for ${updateResult.rowCount} users`);
      gracePeriodSet = true;
    } catch (error) {
      console.log('⚠️  Could not set grace period:', error.message);
    }
    
    res.json({
      success: true,
      message: 'OTP columns migration completed successfully',
      addedColumns,
      existingColumns,
      gracePeriodSet,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error adding OTP columns:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add OTP columns',
      error: error.message
    });
  }
});

// Check OTP columns status
app.get('/api/migrate/otp-columns/status', async (req, res) => {
  try {
    const checkColumns = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('otp_enabled', 'email_verified', 'otp_grace_period_end', 'email_update_required')
    `);
    
    const existingColumns = checkColumns.rows.map(row => row.column_name);
    
    res.json({
      success: true,
      existingColumns,
      allColumnsExist: existingColumns.length === 4,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error checking OTP columns:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check OTP columns',
      error: error.message
    });
  }
});

const PORT = process.env.PORT || 5008;
app.listen(PORT, () => {
  console.log(`🚀 OTP Migration server running on port ${PORT}`);
  console.log(`📋 Migration endpoint: POST http://localhost:${PORT}/api/migrate/otp-columns`);
  console.log(`📊 Status endpoint: GET http://localhost:${PORT}/api/migrate/otp-columns/status`);
});
