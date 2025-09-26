// src/services/targetService.js
// Service for managing marketer targets and performance calculations

const { pool } = require('../config/database');

/**
 * Get all active targets for a specific marketer
 */
async function getMarketerTargets(marketerId) {
  const { rows } = await pool.query(`
    SELECT 
      id,
      marketer_id,
      target_type,
      metric_type,
      target_value,
      period_start,
      period_end,
      is_active,
      created_at,
      updated_at
    FROM marketer_targets
    WHERE marketer_id = $1 AND is_active = true
    ORDER BY target_type, metric_type, period_start DESC
  `, [marketerId]);
  
  return rows;
}

/**
 * Get all active targets for all marketers
 */
async function getAllActiveTargets() {
  const { rows } = await pool.query(`
    SELECT 
      mt.id,
      mt.marketer_id,
      u.first_name || ' ' || u.last_name AS marketer_name,
      mt.target_type,
      mt.metric_type,
      mt.target_value,
      mt.period_start,
      mt.period_end,
      mt.is_active,
      mt.created_at,
      mt.updated_at
    FROM marketer_targets mt
    JOIN users u ON u.unique_id = mt.marketer_id
    WHERE mt.is_active = true
    ORDER BY u.first_name, mt.target_type, mt.metric_type
  `);
  
  return rows;
}

/**
 * Create a new target for a marketer
 */
async function createMarketerTarget(targetData) {
  const { marketerId, targetType, metricType, targetValue, periodStart, periodEnd } = targetData;
  
  const { rows } = await pool.query(`
    INSERT INTO marketer_targets 
    (marketer_id, target_type, metric_type, target_value, period_start, period_end)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `, [marketerId, targetType, metricType, targetValue, periodStart, periodEnd]);
  
  return rows[0];
}

/**
 * Update an existing target
 */
async function updateMarketerTarget(targetId, updateData) {
  const { targetValue, periodStart, periodEnd, isActive } = updateData;
  
  const { rows } = await pool.query(`
    UPDATE marketer_targets 
    SET target_value = COALESCE($2, target_value),
        period_start = COALESCE($3, period_start),
        period_end = COALESCE($4, period_end),
        is_active = COALESCE($5, is_active),
        updated_at = NOW()
    WHERE id = $1
    RETURNING *
  `, [targetId, targetValue, periodStart, periodEnd, isActive]);
  
  return rows[0];
}

/**
 * Deactivate a target (soft delete)
 */
async function deactivateMarketerTarget(targetId) {
  const { rows } = await pool.query(`
    UPDATE marketer_targets 
    SET is_active = false, updated_at = NOW()
    WHERE id = $1
    RETURNING *
  `, [targetId]);
  
  return rows[0];
}

/**
 * Get marketer performance data based on targets
 */
async function getMarketerPerformance(marketerId) {
  // Get current targets
  const targets = await getMarketerTargets(marketerId);
  
  // Get the numeric user ID for the orders table
  const { rows: userData } = await pool.query(`
    SELECT id FROM users WHERE unique_id = $1
  `, [marketerId]);
  
  if (userData.length === 0) {
    throw new Error('User not found');
  }
  
  const userId = userData[0].id;
  
  // Get actual performance data
  const now = new Date();
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  
  // Get orders completed this week
  const { rows: weeklyOrders } = await pool.query(`
    SELECT COUNT(*) as count, COALESCE(SUM(sold_amount), 0) as total_sales
    FROM orders 
    WHERE marketer_id = $1 
      AND status = 'released_confirmed'
      AND sale_date >= $2::date
  `, [userId, weekStart.toISOString().split('T')[0]]);
  
  // Get orders completed this month
  const { rows: monthlyOrders } = await pool.query(`
    SELECT COUNT(*) as count, COALESCE(SUM(sold_amount), 0) as total_sales
    FROM orders 
    WHERE marketer_id = $1 
      AND status = 'released_confirmed'
      AND sale_date >= $2::date
  `, [userId, monthStart.toISOString().split('T')[0]]);
  
  // Get total orders and sales for success rate calculation
  const { rows: totalOrders } = await pool.query(`
    SELECT 
      COUNT(*) as total_orders,
      COUNT(*) FILTER (WHERE status = 'released_confirmed') as completed_orders,
      COALESCE(SUM(sold_amount) FILTER (WHERE status = 'released_confirmed'), 0) as total_sales
    FROM orders 
    WHERE marketer_id = $1
  `, [userId]);
  
  const weeklyData = weeklyOrders[0];
  const monthlyData = monthlyOrders[0];
  const totalData = totalOrders[0];
  
  // Calculate performance scores
  const weeklyTarget = targets.find(t => t.target_type === 'weekly' && t.metric_type === 'orders');
  const monthlyTarget = targets.find(t => t.target_type === 'monthly' && t.metric_type === 'orders');
  
  const weeklyPerformance = weeklyTarget ? 
    Math.min(100, Math.round((parseInt(weeklyData.count) / weeklyTarget.target_value) * 100)) : 0;
  
  const monthlyPerformance = monthlyTarget ? 
    Math.min(100, Math.round((parseInt(monthlyData.count) / monthlyTarget.target_value) * 100)) : 0;
  
  const successRate = totalData.total_orders > 0 ? 
    Math.round((parseInt(totalData.completed_orders) / parseInt(totalData.total_orders)) * 100) : 0;
  
  // Overall performance is average of weekly and monthly
  const overallPerformance = Math.round((weeklyPerformance + monthlyPerformance) / 2);
  
  return {
    marketerId,
    targets,
    performance: {
      weekly: {
        orders: parseInt(weeklyData.count),
        sales: parseFloat(weeklyData.total_sales),
        target: weeklyTarget?.target_value || 0,
        performance: weeklyPerformance
      },
      monthly: {
        orders: parseInt(monthlyData.count),
        sales: parseFloat(monthlyData.total_sales),
        target: monthlyTarget?.target_value || 0,
        performance: monthlyPerformance
      },
      overall: {
        performance: overallPerformance,
        successRate: successRate,
        totalOrders: parseInt(totalData.total_orders),
        totalSales: parseFloat(totalData.total_sales)
      }
    }
  };
}

/**
 * Get performance data for all marketers
 */
async function getAllMarketersPerformance() {
  // Get all marketers
  const { rows: marketers } = await pool.query(`
    SELECT u.unique_id, u.first_name, u.last_name, u.role
    FROM users u
    WHERE u.role = 'Marketer'
    ORDER BY u.first_name, u.last_name
  `);
  
  const performanceData = [];
  
  for (const marketer of marketers) {
    const performance = await getMarketerPerformance(marketer.unique_id);
    performanceData.push({
      ...marketer,
      name: `${marketer.first_name} ${marketer.last_name}`,
      performance: performance.performance
    });
  }
  
  // Sort by overall performance (highest first)
  performanceData.sort((a, b) => b.performance.overall.performance - a.performance.overall.performance);
  
  return performanceData;
}

/**
 * Get performance summary statistics
 */
async function getPerformanceSummary() {
  const { rows: summary } = await pool.query(`
    SELECT 
      COUNT(DISTINCT u.unique_id) as total_marketers,
      COUNT(DISTINCT o.marketer_id) as active_marketers,
      COUNT(o.id) as total_orders,
      COALESCE(SUM(o.sold_amount), 0) as total_sales,
      COUNT(o.id) FILTER (WHERE o.status = 'released_confirmed') as completed_orders,
      COALESCE(SUM(o.sold_amount) FILTER (WHERE o.status = 'released_confirmed'), 0) as completed_sales
    FROM users u
    LEFT JOIN orders o ON o.marketer_id = u.id
    WHERE u.role = 'Marketer'
  `);
  
  const data = summary[0];
  const completionRate = data.total_orders > 0 ? 
    Math.round((parseInt(data.completed_orders) / parseInt(data.total_orders)) * 100) : 0;
  
  return {
    totalMarketers: parseInt(data.total_marketers),
    activeMarketers: parseInt(data.active_marketers),
    totalOrders: parseInt(data.total_orders),
    totalSales: parseFloat(data.total_sales),
    completedOrders: parseInt(data.completed_orders),
    completedSales: parseFloat(data.completed_sales),
    completionRate: completionRate
  };
}

module.exports = {
  getMarketerTargets,
  getAllActiveTargets,
  createMarketerTarget,
  updateMarketerTarget,
  deactivateMarketerTarget,
  getMarketerPerformance,
  getAllMarketersPerformance,
  getPerformanceSummary
};
