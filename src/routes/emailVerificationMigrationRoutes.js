const express = require('express');
const router = express.Router();
const pool = require('../config/database');

/**
 * ONE-TIME MIGRATION ENDPOINT
 * Add email verification columns to production database
 * 
 * Call this once via browser: GET /api/migration/add-email-verification-columns
 */
router.get('/add-email-verification-columns', async (req, res) => {
  try {
    console.log('🚀 Starting email verification columns migration...');

    // Check if columns already exist
    const columnCheck = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name IN ('email_verified', 'email_verification_token', 'email_verification_expires', 'email_verification_sent_at')
    `);

    const existingColumns = columnCheck.rows.map(row => row.column_name);
    console.log('📊 Existing columns:', existingColumns);

    const results = [];

    // Add email_verified column
    if (!existingColumns.includes('email_verified')) {
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN email_verified BOOLEAN DEFAULT false
      `);
      results.push('✅ Added email_verified column');
      console.log('✅ Added email_verified column');
    } else {
      results.push('⏭️  email_verified column already exists');
    }

    // Add email_verification_token column
    if (!existingColumns.includes('email_verification_token')) {
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN email_verification_token TEXT
      `);
      results.push('✅ Added email_verification_token column');
      console.log('✅ Added email_verification_token column');
    } else {
      results.push('⏭️  email_verification_token column already exists');
    }

    // Add email_verification_expires column
    if (!existingColumns.includes('email_verification_expires')) {
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN email_verification_expires TIMESTAMP
      `);
      results.push('✅ Added email_verification_expires column');
      console.log('✅ Added email_verification_expires column');
    } else {
      results.push('⏭️  email_verification_expires column already exists');
    }

    // Add email_verification_sent_at column
    if (!existingColumns.includes('email_verification_sent_at')) {
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN email_verification_sent_at TIMESTAMP
      `);
      results.push('✅ Added email_verification_sent_at column');
      console.log('✅ Added email_verification_sent_at column');
    } else {
      results.push('⏭️  email_verification_sent_at column already exists');
    }

    // Create index on verification token for faster lookups
    try {
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_users_email_verification_token 
        ON users(email_verification_token) 
        WHERE email_verification_token IS NOT NULL
      `);
      results.push('✅ Created index on email_verification_token');
      console.log('✅ Created index on email_verification_token');
    } catch (indexError) {
      results.push('⏭️  Index already exists or could not be created');
      console.log('⏭️  Index already exists:', indexError.message);
    }

    // Update existing users to mark them as verified (grandfather them in)
    const updateResult = await pool.query(`
      UPDATE users 
      SET email_verified = true 
      WHERE email_verified IS NULL OR email_verified = false
      RETURNING id
    `);
    
    results.push(`✅ Updated ${updateResult.rowCount} existing users to verified status`);
    console.log(`✅ Updated ${updateResult.rowCount} existing users to verified status`);

    // Verify the migration
    const finalCheck = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name IN ('email_verified', 'email_verification_token', 'email_verification_expires', 'email_verification_sent_at')
      ORDER BY column_name
    `);

    console.log('✅ Migration completed successfully!');

    res.json({
      success: true,
      message: 'Email verification columns migration completed successfully!',
      results: results,
      columns: finalCheck.rows,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Migration error:', error);
    res.status(500).json({
      success: false,
      message: 'Migration failed',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * Check email verification schema status
 */
router.get('/check-email-verification-schema', async (req, res) => {
  try {
    const columnCheck = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name IN ('email_verified', 'email_verification_token', 'email_verification_expires', 'email_verification_sent_at')
      ORDER BY column_name
    `);

    const sampleUser = await pool.query(`
      SELECT id, email, email_verified, email_verification_token IS NOT NULL as has_token
      FROM users
      LIMIT 5
    `);

    res.json({
      success: true,
      columns: columnCheck.rows,
      sampleUsers: sampleUser.rows,
      columnsCount: columnCheck.rows.length,
      expectedColumns: 4,
      allColumnsExist: columnCheck.rows.length === 4
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;

