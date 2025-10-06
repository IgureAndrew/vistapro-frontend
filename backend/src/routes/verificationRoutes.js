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

// Removed redundant success routes - main submission endpoints handle everything

module.exports = router;
