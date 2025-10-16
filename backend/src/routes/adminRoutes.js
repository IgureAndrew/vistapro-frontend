// src/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { Pool } = require('pg');
const { verifyToken } = require('../middlewares/authMiddleware');
const { verifyRole } = require('../middlewares/roleMiddleware');
// Note: Use the correct function name from your adminController.
const { getAccount, updateAccount, updateAdminAccountSettings, registerDealer, registerMarketer, getDashboardSummary, getWalletSummary, getRecentActivities, getVerificationSubmissions, getAssignedMarketers, getAssignmentStats } = require('../controllers/adminController');
const { getRawFormData } = require('../controllers/verificationController');

// Database connection for admin operations
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Configure Multer for file uploads (for profile image upload)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// GET /api/admin/account - Get Admin account details
router.get('/account', verifyToken, verifyRole(['Admin']), getAccount);

// PATCH /api/admin/account - Update Admin account settings
router.patch('/account', verifyToken, verifyRole(['Admin']), upload.single('profile_image'), updateAccount);

// PATCH /api/admin/profile - Update Admin account settings (avatar, display name, email, phone, password)
// Note: We now use 'avatar' for the file field.
router.patch(
  '/profile',
  verifyToken,
  verifyRole(['Admin']),
  upload.single('avatar'),
  updateAdminAccountSettings
);

// Endpoint for Admin to register a new Dealer account
router.post('/register-dealer', verifyToken, verifyRole(['Admin']), registerDealer);

// Endpoint for Admin to register a new Marketer account
router.post('/register-marketer', verifyToken, verifyRole(['Admin']), registerMarketer);

// Dashboard endpoints
router.get('/dashboard-summary', verifyToken, verifyRole(['Admin']), getDashboardSummary);
router.get('/wallet-summary', verifyToken, verifyRole(['Admin']), getWalletSummary);
router.get('/recent-activities', verifyToken, verifyRole(['Admin']), getRecentActivities);

// Verification submissions endpoint
router.get('/verification-submissions', verifyToken, verifyRole(['Admin']), getVerificationSubmissions);

// Assignment management endpoints
router.get('/assigned-marketers', verifyToken, verifyRole(['Admin']), getAssignedMarketers);
router.get('/assignment-stats', verifyToken, verifyRole(['Admin']), getAssignmentStats);

// Debug endpoint for raw form data
router.get('/raw-form-data', verifyToken, verifyRole(['Admin']), getRawFormData);

// Admin-only endpoint to fix database schema
router.post('/fix-database-schema', verifyToken, verifyRole(['Admin']), async (req, res) => {
  try {
    console.log('🔧 Admin requested database schema fix...');
    
    // 1. Create marketer_guarantor_form table if it doesn't exist
    console.log('🔄 Creating marketer_guarantor_form table...');
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

    // 2. Create marketer_commitment_form table if it doesn't exist
    console.log('🔄 Creating marketer_commitment_form table...');
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

    // 3. Add missing columns to orders table
    console.log('🔄 Adding device columns to orders table...');
    await pool.query(`
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'orders' AND column_name = 'device_name'
          ) THEN
              ALTER TABLE orders ADD COLUMN device_name VARCHAR(255);
          END IF;
      END $$;
    `);

    await pool.query(`
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'orders' AND column_name = 'device_model'
          ) THEN
              ALTER TABLE orders ADD COLUMN device_model VARCHAR(255);
          END IF;
      END $$;
    `);

    await pool.query(`
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'orders' AND column_name = 'device_type'
          ) THEN
              ALTER TABLE orders ADD COLUMN device_type VARCHAR(50);
          END IF;
      END $$;
    `);

    // 4. Create verification_submissions table if it doesn't exist
    console.log('🔄 Creating verification_submissions table...');
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

    // 5. Create verification_workflow_logs table if it doesn't exist
    console.log('🔄 Creating verification_workflow_logs table...');
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

    // 6. Reset Bayo Lawal's verification status
    console.log('🔄 Resetting Bayo Lawal verification status...');
    await pool.query(`
      UPDATE users 
      SET 
        bio_submitted = false,
        guarantor_submitted = false,
        commitment_submitted = false,
        overall_verification_status = NULL,
        updated_at = CURRENT_TIMESTAMP
      WHERE unique_id = 'DSR00336' OR email = 'bayolawal@gmail.com';
    `);

    // 7. Delete existing form submissions for Bayo Lawal
    console.log('🔄 Deleting existing Bayo Lawal form submissions...');
    await pool.query(`
      DELETE FROM marketer_biodata WHERE marketer_unique_id = 'DSR00336';
    `);
    
    await pool.query(`
      DELETE FROM marketer_guarantor_form WHERE marketer_id = (SELECT id FROM users WHERE unique_id = 'DSR00336');
    `);
    
    await pool.query(`
      DELETE FROM marketer_commitment_form WHERE marketer_id = (SELECT id FROM users WHERE unique_id = 'DSR00336');
    `);
    
    await pool.query(`
      DELETE FROM verification_submissions WHERE marketer_id = (SELECT id FROM users WHERE unique_id = 'DSR00336');
    `);

    console.log('✅ Database schema fix completed successfully!');
    
    res.json({
      success: true,
      message: 'Database schema fixed successfully! Bayo Lawal verification has been reset.',
      actions: [
        'Created marketer_guarantor_form table',
        'Created marketer_commitment_form table',
        'Added device columns to orders table',
        'Created verification_submissions table',
        'Created verification_workflow_logs table',
        'Reset Bayo Lawal verification status',
        'Deleted existing Bayo Lawal form submissions'
      ]
    });

  } catch (error) {
    console.error('❌ Error fixing database schema:', error);
    res.status(500).json({
      success: false,
      message: 'Error fixing database schema',
      error: error.message
    });
  }
});

module.exports = router;
