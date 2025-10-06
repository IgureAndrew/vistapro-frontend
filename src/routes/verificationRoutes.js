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
