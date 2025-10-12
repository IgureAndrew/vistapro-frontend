// src/controllers/assignmentController.js
// Controller for managing user assignments

const assignmentService = require('../services/assignmentService');
const { logger } = require('../utils/logger');

/**
 * Get all assignments for a specific user
 */
const getAssignmentsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const assignments = await assignmentService.getAssignedMarketers(userId);
    
    res.json({
      success: true,
      data: assignments
    });
  } catch (error) {
    logger.error('Error getting assignments by user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get assignments',
      error: error.message
    });
  }
};

/**
 * Get all marketers assigned to a specific admin/superadmin
 */
const getAssignedMarketers = async (req, res) => {
  try {
    const { userId } = req.params;
    const userRole = req.user.role;
    const currentUserId = req.user.unique_id;
    
    // Security check: Users can only access their own assigned marketers
    // unless they are MasterAdmin
    if (userRole !== 'MasterAdmin' && userId !== currentUserId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only view your own assigned marketers'
      });
    }
    
    const marketers = await assignmentService.getAssignedMarketers(userId);
    
    res.json({
      success: true,
      data: marketers
    });
  } catch (error) {
    logger.error('Error getting assigned marketers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get assigned marketers',
      error: error.message
    });
  }
};

/**
 * Get the admin/superadmin assigned to a specific marketer
 */
const getMarketerAssignment = async (req, res) => {
  try {
    const { marketerId } = req.params;
    const assignment = await assignmentService.getMarketerAssignment(marketerId);
    
    res.json({
      success: true,
      data: assignment
    });
  } catch (error) {
    logger.error('Error getting marketer assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get marketer assignment',
      error: error.message
    });
  }
};

/**
 * Assign a marketer to an admin/superadmin
 */
const assignMarketer = async (req, res) => {
  try {
    const { marketerId, assignedToId, assignmentType } = req.body;
    
    // Validate required fields
    if (!marketerId || !assignedToId || !assignmentType) {
      return res.status(400).json({
        success: false,
        message: 'marketerId, assignedToId, and assignmentType are required'
      });
    }
    
    // Validate assignment type
    if (!['marketer_to_admin', 'admin_to_superadmin'].includes(assignmentType)) {
      return res.status(400).json({
        success: false,
        message: 'assignmentType must be either "marketer_to_admin" or "admin_to_superadmin"'
      });
    }
    
    let assignment;
    if (assignmentType === 'marketer_to_admin') {
      assignment = await assignmentService.assignMarketerToAdmin(marketerId, assignedToId);
    } else if (assignmentType === 'admin_to_superadmin') {
      assignment = await assignmentService.assignAdminToSuperAdmin(marketerId, assignedToId);
    }
    
    res.status(201).json({
      success: true,
      message: 'Assignment created successfully',
      data: assignment
    });
  } catch (error) {
    logger.error('Error assigning marketer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign marketer',
      error: error.message
    });
  }
};

/**
 * Update an assignment
 */
const updateAssignment = async (req, res) => {
  try {
    // Since we're using direct column updates, we need to unassign and reassign
    const { assignmentId } = req.params;
    const { assignedToId, assignmentType } = req.body;
    
    // For now, return an error since we don't have assignment IDs in the new system
    res.status(400).json({
      success: false,
      message: 'Assignment updates should be done through unassign/assign operations'
    });
  } catch (error) {
    logger.error('Error updating assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update assignment',
      error: error.message
    });
  }
};

/**
 * Deactivate an assignment
 */
const deactivateAssignment = async (req, res) => {
  try {
    // Since we're using direct column updates, we need to unassign
    const { assignmentId } = req.params;
    
    // For now, return an error since we don't have assignment IDs in the new system
    res.status(400).json({
      success: false,
      message: 'Assignment deactivation should be done through unassign operations'
    });
  } catch (error) {
    logger.error('Error deactivating assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate assignment',
      error: error.message
    });
  }
};

/**
 * Get all unassigned marketers
 */
const getUnassignedMarketers = async (req, res) => {
  try {
    const marketers = await assignmentService.getUnassignedMarketers();
    
    res.json({
      success: true,
      data: marketers
    });
  } catch (error) {
    logger.error('Error getting unassigned marketers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unassigned marketers',
      error: error.message
    });
  }
};

/**
 * Get all available assignees (admins and superadmins)
 */
const getAvailableAssignees = async (req, res) => {
  try {
    const assignees = await assignmentService.getAvailableAssignees();
    
    res.json({
      success: true,
      data: assignees
    });
  } catch (error) {
    logger.error('Error getting available assignees:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get available assignees',
      error: error.message
    });
  }
};

/**
 * Get assignment statistics
 */
const getAssignmentStats = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user.unique_id;
    
    let stats;
    
    if (userRole === 'MasterAdmin') {
      // MasterAdmin gets global statistics
      stats = await assignmentService.getAssignmentStats();
    } else if (userRole === 'Admin' || userRole === 'SuperAdmin') {
      // Admin/SuperAdmin get their own assignment statistics
      const assignedMarketers = await assignmentService.getAssignedMarketers(userId);
      stats = {
        totalMarketers: assignedMarketers.length,
        assignedMarketers: assignedMarketers.length,
        unassignedMarketers: 0,
        activeAssignees: 1,
        marketers: {
          total: assignedMarketers.length,
          assigned: assignedMarketers.length,
          unassigned: 0
        },
        admins: {
          total: 0,
          assigned: 0,
          unassigned: 0
        }
      };
    } else {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error getting assignment stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get assignment statistics',
      error: error.message
    });
  }
};

const getCurrentAssignments = async (req, res) => {
  try {
    const assignments = await assignmentService.getCurrentAssignments();
    
    res.json({
      success: true,
      data: assignments
    });
  } catch (error) {
    logger.error('Error getting current assignments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get current assignments',
      error: error.message
    });
  }
};

/**
 * Bulk assign marketers
 */
const bulkAssignMarketers = async (req, res) => {
  try {
    const { marketerIds, assignedToId, assignmentType } = req.body;
    
    // Validate required fields
    if (!marketerIds || !Array.isArray(marketerIds) || marketerIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'marketerIds must be a non-empty array'
      });
    }
    
    if (!assignedToId || !assignmentType) {
      return res.status(400).json({
        success: false,
        message: 'assignedToId and assignmentType are required'
      });
    }
    
    // Validate assignment type
    if (!['marketer_to_admin', 'admin_to_superadmin'].includes(assignmentType)) {
      return res.status(400).json({
        success: false,
        message: 'assignmentType must be either "marketer_to_admin" or "admin_to_superadmin"'
      });
    }
    
    const assignments = await assignmentService.bulkAssignMarketers({
      marketerIds,
      assignedToId,
      assignmentType
    });
    
    res.status(201).json({
      success: true,
      message: `${assignments.length} assignments created successfully`,
      data: assignments
    });
  } catch (error) {
    logger.error('Error bulk assigning marketers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk assign marketers',
      error: error.message
    });
  }
};

/**
 * Reassign a marketer to a different admin (Master Admin only)
 */
const reassignMarketer = async (req, res) => {
  try {
    const { marketerId, newAdminId } = req.body;
    
    // Validate required fields
    if (!marketerId || !newAdminId) {
      return res.status(400).json({
        success: false,
        message: 'marketerId and newAdminId are required'
      });
    }
    
    const result = await assignmentService.reassignMarketer(marketerId, newAdminId);
    
    res.json({
      success: true,
      message: result.message,
      data: result
    });
  } catch (error) {
    logger.error('Error reassigning marketer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reassign marketer',
      error: error.message
    });
  }
};

/**
 * Reassign an admin to a different superadmin (Master Admin only)
 */
const reassignAdmin = async (req, res) => {
  try {
    const { adminId, newSuperAdminId } = req.body;
    
    // Validate required fields
    if (!adminId || !newSuperAdminId) {
      return res.status(400).json({
        success: false,
        message: 'adminId and newSuperAdminId are required'
      });
    }
    
    const result = await assignmentService.reassignAdmin(adminId, newSuperAdminId);
    
    res.json({
      success: true,
      message: result.message,
      data: result
    });
  } catch (error) {
    logger.error('Error reassigning admin:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reassign admin',
      error: error.message
    });
  }
};

/**
 * Get all users by location for reassignment purposes
 */
const getUsersByLocation = async (req, res) => {
  try {
    const { location } = req.params;
    
    if (!location) {
      return res.status(400).json({
        success: false,
        message: 'Location parameter is required'
      });
    }
    
    const users = await assignmentService.getUsersByLocation(location);
    
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    logger.error('Error getting users by location:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get users by location',
      error: error.message
    });
  }
};

/**
 * Get all available locations
 */
const getAllLocations = async (req, res) => {
  try {
    const locations = await assignmentService.getAllLocations();
    
    res.json({
      success: true,
      data: locations
    });
  } catch (error) {
    logger.error('Error getting all locations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get locations',
      error: error.message
    });
  }
};

module.exports = {
  getAssignmentsByUser,
  getAssignedMarketers,
  getMarketerAssignment,
  assignMarketer,
  updateAssignment,
  deactivateAssignment,
  getUnassignedMarketers,
  getAvailableAssignees,
  getAssignmentStats,
  getCurrentAssignments,
  reassignMarketer,
  reassignAdmin,
  getUsersByLocation,
  getAllLocations,
  bulkAssignMarketers
};