// src/routes/assignmentRoutes.js
// Routes for user assignment management

const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { verifyRole } = require('../middlewares/roleMiddleware');

// Apply authentication to all routes
router.use(verifyToken);

// Get assignments for a specific user
router.get('/user/:userId', assignmentController.getAssignmentsByUser);

// Get marketers assigned to a specific admin/superadmin
router.get('/assigned/:userId', verifyRole(['MasterAdmin', 'Admin', 'SuperAdmin']), assignmentController.getAssignedMarketers);

// Get the admin/superadmin assigned to a specific marketer
router.get('/marketer/:marketerId', assignmentController.getMarketerAssignment);

// Get unassigned marketers (Master Admin only)
router.get('/unassigned', verifyRole(['MasterAdmin']), assignmentController.getUnassignedMarketers);

// Get available assignees (Master Admin only)
router.get('/assignees', verifyRole(['MasterAdmin']), assignmentController.getAvailableAssignees);

// Get assignment statistics (Master Admin only)
router.get('/stats', verifyRole(['MasterAdmin', 'Admin', 'SuperAdmin']), assignmentController.getAssignmentStats);

// Get current assignments with hierarchical structure (Master Admin only)
router.get('/current', verifyRole(['MasterAdmin']), assignmentController.getCurrentAssignments);

// Get all available locations (Master Admin only)
router.get('/locations', verifyRole(['MasterAdmin']), assignmentController.getAllLocations);

// Get users by location for reassignment (Master Admin only)
router.get('/location/:location', verifyRole(['MasterAdmin']), assignmentController.getUsersByLocation);

// Assign a marketer to an admin/superadmin (Master Admin only)
router.post('/assign', verifyRole(['MasterAdmin']), assignmentController.assignMarketer);

// Reassign a marketer to a different admin (Master Admin only)
router.post('/reassign/marketer', verifyRole(['MasterAdmin']), assignmentController.reassignMarketer);

// Reassign an admin to a different superadmin (Master Admin only)
router.post('/reassign/admin', verifyRole(['MasterAdmin']), assignmentController.reassignAdmin);

// Bulk assign marketers (Master Admin only)
router.post('/bulk-assign', verifyRole(['MasterAdmin']), assignmentController.bulkAssignMarketers);

// Update an assignment (Master Admin only)
router.put('/:assignmentId', verifyRole(['MasterAdmin']), assignmentController.updateAssignment);

// Deactivate an assignment (Master Admin only)
router.delete('/:assignmentId', verifyRole(['MasterAdmin']), assignmentController.deactivateAssignment);

module.exports = router;