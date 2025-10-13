// Grace Period Reminder Service - Automated email reminders for OTP transition
const { pool } = require('../config/database');
const { sendEmailUpdateReminder } = require('./emailService');

/**
 * Get users who need grace period reminders
 * @param {number} daysRemaining - Days remaining until grace period ends
 */
async function getUsersNeedingReminder(daysRemaining) {
  try {
    const query = `
      SELECT 
        id,
        unique_id,
        first_name,
        last_name,
        email,
        otp_grace_period_end,
        email_verified,
        otp_enabled,
        EXTRACT(DAY FROM (otp_grace_period_end - NOW())) as days_left
      FROM users
      WHERE 
        otp_grace_period_end IS NOT NULL
        AND otp_grace_period_end > NOW()
        AND otp_enabled = false
        AND role NOT IN ('MasterAdmin')
        AND EXTRACT(DAY FROM (otp_grace_period_end - NOW())) <= $1
        AND EXTRACT(DAY FROM (otp_grace_period_end - NOW())) >= $1 - 1
        AND (
          last_reminder_sent IS NULL 
          OR last_reminder_sent < NOW() - INTERVAL '1 day'
        )
    `;

    const { rows } = await pool.query(query, [daysRemaining]);
    return rows;
  } catch (error) {
    console.error(`Error getting users needing reminder (${daysRemaining} days):`, error);
    throw error;
  }
}

/**
 * Send grace period reminder email
 */
async function sendGracePeriodReminder(user, daysRemaining) {
  try {
    await sendEmailUpdateReminder(user.email, user.first_name, daysRemaining);
    
    // Update last_reminder_sent timestamp
    await pool.query(
      'UPDATE users SET last_reminder_sent = NOW() WHERE id = $1',
      [user.id]
    );

    console.log(`✅ Sent grace period reminder to ${user.email} (${daysRemaining} days remaining)`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send reminder to ${user.email}:`, error);
    return false;
  }
}

/**
 * Process all grace period reminders for a specific milestone
 */
async function processReminders(daysRemaining) {
  try {
    console.log(`\n📧 Processing ${daysRemaining}-day grace period reminders...`);
    
    const users = await getUsersNeedingReminder(daysRemaining);
    console.log(`Found ${users.length} users needing ${daysRemaining}-day reminder`);

    if (users.length === 0) {
      return { success: 0, failed: 0, total: 0 };
    }

    let successCount = 0;
    let failCount = 0;

    for (const user of users) {
      const sent = await sendGracePeriodReminder(user, Math.ceil(user.days_left));
      if (sent) {
        successCount++;
      } else {
        failCount++;
      }

      // Add small delay between emails to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`✅ Reminder results: ${successCount} sent, ${failCount} failed`);
    
    return {
      success: successCount,
      failed: failCount,
      total: users.length
    };
  } catch (error) {
    console.error('Error processing reminders:', error);
    throw error;
  }
}

/**
 * Run all scheduled reminders (14, 7, 3, 1 days)
 */
async function runAllScheduledReminders() {
  try {
    console.log('\n🔔 Starting scheduled grace period reminders...');
    console.log(`Time: ${new Date().toISOString()}`);

    const milestones = [14, 7, 3, 1];
    const results = {};

    for (const days of milestones) {
      results[`${days}days`] = await processReminders(days);
    }

    console.log('\n📊 Summary of all reminders:');
    console.log(JSON.stringify(results, null, 2));

    return results;
  } catch (error) {
    console.error('Error running scheduled reminders:', error);
    throw error;
  }
}

/**
 * Send immediate grace period notification
 */
async function sendImmediateNotification(userId, notificationType) {
  try {
    const userQuery = `
      SELECT 
        id,
        first_name,
        email,
        otp_grace_period_end,
        EXTRACT(DAY FROM (otp_grace_period_end - NOW())) as days_left
      FROM users
      WHERE id = $1
    `;

    const { rows } = await pool.query(userQuery, [userId]);
    
    if (rows.length === 0) {
      throw new Error('User not found');
    }

    const user = rows[0];
    const daysRemaining = Math.max(0, Math.ceil(user.days_left));

    if (notificationType === 'grace_period_reminder') {
      await sendGracePeriodReminder(user, daysRemaining);
    }

    return { success: true, user: user.email, daysRemaining };
  } catch (error) {
    console.error('Error sending immediate notification:', error);
    throw error;
  }
}

/**
 * Get reminder statistics
 */
async function getReminderStats() {
  try {
    const statsQuery = `
      SELECT 
        COUNT(*) FILTER (WHERE last_reminder_sent IS NOT NULL) as total_reminders_sent,
        COUNT(*) FILTER (
          WHERE otp_grace_period_end IS NOT NULL 
          AND otp_grace_period_end > NOW()
          AND otp_enabled = false
          AND EXTRACT(DAY FROM (otp_grace_period_end - NOW())) <= 14
        ) as users_in_reminder_window,
        COUNT(*) FILTER (
          WHERE otp_grace_period_end IS NOT NULL 
          AND otp_grace_period_end > NOW()
          AND otp_enabled = false
          AND EXTRACT(DAY FROM (otp_grace_period_end - NOW())) <= 1
        ) as critical_users,
        MAX(last_reminder_sent) as last_reminder_time
      FROM users
      WHERE role NOT IN ('MasterAdmin')
    `;

    const { rows } = await pool.query(statsQuery);
    return rows[0];
  } catch (error) {
    console.error('Error getting reminder stats:', error);
    throw error;
  }
}

module.exports = {
  getUsersNeedingReminder,
  sendGracePeriodReminder,
  processReminders,
  runAllScheduledReminders,
  sendImmediateNotification,
  getReminderStats
};
