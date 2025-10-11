// src/services/targetBasedPerformanceService.js
// Simplified target-based performance calculation service

const { pool } = require('../config/database');

/**
 * Calculate user performance based on targets - SIMPLIFIED VERSION
 * Performance = (Actual Achievement / Target) × 100%
 */
async function calculateUserPerformance(userId, startDate, endDate) {
  try {
    console.log(`🔍 Calculating target-based performance for user ${userId}`);
    
    // Get user details first
    const userResult = await pool.query(`
      SELECT id, unique_id, first_name, last_name, role, location, admin_id, super_admin_id
      FROM users 
      WHERE id = $1
    `, [userId]);
    
    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }
    
    const user = userResult.rows[0];
    
    console.log(`👤 User: ${user.first_name} ${user.last_name} (${user.role})`);
    
    // Get all active targets for this user in the specified period
    const targetsResult = await pool.query(`
      SELECT 
        t.id,
        t.target_type_id,
        tt.name as target_type_name,
        tt.metric_unit,
        t.target_value,
        t.target_percentage,
        t.calculated_target_value,
        t.period_type,
        t.period_start,
        t.period_end,
        t.bnpl_platform,
        t.is_active
      FROM targets t
      JOIN target_types tt ON t.target_type_id = tt.id
      WHERE t.user_id = $1 
        AND t.is_active = true
        AND t.period_start <= $2::date 
        AND t.period_end >= $3::date
    `, [userId, endDate, startDate]);
    
    console.log(`🎯 Found ${targetsResult.rows.length} active targets`);
    
    if (targetsResult.rows.length === 0) {
      return {
        user: {
          id: user.id,
          unique_id: user.unique_id,
          name: `${user.first_name} ${user.last_name}`,
          role: user.role,
          location: user.location,
          admin_id: user.admin_id,
          super_admin_id: user.super_admin_id
        },
        performance: {
          overall: 0,
          targets: []
        },
        message: 'No active targets found for this period'
      };
    }
    
    // Calculate performance for each target
    const targetPerformances = [];
    let totalPerformance = 0;
    
    for (const target of targetsResult.rows) {
      let actualValue = 0;
      let targetValue = target.target_percentage ? target.calculated_target_value : target.target_value;
      
      console.log(`📊 Processing ${target.target_type_name} target: ${targetValue} (${target.period_type})`);
      
      // Get actual performance based on target type
      if (target.target_type_name === 'orders') {
        const ordersResult = await pool.query(`
          SELECT COUNT(*) as count
          FROM orders 
          WHERE marketer_id = $1 
            AND status = 'released_confirmed'
            AND sale_date >= $2::date 
            AND sale_date <= $3::date
        `, [userId, target.period_start, target.period_end]);
        
        actualValue = parseInt(ordersResult.rows[0].count);
        
      } else if (target.target_type_name === 'sales') {
        if (target.bnpl_platform) {
          const bnplResult = await pool.query(`
            SELECT COALESCE(SUM(sold_amount), 0) as total_sales
            FROM orders 
            WHERE marketer_id = $1 
              AND status = 'released_confirmed'
              AND bnpl_platform = $2
              AND sale_date >= $3::date 
              AND sale_date <= $4::date
          `, [userId, target.bnpl_platform, target.period_start, target.period_end]);
          
          actualValue = parseFloat(bnplResult.rows[0].total_sales);
        } else {
          const salesResult = await pool.query(`
            SELECT COALESCE(SUM(sold_amount), 0) as total_sales
            FROM orders 
            WHERE marketer_id = $1 
              AND status = 'released_confirmed'
              AND sale_date >= $2::date 
              AND sale_date <= $3::date
          `, [userId, target.period_start, target.period_end]);
          
          actualValue = parseFloat(salesResult.rows[0].total_sales);
        }
        
      } else if (target.target_type_name === 'recruitment') {
        const recruitmentResult = await pool.query(`
          SELECT COUNT(*) as count
          FROM users 
          WHERE admin_id = $1 
            AND created_at >= $2::date 
            AND created_at <= $3::date
        `, [userId, target.period_start, target.period_end]);
        
        actualValue = parseInt(recruitmentResult.rows[0].count);
      }
      
      // Calculate performance percentage: (Actual / Target) × 100%
      const targetPerformance = targetValue > 0 ? (actualValue / targetValue) * 100 : 0;
      totalPerformance += targetPerformance;
      
      console.log(`📈 ${target.target_type_name}: ${actualValue}/${targetValue} = ${targetPerformance.toFixed(1)}%`);
      
      targetPerformances.push({
        target_id: target.id,
        target_type: target.target_type_name,
        target_value: targetValue,
        actual_value: actualValue,
        performance: targetPerformance,
        bnpl_platform: target.bnpl_platform,
        period: target.period_type,
        period_start: target.period_start,
        period_end: target.period_end
      });
    }
    
    // Calculate overall performance (average of all targets)
    const overallPerformance = targetPerformances.length > 0 ? totalPerformance / targetPerformances.length : 0;
    
    return {
      user: {
        id: user.id,
        unique_id: user.unique_id,
        name: `${user.first_name} ${user.last_name}`,
        role: user.role,
        location: user.location,
        admin_id: user.admin_id,
        super_admin_id: user.super_admin_id
      },
      performance: {
        overall: overallPerformance,
        targets: targetPerformances
      }
    };
    
  } catch (error) {
    console.error('❌ Error calculating target-based performance:', error);
    throw error;
  }
}

/**
 * Get performance data for all users with filters
 */
async function getAllUsersPerformance(filters = {}) {
  try {
    console.log('🔍 Getting all users performance with filters:', filters);
    
    const { 
      period = 'monthly', 
      location = null, 
      targetType = null, 
      performanceRange = 'all',
      role = null 
    } = filters;
    
    // Calculate date range based on period
    const now = new Date();
    let startDate, endDate;
    
    switch (period) {
      case 'weekly':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 6);
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'quarterly':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        endDate = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }
    
    // Build query for users with targets
    let userQuery = `
      SELECT DISTINCT u.id, u.unique_id, u.first_name, u.last_name, u.role, u.location
      FROM users u
      JOIN targets t ON u.id = t.user_id
      WHERE t.is_active = true
        AND t.period_start <= $1::date 
        AND t.period_end >= $2::date
    `;
    
    const queryParams = [endDate.toISOString().split('T')[0], startDate.toISOString().split('T')[0]];
    let paramIndex = 3;
    
    if (location && location !== 'all') {
      userQuery += ` AND u.location = $${paramIndex}`;
      queryParams.push(location);
      paramIndex++;
    }
    
    if (role) {
      userQuery += ` AND u.role = $${paramIndex}`;
      queryParams.push(role);
      paramIndex++;
    }
    
    userQuery += ` ORDER BY u.first_name, u.last_name`;
    
    const usersResult = await pool.query(userQuery, queryParams);
    console.log(`👥 Found ${usersResult.rows.length} users with targets`);
    
    // Calculate performance for each user
    const usersPerformance = [];
    
    for (const user of usersResult.rows) {
      try {
        const performance = await calculateUserPerformance(user.id, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]);
        
        // Apply performance range filter
        if (performanceRange !== 'all') {
          const overall = performance.performance.overall;
          
          switch (performanceRange) {
            case 'top':
              if (overall < 90) continue;
              break;
            case 'good':
              if (overall < 70 || overall >= 90) continue;
              break;
            case 'average':
              if (overall < 50 || overall >= 70) continue;
              break;
            case 'below':
              if (overall >= 50) continue;
              break;
          }
        }
        
        // Apply target type filter
        if (targetType && targetType !== 'all') {
          const hasTargetType = performance.performance.targets.some(t => t.target_type === targetType);
          if (!hasTargetType) continue;
        }
        
        usersPerformance.push(performance);
        
      } catch (error) {
        console.error(`❌ Error calculating performance for user ${user.id}:`, error);
        // Continue with other users
      }
    }
    
    // Sort by overall performance (descending)
    usersPerformance.sort((a, b) => b.performance.overall - a.performance.overall);
    
    return {
      success: true,
      data: usersPerformance,
      filters: {
        period,
        location,
        targetType,
        performanceRange,
        role
      },
      period: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0]
      },
      total: usersPerformance.length
    };
    
  } catch (error) {
    console.error('❌ Error getting all users performance:', error);
    throw error;
  }
}

/**
 * Get user's current targets for dashboard widget
 */
async function getUserTargets(userId) {
  try {
    console.log(`🎯 Getting targets for user ${userId}`);
    
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const targetsResult = await pool.query(`
      SELECT 
        t.id,
        t.target_type_id,
        tt.name as target_type_name,
        tt.metric_unit,
        t.target_value,
        t.target_percentage,
        t.calculated_target_value,
        t.period_type,
        t.period_start,
        t.period_end,
        t.bnpl_platform,
        t.is_active
      FROM targets t
      JOIN target_types tt ON t.target_type_id = tt.id
      WHERE t.user_id = $1 
        AND t.is_active = true
        AND t.period_start <= $2::date 
        AND t.period_end >= $3::date
      ORDER BY t.period_type, tt.name
    `, [userId, endOfMonth.toISOString().split('T')[0], startOfMonth.toISOString().split('T')[0]]);
    
    if (targetsResult.rows.length === 0) {
      return {
        success: true,
        data: [],
        message: 'No active targets found'
      };
    }
    
    // Calculate progress for each target
    const targetsWithProgress = [];
    
    for (const target of targetsResult.rows) {
      let actualValue = 0;
      let targetValue = target.target_percentage ? target.calculated_target_value : target.target_value;
      
      // Get actual performance based on target type
      if (target.target_type_name === 'orders') {
        const ordersResult = await pool.query(`
          SELECT COUNT(*) as count
          FROM orders 
          WHERE marketer_id = $1 
            AND status = 'released_confirmed'
            AND sale_date >= $2::date 
            AND sale_date <= $3::date
        `, [userId, target.period_start, target.period_end]);
        
        actualValue = parseInt(ordersResult.rows[0].count);
        
      } else if (target.target_type_name === 'sales') {
        if (target.bnpl_platform) {
          const bnplResult = await pool.query(`
            SELECT COALESCE(SUM(sold_amount), 0) as total_sales
            FROM orders 
            WHERE marketer_id = $1 
              AND status = 'released_confirmed'
              AND bnpl_platform = $2
              AND sale_date >= $3::date 
              AND sale_date <= $4::date
          `, [userId, target.bnpl_platform, target.period_start, target.period_end]);
          
          actualValue = parseFloat(bnplResult.rows[0].total_sales);
        } else {
          const salesResult = await pool.query(`
            SELECT COALESCE(SUM(sold_amount), 0) as total_sales
            FROM orders 
            WHERE marketer_id = $1 
              AND status = 'released_confirmed'
              AND sale_date >= $2::date 
              AND sale_date <= $3::date
          `, [userId, target.period_start, target.period_end]);
          
          actualValue = parseFloat(salesResult.rows[0].total_sales);
        }
        
      } else if (target.target_type_name === 'recruitment') {
        const recruitmentResult = await pool.query(`
          SELECT COUNT(*) as count
          FROM users 
          WHERE admin_id = $1 
            AND created_at >= $2::date 
            AND created_at <= $3::date
        `, [userId, target.period_start, target.period_end]);
        
        actualValue = parseInt(recruitmentResult.rows[0].count);
      }
      
      // Calculate progress percentage
      const progress = targetValue > 0 ? (actualValue / targetValue) * 100 : 0;
      
      // Determine status
      let status = 'behind';
      if (progress >= 100) status = 'achieved';
      else if (progress >= 70) status = 'on_track';
      
      targetsWithProgress.push({
        id: target.id,
        target_type: target.target_type_name,
        target_value: targetValue,
        actual_value: actualValue,
        progress: Math.round(progress),
        status,
        period: target.period_type,
        bnpl_platform: target.bnpl_platform,
        period_start: target.period_start,
        period_end: target.period_end
      });
    }
    
    return {
      success: true,
      data: targetsWithProgress,
      total: targetsWithProgress.length
    };
    
  } catch (error) {
    console.error('❌ Error getting user targets:', error);
    throw error;
  }
}

module.exports = {
  calculateUserPerformance,
  getAllUsersPerformance,
  getUserTargets
};
