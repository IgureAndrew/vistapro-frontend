const express = require('express');
const { verifyToken } = require('../middlewares/authMiddleware');
const { pool } = require('../config/database');

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// GET /api/profile/login-history - Get user's login history
router.get('/login-history', async (req, res) => {
  try {
    const userId = req.user.id;
    
    // For now, return mock data since we don't have a login_history table yet
    // In a real implementation, you would query a login_history table
    const mockLoginHistory = [
      {
        id: 1,
        device: 'Chrome on Windows',
        location: 'Lagos, Nigeria',
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        ip_address: '192.168.1.1'
      },
      {
        id: 2,
        device: 'Mobile Safari',
        location: 'Abuja, Nigeria', 
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        ip_address: '192.168.1.2'
      },
      {
        id: 3,
        device: 'Firefox on Linux',
        location: 'Port Harcourt, Nigeria',
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        ip_address: '192.168.1.3'
      }
    ];
    
    res.json({
      success: true,
      loginHistory: mockLoginHistory
    });
    
  } catch (error) {
    console.error('Error fetching login history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch login history',
      error: error.message
    });
  }
});

// PATCH /api/profile/otp-toggle - Toggle OTP for user
router.patch('/otp-toggle', async (req, res) => {
  try {
    const userId = req.user.id;
    const { enabled } = req.body;
    
    // Update OTP enabled status in users table
    const result = await pool.query(
      'UPDATE users SET otp_enabled = $1, updated_at = NOW() WHERE id = $2 RETURNING id, otp_enabled',
      [enabled, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      message: `OTP ${enabled ? 'enabled' : 'disabled'} successfully`,
      otpEnabled: result.rows[0].otp_enabled
    });
    
  } catch (error) {
    console.error('Error toggling OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle OTP',
      error: error.message
    });
  }
});

// GET /api/profile/preferences - Get user preferences
router.get('/preferences', async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user preferences from database
    // For now, return default preferences since we don't have a user_preferences table yet
    const defaultPreferences = {
      theme: 'light',
      language: 'en',
      timezone: 'Africa/Lagos'
    };
    
    // In a real implementation, you would query a user_preferences table
    // const result = await pool.query('SELECT * FROM user_preferences WHERE user_id = $1', [userId]);
    
    res.json({
      success: true,
      preferences: defaultPreferences
    });
    
  } catch (error) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch preferences',
      error: error.message
    });
  }
});

// PATCH /api/profile/preferences - Update user preferences
router.patch('/preferences', async (req, res) => {
  try {
    const userId = req.user.id;
    const { theme, language, timezone } = req.body;
    
    // For now, just return success since we don't have a user_preferences table yet
    // In a real implementation, you would update/insert into user_preferences table
    
    const updatedPreferences = {
      theme: theme || 'light',
      language: language || 'en',
      timezone: timezone || 'Africa/Lagos'
    };
    
    res.json({
      success: true,
      message: 'Preferences updated successfully',
      preferences: updatedPreferences
    });
    
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update preferences',
      error: error.message
    });
  }
});

// GET /api/profile/notification-preferences - Get user notification preferences
router.get('/notification-preferences', async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user notification preferences from database
    // For now, return default preferences since we don't have a notification_preferences table yet
    const defaultNotificationPreferences = {
      emailNotifications: true,
      pushNotifications: false,
      orderUpdates: true,
      securityAlerts: true
    };
    
    // In a real implementation, you would query a notification_preferences table
    // const result = await pool.query('SELECT * FROM notification_preferences WHERE user_id = $1', [userId]);
    
    res.json({
      success: true,
      notificationPreferences: defaultNotificationPreferences
    });
    
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification preferences',
      error: error.message
    });
  }
});

// PATCH /api/profile/notification-preferences - Update user notification preferences
router.patch('/notification-preferences', async (req, res) => {
  try {
    const userId = req.user.id;
    const { emailNotifications, pushNotifications, orderUpdates, securityAlerts } = req.body;
    
    // For now, just return success since we don't have a notification_preferences table yet
    // In a real implementation, you would update/insert into notification_preferences table
    
    const updatedNotificationPreferences = {
      emailNotifications: emailNotifications !== undefined ? emailNotifications : true,
      pushNotifications: pushNotifications !== undefined ? pushNotifications : false,
      orderUpdates: orderUpdates !== undefined ? orderUpdates : true,
      securityAlerts: securityAlerts !== undefined ? securityAlerts : true
    };
    
    res.json({
      success: true,
      message: 'Notification preferences updated successfully',
      notificationPreferences: updatedNotificationPreferences
    });
    
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification preferences',
      error: error.message
    });
  }
});

module.exports = router;
