// src/controllers/performanceController.js
// Enhanced controller for performance metrics with user assignments

const performanceCalculationService = require('../services/performanceCalculationService');
const { logger } = require('../utils/logger');

/**
 * Get performance overview for all roles - with timeout protection
 */
const getPerformanceOverview = async (req, res) => {
  // Set a timeout to prevent hanging
  const timeout = setTimeout(() => {
    if (!res.headersSent) {
      res.status(408).json({
        success: false,
        message: 'Performance data request timed out. Please try again.',
        error: 'Request timeout'
      });
    }
  }, 15000); // 15 second timeout

  try {
    console.log('🚀 Performance overview request started');
    const startTime = Date.now();
    
    const performanceData = await performanceCalculationService.getPerformanceSummary();
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    console.log(`✅ Performance overview completed in ${duration}ms`);
    
    clearTimeout(timeout);
    
    if (!res.headersSent) {
      res.json({
        success: true,
        message: "Performance overview retrieved successfully",
        data: performanceData,
        meta: {
          processingTime: duration,
          timestamp: new Date().toISOString()
        }
      });
    }
  } catch (error) {
    clearTimeout(timeout);
    logger.error('Error getting performance overview:', error);
    
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Failed to get performance overview',
        error: error.message,
        fallback: true
      });
    }
  }
};

/**
 * Get performance for a specific marketer
 */
const getMarketerPerformance = async (req, res) => {
  try {
    const { marketerId } = req.params;
    const performance = await performanceCalculationService.calculateMarketerPerformance(marketerId);
    
    res.json({
      success: true,
      data: performance
    });
  } catch (error) {
    logger.error('Error getting marketer performance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get marketer performance',
      error: error.message
    });
  }
};

/**
 * Get performance for a specific admin
 */
const getAdminPerformance = async (req, res) => {
  try {
    const { adminId } = req.params;
    const performance = await performanceCalculationService.calculateAdminPerformance(adminId);
    
    res.json({
      success: true,
      data: performance
    });
  } catch (error) {
    logger.error('Error getting admin performance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get admin performance',
      error: error.message
    });
  }
};

/**
 * Get performance for a specific superadmin
 */
const getSuperAdminPerformance = async (req, res) => {
  try {
    const { superAdminId } = req.params;
    const performance = await performanceCalculationService.calculateSuperAdminPerformance(superAdminId);
    
    res.json({
      success: true,
      data: performance
    });
  } catch (error) {
    logger.error('Error getting superadmin performance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get superadmin performance',
      error: error.message
    });
  }
};

module.exports = {
  getPerformanceOverview,
  getMarketerPerformance,
  getAdminPerformance,
  getSuperAdminPerformance
};
