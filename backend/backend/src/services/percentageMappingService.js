// src/services/percentageMappingService.js
// Service for managing target percentage mappings

const { pool } = require('../config/database');

/**
 * Get all percentage mappings with optional filters
 */
async function getPercentageMappings(filters = {}) {
  try {
    let query = `
      SELECT id, percentage, orders_count, target_type, bnpl_platform, location, is_active, created_at, updated_at
      FROM target_percentage_mappings
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramCount = 0;
    
    // Add filters
    if (filters.targetType) {
      paramCount++;
      query += ` AND target_type = $${paramCount}`;
      queryParams.push(filters.targetType);
    }
    
    if (filters.bnplPlatform) {
      paramCount++;
      query += ` AND bnpl_platform = $${paramCount}`;
      queryParams.push(filters.bnplPlatform);
    }
    
    if (filters.location) {
      paramCount++;
      query += ` AND location = $${paramCount}`;
      queryParams.push(filters.location);
    }
    
    if (filters.isActive !== undefined) {
      paramCount++;
      query += ` AND is_active = $${paramCount}`;
      queryParams.push(filters.isActive);
    }
    
    query += ` ORDER BY target_type, percentage ASC`;
    
    const { rows } = await pool.query(query, queryParams);
    return rows;
    
  } catch (error) {
    console.error('Error getting percentage mappings:', error);
    throw error;
  }
}

/**
 * Get percentage mapping by ID
 */
async function getPercentageMappingById(id) {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM target_percentage_mappings WHERE id = $1',
      [id]
    );
    return rows[0];
  } catch (error) {
    console.error('Error getting percentage mapping by ID:', error);
    throw error;
  }
}

/**
 * Create a new percentage mapping
 */
async function createPercentageMapping(mappingData) {
  try {
    const { percentage, orders_count, target_type, bnpl_platform, location } = mappingData;
    
    const { rows } = await pool.query(
      `INSERT INTO target_percentage_mappings 
       (percentage, orders_count, target_type, bnpl_platform, location) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [percentage, orders_count, target_type, bnpl_platform, location]
    );
    
    return rows[0];
  } catch (error) {
    console.error('Error creating percentage mapping:', error);
    throw error;
  }
}

/**
 * Update a percentage mapping
 */
async function updatePercentageMapping(id, mappingData) {
  try {
    const { percentage, orders_count, target_type, bnpl_platform, location, is_active } = mappingData;
    
    const { rows } = await pool.query(
      `UPDATE target_percentage_mappings 
       SET percentage = $1, orders_count = $2, target_type = $3, 
           bnpl_platform = $4, location = $5, is_active = $6, 
           updated_at = NOW()
       WHERE id = $7 
       RETURNING *`,
      [percentage, orders_count, target_type, bnpl_platform, location, is_active, id]
    );
    
    return rows[0];
  } catch (error) {
    console.error('Error updating percentage mapping:', error);
    throw error;
  }
}

/**
 * Delete a percentage mapping
 */
async function deletePercentageMapping(id) {
  try {
    const { rows } = await pool.query(
      'DELETE FROM target_percentage_mappings WHERE id = $1 RETURNING *',
      [id]
    );
    return rows[0];
  } catch (error) {
    console.error('Error deleting percentage mapping:', error);
    throw error;
  }
}

/**
 * Get the orders count for a specific percentage and target type
 */
async function getOrdersCountForPercentage(percentage, targetType, bnplPlatform = null, location = null) {
  try {
    let query = `
      SELECT orders_count 
      FROM target_percentage_mappings 
      WHERE percentage = $1 AND target_type = $2 AND is_active = true
    `;
    
    const queryParams = [percentage, targetType];
    let paramCount = 2;
    
    if (bnplPlatform) {
      paramCount++;
      query += ` AND bnpl_platform = $${paramCount}`;
      queryParams.push(bnplPlatform);
    } else {
      query += ` AND bnpl_platform IS NULL`;
    }
    
    if (location) {
      paramCount++;
      query += ` AND location = $${paramCount}`;
      queryParams.push(location);
    } else {
      query += ` AND location IS NULL`;
    }
    
    query += ` ORDER BY created_at DESC LIMIT 1`;
    
    const { rows } = await pool.query(query, queryParams);
    
    if (rows.length === 0) {
      // If no specific mapping found, try to get the closest one
      const fallbackQuery = `
        SELECT orders_count 
        FROM target_percentage_mappings 
        WHERE percentage = $1 AND target_type = $2 AND is_active = true 
        AND bnpl_platform IS NULL AND location IS NULL
        ORDER BY created_at DESC LIMIT 1
      `;
      
      const fallbackRows = await pool.query(fallbackQuery, [percentage, targetType]);
      
      if (fallbackRows.rows.length === 0) {
        throw new Error(`No percentage mapping found for ${percentage}% ${targetType}`);
      }
      
      return fallbackRows.rows[0].orders_count;
    }
    
    return rows[0].orders_count;
  } catch (error) {
    console.error('Error getting orders count for percentage:', error);
    throw error;
  }
}

/**
 * Validate percentage mapping data
 */
function validatePercentageMapping(mappingData) {
  const errors = [];
  
  if (!mappingData.percentage || mappingData.percentage < 1 || mappingData.percentage > 100) {
    errors.push('Percentage must be between 1 and 100');
  }
  
  if (!mappingData.orders_count || mappingData.orders_count < 1) {
    errors.push('Orders count must be greater than 0');
  }
  
  if (!mappingData.target_type) {
    errors.push('Target type is required');
  }
  
  const validTargetTypes = ['orders', 'sales', 'recruitment', 'customers', 'conversion_rate'];
  if (!validTargetTypes.includes(mappingData.target_type)) {
    errors.push(`Target type must be one of: ${validTargetTypes.join(', ')}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Get available percentages for a target type
 */
async function getAvailablePercentages(targetType, bnplPlatform = null, location = null) {
  try {
    let query = `
      SELECT DISTINCT percentage 
      FROM target_percentage_mappings 
      WHERE target_type = $1 AND is_active = true
    `;
    
    const queryParams = [targetType];
    let paramCount = 1;
    
    if (bnplPlatform) {
      paramCount++;
      query += ` AND bnpl_platform = $${paramCount}`;
      queryParams.push(bnplPlatform);
    } else {
      query += ` AND bnpl_platform IS NULL`;
    }
    
    if (location) {
      paramCount++;
      query += ` AND location = $${paramCount}`;
      queryParams.push(location);
    } else {
      query += ` AND location IS NULL`;
    }
    
    query += ` ORDER BY percentage ASC`;
    
    const { rows } = await pool.query(query, queryParams);
    return rows.map(row => row.percentage);
  } catch (error) {
    console.error('Error getting available percentages:', error);
    throw error;
  }
}

module.exports = {
  getPercentageMappings,
  getPercentageMappingById,
  createPercentageMapping,
  updatePercentageMapping,
  deletePercentageMapping,
  getOrdersCountForPercentage,
  validatePercentageMapping,
  getAvailablePercentages
};
