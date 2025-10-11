// src/routes/targetPerformanceRoutes.js
// API routes for target-based performance analysis

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const targetBasedPerformanceService = require('../services/targetBasedPerformanceService');

/**
 * Get all users performance with filters
 * GET /api/target-performance/all
 */
router.get('/all', verifyToken, async (req, res) => {
  try {
    const {
      period = 'monthly',
      location = null,
      targetType = null,
      performanceRange = 'all',
      role = null
    } = req.query;

    console.log('📊 Getting target-based performance with filters:', {
      period,
      location,
      targetType,
      performanceRange,
      role
    });

    const result = await targetBasedPerformanceService.getAllUsersPerformance({
      period,
      location,
      targetType,
      performanceRange,
      role
    });

    res.json(result);

  } catch (error) {
    console.error('❌ Error getting target-based performance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get target-based performance',
      error: error.message
    });
  }
});

/**
 * Get specific user's performance
 * GET /api/target-performance/user/:userId
 */
router.get('/user/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;

    // Default to current month if no dates provided
    const now = new Date();
    const defaultStartDate = startDate || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const defaultEndDate = endDate || new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    console.log(`📊 Getting performance for user ${userId} from ${defaultStartDate} to ${defaultEndDate}`);

    const result = await targetBasedPerformanceService.calculateUserPerformance(
      userId,
      defaultStartDate,
      defaultEndDate
    );

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('❌ Error getting user performance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user performance',
      error: error.message
    });
  }
});

/**
 * Get user's current targets for dashboard widget
 * GET /api/target-performance/my-targets
 */
router.get('/my-targets', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    console.log(`🎯 Getting targets for user ${userId}`);

    const result = await targetBasedPerformanceService.getUserTargets(userId);

    res.json(result);

  } catch (error) {
    console.error('❌ Error getting user targets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user targets',
      error: error.message
    });
  }
});

/**
 * Get performance statistics summary
 * GET /api/target-performance/stats
 */
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const {
      period = 'monthly',
      location = null,
      role = null
    } = req.query;

    console.log('📊 Getting performance statistics:', { period, location, role });

    const result = await targetBasedPerformanceService.getAllUsersPerformance({
      period,
      location,
      targetType: null,
      performanceRange: 'all',
      role
    });

    // Calculate statistics
    const performances = result.data.map(user => user.performance.overall);
    
    const stats = {
      total_users: performances.length,
      average_performance: performances.length > 0 ? performances.reduce((a, b) => a + b, 0) / performances.length : 0,
      top_performers: performances.filter(p => p >= 90).length,
      good_performers: performances.filter(p => p >= 70 && p < 90).length,
      average_performers: performances.filter(p => p >= 50 && p < 70).length,
      below_target: performances.filter(p => p < 50).length,
      achieved_targets: performances.filter(p => p >= 100).length
    };

    res.json({
      success: true,
      data: stats,
      filters: {
        period,
        location,
        role
      }
    });

  } catch (error) {
    console.error('❌ Error getting performance statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get performance statistics',
      error: error.message
    });
  }
});

module.exports = router;
