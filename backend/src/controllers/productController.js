// src/controllers/productController.js
const { pool } = require('../config/database');
const logProductActivity = require('../utils/logProductActivity');

/**
 * addProduct
 * - Inserts the product record only; IMEIs are not handled here.
 */
async function addProduct(req, res, next) {
  const {
    dealer_id,
    device_type,
    device_name,
    device_model,
    cost_price,
    selling_price,
    quantity_to_add    // ← optional initial stock count
  } = req.body;

  // 1) Validate required fields
  if (
    !dealer_id ||
    !device_type ||
    !device_name ||
    !device_model ||
    cost_price == null ||
    selling_price == null
  ) {
    return res.status(400).json({ message: "Missing required product fields." });
  }

  const client = await pool.connect();
  try {
    // 2) Start transaction
    await client.query('BEGIN');

    // 3) Verify dealer exists
    const { rows: dealerCheck } = await client.query(
      'SELECT 1 FROM users WHERE id = $1',
      [dealer_id]
    );
    if (!dealerCheck.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: "Dealer not found." });
    }

    // 4) Insert product
    const insertProductSql = `
      INSERT INTO products (
        dealer_id, device_type, device_name, device_model,
        cost_price, selling_price, created_at
      ) VALUES ($1,$2,$3,$4,$5,$6,NOW())
      RETURNING *
    `;
    const { rows: [product] } = await client.query(
      insertProductSql,
      [
        dealer_id,
        device_type,
        device_name,
        device_model,
        cost_price,
        selling_price
      ]
    );

    // 5) Bulk-insert initial stock items (no IMEI)
    const toAdd = parseInt(quantity_to_add, 10) || 0;
    if (toAdd > 0) {
      await client.query(`
        INSERT INTO inventory_items (product_id, status, created_at)
        SELECT $1, 'available', NOW()
          FROM generate_series(1, $2)
      `, [product.id, toAdd]);
    }

    // 6) Commit transaction
    await client.query('COMMIT');

    // 7) Log product activity
    const actorName = `${req.user.first_name} ${req.user.last_name}`;
    const actorRole = req.user.role;
    
    await logProductActivity(
      product.id,
      'created',
      req.user.id,
      actorName,
      actorRole,
      null,
      {
        device_name: product.device_name,
        device_model: product.device_model,
        device_type: product.device_type,
        cost_price: product.cost_price,
        selling_price: product.selling_price,
        dealer_id: product.dealer_id
      },
      toAdd,
      `Created product "${product.device_name} ${product.device_model}"${toAdd > 0 ? ` with ${toAdd} initial stock` : ''}`
    );

    // 8) Compute quantity_available
    const { rows: countRows } = await client.query(`
      SELECT COUNT(*)::int AS quantity_available
        FROM inventory_items
       WHERE product_id = $1
         AND status     = 'available'
    `, [product.id]);

    // 9) Return success
    res.status(201).json({
      message: `Product added successfully.${toAdd > 0 ? ` Added ${toAdd} unit${toAdd !== 1 ? 's' : ''} to stock.` : ''}`,
      product: {
        ...product,
        quantity_available: countRows[0].quantity_available
      }
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

/**
 * getProducts
 * Any authenticated user may list all products.
 * Includes dealer info, qty_available, is_low_stock, is_available.
 */
async function getProducts(req, res, next) {
  try {
    const { rows } = await pool.query(`
      SELECT
        p.id,
        p.dealer_id,
        u.business_name   AS dealer_name,
        u.location        AS dealer_location,
        p.device_type,
        p.device_name,
        p.device_model,
        p.cost_price,
        p.selling_price,
        COALESCE(i.qty_available, 0) AS quantity_available,
        (COALESCE(i.qty_available, 0) <= 2) AS is_low_stock,
        (COALESCE(i.qty_available, 0) > 0) AS is_available
      FROM products p
      JOIN users u
        ON p.dealer_id = u.id
      LEFT JOIN (
        SELECT
          product_id,
          COUNT(*) FILTER (WHERE status = 'available') AS qty_available
        FROM inventory_items
        GROUP BY product_id
      ) i
        ON p.id = i.product_id
      ORDER BY p.id DESC
    `);
    res.json({ products: rows });
  } catch (err) {
    next(err);
  }
}

/**
 * listProducts
 * A simpler list for dropdowns: no inventory details.
 */
async function listProducts(req, res, next) {
  try {
    const { rows } = await pool.query(`
      SELECT
        p.id,
        p.device_name,
        p.device_model,
        p.device_type,
        p.cost_price,
        p.selling_price,
        u.business_name AS dealer_name,
        u.location      AS dealer_location
      FROM products p
      JOIN users u ON u.id = p.dealer_id
      ORDER BY p.device_name
    `);
    res.json({ products: rows });
  } catch (err) {
    next(err);
  }
}

/**
 * updateProduct
 * Only MasterAdmin may update.
 * Adjusts product fields; if `quantity_to_add` is passed and > 0,
 * inserts that many new inventory_items (no IMEI).
 */
async function updateProduct(req, res, next) {
  const client = await pool.connect();
  try {
    const productId = parseInt(req.params.id, 10);
    if (!Number.isInteger(productId)) {
      return res.status(400).json({ message: "Invalid product ID." });
    }

    // pull fields from body
    const {
      device_type,
      device_name,
      device_model,
      cost_price,
      selling_price,
      quantity_to_add    // ← optional: positive to add, negative to remove
    } = req.body;

    await client.query("BEGIN");

    // 1) Get current product data for logging
    const { rows: currentProduct } = await client.query(`
      SELECT device_type, device_name, device_model, cost_price, selling_price
      FROM products WHERE id = $1
    `, [productId]);

    if (!currentProduct.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Product not found." });
    }

    // 2) Update product metadata
    const { rows: prodRows } = await client.query(`
      UPDATE products
         SET device_type   = COALESCE($1, device_type),
             device_name   = COALESCE($2, device_name),
             device_model  = COALESCE($3, device_model),
             cost_price    = COALESCE($4, cost_price),
             selling_price = COALESCE($5, selling_price),
             updated_at    = NOW()
       WHERE id = $6
     RETURNING *
    `, [
      device_type,
      device_name,
      device_model,
      cost_price,
      selling_price,
      productId
    ]);

    if (!prodRows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Product not found." });
    }

    // 2) Bulk-insert or remove stock without IMEI
    const toAdd = parseInt(quantity_to_add, 10) || 0;
    if (toAdd > 0) {
      // insert `toAdd` new available items
      await client.query(`
        INSERT INTO inventory_items (product_id, status, created_at)
        SELECT $1, 'available', NOW()
          FROM generate_series(1, $2)
      `, [ productId, toAdd ]);
    } else if (toAdd < 0) {
      // remove |toAdd| oldest available items
      const removeCount = -toAdd;
      const { rows: toRemove } = await client.query(`
        SELECT id
          FROM inventory_items
         WHERE product_id = $1
           AND status     = 'available'
         ORDER BY created_at ASC
         LIMIT $2
         FOR UPDATE SKIP LOCKED
      `, [ productId, removeCount ]);

      if (toRemove.length) {
        const ids = toRemove.map(r => r.id);
        await client.query(`
          DELETE FROM inventory_items
           WHERE id = ANY($1)
        `, [ids]);
      }
    }

    await client.query("COMMIT");

    // 3) Log product activity
    const actorName = `${req.user.first_name} ${req.user.last_name}`;
    const actorRole = req.user.role;
    const oldValues = currentProduct[0];
    const newValues = prodRows[0];
    
    // Determine what changed
    const changes = [];
    if (device_type && oldValues.device_type !== device_type) changes.push(`device type: ${oldValues.device_type} → ${device_type}`);
    if (device_name && oldValues.device_name !== device_name) changes.push(`device name: ${oldValues.device_name} → ${device_name}`);
    if (device_model && oldValues.device_model !== device_model) changes.push(`device model: ${oldValues.device_model} → ${device_model}`);
    if (cost_price && oldValues.cost_price != cost_price) changes.push(`cost price: ₦${oldValues.cost_price} → ₦${cost_price}`);
    if (selling_price && oldValues.selling_price != selling_price) changes.push(`selling price: ₦${oldValues.selling_price} → ₦${selling_price}`);
    
    const actionType = toAdd > 0 ? 'quantity_added' : toAdd < 0 ? 'quantity_removed' : 'updated';
    const description = changes.length > 0 
      ? `Updated product: ${changes.join(', ')}${toAdd !== 0 ? `, quantity: ${toAdd > 0 ? '+' : ''}${toAdd}` : ''}`
      : toAdd !== 0 
        ? `Quantity ${toAdd > 0 ? 'added' : 'removed'}: ${Math.abs(toAdd)} units`
        : 'Product updated';

    await logProductActivity(
      productId,
      actionType,
      req.user.id,
      actorName,
      actorRole,
      oldValues,
      newValues,
      toAdd,
      description
    );

    // 4) Recompute available quantity
    const { rows: countRows } = await client.query(`
      SELECT COUNT(*)::int AS quantity_available
        FROM inventory_items
       WHERE product_id = $1
         AND status     = 'available'
    `, [productId]);

    const updatedProduct = {
      ...prodRows[0],
      quantity_available: countRows[0].quantity_available
    };

    // 5) Return success
    res.json({
      message: `Product updated successfully.${toAdd > 0 ? ` Added ${toAdd} unit${toAdd !== 1 ? 's' : ''} to stock.` : toAdd < 0 ? ` Removed ${-toAdd} unit${toAdd !== -1 ? 's' : ''} from stock.` : ''}`,
      product: updatedProduct
    });
  } catch (err) {
    await client.query("ROLLBACK");
    next(err);
  } finally {
    client.release();
  }
}

/**
 * deleteProduct
 * Deletes a product and any related inventory (foreign key cascade assumed).
 */
async function deleteProduct(req, res, next) {
  const productId = req.params.id;
  const client    = await pool.connect();

  try {
    await client.query('BEGIN');
    
    // Get product data before deletion for logging
    const { rows: productData } = await client.query(
      `SELECT device_name, device_model, device_type FROM products WHERE id = $1`,
      [productId]
    );
    
    const { rows } = await client.query(
      `DELETE FROM products WHERE id = $1 RETURNING *`,
      [productId]
    );
    await client.query('COMMIT');

    if (!rows.length) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    // Log product deletion activity
    const actorName = `${req.user.first_name} ${req.user.last_name}`;
    const actorRole = req.user.role;
    
    await logProductActivity(
      parseInt(productId),
      'deleted',
      req.user.id,
      actorName,
      actorRole,
      productData[0] || {},
      null,
      0,
      `Deleted product "${productData[0]?.device_name} ${productData[0]?.device_model}"`
    );

    res.json({ message: 'Product deleted successfully.', product: rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

/**
 * getAllProducts
 * For SuperAdmin: full product list with profit & inventory details.
 */
async function getAllProducts(req, res, next) {
  try {
    const { rows } = await pool.query(`
      SELECT
        p.id,
        u.business_name       AS dealer_business_name,
        u.location            AS dealer_location,
        p.device_type,
        p.device_name,
        p.device_model,
        p.cost_price,
        p.selling_price,
        (p.selling_price - p.cost_price) AS profit,
        COALESCE(i.qty_available, 0)      AS qty_available
      FROM products p
      JOIN users u ON p.dealer_id = u.id
      LEFT JOIN (
        SELECT
          product_id,
          COUNT(*) FILTER (WHERE status = 'available') AS qty_available
        FROM inventory_items
        GROUP BY product_id
      ) i
        ON p.id = i.product_id
      ORDER BY p.device_name, p.device_model
    `);
    res.json({ products: rows });
  } catch (err) {
    next(err);
  }
}

/**
 * getProductActivityHistory
 * Get activity history for a specific product or all products
 */
async function getProductActivityHistory(req, res, next) {
  try {
    const { productId, limit = 50, offset = 0 } = req.query;
    
    let query = `
      SELECT 
        pal.id,
        pal.product_id,
        pal.action_type,
        pal.actor_name,
        pal.actor_role,
        pal.old_values,
        pal.new_values,
        pal.quantity_change,
        pal.description,
        pal.created_at,
        p.device_name,
        p.device_model,
        p.device_type
      FROM product_activity_logs pal
      LEFT JOIN products p ON pal.product_id = p.id
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (productId) {
      query += ` WHERE pal.product_id = $${++paramCount}`;
      params.push(productId);
    }
    
    query += ` ORDER BY pal.created_at DESC LIMIT $${++paramCount} OFFSET $${++paramCount}`;
    params.push(parseInt(limit), parseInt(offset));
    
    const { rows } = await pool.query(query, params);
    
    res.json({
      success: true,
      activities: rows,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: rows.length
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * getRecentProductActivities
 * Get recent product activities for dashboard
 */
async function getRecentProductActivities(req, res, next) {
  try {
    const { limit = 10 } = req.query;
    
    const { rows } = await pool.query(`
      SELECT 
        pal.id,
        pal.product_id,
        pal.action_type,
        pal.actor_name,
        pal.actor_role,
        pal.quantity_change,
        pal.description,
        pal.created_at,
        p.device_name,
        p.device_model,
        p.device_type
      FROM product_activity_logs pal
      LEFT JOIN products p ON pal.product_id = p.id
      ORDER BY pal.created_at DESC 
      LIMIT $1
    `, [parseInt(limit)]);
    
    res.json({
      success: true,
      activities: rows
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  addProduct,
  getProducts,
  listProducts,
  updateProduct,
  deleteProduct,
  getAllProducts,
  getProductActivityHistory,
  getRecentProductActivities
};
