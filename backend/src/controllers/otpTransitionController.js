// OTP Transition Management Controller for MasterAdmin
const { pool } = require('../config/database');

/**
 * Get OTP transition statistics and metrics
 */
const getTransitionStats = async (req, res, next) => {
  try {
    // Get overall statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE email_verified = true) as verified_users,
        COUNT(*) FILTER (WHERE otp_enabled = true) as otp_enabled_users,
        COUNT(*) FILTER (WHERE otp_grace_period_end IS NOT NULL AND otp_grace_period_end > NOW()) as users_in_grace_period,
        COUNT(*) FILTER (WHERE otp_grace_period_end IS NOT NULL AND otp_grace_period_end <= NOW()) as users_past_grace_period,
        COUNT(*) FILTER (WHERE email_update_required = true) as users_need_email_update,
        COUNT(*) FILTER (WHERE email_verified = false) as users_not_verified
      FROM users
      WHERE role NOT IN ('MasterAdmin')
    `;
    
    const { rows: statsRows } = await pool.query(statsQuery);
    const stats = statsRows[0];

    // Calculate percentages
    const totalUsers = parseInt(stats.total_users);
    const metrics = {
      totalUsers,
      verifiedUsers: parseInt(stats.verified_users),
      verifiedPercentage: totalUsers > 0 ? ((parseInt(stats.verified_users) / totalUsers) * 100).toFixed(1) : 0,
      otpEnabledUsers: parseInt(stats.otp_enabled_users),
      otpEnabledPercentage: totalUsers > 0 ? ((parseInt(stats.otp_enabled_users) / totalUsers) * 100).toFixed(1) : 0,
      usersInGracePeriod: parseInt(stats.users_in_grace_period),
      gracePeriodPercentage: totalUsers > 0 ? ((parseInt(stats.users_in_grace_period) / totalUsers) * 100).toFixed(1) : 0,
      usersPastGracePeriod: parseInt(stats.users_past_grace_period),
      usersNeedEmailUpdate: parseInt(stats.users_need_email_update),
      usersNotVerified: parseInt(stats.users_not_verified),
      transitionComplete: parseInt(stats.otp_enabled_users),
      transitionCompletePercentage: totalUsers > 0 ? ((parseInt(stats.otp_enabled_users) / totalUsers) * 100).toFixed(1) : 0
    };

    // Get transition status breakdown by role
    const roleBreakdownQuery = `
      SELECT 
        role,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE email_verified = true) as verified,
        COUNT(*) FILTER (WHERE otp_enabled = true) as otp_enabled,
        COUNT(*) FILTER (WHERE otp_grace_period_end IS NOT NULL AND otp_grace_period_end > NOW()) as in_grace_period
      FROM users
      WHERE role NOT IN ('MasterAdmin')
      GROUP BY role
      ORDER BY role
    `;
    
    const { rows: roleBreakdown } = await pool.query(roleBreakdownQuery);

    // Get recent transitions (users who recently verified or enabled OTP)
    const recentTransitionsQuery = `
      SELECT 
        id,
        unique_id,
        first_name,
        last_name,
        email,
        role,
        email_verified,
        otp_enabled,
        otp_grace_period_end,
        email_verification_sent_at,
        updated_at
      FROM users
      WHERE role NOT IN ('MasterAdmin')
        AND (email_verified = true OR otp_enabled = true)
      ORDER BY updated_at DESC
      LIMIT 10
    `;
    
    const { rows: recentTransitions } = await pool.query(recentTransitionsQuery);

    res.json({
      success: true,
      data: {
        metrics,
        roleBreakdown,
        recentTransitions
      }
    });
  } catch (error) {
    console.error('Error getting transition stats:', error);
    next(error);
  }
};

/**
 * Get detailed user list with OTP transition status
 */
const getTransitionUsers = async (req, res, next) => {
  try {
    const { 
      status, // 'verified', 'not_verified', 'otp_enabled', 'in_grace_period', 'past_grace_period'
      role,
      search,
      page = 1,
      limit = 20
    } = req.query;

    let whereConditions = ["role NOT IN ('MasterAdmin')"];
    const queryParams = [];
    let paramCount = 1;

    // Filter by status
    if (status === 'verified') {
      whereConditions.push('email_verified = true');
    } else if (status === 'not_verified') {
      whereConditions.push('email_verified = false');
    } else if (status === 'otp_enabled') {
      whereConditions.push('otp_enabled = true');
    } else if (status === 'in_grace_period') {
      whereConditions.push('otp_grace_period_end IS NOT NULL AND otp_grace_period_end > NOW()');
    } else if (status === 'past_grace_period') {
      whereConditions.push('otp_grace_period_end IS NOT NULL AND otp_grace_period_end <= NOW()');
    }

    // Filter by role
    if (role && role !== 'all') {
      queryParams.push(role);
      whereConditions.push(`role = $${paramCount++}`);
    }

    // Search by name or email
    if (search) {
      queryParams.push(`%${search}%`);
      whereConditions.push(`(
        LOWER(first_name) LIKE LOWER($${paramCount}) OR 
        LOWER(last_name) LIKE LOWER($${paramCount}) OR 
        LOWER(email) LIKE LOWER($${paramCount})
      )`);
      paramCount++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM users
      ${whereClause}
    `;
    const { rows: countRows } = await pool.query(countQuery, queryParams);
    const totalUsers = parseInt(countRows[0].total);

    // Get paginated users
    const offset = (page - 1) * limit;
    queryParams.push(limit, offset);
    
    const usersQuery = `
      SELECT 
        id,
        unique_id,
        first_name,
        last_name,
        email,
        role,
        email_verified,
        otp_enabled,
        email_update_required,
        otp_grace_period_end,
        email_verification_sent_at,
        created_at,
        updated_at,
        CASE 
          WHEN otp_enabled = true THEN 'completed'
          WHEN otp_grace_period_end IS NOT NULL AND otp_grace_period_end > NOW() THEN 'in_grace_period'
          WHEN otp_grace_period_end IS NOT NULL AND otp_grace_period_end <= NOW() THEN 'past_grace_period'
          WHEN email_verified = true THEN 'verified'
          ELSE 'not_verified'
        END as transition_status,
        CASE 
          WHEN otp_grace_period_end IS NOT NULL AND otp_grace_period_end > NOW() 
          THEN EXTRACT(DAY FROM (otp_grace_period_end - NOW()))
          ELSE 0
        END as days_remaining
      FROM users
      ${whereClause}
      ORDER BY updated_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    
    const { rows: users } = await pool.query(usersQuery, queryParams);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          total: totalUsers,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(totalUsers / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error getting transition users:', error);
    next(error);
  }
};

/**
 * Send bulk email reminders to users
 */
const sendBulkReminders = async (req, res, next) => {
  try {
    const { userIds, reminderType } = req.body; // reminderType: 'verification' or 'grace_period'

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'User IDs are required' });
    }

    // Get users
    const usersQuery = `
      SELECT id, email, first_name, otp_grace_period_end
      FROM users
      WHERE id = ANY($1::int[])
    `;
    const { rows: users } = await pool.query(usersQuery, [userIds]);

    if (users.length === 0) {
      return res.status(404).json({ message: 'No users found' });
    }

    // Import email service
    const { sendEmailUpdateReminder } = require('../services/emailService');

    let successCount = 0;
    let failCount = 0;
    const errors = [];

    // Send reminders
    for (const user of users) {
      try {
        const now = new Date();
        const gracePeriodEnd = user.otp_grace_period_end ? new Date(user.otp_grace_period_end) : null;
        const daysRemaining = gracePeriodEnd ? Math.ceil((gracePeriodEnd - now) / (24 * 60 * 60 * 1000)) : 14;

        await sendEmailUpdateReminder(user.email, user.first_name, daysRemaining);
        successCount++;
      } catch (error) {
        failCount++;
        errors.push({ userId: user.id, email: user.email, error: error.message });
      }
    }

    res.json({
      success: true,
      message: `Sent ${successCount} reminders, ${failCount} failed`,
      data: {
        successCount,
        failCount,
        errors: errors.length > 0 ? errors : undefined
      }
    });
  } catch (error) {
    console.error('Error sending bulk reminders:', error);
    next(error);
  }
};

/**
 * Export transition data to CSV
 */
const exportTransitionData = async (req, res, next) => {
  try {
    const { status, role } = req.query;

    let whereConditions = ["role NOT IN ('MasterAdmin')"];
    const queryParams = [];
    let paramCount = 1;

    // Filter by status
    if (status && status !== 'all') {
      if (status === 'verified') {
        whereConditions.push('email_verified = true');
      } else if (status === 'not_verified') {
        whereConditions.push('email_verified = false');
      } else if (status === 'otp_enabled') {
        whereConditions.push('otp_enabled = true');
      } else if (status === 'in_grace_period') {
        whereConditions.push('otp_grace_period_end IS NOT NULL AND otp_grace_period_end > NOW()');
      }
    }

    // Filter by role
    if (role && role !== 'all') {
      queryParams.push(role);
      whereConditions.push(`role = $${paramCount++}`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        unique_id,
        first_name,
        last_name,
        email,
        role,
        email_verified,
        otp_enabled,
        email_update_required,
        otp_grace_period_end,
        created_at,
        CASE 
          WHEN otp_enabled = true THEN 'Completed'
          WHEN otp_grace_period_end IS NOT NULL AND otp_grace_period_end > NOW() THEN 'In Grace Period'
          WHEN otp_grace_period_end IS NOT NULL AND otp_grace_period_end <= NOW() THEN 'Past Grace Period'
          WHEN email_verified = true THEN 'Verified'
          ELSE 'Not Verified'
        END as transition_status
      FROM users
      ${whereClause}
      ORDER BY role, last_name, first_name
    `;

    const { rows } = await pool.query(query, queryParams);

    // Convert to CSV
    const headers = [
      'User ID',
      'First Name',
      'Last Name',
      'Email',
      'Role',
      'Email Verified',
      'OTP Enabled',
      'Email Update Required',
      'Grace Period End',
      'Created At',
      'Transition Status'
    ];

    let csv = headers.join(',') + '\n';

    rows.forEach(row => {
      const values = [
        row.unique_id,
        row.first_name,
        row.last_name,
        row.email,
        row.role,
        row.email_verified ? 'Yes' : 'No',
        row.otp_enabled ? 'Yes' : 'No',
        row.email_update_required ? 'Yes' : 'No',
        row.otp_grace_period_end || 'N/A',
        row.created_at?.toISOString() || 'N/A',
        row.transition_status
      ];
      csv += values.map(v => `"${v}"`).join(',') + '\n';
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=otp-transition-export.csv');
    res.send(csv);
  } catch (error) {
    console.error('Error exporting transition data:', error);
    next(error);
  }
};

module.exports = {
  getTransitionStats,
  getTransitionUsers,
  sendBulkReminders,
  exportTransitionData
};
