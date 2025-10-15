// OTP Notification Service - In-app notifications for OTP transition events
const { pool } = require('../config/database');

/**
 * Notification types for OTP transition
 */
const NOTIFICATION_TYPES = {
  EMAIL_VERIFICATION_SENT: 'email_verification_sent',
  EMAIL_VERIFIED: 'email_verified',
  GRACE_PERIOD_STARTED: 'grace_period_started',
  GRACE_PERIOD_WARNING: 'grace_period_warning',
  GRACE_PERIOD_CRITICAL: 'grace_period_critical',
  OTP_ENABLED: 'otp_enabled',
  PASSWORD_LOGIN_DISABLED: 'password_login_disabled',
  EMAIL_UPDATE_REQUIRED: 'email_update_required'
};

/**
 * Create OTP transition notification
 */
async function createOTPNotification(userId, type, metadata = {}) {
  try {
    const notificationData = getNotificationData(type, metadata);
    
    const query = `
      INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        category,
        priority,
        metadata,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING id
    `;

    const values = [
      userId,
      type,
      notificationData.title,
      notificationData.message,
      'otp_transition',
      notificationData.priority,
      JSON.stringify(metadata)
    ];

    const { rows } = await pool.query(query, values);
    
    console.log(`✅ Created OTP notification for user ${userId}: ${type}`);
    
    // Emit socket event for real-time notification
    const io = global.io;
    if (io) {
      io.to(`user:${userId}`).emit('new-notification', {
        id: rows[0].id,
        type,
        ...notificationData,
        metadata,
        created_at: new Date()
      });
    }

    return rows[0].id;
  } catch (error) {
    console.error('Error creating OTP notification:', error);
    throw error;
  }
}

/**
 * Get notification content based on type
 */
function getNotificationData(type, metadata = {}) {
  const { daysRemaining, email } = metadata;

  const notificationMap = {
    [NOTIFICATION_TYPES.EMAIL_VERIFICATION_SENT]: {
      title: '📧 Verification Email Sent',
      message: 'We\'ve sent a verification email to your inbox. Please check your email and click the verification link.',
      priority: 'medium'
    },
    [NOTIFICATION_TYPES.EMAIL_VERIFIED]: {
      title: '✅ Email Verified Successfully',
      message: 'Your email address has been verified! You can now enable OTP login for secure access.',
      priority: 'high'
    },
    [NOTIFICATION_TYPES.GRACE_PERIOD_STARTED]: {
      title: '⏰ Grace Period Started',
      message: 'You have 14 days to update your email and enable OTP login. Password login will be disabled after this period.',
      priority: 'medium'
    },
    [NOTIFICATION_TYPES.GRACE_PERIOD_WARNING]: {
      title: `⚠️ Grace Period: ${daysRemaining} Days Remaining`,
      message: `Only ${daysRemaining} days left to complete OTP setup. Update your email and enable OTP to avoid login issues.`,
      priority: 'high'
    },
    [NOTIFICATION_TYPES.GRACE_PERIOD_CRITICAL]: {
      title: `🚨 URGENT: ${daysRemaining} Day${daysRemaining !== 1 ? 's' : ''} Left!`,
      message: `Critical: Password login will be disabled in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}. Enable OTP immediately!`,
      priority: 'critical'
    },
    [NOTIFICATION_TYPES.OTP_ENABLED]: {
      title: '🎉 OTP Login Enabled',
      message: 'Success! OTP login is now enabled for your account. You\'ll receive a one-time code via email each time you log in.',
      priority: 'high'
    },
    [NOTIFICATION_TYPES.PASSWORD_LOGIN_DISABLED]: {
      title: '🔒 Password Login Disabled',
      message: 'Password login has been disabled. Please use OTP login with your verified email address.',
      priority: 'critical'
    },
    [NOTIFICATION_TYPES.EMAIL_UPDATE_REQUIRED]: {
      title: '📝 Email Update Required',
      message: 'Please update your email address to continue using VistaPro. Go to Account Settings to update.',
      priority: 'high'
    }
  };

  return notificationMap[type] || {
    title: 'OTP Transition Update',
    message: 'You have a new OTP transition update.',
    priority: 'medium'
  };
}

/**
 * Notify user about email verification sent
 */
async function notifyEmailVerificationSent(userId, email) {
  return await createOTPNotification(
    userId,
    NOTIFICATION_TYPES.EMAIL_VERIFICATION_SENT,
    { email }
  );
}

/**
 * Notify user about successful email verification
 */
async function notifyEmailVerified(userId, email) {
  return await createOTPNotification(
    userId,
    NOTIFICATION_TYPES.EMAIL_VERIFIED,
    { email }
  );
}

/**
 * Notify user about grace period start
 */
async function notifyGracePeriodStarted(userId, gracePeriodEnd) {
  return await createOTPNotification(
    userId,
    NOTIFICATION_TYPES.GRACE_PERIOD_STARTED,
    { gracePeriodEnd }
  );
}

/**
 * Notify user about grace period warning
 */
async function notifyGracePeriodWarning(userId, daysRemaining) {
  const type = daysRemaining <= 3 
    ? NOTIFICATION_TYPES.GRACE_PERIOD_CRITICAL
    : NOTIFICATION_TYPES.GRACE_PERIOD_WARNING;

  return await createOTPNotification(userId, type, { daysRemaining });
}

/**
 * Notify user about OTP enabled
 */
async function notifyOTPEnabled(userId) {
  return await createOTPNotification(
    userId,
    NOTIFICATION_TYPES.OTP_ENABLED,
    {}
  );
}

/**
 * Notify user about password login disabled
 */
async function notifyPasswordLoginDisabled(userId) {
  return await createOTPNotification(
    userId,
    NOTIFICATION_TYPES.PASSWORD_LOGIN_DISABLED,
    {}
  );
}

/**
 * Get OTP notifications for user
 */
async function getOTPNotifications(userId, limit = 10) {
  try {
    const query = `
      SELECT 
        id,
        type,
        title,
        message,
        category,
        priority,
        metadata,
        is_read,
        created_at
      FROM notifications
      WHERE user_id = $1 
        AND category = 'otp_transition'
      ORDER BY created_at DESC
      LIMIT $2
    `;

    const { rows } = await pool.query(query, [userId, limit]);
    return rows;
  } catch (error) {
    console.error('Error getting OTP notifications:', error);
    throw error;
  }
}

/**
 * Mark notification as read
 */
async function markNotificationRead(notificationId, userId) {
  try {
    const query = `
      UPDATE notifications
      SET is_read = true, read_at = NOW()
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `;

    const { rows } = await pool.query(query, [notificationId, userId]);
    return rows.length > 0;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

/**
 * Get unread OTP notification count
 */
async function getUnreadOTPCount(userId) {
  try {
    const query = `
      SELECT COUNT(*) as count
      FROM notifications
      WHERE user_id = $1 
        AND category = 'otp_transition'
        AND is_read = false
    `;

    const { rows } = await pool.query(query, [userId]);
    return parseInt(rows[0].count);
  } catch (error) {
    console.error('Error getting unread OTP count:', error);
    throw error;
  }
}

module.exports = {
  NOTIFICATION_TYPES,
  createOTPNotification,
  notifyEmailVerificationSent,
  notifyEmailVerified,
  notifyGracePeriodStarted,
  notifyGracePeriodWarning,
  notifyOTPEnabled,
  notifyPasswordLoginDisabled,
  getOTPNotifications,
  markNotificationRead,
  getUnreadOTPCount
};
