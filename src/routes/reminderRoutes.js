// Reminder Routes for Grace Period Notifications
const express = require('express');
const router = express.Router();
const { verifyToken, verifyRole } = require('../middlewares/authMiddleware');
const {
  triggerReminders,
  getStats,
  sendUserNotification
} = require('../controllers/reminderController');

// All routes require MasterAdmin authentication
router.use(verifyToken);
router.use(verifyRole(['MasterAdmin']));

// POST /api/reminders/trigger - Manually trigger all scheduled reminders
router.post('/trigger', triggerReminders);

// GET /api/reminders/stats - Get reminder statistics
router.get('/stats', getStats);

// POST /api/reminders/send - Send immediate notification to user
router.post('/send', sendUserNotification);

module.exports = router;
