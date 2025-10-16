const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/authMiddleware');
const { verifyRole } = require('../middlewares/roleMiddleware');
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
router.put('/:id/lock', authenticateToken, verifyRole(['MasterAdmin']), lockUser);

// Unlock user account
router.put('/:id/unlock', authenticateToken, verifyRole(['MasterAdmin']), unlockUser);

// Soft delete user account (preserve data)
router.delete('/:id/soft', authenticateToken, verifyRole(['MasterAdmin']), softDeleteUser);

// Hard delete user account (permanent deletion)
router.delete('/:id/hard', authenticateToken, verifyRole(['MasterAdmin']), hardDeleteUser);

// Restore soft-deleted user account
router.put('/:id/restore', authenticateToken, verifyRole(['MasterAdmin']), restoreUser);

// Get all soft-deleted users
router.get('/deleted', authenticateToken, verifyRole(['MasterAdmin']), getDeletedUsers);

// Get user activity history (for soft-deleted users)
router.get('/:id/activity', authenticateToken, verifyRole(['MasterAdmin']), getUserActivity);

// Check user status (locked/deleted)
router.get('/:id/status', authenticateToken, verifyRole(['MasterAdmin']), checkUserStatus);

module.exports = router;

