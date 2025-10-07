// src/routes/verificationRoutes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const { body, validationResult } = require("express-validator");

// Use memory storage so that files are available as buffers (for Cloudinary uploads).
const memoryStorage = multer.memoryStorage();
const upload = multer({ storage: memoryStorage });

// Import authentication and role-verification middleware.
const { verifyToken } = require("../middlewares/authMiddleware");
const { verifyRole }  = require("../middlewares/roleMiddleware");
const { pool } = require("../config/database");

// Import all your controller functions
const {
  submitBiodata,
  submitGuarantor,
  submitCommitment,
  allowRefillForm,
  getFormStatus,
  adminReview,
  superadminVerify,
  masterApprove,
  deleteBiodataSubmission,
  deleteGuarantorSubmission,
  deleteCommitmentSubmission,
  getAllSubmissionsForMasterAdmin,
  getApprovedSubmissionsForMasterAdmin,
  getVerificationWorkflowLogs,
  getSubmissionsForAdmin,
  getSubmissionsForSuperAdmin,
  getVerifiedMarketersMaster,
  getVerifiedMarketersSuperadmin,
  getVerifiedMarketersAdmin,
  uploadAdminVerification,
  verifyAndSendToSuperAdmin,
  resetSubmissionStatus,
  getVerificationStatus,
  sendToSuperAdmin,
  approveAdminSuperadmin,
  getAdminAssignmentInfo,
  fixUserFormFlags,
  testFormSubmission,
  resetAllForms,
} = require("../controllers/verificationController");

/** *********************** Submission Endpoints *************************/

// Marketer submits biodata
router.post(
  "/bio-data",
  verifyToken,
  verifyRole(["Marketer"]),
  upload.fields([
    { name: "passport_photo", maxCount: 1 },
    { name: "id_document",    maxCount: 1 },
  ]),
  // Validate phone (11 digits) and account_number (10 digits)
  [
    body("phone")
      .matches(/^[0-9]{11}$/)
      .withMessage("Phone number must be exactly 11 digits."),
    body("account_number")
      .matches(/^[0-9]{10}$/)
      .withMessage("Account number must be exactly 10 digits."),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const { param, msg } = errors.array()[0];
      return res.status(400).json({ field: param, message: msg });
    }
    submitBiodata(req, res, next);
  }
);

// Marketer submits guarantor form
router.post(
  "/guarantor",
  verifyToken,
  verifyRole(["Marketer"]),
  upload.fields([
    { name: "identification_file", maxCount: 1 },
    { name: "signature",           maxCount: 1 },
  ]),
  submitGuarantor
);

// Marketer submits commitment form
router.post(
  "/commitment-handbook",
  verifyToken,
  verifyRole(["Marketer"]),
  upload.single("signature"),
  submitCommitment
);

// Get form submission status for marketer
router.get(
  "/form-status",
  verifyToken,
  verifyRole(["Marketer"]),
  getFormStatus
);

/** *********************** Admin / Master Admin Endpoints *************************/

// MasterAdmin allows a refill
router.patch(
  "/allow-refill",
  verifyToken,
  verifyRole(["MasterAdmin"]),
  allowRefillForm
);

// Admin reviews (first-line)
router.patch(
  "/admin-review",
  verifyToken,
  verifyRole(["Admin"]),
  adminReview
);

// SuperAdmin verifies
router.patch(
  "/superadmin-verify",
  verifyToken,
  verifyRole(["SuperAdmin"]),
  superadminVerify
);

// MasterAdmin final approval
router.patch(
  "/master-approve",
  verifyToken,
  verifyRole(["MasterAdmin"]),
  masterApprove
);

/** *********************** Deletion Endpoints (Master Admin Only) *************************/

router.delete(
  "/biodata/:submissionId",
  verifyToken,
  verifyRole(["MasterAdmin"]),
  deleteBiodataSubmission
);

router.delete(
  "/guarantor/:submissionId",
  verifyToken,
  verifyRole(["MasterAdmin"]),
  deleteGuarantorSubmission
);

router.delete(
  "/commitment/:submissionId",
  verifyToken,
  verifyRole(["MasterAdmin"]),
  deleteCommitmentSubmission
);

/** *********************** GET Submissions Lists *************************/

// MasterAdmin sees _all_ submissions
router.get(
  "/submissions/master",
  verifyToken,
  verifyRole(["MasterAdmin"]),
  getAllSubmissionsForMasterAdmin
);

// MasterAdmin sees approved/rejected submissions history
router.get(
  "/submissions/master/approved",
  verifyToken,
  verifyRole(["MasterAdmin"]),
  getApprovedSubmissionsForMasterAdmin
);

// MasterAdmin sees verification workflow logs
router.get(
  "/workflow-logs",
  verifyToken,
  verifyRole(["MasterAdmin"]),
  getVerificationWorkflowLogs
);

// MasterAdmin approves/rejects Admin/SuperAdmin directly (no verification needed)
router.post(
  "/admin-superadmin/approve",
  verifyToken,
  verifyRole(["MasterAdmin"]),
  approveAdminSuperadmin
);

// Admin sees submissions for _their_ marketers
router.get(
  "/submissions/admin",
  verifyToken,
  verifyRole(["Admin"]),
  getSubmissionsForAdmin
);

// SuperAdmin sees submissions under their admins
router.get(
  "/submissions/superadmin",
  verifyToken,
  verifyRole(["SuperAdmin"]),
  getSubmissionsForSuperAdmin
);

/** *********************** GET Verified-Marketers Lists *************************/

router.get(
  "/verified-master",
  verifyToken,
  verifyRole(["MasterAdmin"]),
  getVerifiedMarketersMaster
);

router.get(
  "/verified-superadmin",
  verifyToken,
  verifyRole(["SuperAdmin"]),
  getVerifiedMarketersSuperadmin
);

router.get(
  "/verified-admin",
  verifyToken,
  verifyRole(["Admin"]),
  getVerifiedMarketersAdmin
);

// Admin verification upload
router.post(
  "/admin/upload-verification/:submissionId",
  verifyToken,
  verifyRole(["Admin"]),
  upload.fields([
    { name: 'locationPhotos', maxCount: 10 },
    { name: 'adminMarketerPhotos', maxCount: 10 },
    { name: 'landmarkPhotos', maxCount: 10 }
  ]),
  uploadAdminVerification
);

// Admin verify and send to SuperAdmin
router.post(
  "/admin/verify-and-send/:submissionId",
  verifyToken,
  verifyRole(["Admin"]),
  verifyAndSendToSuperAdmin
);

// Admin reset submission status for testing
router.post(
  "/admin/reset-status/:submissionId",
  verifyToken,
  verifyRole(["Admin"]),
  resetSubmissionStatus
);

// Admin send to SuperAdmin
router.post(
  "/admin/send-to-superadmin/:submissionId",
  verifyToken,
  verifyRole(["Admin"]),
  sendToSuperAdmin
);

// SuperAdmin validate
router.post(
  "/superadmin/validate/:submissionId",
  verifyToken,
  verifyRole(["SuperAdmin"]),
  (req, res) => {
    res.json({ success: true, message: "Validation completed" });
  }
);

// MasterAdmin approve
router.post(
  "/masteradmin/approve/:submissionId",
  verifyToken,
  verifyRole(["MasterAdmin"]),
  masterApprove
);

// Get verification status and progress for a submission
router.get(
  "/status/:submissionId",
  verifyToken,
  verifyRole(["Admin", "SuperAdmin", "MasterAdmin"]),
  getVerificationStatus
);

// Get admin assignment information for marketer
router.get(
  "/admin-assignment",
  verifyToken,
  verifyRole(["Marketer"]),
  getAdminAssignmentInfo
);

// Test form submission status
router.get(
  "/test-form-submission",
  verifyToken,
  verifyRole(["Marketer"]),
  testFormSubmission
);

// Test endpoint to verify frontend-backend connection
router.get(
  "/test-connection",
  verifyToken,
  verifyRole(["Marketer"]),
  async (req, res) => {
    try {
      const user = req.user;
      res.status(200).json({
        success: true,
        message: "Frontend-Backend connection successful",
        user: {
          id: user.id,
          unique_id: user.unique_id,
          role: user.role,
          first_name: user.first_name,
          last_name: user.last_name
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Test connection error:', error);
      res.status(500).json({
        success: false,
        message: "Connection test failed",
        error: error.message
      });
    }
  }
);

// Reset all forms for a marketer (for testing/fresh start)
router.post(
  "/reset-all-forms",
  verifyToken,
  verifyRole(["Marketer"]),
  resetAllForms
);

// Emergency reset endpoint (no auth required for testing)
router.post(
  "/emergency-reset/:marketerUniqueId",
  async (req, res, next) => {
    try {
      const { marketerUniqueId } = req.params;
      
      console.log(`🚨 Emergency reset for marketer ${marketerUniqueId}`);
      
      // Get marketer ID
      const marketerResult = await pool.query(
        'SELECT id FROM users WHERE unique_id = $1',
        [marketerUniqueId]
      );
      
      if (marketerResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Marketer not found'
        });
      }
      
      const marketerId = marketerResult.rows[0].id;
      
      // Reset user flags
      await pool.query(
        `UPDATE users SET 
          bio_submitted = FALSE,
          guarantor_submitted = FALSE,
          commitment_submitted = FALSE,
          overall_verification_status = NULL,
          updated_at = NOW()
         WHERE unique_id = $1`,
        [marketerUniqueId]
      );
      
      // Delete form records
      await pool.query(
        'DELETE FROM marketer_biodata WHERE marketer_unique_id = $1',
        [marketerUniqueId]
      );
      
      await pool.query(
        'DELETE FROM marketer_guarantor_form WHERE marketer_id = $1',
        [marketerId]
      );
      
      await pool.query(
        'DELETE FROM direct_sales_commitment_form WHERE marketer_unique_id = $1',
        [marketerUniqueId]
      );
      
      // Delete verification submission records
      await pool.query(
        'DELETE FROM verification_submissions WHERE marketer_id = $1',
        [marketerId]
      );
      
      // Delete workflow logs
      await pool.query(
        'DELETE FROM verification_workflow_logs WHERE marketer_id = $1',
        [marketerId]
      );
      
      console.log(`✅ Emergency reset completed for marketer ${marketerUniqueId}`);
      
      res.json({
        success: true,
        message: "All forms have been reset successfully via emergency endpoint.",
        marketerUniqueId: marketerUniqueId,
        resetAt: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Error in emergency reset:', error);
      res.status(500).json({
        success: false,
        message: "Error resetting forms",
        error: error.message
      });
    }
  }
);

// Fix user form flags (utility endpoint for debugging)
router.post(
  "/fix-user-flags",
  verifyToken,
  verifyRole(["MasterAdmin", "Admin"]),
  async (req, res, next) => {
    try {
      const { marketerUniqueId } = req.body;
      if (!marketerUniqueId) {
        return res.status(400).json({
          success: false,
          message: "Marketer unique ID is required"
        });
      }
      
      const result = await fixUserFormFlags(marketerUniqueId);
      if (result) {
        res.json({
          success: true,
          message: "User form flags fixed successfully",
          user: result
        });
      } else {
        res.status(404).json({
          success: false,
          message: "User not found"
        });
      }
    } catch (error) {
      next(error);
    }
  }
);

// Run complete production database fix
router.post(
  "/run-complete-fix",
  verifyToken,
  verifyRole(["MasterAdmin"]),
  async (req, res, next) => {
    try {
      console.log('🔧 Starting complete production database fix via API...');
      
      // Step 1: Create marketer_guarantor_form table
      console.log('📋 Step 1: Creating marketer_guarantor_form table...');
      const createGuarantorTable = `
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
      `;
      
      await pool.query(createGuarantorTable);
      console.log('✅ marketer_guarantor_form table created');
      
      // Step 2: Create marketer_commitment_form table
      console.log('📋 Step 2: Creating marketer_commitment_form table...');
      const createCommitmentTable = `
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
      `;
      
      await pool.query(createCommitmentTable);
      console.log('✅ marketer_commitment_form table created');
      
      // Step 3: Create admin_verification_details table
      console.log('📋 Step 3: Creating admin_verification_details table...');
      const createAdminVerificationTable = `
        CREATE TABLE IF NOT EXISTS admin_verification_details (
          id SERIAL PRIMARY KEY,
          verification_submission_id INTEGER NOT NULL,
          admin_id INTEGER NOT NULL,
          admin_verification_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          verification_notes TEXT,
          location_photo_url TEXT,
          admin_marketer_photo_url TEXT,
          landmark_description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;
      
      await pool.query(createAdminVerificationTable);
      console.log('✅ admin_verification_details table created');
      
      // Step 4: Add foreign key constraints
      console.log('📋 Step 4: Adding foreign key constraints...');
      
      const constraints = [
        {
          name: 'fk_guarantor_marketer',
          query: 'ALTER TABLE marketer_guarantor_form ADD CONSTRAINT fk_guarantor_marketer FOREIGN KEY (marketer_id) REFERENCES users(id) ON DELETE CASCADE;'
        },
        {
          name: 'fk_commitment_marketer',
          query: 'ALTER TABLE marketer_commitment_form ADD CONSTRAINT fk_commitment_marketer FOREIGN KEY (marketer_id) REFERENCES users(id) ON DELETE CASCADE;'
        },
        {
          name: 'fk_admin_verification_submission',
          query: 'ALTER TABLE admin_verification_details ADD CONSTRAINT fk_admin_verification_submission FOREIGN KEY (verification_submission_id) REFERENCES verification_submissions(id) ON DELETE CASCADE;'
        },
        {
          name: 'fk_admin_verification_admin',
          query: 'ALTER TABLE admin_verification_details ADD CONSTRAINT fk_admin_verification_admin FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE;'
        }
      ];
      
      for (const constraint of constraints) {
        try {
          await pool.query(constraint.query);
          console.log(`✅ ${constraint.name} constraint added`);
        } catch (error) {
          if (error.code === '42710') {
            console.log(`⚠️  ${constraint.name} constraint already exists, skipping...`);
          } else {
            console.log(`❌ Error adding ${constraint.name}:`, error.message);
          }
        }
      }
      
      // Step 5: Create indexes
      console.log('📋 Step 5: Creating indexes...');
      const indexes = [
        'CREATE INDEX IF NOT EXISTS idx_guarantor_marketer ON marketer_guarantor_form(marketer_id);',
        'CREATE INDEX IF NOT EXISTS idx_commitment_marketer ON marketer_commitment_form(marketer_id);',
        'CREATE INDEX IF NOT EXISTS idx_admin_verification_submission ON admin_verification_details(verification_submission_id);',
        'CREATE INDEX IF NOT EXISTS idx_admin_verification_admin ON admin_verification_details(admin_id);',
        'CREATE INDEX IF NOT EXISTS idx_admin_verification_date ON admin_verification_details(admin_verification_date);'
      ];
      
      for (const indexQuery of indexes) {
        await pool.query(indexQuery);
      }
      console.log('✅ Indexes created');
      
      // Step 6: Fix user form flags
      console.log('📋 Step 6: Fixing user form flags...');
      
      // Get all marketers
      const marketersResult = await pool.query(
        'SELECT id, unique_id, first_name, last_name FROM users WHERE role = $1',
        ['Marketer']
      );
      
      console.log(`📊 Found ${marketersResult.rows.length} marketers to check`);
      
      let fixedCount = 0;
      let errorCount = 0;
      const results = [];
      
      for (const marketer of marketersResult.rows) {
        try {
          console.log(`\n🔍 Checking marketer: ${marketer.first_name} ${marketer.last_name} (${marketer.unique_id})`);
          
          // Check if forms actually exist in database
          const biodataCheck = await pool.query(
            'SELECT COUNT(*) as count FROM marketer_biodata WHERE marketer_unique_id = $1',
            [marketer.unique_id]
          );
          
          const guarantorCheck = await pool.query(
            'SELECT COUNT(*) as count FROM marketer_guarantor_form WHERE marketer_id = $1',
            [marketer.id]
          );
          
          const commitmentCheck = await pool.query(
            'SELECT COUNT(*) as count FROM marketer_commitment_form WHERE marketer_id = $1',
            [marketer.id]
          );
          
          const bioSubmitted = parseInt(biodataCheck.rows[0].count) > 0;
          const guarantorSubmitted = parseInt(guarantorCheck.rows[0].count) > 0;
          const commitmentSubmitted = parseInt(commitmentCheck.rows[0].count) > 0;
          
          // Get current user flags
          const currentUserResult = await pool.query(
            'SELECT bio_submitted, guarantor_submitted, commitment_submitted FROM users WHERE id = $1',
            [marketer.id]
          );
          
          const currentFlags = currentUserResult.rows[0];
          
          // Check if flags need updating
          const needsUpdate = 
            currentFlags.bio_submitted !== bioSubmitted ||
            currentFlags.guarantor_submitted !== guarantorSubmitted ||
            currentFlags.commitment_submitted !== commitmentSubmitted;
          
          if (needsUpdate) {
            console.log(`🔄 Updating flags for ${marketer.first_name} ${marketer.last_name}...`);
            
            // Update user flags to match actual form existence
            const updateResult = await pool.query(
              `UPDATE users 
               SET bio_submitted = $1, 
                   guarantor_submitted = $2, 
                   commitment_submitted = $3,
                   updated_at = NOW()
               WHERE id = $4
               RETURNING *`,
              [bioSubmitted, guarantorSubmitted, commitmentSubmitted, marketer.id]
            );
            
            if (updateResult.rows.length > 0) {
              console.log(`✅ Flags updated for ${marketer.first_name} ${marketer.last_name}`);
              fixedCount++;
              results.push({
                marketer: `${marketer.first_name} ${marketer.last_name}`,
                uniqueId: marketer.unique_id,
                status: 'fixed',
                oldFlags: currentFlags,
                newFlags: { bioSubmitted, guarantorSubmitted, commitmentSubmitted }
              });
            } else {
              console.log(`❌ Failed to update flags for ${marketer.first_name} ${marketer.last_name}`);
              errorCount++;
              results.push({
                marketer: `${marketer.first_name} ${marketer.last_name}`,
                uniqueId: marketer.unique_id,
                status: 'error',
                error: 'Update failed'
              });
            }
          } else {
            console.log(`✅ Flags already correct for ${marketer.first_name} ${marketer.last_name}`);
            results.push({
              marketer: `${marketer.first_name} ${marketer.last_name}`,
              uniqueId: marketer.unique_id,
              status: 'already_correct'
            });
          }
          
        } catch (error) {
          console.error(`❌ Error processing marketer ${marketer.first_name} ${marketer.last_name}:`, error.message);
          errorCount++;
          results.push({
            marketer: `${marketer.first_name} ${marketer.last_name}`,
            uniqueId: marketer.unique_id,
            status: 'error',
            error: error.message
          });
        }
      }
      
      console.log(`\n🎉 Complete production fix completed!`);
      console.log(`✅ Fixed: ${fixedCount} marketers`);
      console.log(`❌ Errors: ${errorCount} marketers`);
      console.log(`📊 Total processed: ${marketersResult.rows.length} marketers`);
      
      res.json({
        success: true,
        message: "Complete production database fix completed",
        summary: {
          total: marketersResult.rows.length,
          fixed: fixedCount,
          errors: errorCount,
          alreadyCorrect: marketersResult.rows.length - fixedCount - errorCount
        },
        results: results
      });
      
    } catch (error) {
      console.error('❌ Error running complete production fix:', error);
      next(error);
    }
  }
);

// Fix all user form flags (utility endpoint for fixing all data)
router.post(
  "/fix-all-user-flags",
  verifyToken,
  verifyRole(["MasterAdmin"]),
  async (req, res, next) => {
    try {
      console.log('🔧 Starting to fix all user form flags via API...');
      
      // Get all marketers
      const marketersResult = await pool.query(
        'SELECT id, unique_id, first_name, last_name FROM users WHERE role = $1',
        ['Marketer']
      );
      
      console.log(`📊 Found ${marketersResult.rows.length} marketers to check`);
      
      let fixedCount = 0;
      let errorCount = 0;
      const results = [];
      
      for (const marketer of marketersResult.rows) {
        try {
          console.log(`\n🔍 Checking marketer: ${marketer.first_name} ${marketer.last_name} (${marketer.unique_id})`);
          
          // Check if forms actually exist in database
          const biodataCheck = await pool.query(
            'SELECT COUNT(*) as count FROM marketer_biodata WHERE marketer_unique_id = $1',
            [marketer.unique_id]
          );
          
          const guarantorCheck = await pool.query(
            'SELECT COUNT(*) as count FROM marketer_guarantor_form WHERE marketer_id = $1',
            [marketer.id]
          );
          
          const commitmentCheck = await pool.query(
            'SELECT COUNT(*) as count FROM marketer_commitment_form WHERE marketer_id = $1',
            [marketer.id]
          );
          
          const bioSubmitted = parseInt(biodataCheck.rows[0].count) > 0;
          const guarantorSubmitted = parseInt(guarantorCheck.rows[0].count) > 0;
          const commitmentSubmitted = parseInt(commitmentCheck.rows[0].count) > 0;
          
          // Get current user flags
          const currentUserResult = await pool.query(
            'SELECT bio_submitted, guarantor_submitted, commitment_submitted FROM users WHERE id = $1',
            [marketer.id]
          );
          
          const currentFlags = currentUserResult.rows[0];
          
          // Check if flags need updating
          const needsUpdate = 
            currentFlags.bio_submitted !== bioSubmitted ||
            currentFlags.guarantor_submitted !== guarantorSubmitted ||
            currentFlags.commitment_submitted !== commitmentSubmitted;
          
          if (needsUpdate) {
            console.log(`🔄 Updating flags for ${marketer.first_name} ${marketer.last_name}...`);
            
            // Update user flags to match actual form existence
            const updateResult = await pool.query(
              `UPDATE users 
               SET bio_submitted = $1, 
                   guarantor_submitted = $2, 
                   commitment_submitted = $3,
                   updated_at = NOW()
               WHERE id = $4
               RETURNING *`,
              [bioSubmitted, guarantorSubmitted, commitmentSubmitted, marketer.id]
            );
            
            if (updateResult.rows.length > 0) {
              console.log(`✅ Flags updated for ${marketer.first_name} ${marketer.last_name}`);
              fixedCount++;
              results.push({
                marketer: `${marketer.first_name} ${marketer.last_name}`,
                uniqueId: marketer.unique_id,
                status: 'fixed',
                oldFlags: currentFlags,
                newFlags: { bioSubmitted, guarantorSubmitted, commitmentSubmitted }
              });
            } else {
              console.log(`❌ Failed to update flags for ${marketer.first_name} ${marketer.last_name}`);
              errorCount++;
              results.push({
                marketer: `${marketer.first_name} ${marketer.last_name}`,
                uniqueId: marketer.unique_id,
                status: 'error',
                error: 'Update failed'
              });
            }
          } else {
            console.log(`✅ Flags already correct for ${marketer.first_name} ${marketer.last_name}`);
            results.push({
              marketer: `${marketer.first_name} ${marketer.last_name}`,
              uniqueId: marketer.unique_id,
              status: 'already_correct'
            });
          }
          
        } catch (error) {
          console.error(`❌ Error processing marketer ${marketer.first_name} ${marketer.last_name}:`, error.message);
          errorCount++;
          results.push({
            marketer: `${marketer.first_name} ${marketer.last_name}`,
            uniqueId: marketer.unique_id,
            status: 'error',
            error: error.message
          });
        }
      }
      
      console.log(`\n🎉 Fix completed!`);
      console.log(`✅ Fixed: ${fixedCount} marketers`);
      console.log(`❌ Errors: ${errorCount} marketers`);
      console.log(`📊 Total processed: ${marketersResult.rows.length} marketers`);
      
      res.json({
        success: true,
        message: "All user form flags fix completed",
        summary: {
          total: marketersResult.rows.length,
          fixed: fixedCount,
          errors: errorCount,
          alreadyCorrect: marketersResult.rows.length - fixedCount - errorCount
        },
        results: results
      });
      
    } catch (error) {
      console.error('❌ Error fixing all user form flags:', error);
      next(error);
    }
  }
);

// Removed redundant success routes - main submission endpoints handle everything

module.exports = router;
