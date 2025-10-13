// Reminder Controller for Grace Period Email Notifications
const { 
  runAllScheduledReminders,
  getReminderStats,
  sendImmediateNotification 
} = require('../services/gracePeriodReminderService');

/**
 * Manually trigger all scheduled reminders (MasterAdmin only)
 */
const triggerReminders = async (req, res, next) => {
  try {
    console.log('🔧 Manual trigger of grace period reminders requested by:', req.user?.unique_id);
    
    const results = await runAllScheduledReminders();
    
    res.json({
      success: true,
      message: 'Grace period reminders sent successfully',
      data: results
    });
  } catch (error) {
    console.error('Error triggering reminders:', error);
    next(error);
  }
};

/**
 * Get reminder statistics
 */
const getStats = async (req, res, next) => {
  try {
    const stats = await getReminderStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting reminder stats:', error);
    next(error);
  }
};

/**
 * Send immediate notification to specific user
 */
const sendUserNotification = async (req, res, next) => {
  try {
    const { userId, notificationType } = req.body;
    
    if (!userId || !notificationType) {
      return res.status(400).json({
        success: false,
        message: 'userId and notificationType are required'
      });
    }

    const result = await sendImmediateNotification(userId, notificationType);
    
    res.json({
      success: true,
      message: 'Notification sent successfully',
      data: result
    });
  } catch (error) {
    console.error('Error sending user notification:', error);
    next(error);
  }
};

module.exports = {
  triggerReminders,
  getStats,
  sendUserNotification
};
