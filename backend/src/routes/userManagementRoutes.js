const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
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

console.log('✅ userManagementRoutes.js loaded');
console.log('🔍 verifyRole type:', typeof verifyRole);
console.log('🔍 lockUser type:', typeof lockUser);
console.log('🔍 authenticateToken type:', typeof authenticateToken);

/**
 * User Management Routes
 * All routes require MasterAdmin role
 */

// Lock user account
router.put('/:id/lock', verifyToken, verifyRole(['MasterAdmin']), lockUser);

// Unlock user account
router.put('/:id/unlock', verifyToken, verifyRole(['MasterAdmin']), unlockUser);

// Soft delete user account (preserve data)
router.delete('/:id/soft', verifyToken, verifyRole(['MasterAdmin']), softDeleteUser);

// Hard delete user account (permanent deletion)
router.delete('/:id/hard', verifyToken, verifyRole(['MasterAdmin']), hardDeleteUser);

// Restore soft-deleted user account
router.put('/:id/restore', verifyToken, verifyRole(['MasterAdmin']), restoreUser);

// Get all soft-deleted users
router.get('/deleted', verifyToken, verifyRole(['MasterAdmin']), getDeletedUsers);

// Get user activity history (for soft-deleted users)
router.get('/:id/activity', verifyToken, verifyRole(['MasterAdmin']), getUserActivity);

// Check user status (locked/deleted)
router.get('/:id/status', verifyToken, verifyRole(['MasterAdmin']), checkUserStatus);

module.exports = router;

