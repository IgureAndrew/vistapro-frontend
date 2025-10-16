const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');
const {
  lockUser,
  unlockUser,
  softDeleteUser,
  hardDeleteUser,
  restoreUser,
  getDeletedUsers,
  getUserActivity,
  checkUserStatus
} = require('../controllers/userManagementController');

/**
 * User Management Routes
 * All routes require MasterAdmin role
 */

// Lock user account
router.put('/:id/lock', authenticateToken, requireRole(['MasterAdmin']), lockUser);

// Unlock user account
router.put('/:id/unlock', authenticateToken, requireRole(['MasterAdmin']), unlockUser);

// Soft delete user account (preserve data)
router.delete('/:id/soft', authenticateToken, requireRole(['MasterAdmin']), softDeleteUser);

// Hard delete user account (permanent deletion)
router.delete('/:id/hard', authenticateToken, requireRole(['MasterAdmin']), hardDeleteUser);

// Restore soft-deleted user account
router.put('/:id/restore', authenticateToken, requireRole(['MasterAdmin']), restoreUser);

// Get all soft-deleted users
router.get('/deleted', authenticateToken, requireRole(['MasterAdmin']), getDeletedUsers);

// Get user activity history (for soft-deleted users)
router.get('/:id/activity', authenticateToken, requireRole(['MasterAdmin']), getUserActivity);

// Check user status (locked/deleted)
router.get('/:id/status', authenticateToken, requireRole(['MasterAdmin']), checkUserStatus);

module.exports = router;

