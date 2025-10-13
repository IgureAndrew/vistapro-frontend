// OTP Notification Controller
const {
  getOTPNotifications,
  markNotificationRead,
  getUnreadOTPCount
} = require('../services/otpNotificationService');

/**
 * Get OTP notifications for current user
 */
const getUserOTPNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;

    const notifications = await getOTPNotifications(userId, limit);
    const unreadCount = await getUnreadOTPCount(userId);

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount
      }
    });
  } catch (error) {
    console.error('Error getting OTP notifications:', error);
    next(error);
  }
};

/**
 * Mark notification as read
 */
const markAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { notificationId } = req.params;

    const success = await markNotificationRead(notificationId, userId);

    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    next(error);
  }
};

/**
 * Mark all OTP notifications as read
 */
const markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const query = `
      UPDATE notifications
      SET is_read = true, read_at = NOW()
      WHERE user_id = $1 
        AND category = 'otp_transition'
        AND is_read = false
      RETURNING id
    `;

    const { pool } = require('../config/database');
    const { rows } = await pool.query(query, [userId]);

    res.json({
      success: true,
      message: `Marked ${rows.length} notifications as read`,
      count: rows.length
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    next(error);
  }
};

/**
 * Get unread count
 */
const getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const count = await getUnreadOTPCount(userId);

    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    console.error('Error getting unread count:', error);
    next(error);
  }
};

module.exports = {
  getUserOTPNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount
};
