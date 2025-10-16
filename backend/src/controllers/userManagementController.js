const pool = require('../config/database');
const { logActivity } = require('../utils/auditLogger');

/**
 * User Management Controller
 * MasterAdmin only - Lock, Unlock, Soft Delete, Hard Delete, Restore users
 */

/**
 * Lock a user account
 * POST /api/users/:id/lock
 */
const lockUser = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const performedBy = req.user.id; // MasterAdmin performing the action

    // Validate reason is provided
    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Lock reason is required'
      });
    }

    // Check if user exists and is not already locked
    const userCheck = await client.query(
      'SELECT id, first_name, last_name, role, is_locked FROM users WHERE id = $1',
      [id]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userCheck.rows[0];

    if (user.is_locked) {
      return res.status(400).json({
        success: false,
        message: 'User account is already locked'
      });
    }

    // Lock the user account
    await client.query(
      `UPDATE users 
       SET is_locked = true, 
           lock_reason = $1, 
           locked_by = $2, 
           locked_at = CURRENT_TIMESTAMP 
       WHERE id = $3`,
      [reason.trim(), performedBy, id]
    );

    // Log the action in audit trail
    await client.query(
      `INSERT INTO user_management_audit (user_id, action, performed_by, reason, details)
       VALUES ($1, 'lock', $2, $3, $4)`,
      [id, performedBy, reason.trim(), JSON.stringify({
        userName: `${user.first_name} ${user.last_name}`,
        userRole: user.role,
        timestamp: new Date().toISOString()
      })]
    );

    // Log activity
    await logActivity(
      performedBy,
      'USER_LOCKED',
      `Locked user account: ${user.first_name} ${user.last_name} (ID: ${id})`,
      { userId: id, reason: reason.trim() }
    );

    res.status(200).json({
      success: true,
      message: 'User account locked successfully',
      data: {
        userId: id,
        userName: `${user.first_name} ${user.last_name}`,
        lockedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error locking user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to lock user account',
      error: error.message
    });
  } finally {
    client.release();
  }
};

/**
 * Unlock a user account
 * PUT /api/users/:id/unlock
 */
const unlockUser = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const performedBy = req.user.id;

    // Check if user exists and is locked
    const userCheck = await client.query(
      'SELECT id, first_name, last_name, role, is_locked FROM users WHERE id = $1',
      [id]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userCheck.rows[0];

    if (!user.is_locked) {
      return res.status(400).json({
        success: false,
        message: 'User account is not locked'
      });
    }

    // Unlock the user account
    await client.query(
      `UPDATE users 
       SET is_locked = false, 
           lock_reason = NULL, 
           locked_by = NULL, 
           locked_at = NULL 
       WHERE id = $1`,
      [id]
    );

    // Log the action in audit trail
    await client.query(
      `INSERT INTO user_management_audit (user_id, action, performed_by, reason, details)
       VALUES ($1, 'unlock', $2, $3, $4)`,
      [id, performedBy, 'Account unlocked', JSON.stringify({
        userName: `${user.first_name} ${user.last_name}`,
        userRole: user.role,
        timestamp: new Date().toISOString()
      })]
    );

    // Log activity
    await logActivity(
      performedBy,
      'USER_UNLOCKED',
      `Unlocked user account: ${user.first_name} ${user.last_name} (ID: ${id})`,
      { userId: id }
    );

    res.status(200).json({
      success: true,
      message: 'User account unlocked successfully',
      data: {
        userId: id,
        userName: `${user.first_name} ${user.last_name}`,
        unlockedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error unlocking user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unlock user account',
      error: error.message
    });
  } finally {
    client.release();
  }
};

/**
 * Soft delete a user account
 * DELETE /api/users/:id/soft
 */
const softDeleteUser = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const performedBy = req.user.id;

    // Check if user exists and is not already deleted
    const userCheck = await client.query(
      'SELECT id, first_name, last_name, role, is_deleted FROM users WHERE id = $1',
      [id]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userCheck.rows[0];

    if (user.is_deleted) {
      return res.status(400).json({
        success: false,
        message: 'User account is already deleted'
      });
    }

    // Soft delete the user account (preserve all data)
    await client.query(
      `UPDATE users 
       SET is_deleted = true, 
           deleted_by = $1, 
           deleted_at = CURRENT_TIMESTAMP,
           deletion_type = 'soft'
       WHERE id = $2`,
      [performedBy, id]
    );

    // Log the action in audit trail
    await client.query(
      `INSERT INTO user_management_audit (user_id, action, performed_by, reason, details)
       VALUES ($1, 'soft_delete', $2, $3, $4)`,
      [id, performedBy, 'Soft deleted - data preserved', JSON.stringify({
        userName: `${user.first_name} ${user.last_name}`,
        userRole: user.role,
        timestamp: new Date().toISOString(),
        note: 'User data is preserved and can be restored'
      })]
    );

    // Log activity
    await logActivity(
      performedBy,
      'USER_SOFT_DELETED',
      `Soft deleted user: ${user.first_name} ${user.last_name} (ID: ${id})`,
      { userId: id }
    );

    res.status(200).json({
      success: true,
      message: 'User account soft deleted successfully. All data is preserved.',
      data: {
        userId: id,
        userName: `${user.first_name} ${user.last_name}`,
        deletedAt: new Date().toISOString(),
        deletionType: 'soft'
      }
    });

  } catch (error) {
    console.error('Error soft deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to soft delete user account',
      error: error.message
    });
  } finally {
    client.release();
  }
};

/**
 * Hard delete a user account (permanent deletion)
 * DELETE /api/users/:id/hard
 */
const hardDeleteUser = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const performedBy = req.user.id;

    // Check if user exists
    const userCheck = await client.query(
      'SELECT id, first_name, last_name, role FROM users WHERE id = $1',
      [id]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userCheck.rows[0];

    // Start transaction for hard delete
    await client.query('BEGIN');

    try {
      // Mark as hard deleted first (for audit trail)
      await client.query(
        `UPDATE users 
         SET is_deleted = true, 
             deleted_by = $1, 
             deleted_at = CURRENT_TIMESTAMP,
             deletion_type = 'hard'
         WHERE id = $2`,
        [performedBy, id]
      );

      // Log the action before deletion
      await client.query(
        `INSERT INTO user_management_audit (user_id, action, performed_by, reason, details)
         VALUES ($1, 'hard_delete', $2, $3, $4)`,
        [id, performedBy, 'Hard deleted - permanent removal', JSON.stringify({
          userName: `${user.first_name} ${user.last_name}`,
          userRole: user.role,
          timestamp: new Date().toISOString(),
          warning: 'This action is permanent and cannot be undone'
        })]
      );

      // Log activity
      await logActivity(
        performedBy,
        'USER_HARD_DELETED',
        `Hard deleted user: ${user.first_name} ${user.last_name} (ID: ${id})`,
        { userId: id }
      );

      // Now perform actual deletion of user records
      // Delete user-related data (cascade delete)
      await client.query('DELETE FROM orders WHERE user_id = $1', [id]);
      await client.query('DELETE FROM user_otps WHERE user_id = $1', [id]);
      await client.query('DELETE FROM messages WHERE sender_id = $1 OR receiver_id = $1', [id]);
      await client.query('DELETE FROM notifications WHERE user_id = $1', [id]);
      await client.query('DELETE FROM user_management_audit WHERE user_id = $1', [id]);
      
      // Finally delete the user
      await client.query('DELETE FROM users WHERE id = $1', [id]);

      await client.query('COMMIT');

      res.status(200).json({
        success: true,
        message: 'User account permanently deleted. All data has been removed.',
        data: {
          userId: id,
          userName: `${user.first_name} ${user.last_name}`,
          deletedAt: new Date().toISOString(),
          deletionType: 'hard'
        }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Error hard deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to hard delete user account',
      error: error.message
    });
  } finally {
    client.release();
  }
};

/**
 * Restore a soft-deleted user account
 * PUT /api/users/:id/restore
 */
const restoreUser = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const performedBy = req.user.id;

    // Check if user exists and is soft-deleted
    const userCheck = await client.query(
      `SELECT id, first_name, last_name, role, is_deleted, deletion_type 
       FROM users WHERE id = $1`,
      [id]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userCheck.rows[0];

    if (!user.is_deleted) {
      return res.status(400).json({
        success: false,
        message: 'User account is not deleted'
      });
    }

    if (user.deletion_type !== 'soft') {
      return res.status(400).json({
        success: false,
        message: 'Cannot restore hard-deleted accounts'
      });
    }

    // Restore the user account
    await client.query(
      `UPDATE users 
       SET is_deleted = false, 
           deleted_by = NULL, 
           deleted_at = NULL,
           deletion_type = NULL
       WHERE id = $1`,
      [id]
    );

    // Log the action in audit trail
    await client.query(
      `INSERT INTO user_management_audit (user_id, action, performed_by, reason, details)
       VALUES ($1, 'restore', $2, $3, $4)`,
      [id, performedBy, 'Account restored', JSON.stringify({
        userName: `${user.first_name} ${user.last_name}`,
        userRole: user.role,
        timestamp: new Date().toISOString()
      })]
    );

    // Log activity
    await logActivity(
      performedBy,
      'USER_RESTORED',
      `Restored user: ${user.first_name} ${user.last_name} (ID: ${id})`,
      { userId: id }
    );

    res.status(200).json({
      success: true,
      message: 'User account restored successfully',
      data: {
        userId: id,
        userName: `${user.first_name} ${user.last_name}`,
        restoredAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error restoring user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to restore user account',
      error: error.message
    });
  } finally {
    client.release();
  }
};

/**
 * Get all soft-deleted users with their data
 * GET /api/users/deleted
 */
const getDeletedUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // Get soft-deleted users
    const result = await pool.query(
      `SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        u.role,
        u.is_locked,
        u.lock_reason,
        u.deleted_at,
        u.deletion_type,
        admin.first_name as deleted_by_name,
        admin.last_name as deleted_by_last_name,
        COUNT(DISTINCT o.id) as total_orders,
        COUNT(DISTINCT m.id) as total_messages,
        COUNT(DISTINCT n.id) as total_notifications
       FROM users u
       LEFT JOIN users admin ON u.deleted_by = admin.id
       LEFT JOIN orders o ON u.id = o.user_id
       LEFT JOIN messages m ON (u.id = m.sender_id OR u.id = m.receiver_id)
       LEFT JOIN notifications n ON u.id = n.user_id
       WHERE u.is_deleted = true AND u.deletion_type = 'soft'
       GROUP BY u.id, admin.first_name, admin.last_name
       ORDER BY u.deleted_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    // Get total count
    const countResult = await pool.query(
      'SELECT COUNT(*) as total FROM users WHERE is_deleted = true AND deletion_type = $1',
      ['soft']
    );

    res.status(200).json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].total),
        pages: Math.ceil(countResult.rows[0].total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching deleted users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch deleted users',
      error: error.message
    });
  }
};

/**
 * Get user activity history (for soft-deleted users)
 * GET /api/users/:id/activity
 */
const getUserActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    // Get user info
    const userResult = await pool.query(
      'SELECT id, first_name, last_name, email, role, is_deleted FROM users WHERE id = $1',
      [id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userResult.rows[0];

    // Get orders
    const ordersResult = await pool.query(
      `SELECT id, product_name, quantity, total_amount, status, created_at 
       FROM orders WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [id, limit, offset]
    );

    // Get messages
    const messagesResult = await pool.query(
      `SELECT id, message, sender_id, receiver_id, created_at 
       FROM messages 
       WHERE sender_id = $1 OR receiver_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [id, limit, offset]
    );

    // Get notifications
    const notificationsResult = await pool.query(
      `SELECT id, title, message, type, created_at 
       FROM notifications 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [id, limit, offset]
    );

    // Get audit logs
    const auditResult = await pool.query(
      `SELECT id, action, performed_by, reason, created_at 
       FROM user_management_audit 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [id, limit, offset]
    );

    res.status(200).json({
      success: true,
      data: {
        user,
        orders: ordersResult.rows,
        messages: messagesResult.rows,
        notifications: notificationsResult.rows,
        auditLogs: auditResult.rows
      }
    });

  } catch (error) {
    console.error('Error fetching user activity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user activity',
      error: error.message
    });
  }
};

/**
 * Check if user account is locked (for login)
 * GET /api/users/:id/status
 */
const checkUserStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT id, is_locked, lock_reason, is_deleted, deletion_type 
       FROM users WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = result.rows[0];

    res.status(200).json({
      success: true,
      data: {
        isLocked: user.is_locked,
        lockReason: user.lock_reason,
        isDeleted: user.is_deleted,
        deletionType: user.deletion_type
      }
    });

  } catch (error) {
    console.error('Error checking user status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check user status',
      error: error.message
    });
  }
};

module.exports = {
  lockUser,
  unlockUser,
  softDeleteUser,
  hardDeleteUser,
  restoreUser,
  getDeletedUsers,
  getUserActivity,
  checkUserStatus
};

