// src/services/performanceCalculationService.js
// Enhanced performance calculation service that considers user assignments
// Uses existing assignment structure from users table (admin_id, super_admin_id)

const { pool } = require('../config/database');
const targetManagementService = require('./targetManagementService');

/**
 * Get assigned marketers for an admin using existing assignment structure
 */
async function getAssignedMarketers(adminId) {
  const { rows } = await pool.query(`
    SELECT u.unique_id, u.first_name, u.last_name, u.role, u.email
    FROM users u
    JOIN users a ON u.admin_id = a.id
    WHERE a.unique_id = $1 AND u.role = 'Marketer'
    ORDER BY u.first_name, u.last_name
  `, [adminId]);
  
  return rows;
}

/**
 * Get assigned admins for a superadmin using existing assignment structure
 */
async function getAssignedAdmins(superAdminId) {
  const { rows } = await pool.query(`
    SELECT u.unique_id, u.first_name, u.last_name, u.role, u.email
    FROM users u
    JOIN users s ON u.super_admin_id = s.id
    WHERE s.unique_id = $1 AND u.role = 'Admin'
    ORDER BY u.first_name, u.last_name
  `, [superAdminId]);
  
  return rows;
}

/**
 * Calculate performance for a marketer based on their targets
 */
async function calculateMarketerPerformance(marketerId) {
  // Get current targets
  const targets = await targetManagementService.getUserTargets(marketerId);
  
  // Get the numeric user ID for the orders table
  const { rows: userData } = await pool.query(`
    SELECT id FROM users WHERE unique_id = $1
  `, [marketerId]);
  
  if (userData.length === 0) {
    throw new Error('User not found');
  }
  
  const userId = userData[0].id;
  
  // Get actual performance data for different periods
  const now = new Date();
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
  
  // Get orders data
  const { rows: weeklyOrders } = await pool.query(`
    SELECT COUNT(*) as count, COALESCE(SUM(sold_amount), 0) as total_sales
    FROM orders 
    WHERE marketer_id = $1 
      AND status = 'released_confirmed'
      AND sale_date >= $2::date
  `, [userId, weekStart.toISOString().split('T')[0]]);
  
  const { rows: monthlyOrders } = await pool.query(`
    SELECT COUNT(*) as count, COALESCE(SUM(sold_amount), 0) as total_sales
    FROM orders 
    WHERE marketer_id = $1 
      AND status = 'released_confirmed'
      AND sale_date >= $2::date
  `, [userId, monthStart.toISOString().split('T')[0]]);
  
  const { rows: quarterlyOrders } = await pool.query(`
    SELECT COUNT(*) as count, COALESCE(SUM(sold_amount), 0) as total_sales
    FROM orders 
    WHERE marketer_id = $1 
      AND status = 'released_confirmed'
      AND sale_date >= $2::date
  `, [userId, quarterStart.toISOString().split('T')[0]]);
  
  // Get total performance data
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
  const quarterlyData = quarterlyOrders[0];
  const totalData = totalOrders[0];
  
  // Calculate performance scores based on targets
  const performance = {
    weekly: { orders: parseInt(weeklyData.count), sales: parseFloat(weeklyData.total_sales), performance: 0 },
    monthly: { orders: parseInt(monthlyData.count), sales: parseFloat(monthlyData.total_sales), performance: 0 },
    quarterly: { orders: parseInt(quarterlyData.count), sales: parseFloat(quarterlyData.total_sales), performance: 0 },
    overall: { performance: 0, successRate: 0, totalOrders: parseInt(totalData.total_orders), totalSales: parseFloat(totalData.total_sales) }
  };
  
  // Calculate performance for each period based on targets
  const weeklyTarget = targets.find(t => t.period_type === 'weekly' && t.target_type_name === 'orders');
  const monthlyTarget = targets.find(t => t.period_type === 'monthly' && t.target_type_name === 'orders');
  const quarterlyTarget = targets.find(t => t.period_type === 'quarterly' && t.target_type_name === 'orders');
  
  if (weeklyTarget) {
    performance.weekly.target = weeklyTarget.target_value;
    performance.weekly.performance = Math.min(100, Math.round((performance.weekly.orders / weeklyTarget.target_value) * 100));
  }
  
  if (monthlyTarget) {
    performance.monthly.target = monthlyTarget.target_value;
    performance.monthly.performance = Math.min(100, Math.round((performance.monthly.orders / monthlyTarget.target_value) * 100));
  }
  
  if (quarterlyTarget) {
    performance.quarterly.target = quarterlyTarget.target_value;
    performance.quarterly.performance = Math.min(100, Math.round((performance.quarterly.orders / quarterlyTarget.target_value) * 100));
  }
  
  // Calculate overall performance
  const performances = [performance.weekly.performance, performance.monthly.performance, performance.quarterly.performance].filter(p => p > 0);
  performance.overall.performance = performances.length > 0 ? Math.round(performances.reduce((a, b) => a + b, 0) / performances.length) : 0;
  
  // Calculate success rate
  performance.overall.successRate = totalData.total_orders > 0 ? 
    Math.round((parseInt(totalData.completed_orders) / parseInt(totalData.total_orders)) * 100) : 0;
  
  return {
    marketerId,
    targets,
    performance
  };
}

/**
 * Calculate performance for an admin based on their assigned marketers
 */
async function calculateAdminPerformance(adminId) {
  // Get assigned marketers using existing assignment structure
  const assignedMarketers = await getAssignedMarketers(adminId);
  
  if (assignedMarketers.length === 0) {
    return {
      adminId,
      assignedMarketers: [],
      performance: {
        teamSize: 0,
        averagePerformance: 0,
        totalOrders: 0,
        totalSales: 0,
        successRate: 0,
        topPerformers: [],
        underPerformers: []
      }
    };
  }
  
  // Calculate performance for each assigned marketer
  const marketerPerformances = [];
  let totalOrders = 0;
  let totalSales = 0;
  let totalSuccessRate = 0;
  
  for (const marketer of assignedMarketers) {
    try {
      const performance = await calculateMarketerPerformance(marketer.unique_id);
      marketerPerformances.push({
        ...marketer,
        performance: performance.performance
      });
      
      totalOrders += performance.performance.overall.totalOrders;
      totalSales += performance.performance.overall.totalSales;
      totalSuccessRate += performance.performance.overall.successRate;
    } catch (error) {
      console.error(`Error calculating performance for marketer ${marketer.unique_id}:`, error);
    }
  }
  
  // Calculate team performance metrics
  const averagePerformance = marketerPerformances.length > 0 ? 
    Math.round(marketerPerformances.reduce((sum, m) => sum + m.performance.overall.performance, 0) / marketerPerformances.length) : 0;
  
  const averageSuccessRate = marketerPerformances.length > 0 ? 
    Math.round(totalSuccessRate / marketerPerformances.length) : 0;
  
  // Identify top and under performers
  const sortedPerformers = marketerPerformances.sort((a, b) => b.performance.overall.performance - a.performance.overall.performance);
  const topPerformers = sortedPerformers.slice(0, 3);
  const underPerformers = sortedPerformers.filter(m => m.performance.overall.performance < 70);
  
  return {
    adminId,
    assignedMarketers: marketerPerformances,
    performance: {
      teamSize: assignedMarketers.length,
      averagePerformance,
      totalOrders,
      totalSales,
      successRate: averageSuccessRate,
      topPerformers,
      underPerformers
    }
  };
}

/**
 * Calculate performance for a superadmin based on their assigned admins
 */
async function calculateSuperAdminPerformance(superAdminId) {
  // Get assigned admins using existing assignment structure
  const assignedAdmins = await getAssignedAdmins(superAdminId);
  
  if (assignedAdmins.length === 0) {
    return {
      superAdminId,
      assignedAdmins: [],
      performance: {
        teamSize: 0,
        averagePerformance: 0,
        totalOrders: 0,
        totalSales: 0,
        successRate: 0,
        topPerformers: [],
        underPerformers: []
      }
    };
  }
  
  // Calculate performance for each assigned admin
  const adminPerformances = [];
  let totalOrders = 0;
  let totalSales = 0;
  let totalSuccessRate = 0;
  
  for (const admin of assignedAdmins) {
    try {
      const performance = await calculateAdminPerformance(admin.unique_id);
      adminPerformances.push({
        ...admin,
        performance: performance.performance
      });
      
      totalOrders += performance.performance.totalOrders;
      totalSales += performance.performance.totalSales;
      totalSuccessRate += performance.performance.successRate;
    } catch (error) {
      console.error(`Error calculating performance for admin ${admin.unique_id}:`, error);
    }
  }
  
  // Calculate team performance metrics
  const averagePerformance = adminPerformances.length > 0 ? 
    Math.round(adminPerformances.reduce((sum, a) => sum + a.performance.averagePerformance, 0) / adminPerformances.length) : 0;
  
  const averageSuccessRate = adminPerformances.length > 0 ? 
    Math.round(totalSuccessRate / adminPerformances.length) : 0;
  
  // Identify top and under performers
  const sortedPerformers = adminPerformances.sort((a, b) => b.performance.averagePerformance - a.performance.averagePerformance);
  const topPerformers = sortedPerformers.slice(0, 3);
  const underPerformers = sortedPerformers.filter(a => a.performance.averagePerformance < 70);
  
  return {
    superAdminId,
    assignedAdmins: adminPerformances,
    performance: {
      teamSize: assignedAdmins.length,
      averagePerformance,
      totalOrders,
      totalSales,
      successRate: averageSuccessRate,
      topPerformers,
      underPerformers
    }
  };
}

/**
 * Get performance summary for all roles - OPTIMIZED VERSION
 * Uses batch queries and limits processing to prevent hanging
 */
async function getPerformanceSummary() {
  try {
    console.log('🚀 Starting optimized performance summary calculation...');
    
    // Set a reasonable limit to prevent performance issues
    const MAX_USERS_PER_ROLE = 50;
    
    // Get basic user counts first (fast query)
    const { rows: userCounts } = await pool.query(`
      SELECT 
        role,
        COUNT(*) as count
      FROM users 
      WHERE role IN ('Marketer', 'Admin', 'SuperAdmin')
      GROUP BY role
    `);
    
    const counts = userCounts.reduce((acc, row) => {
      acc[row.role.toLowerCase()] = parseInt(row.count);
      return acc;
    }, {});
    
    console.log('📊 User counts:', counts);
    
    // Get aggregated performance data in batch queries (much faster)
    const { rows: marketerStats } = await pool.query(`
      SELECT 
        u.unique_id,
        u.first_name,
        u.last_name,
        COUNT(o.id) as total_orders,
        COALESCE(SUM(o.sold_amount), 0) as total_sales,
        COUNT(CASE WHEN o.status = 'released_confirmed' THEN 1 END) as confirmed_orders,
        COALESCE(SUM(CASE WHEN o.status = 'released_confirmed' THEN o.sold_amount ELSE 0 END), 0) as confirmed_sales
      FROM users u
      LEFT JOIN orders o ON u.id = o.marketer_id
      WHERE u.role = 'Marketer'
      GROUP BY u.unique_id, u.first_name, u.last_name
      ORDER BY confirmed_sales DESC
      LIMIT $1
    `, [MAX_USERS_PER_ROLE]);
    
    const { rows: adminStats } = await pool.query(`
      SELECT 
        u.unique_id,
        u.first_name,
        u.last_name,
        COUNT(DISTINCT m.id) as assigned_marketers,
        COUNT(o.id) as team_orders,
        COALESCE(SUM(o.sold_amount), 0) as team_sales
      FROM users u
      LEFT JOIN users m ON m.admin_id = u.id AND m.role = 'Marketer'
      LEFT JOIN orders o ON m.id = o.marketer_id AND o.status = 'released_confirmed'
      WHERE u.role = 'Admin'
      GROUP BY u.unique_id, u.first_name, u.last_name
      ORDER BY team_sales DESC
      LIMIT $1
    `, [MAX_USERS_PER_ROLE]);
    
    const { rows: superAdminStats } = await pool.query(`
      SELECT 
        u.unique_id,
        u.first_name,
        u.last_name,
        COUNT(DISTINCT a.id) as assigned_admins,
        COUNT(DISTINCT m.id) as total_team_members,
        COUNT(o.id) as team_orders,
        COALESCE(SUM(o.sold_amount), 0) as team_sales
      FROM users u
      LEFT JOIN users a ON a.super_admin_id = u.id AND a.role = 'Admin'
      LEFT JOIN users m ON m.admin_id = a.id AND m.role = 'Marketer'
      LEFT JOIN orders o ON m.id = o.marketer_id AND o.status = 'released_confirmed'
      WHERE u.role = 'SuperAdmin'
      GROUP BY u.unique_id, u.first_name, u.last_name
      ORDER BY team_sales DESC
      LIMIT $1
    `, [MAX_USERS_PER_ROLE]);
    
    // Process marketers data
    const marketerPerformances = marketerStats.map(marketer => {
      const totalOrders = parseInt(marketer.total_orders) || 0;
      const confirmedOrders = parseInt(marketer.confirmed_orders) || 0;
      const totalSales = parseFloat(marketer.total_sales) || 0;
      const confirmedSales = parseFloat(marketer.confirmed_sales) || 0;
      
      // Calculate performance score (0-100)
      const performanceScore = totalOrders > 0 ? Math.round((confirmedOrders / totalOrders) * 100) : 0;
      
      return {
        unique_id: marketer.unique_id,
        first_name: marketer.first_name,
        last_name: marketer.last_name,
        name: `${marketer.first_name} ${marketer.last_name}`,
        performance: {
          overall: {
            totalOrders,
            totalSales: confirmedSales,
            performance: performanceScore
          }
        }
      };
    });
    
    // Process admins data
    const adminPerformances = adminStats.map(admin => {
      const assignedMarketers = parseInt(admin.assigned_marketers) || 0;
      const teamOrders = parseInt(admin.team_orders) || 0;
      const teamSales = parseFloat(admin.team_sales) || 0;
      
      // Calculate average performance based on team performance
      const averagePerformance = assignedMarketers > 0 ? Math.round((teamOrders / assignedMarketers) * 10) : 0;
      
      return {
        unique_id: admin.unique_id,
        first_name: admin.first_name,
        last_name: admin.last_name,
        name: `${admin.first_name} ${admin.last_name}`,
        performance: {
          teamSize: assignedMarketers,
          totalOrders: teamOrders,
          totalSales: teamSales,
          averagePerformance: Math.min(averagePerformance, 100)
        }
      };
    });
    
    // Process superadmins data
    const superAdminPerformances = superAdminStats.map(superAdmin => {
      const assignedAdmins = parseInt(superAdmin.assigned_admins) || 0;
      const totalTeamMembers = parseInt(superAdmin.total_team_members) || 0;
      const teamOrders = parseInt(superAdmin.team_orders) || 0;
      const teamSales = parseFloat(superAdmin.team_sales) || 0;
      
      // Calculate average performance based on team performance
      const averagePerformance = totalTeamMembers > 0 ? Math.round((teamOrders / totalTeamMembers) * 10) : 0;
      
      return {
        unique_id: superAdmin.unique_id,
        first_name: superAdmin.first_name,
        last_name: superAdmin.last_name,
        name: `${superAdmin.first_name} ${superAdmin.last_name}`,
        performance: {
          teamSize: totalTeamMembers,
          totalOrders: teamOrders,
          totalSales: teamSales,
          averagePerformance: Math.min(averagePerformance, 100)
        }
      };
    });
    
    // Calculate totals
    const totalOrders = marketerPerformances.reduce((sum, m) => sum + m.performance.overall.totalOrders, 0);
    const totalSales = marketerPerformances.reduce((sum, m) => sum + m.performance.overall.totalSales, 0);
    
    console.log('✅ Performance summary calculation completed successfully');
    
    return {
      marketers: marketerPerformances,
      admins: adminPerformances,
      superAdmins: superAdminPerformances,
      summary: {
        totalMarketers: counts.marketer || 0,
        totalAdmins: counts.admin || 0,
        totalSuperAdmins: counts.superadmin || 0,
        totalOrders,
        totalSales
      }
    };
    
  } catch (error) {
    console.error('❌ Error in getPerformanceSummary:', error);
    
    // Return fallback data instead of throwing
    return {
      marketers: [],
      admins: [],
      superAdmins: [],
      summary: {
        totalMarketers: 0,
        totalAdmins: 0,
        totalSuperAdmins: 0,
        totalOrders: 0,
        totalSales: 0
      }
    };
  }
}

module.exports = {
  getAssignedMarketers,
  getAssignedAdmins,
  calculateMarketerPerformance,
  calculateAdminPerformance,
  calculateSuperAdminPerformance,
  getPerformanceSummary
};
