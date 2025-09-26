// src/controllers/targetManagementController.js
// Controller for managing targets with Master Admin control

const targetManagementService = require('../services/targetManagementService');
const { logger } = require('../utils/logger');

/**
 * Get all target types
 */
const getTargetTypes = async (req, res) => {
  try {
    const targetTypes = await targetManagementService.getTargetTypes();
    
    res.json({
      success: true,
      data: targetTypes
    });
  } catch (error) {
    logger.error('Error getting target types:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get target types',
      error: error.message
    });
  }
};

/**
 * Get targets for a specific user
 */
const getUserTargets = async (req, res) => {
  try {
    const { userId } = req.params;
    const { periodType } = req.query;
    
    const targets = await targetManagementService.getUserTargets(userId, periodType);
    
    res.json({
      success: true,
      data: targets
    });
  } catch (error) {
    logger.error('Error getting user targets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user targets',
      error: error.message
    });
  }
};

/**
 * Get all targets with optional filters
 */
const getAllTargets = async (req, res) => {
  try {
    const { userRole, periodType, targetType } = req.query;
    
    const filters = {};
    if (userRole) filters.userRole = userRole;
    if (periodType) filters.periodType = periodType;
    if (targetType) filters.targetType = targetType;
    
    const targets = await targetManagementService.getAllTargets(filters);
    
    res.json({
      success: true,
      data: targets
    });
  } catch (error) {
    logger.error('Error getting all targets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get targets',
      error: error.message
    });
  }
};

/**
 * Create a new target
 */
const createTarget = async (req, res) => {
  try {
    const { userId, targetTypeId, targetValue, periodType, periodStart, periodEnd, notes } = req.body;
    const createdBy = req.user.unique_id;
    
    // Validate required fields
    if (!userId || !targetTypeId || !targetValue || !periodType || !periodStart || !periodEnd) {
      return res.status(400).json({
        success: false,
        message: 'userId, targetTypeId, targetValue, periodType, periodStart, and periodEnd are required'
      });
    }
    
    // Validate period type
    if (!['daily', 'weekly', 'monthly', 'quarterly', 'yearly'].includes(periodType)) {
      return res.status(400).json({
        success: false,
        message: 'periodType must be one of: daily, weekly, monthly, quarterly, yearly'
      });
    }
    
    // Validate target value
    if (targetValue <= 0) {
      return res.status(400).json({
        success: false,
        message: 'targetValue must be greater than 0'
      });
    }
    
    const target = await targetManagementService.createTarget({
      userId,
      targetTypeId,
      targetValue,
      periodType,
      periodStart,
      periodEnd,
      createdBy,
      notes
    });
    
    res.status(201).json({
      success: true,
      message: 'Target created successfully',
      data: target
    });
  } catch (error) {
    logger.error('Error creating target:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create target',
      error: error.message
    });
  }
};

/**
 * Update an existing target
 */
const updateTarget = async (req, res) => {
  try {
    const { targetId } = req.params;
    const { targetValue, periodStart, periodEnd, notes } = req.body;
    
    const target = await targetManagementService.updateTarget(targetId, {
      targetValue,
      periodStart,
      periodEnd,
      notes
    });
    
    res.json({
      success: true,
      message: 'Target updated successfully',
      data: target
    });
  } catch (error) {
    logger.error('Error updating target:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update target',
      error: error.message
    });
  }
};

/**
 * Deactivate a target
 */
const deactivateTarget = async (req, res) => {
  try {
    const { targetId } = req.params;
    
    const target = await targetManagementService.deactivateTarget(targetId);
    
    res.json({
      success: true,
      message: 'Target deactivated successfully',
      data: target
    });
  } catch (error) {
    logger.error('Error deactivating target:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate target',
      error: error.message
    });
  }
};

/**
 * Bulk create targets
 */
const bulkCreateTargets = async (req, res) => {
  try {
    const { targets } = req.body;
    const createdBy = req.user.unique_id;
    
    // Validate targets array
    if (!targets || !Array.isArray(targets) || targets.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'targets must be a non-empty array'
      });
    }
    
    // Add createdBy to each target
    const targetsWithCreator = targets.map(target => ({
      ...target,
      createdBy
    }));
    
    const createdTargets = await targetManagementService.bulkCreateTargets(targetsWithCreator);
    
    res.status(201).json({
      success: true,
      message: `${createdTargets.length} targets created successfully`,
      data: createdTargets
    });
  } catch (error) {
    logger.error('Error bulk creating targets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk create targets',
      error: error.message
    });
  }
};

/**
 * Get target history
 */
const getTargetHistory = async (req, res) => {
  try {
    const { targetId } = req.params;
    
    const history = await targetManagementService.getTargetHistory(targetId);
    
    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    logger.error('Error getting target history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get target history',
      error: error.message
    });
  }
};

/**
 * Get targets by period
 */
const getTargetsByPeriod = async (req, res) => {
  try {
    const { periodType, periodStart, periodEnd } = req.query;
    
    if (!periodType || !periodStart || !periodEnd) {
      return res.status(400).json({
        success: false,
        message: 'periodType, periodStart, and periodEnd are required'
      });
    }
    
    const targets = await targetManagementService.getTargetsByPeriod(periodType, periodStart, periodEnd);
    
    res.json({
      success: true,
      data: targets
    });
  } catch (error) {
    logger.error('Error getting targets by period:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get targets by period',
      error: error.message
    });
  }
};

/**
 * Get target statistics
 */
const getTargetStats = async (req, res) => {
  try {
    const stats = await targetManagementService.getTargetStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error getting target stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get target statistics',
      error: error.message
    });
  }
};

/**
 * Get users without targets
 */
const getUsersWithoutTargets = async (req, res) => {
  try {
    const { role } = req.query;
    
    const users = await targetManagementService.getUsersWithoutTargets(role);
    
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    logger.error('Error getting users without targets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get users without targets',
      error: error.message
    });
  }
};

module.exports = {
  getTargetTypes,
  getUserTargets,
  getAllTargets,
  createTarget,
  updateTarget,
  deactivateTarget,
  bulkCreateTargets,
  getTargetHistory,
  getTargetsByPeriod,
  getTargetStats,
  getUsersWithoutTargets
};
