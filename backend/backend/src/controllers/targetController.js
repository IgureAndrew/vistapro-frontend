// src/controllers/targetController.js
// Controller for marketer target management

const targetService = require('../services/targetService');

/**
 * Get all active targets for all marketers
 */
async function getAllTargets(req, res, next) {
  try {
    const targets = await targetService.getAllActiveTargets();
    res.json({
      success: true,
      data: targets
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get targets for a specific marketer
 */
async function getMarketerTargets(req, res, next) {
  try {
    const { marketerId } = req.params;
    const targets = await targetService.getMarketerTargets(marketerId);
    res.json({
      success: true,
      data: targets
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new target for a marketer
 */
async function createTarget(req, res, next) {
  try {
    const { marketerId, targetType, metricType, targetValue, periodStart, periodEnd } = req.body;
    
    // Validate required fields
    if (!marketerId || !targetType || !metricType || !targetValue || !periodStart || !periodEnd) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }
    
    // Validate target type
    if (!['weekly', 'monthly'].includes(targetType)) {
      return res.status(400).json({
        success: false,
        message: 'Target type must be weekly or monthly'
      });
    }
    
    // Validate metric type
    if (!['orders', 'sales', 'customers'].includes(metricType)) {
      return res.status(400).json({
        success: false,
        message: 'Metric type must be orders, sales, or customers'
      });
    }
    
    // Validate target value
    if (targetValue <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Target value must be greater than 0'
      });
    }
    
    const target = await targetService.createMarketerTarget({
      marketerId,
      targetType,
      metricType,
      targetValue,
      periodStart,
      periodEnd
    });
    
    res.status(201).json({
      success: true,
      message: 'Target created successfully',
      data: target
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update an existing target
 */
async function updateTarget(req, res, next) {
  try {
    const { targetId } = req.params;
    const { targetValue, periodStart, periodEnd, isActive } = req.body;
    
    const target = await targetService.updateMarketerTarget(targetId, {
      targetValue,
      periodStart,
      periodEnd,
      isActive
    });
    
    if (!target) {
      return res.status(404).json({
        success: false,
        message: 'Target not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Target updated successfully',
      data: target
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Deactivate a target
 */
async function deactivateTarget(req, res, next) {
  try {
    const { targetId } = req.params;
    
    const target = await targetService.deactivateMarketerTarget(targetId);
    
    if (!target) {
      return res.status(404).json({
        success: false,
        message: 'Target not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Target deactivated successfully',
      data: target
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get performance data for a specific marketer
 */
async function getMarketerPerformance(req, res, next) {
  try {
    const { marketerId } = req.params;
    const performance = await targetService.getMarketerPerformance(marketerId);
    
    res.json({
      success: true,
      data: performance
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get performance data for all marketers
 */
async function getAllMarketersPerformance(req, res, next) {
  try {
    const performance = await targetService.getAllMarketersPerformance();
    
    res.json({
      success: true,
      data: performance
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get performance summary statistics
 */
async function getPerformanceSummary(req, res, next) {
  try {
    const summary = await targetService.getPerformanceSummary();
    
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllTargets,
  getMarketerTargets,
  createTarget,
  updateTarget,
  deactivateTarget,
  getMarketerPerformance,
  getAllMarketersPerformance,
  getPerformanceSummary
};
