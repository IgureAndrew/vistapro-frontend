// OTP Notification Routes
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const {
  getUserOTPNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount
} = require('../controllers/otpNotificationController');

// All routes require authentication
router.use(verifyToken);

// GET /api/otp-notifications - Get user's OTP notifications
router.get('/', getUserOTPNotifications);

// GET /api/otp-notifications/unread-count - Get unread count
router.get('/unread-count', getUnreadCount);

// PUT /api/otp-notifications/:notificationId/read - Mark as read
router.put('/:notificationId/read', markAsRead);

// PUT /api/otp-notifications/mark-all-read - Mark all as read
router.put('/mark-all-read', markAllAsRead);

module.exports = router;
