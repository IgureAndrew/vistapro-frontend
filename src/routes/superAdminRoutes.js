const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const superAdminController = require('../controllers/superAdminController');
const { verifyToken, verifyRole } = require('../middlewares/authMiddleware');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage config - use memory storage for Cloudinary uploads
const memoryStorage = multer.memoryStorage();

// Configure Multer for file uploads
const upload = multer({ 
  storage: memoryStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'profile_image') {
      if (file.mimetype.startsWith('image/')) {
        return cb(null, true);
      }
      return cb(new Error('Only image files allowed for profile image'), false);
    }
    cb(null, true);
  }
});

// All routes require authentication and SuperAdmin role
router.use(verifyToken);
router.use(verifyRole(['SuperAdmin']));

// SuperAdmin team management routes
router.get('/team/hierarchy', superAdminController.getSuperAdminTeamHierarchy);
router.get('/team/stats', superAdminController.getSuperAdminTeamStats);
router.get('/team/performance', superAdminController.getSuperAdminPerformanceMetrics);
router.get('/team/locations', superAdminController.getSuperAdminLocationBreakdown);
router.get('/account', superAdminController.getAccount);
router.patch('/account', upload.single('profile_image'), superAdminController.updateAccount);

// SuperAdmin orders management
router.get('/orders/history', superAdminController.getSuperAdminOrders);

// SuperAdmin dashboard routes
router.get('/stats', superAdminController.getStats);
router.get('/wallet-summary', superAdminController.getWalletSummary);
router.get('/commission-transactions', superAdminController.getCommissionTransactions);
router.get('/recent-activities', superAdminController.getRecentActivities);

// SuperAdmin verification submissions routes
router.get('/verification-submissions', superAdminController.getVerificationSubmissions);
router.post('/verification-submissions/:submissionId/approve', superAdminController.approveVerificationSubmission);
router.post('/verification-submissions/:submissionId/reject', superAdminController.rejectVerificationSubmission);

module.exports = router;