// utils/logProductActivity.js
const { pool } = require('../config/database');

/**
 * Log product activity for detailed tracking
 * @param {number} productId - ID of the product
 * @param {string} actionType - Type of action (created, updated, deleted, quantity_added, quantity_removed)
 * @param {number} actorId - ID of the user performing the action
 * @param {string} actorName - Full name of the actor
 * @param {string} actorRole - Role of the actor
 * @param {object} oldValues - Previous values (for updates)
 * @param {object} newValues - New values (for updates)
 * @param {number} quantityChange - Quantity change (positive for additions, negative for removals)
 * @param {string} description - Human-readable description
 */
module.exports = async function logProductActivity(
  productId,
  actionType,
  actorId,
  actorName,
  actorRole,
  oldValues = null,
  newValues = null,
  quantityChange = 0,
  description = null
) {
  try {
    await pool.query(
      `INSERT INTO product_activity_logs
         (product_id, action_type, actor_id, actor_name, actor_role, 
          old_values, new_values, quantity_change, description, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
      [
        productId,
        actionType,
        actorId,
        actorName,
        actorRole,
        oldValues ? JSON.stringify(oldValues) : null,
        newValues ? JSON.stringify(newValues) : null,
        quantityChange,
        description
      ]
    );
  } catch (error) {
    // Log error but don't crash the application
    console.error('Product activity logging error:', error);
  }
};
