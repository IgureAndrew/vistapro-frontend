// src/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { verifyToken } = require('../middlewares/authMiddleware');
const { verifyRole } = require('../middlewares/roleMiddleware');
// Note: Use the correct function name from your adminController.
const { getAccount, updateAccount, updateAdminAccountSettings, registerDealer, registerMarketer, getDashboardSummary, getWalletSummary, getRecentActivities, getVerificationSubmissions, getAssignedMarketers, getAssignmentStats } = require('../controllers/adminController');

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

module.exports = router;
