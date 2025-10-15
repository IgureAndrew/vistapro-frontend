// OTP Transition Management Routes for MasterAdmin
const express = require('express');
const router = express.Router();
const { verifyToken, verifyRole } = require('../middlewares/authMiddleware');
const {
  getTransitionStats,
  getTransitionUsers,
  sendBulkReminders,
  exportTransitionData
} = require('../controllers/otpTransitionController');

// All routes require MasterAdmin authentication
router.use(verifyToken);
router.use(verifyRole(['MasterAdmin']));

// GET /api/otp-transition/stats - Get transition statistics
router.get('/stats', getTransitionStats);

// GET /api/otp-transition/users - Get user list with transition status
router.get('/users', getTransitionUsers);

// POST /api/otp-transition/bulk-reminders - Send bulk email reminders
router.post('/bulk-reminders', sendBulkReminders);

// GET /api/otp-transition/export - Export transition data to CSV
router.get('/export', exportTransitionData);

module.exports = router;
