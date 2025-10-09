// src/services/targetManagementService.js
// Enhanced service for managing targets with Master Admin control

const { pool } = require('../config/database');

/**
 * Get all target types
 */
async function getTargetTypes() {
  const { rows } = await pool.query(`
    SELECT id, name, description, metric_unit, supports_bnpl, is_active
    FROM target_types
    WHERE is_active = true
    ORDER BY name
  `);
  
  return rows;
}

/**
 * Get targets for a specific user
 */
async function getUserTargets(userId, periodType = null) {
  let query = `
    SELECT 
      t.id,
      t.user_id,
      t.target_type_id,
      t.target_value,
      t.period_type,
      t.period_start,
      t.period_end,
      t.is_active,
      t.created_by,
      t.notes,
      t.created_at,
      t.updated_at,
      tt.name as target_type_name,
      tt.description as target_type_description,
      tt.metric_unit,
      u.first_name || ' ' || u.last_name as user_name
    FROM targets t
    JOIN target_types tt ON tt.id = t.target_type_id
    JOIN users u ON u.unique_id = t.user_id
    WHERE t.user_id = $1 AND t.is_active = true
  `;
  
  const params = [userId];
  
  if (periodType) {
    query += ` AND t.period_type = $2`;
    params.push(periodType);
  }
  
  query += ` ORDER BY t.period_type, t.period_start DESC, tt.name`;
  
  const { rows } = await pool.query(query, params);
  return rows;
}

/**
 * Get all targets with user information
 */
async function getAllTargets(filters = {}) {
  let query = `
    SELECT 
      t.id,
      t.user_id,
      t.target_type_id,
      t.target_value,
      t.period_type,
      t.period_start,
      t.period_end,
      t.bnpl_platform,
      t.is_active,
      t.created_by,
      t.notes,
      t.created_at,
      t.updated_at,
      tt.name as target_type_name,
      tt.description as target_type_description,
      tt.metric_unit,
      tt.supports_bnpl,
      u.first_name || ' ' || u.last_name as user_name,
      u.role as user_role,
      u.email as user_email,
      u.location as user_location
    FROM targets t
    JOIN target_types tt ON tt.id = t.target_type_id
    JOIN users u ON u.unique_id = t.user_id
    WHERE t.is_active = true
  `;
  
  const params = [];
  let paramCount = 0;
  
  if (filters.userRole) {
    paramCount++;
    query += ` AND u.role = $${paramCount}`;
    params.push(filters.userRole);
  }
  
  if (filters.periodType) {
    paramCount++;
    query += ` AND t.period_type = $${paramCount}`;
    params.push(filters.periodType);
  }
  
  if (filters.targetType) {
    paramCount++;
    query += ` AND tt.name = $${paramCount}`;
    params.push(filters.targetType);
  }
  
  // Add location filter
  if (filters.location) {
    paramCount++;
    query += ` AND u.location = $${paramCount}`;
    params.push(filters.location);
  }
  
  // Add BNPL platform filter
  if (filters.bnplPlatform) {
    paramCount++;
    query += ` AND t.bnpl_platform = $${paramCount}`;
    params.push(filters.bnplPlatform);
  }
  
  query += ` ORDER BY u.role, u.first_name, u.last_name, t.period_type, t.period_start DESC`;
  
  const { rows } = await pool.query(query, params);
  return rows;
}

/**
 * Create a new target
 */
async function createTarget(targetData) {
  const { userId, targetTypeId, targetValue, periodType, periodStart, periodEnd, bnplPlatform, createdBy, notes } = targetData;
  
  // Deactivate any existing target of the same type and period
  await pool.query(`
    UPDATE targets 
    SET is_active = false, updated_at = NOW()
    WHERE user_id = $1 AND target_type_id = $2 AND period_type = $3 AND period_start = $4
  `, [userId, targetTypeId, periodType, periodStart]);
  
  const { rows } = await pool.query(`
    INSERT INTO targets 
    (user_id, target_type_id, target_value, period_type, period_start, period_end, bnpl_platform, created_by, notes)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `, [userId, targetTypeId, targetValue, periodType, periodStart, periodEnd, bnplPlatform, createdBy, notes]);
  
  return rows[0];
}

/**
 * Update an existing target
 */
async function updateTarget(targetId, updateData) {
  const { targetValue, periodStart, periodEnd, notes } = updateData;
  
  const { rows } = await pool.query(`
    UPDATE targets 
    SET target_value = COALESCE($2, target_value),
        period_start = COALESCE($3, period_start),
        period_end = COALESCE($4, period_end),
        notes = COALESCE($5, notes),
        updated_at = NOW()
    WHERE id = $1
    RETURNING *
  `, [targetId, targetValue, periodStart, periodEnd, notes]);
  
  return rows[0];
}

/**
 * Deactivate a target
 */
async function deactivateTarget(targetId) {
  const { rows } = await pool.query(`
    UPDATE targets 
    SET is_active = false, updated_at = NOW()
    WHERE id = $1
    RETURNING *
  `, [targetId]);
  
  return rows[0];
}

/**
 * Bulk create targets for multiple users
 */
async function bulkCreateTargets(targetsData) {
  const results = [];
  
  for (const targetData of targetsData) {
    const target = await createTarget(targetData);
    results.push(target);
  }
  
  return results;
}

/**
 * Get target history for a specific target
 */
async function getTargetHistory(targetId) {
  const { rows } = await pool.query(`
    SELECT 
      th.id,
      th.action,
      th.old_value,
      th.new_value,
      th.old_period_start,
      th.new_period_start,
      th.old_period_end,
      th.new_period_end,
      th.change_reason,
      th.created_at,
      u.first_name || ' ' || u.last_name as changed_by_name
    FROM target_history th
    LEFT JOIN users u ON u.unique_id = th.changed_by
    WHERE th.target_id = $1
    ORDER BY th.created_at DESC
  `, [targetId]);
  
  return rows;
}

/**
 * Get targets by period (current week, month, etc.)
 */
async function getTargetsByPeriod(periodType, periodStart, periodEnd) {
  const { rows } = await pool.query(`
    SELECT 
      t.id,
      t.user_id,
      t.target_type_id,
      t.target_value,
      t.period_type,
      t.period_start,
      t.period_end,
      t.is_active,
      t.notes,
      tt.name as target_type_name,
      tt.metric_unit,
      u.first_name || ' ' || u.last_name as user_name,
      u.role as user_role
    FROM targets t
    JOIN target_types tt ON tt.id = t.target_type_id
    JOIN users u ON u.unique_id = t.user_id
    WHERE t.period_type = $1 
      AND t.period_start = $2 
      AND t.period_end = $3 
      AND t.is_active = true
    ORDER BY u.role, u.first_name, u.last_name, tt.name
  `, [periodType, periodStart, periodEnd]);
  
  return rows;
}

/**
 * Get target statistics
 */
async function getTargetStats() {
  const { rows } = await pool.query(`
    SELECT 
      COUNT(DISTINCT t.user_id) as users_with_targets,
      COUNT(t.id) as total_targets,
      COUNT(t.id) FILTER (WHERE t.period_type = 'weekly') as weekly_targets,
      COUNT(t.id) FILTER (WHERE t.period_type = 'monthly') as monthly_targets,
      COUNT(t.id) FILTER (WHERE t.period_type = 'quarterly') as quarterly_targets,
      COUNT(DISTINCT tt.id) as target_types_used
    FROM targets t
    JOIN target_types tt ON tt.id = t.target_type_id
    WHERE t.is_active = true
  `);
  
  return rows[0];
}

/**
 * Get users without targets
 */
async function getUsersWithoutTargets(role = null) {
  let query = `
    SELECT 
      u.unique_id,
      u.first_name,
      u.last_name,
      u.email,
      u.role,
      u.created_at
    FROM users u
    WHERE NOT EXISTS (
      SELECT 1 FROM targets t 
      WHERE t.user_id = u.unique_id 
      AND t.is_active = true
    )
  `;
  
  const params = [];
  if (role) {
    query += ` AND u.role = $1`;
    params.push(role);
  }
  
  query += ` ORDER BY u.role, u.first_name, u.last_name`;
  
  const { rows } = await pool.query(query, params);
  return rows;
}

/**
 * Get users filtered by role and location for target creation
 */
async function getUsersForTargetCreation(role = null, location = null) {
  let query = `
    SELECT 
      u.unique_id,
      u.first_name,
      u.last_name,
      u.email,
      u.role,
      u.location,
      u.created_at,
      u.locked,
      u.overall_verification_status
    FROM users u
    WHERE u.deleted = FALSE
      AND u.role IN ('Marketer', 'Admin', 'SuperAdmin', 'Dealer')
  `;
  
  const params = [];
  let paramCount = 0;
  
  if (role) {
    paramCount++;
    query += ` AND u.role = $${paramCount}`;
    params.push(role);
  }
  
  if (location) {
    paramCount++;
    query += ` AND u.location = $${paramCount}`;
    params.push(location);
  }
  
  query += ` ORDER BY u.role, u.location, u.first_name, u.last_name`;
  
  const { rows } = await pool.query(query, params);
  return rows;
}

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
  getUsersWithoutTargets,
  getUsersForTargetCreation
};
