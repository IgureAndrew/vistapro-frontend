// src/controllers/manageOrderController.js
const { pool } = require("../config/database");
const {
  creditMarketerCommission,
  creditAdminCommission,
  creditSuperAdminCommission
} = require("../services/walletService");

/**
 * GET /api/manage-orders/orders
 * List only the IMEIs typed in at order time (no reserved-stock fallback),
 * and always show device name/model/type even before confirmation.
 */
async function getPendingOrders(req, res, next) {
  try {
    const { rows } = await pool.query(`
      SELECT
        o.id,
        o.bnpl_platform,
        o.number_of_devices,
        o.sold_amount,
        o.sale_date,
        o.status,
        o.customer_name,
        o.customer_phone,
        o.customer_address,
        m.first_name || ' ' || m.last_name AS user_name,
        m.unique_id AS user_unique_id,
        m.role AS user_role,
        m.location AS user_location,

        -- pick product info from either the confirmed product_id or the original stock_update
        COALESCE(p1.device_name, p2.device_name)   AS device_name,
        COALESCE(p1.device_model, p2.device_model) AS device_model,
        COALESCE(p1.device_type,  p2.device_type)  AS device_type,

        COALESCE(
          ARRAY_AGG(ii.imei ORDER BY ii.id)
            FILTER (WHERE ii.imei IS NOT NULL),
          ARRAY[]::text[]
        ) AS imeis

      FROM orders o
      JOIN users m
        ON m.id = o.marketer_id

      -- product if already confirmed
      LEFT JOIN products p1
        ON p1.id = o.product_id
      -- otherwise via the original stock pickup
      LEFT JOIN stock_updates su
        ON su.id = o.stock_update_id
      LEFT JOIN products p2
        ON p2.id = su.product_id

      LEFT JOIN order_items oi
        ON oi.order_id = o.id
      LEFT JOIN inventory_items ii
        ON ii.id = oi.inventory_item_id

      WHERE o.status = 'pending'
      GROUP BY
        o.id, m.first_name, m.last_name, m.unique_id, m.role, m.location,
        COALESCE(p1.device_name, p2.device_name),
        COALESCE(p1.device_model, p2.device_model),
        COALESCE(p1.device_type,  p2.device_type),
        o.bnpl_platform, o.number_of_devices, o.sold_amount, o.sale_date, o.status,
        o.customer_name, o.customer_phone, o.customer_address

      ORDER BY o.sale_date DESC
    `);

    res.json({ orders: rows });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/manage-orders/orders/:orderId/confirm
 * Confirm a pending pickup order: record IMEIs sold, update stock,
 * pay commissions, and finally mark as released_confirmed.
 */
async function confirmOrder(req, res, next) {
  const orderId = parseInt(req.params.orderId, 10);
  const client  = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1) Lock & fetch the pending order
    const { rows: [order] } = await client.query(`
      SELECT
        marketer_id,
        product_id,
        stock_update_id,
        number_of_devices AS qty,
        commission_paid,
        bnpl_platform
      FROM orders
      WHERE id = $1
        AND status = 'pending'
      FOR UPDATE
    `, [orderId]);

    if (!order) {
      // Either the order doesn't exist, or it's already been confirmed.
      return res.status(404).json({ message: "Order not found or already confirmed." });
    }

    let {
      marketer_id:     marketerId,
      product_id:      productId,
      stock_update_id: stockUpdateId,
      qty,
      commission_paid: commissionPaid,
      bnpl_platform:   bnplPlatform
    } = order;

    // 2) If product_id was null (edge‐case for stock orders), backfill it
    if (!productId && stockUpdateId) {
      const { rows: [su] } = await client.query(
        `SELECT product_id FROM stock_updates WHERE id = $1`,
        [stockUpdateId]
      );
      if (!su) {
        await client.query("ROLLBACK");
        return res.status(404).json({ message: "Associated stock update not found." });
      }
      productId = su.product_id;
      await client.query(
        `UPDATE orders
            SET product_id = $1
          WHERE id = $2`,
        [productId, orderId]
      );
    }

    // ─── 3) PAY COMMISSIONS FIRST (while status is still 'pending') ───────────────────────
    if (!commissionPaid) {
      // Check if BNPL platform is Easybuy - if so, skip all commissions
      if (bnplPlatform && bnplPlatform.toUpperCase() === 'EASYBUY') {
        console.log(`Skipping commission for order ${orderId} - Easybuy BNPL platform`);
      } else {
        // a) fetch marketer UID and role
        const { rows: [mu] } = await client.query(
          `SELECT unique_id, role FROM users WHERE id = $1`,
          [marketerId]
        );
        const marketerUid = mu.unique_id;
        const userRole = mu.role;

        // b) fetch device_type
        const { rows: [pd] } = await client.query(
          `SELECT device_type FROM products WHERE id = $1`,
          [productId]
        );
        const deviceType = pd.device_type;

        // c) credit commissions based on user role
        if (userRole === 'Marketer') {
          // For marketers: credit all three commissions (marketer + hierarchy)
          await creditMarketerCommission   (marketerUid, orderId, deviceType, qty);
          await creditAdminCommission      (marketerUid, orderId,           qty);
          await creditSuperAdminCommission (marketerUid, orderId,           qty);
        } else if (userRole === 'SuperAdmin' || userRole === 'Admin') {
          // For SuperAdmin/Admin: only credit marketer commission (they act as marketers)
          await creditMarketerCommission   (marketerUid, orderId, deviceType, qty);
        }
      }

      // d) compute initial_profit for the sales_record
      const { rows: [profitRow] } = await client.query(`
        SELECT (selling_price - cost_price) * $1 AS profit
          FROM products
         WHERE id = $2
      `, [qty, productId]);
      const initialProfit = profitRow?.profit || 0;

      // e) insert into sales_record
      await client.query(`
        INSERT INTO sales_record (
          order_id,
          product_id,
          sale_date,
          quantity_sold,
          initial_profit
        ) VALUES ($1, $2, NOW(), $3, $4)
      `, [orderId, productId, qty, initialProfit]);

      // f) mark that commissions have been paid on this order
      await client.query(
        `UPDATE orders
            SET commission_paid = TRUE
          WHERE id = $1`,
        [orderId]
      );
    }

    // ─── 4) NOW flip the order status to 'released_confirmed' ──────────────────────────────
    await client.query(`
      UPDATE orders
         SET status        = 'released_confirmed',
             confirmed_at  = NOW(),
             updated_at    = NOW()
       WHERE id = $1
    `, [orderId]);

    // ─── 5) If this was a stock_update, mark that stock as sold ───────────────────────────
    if (stockUpdateId) {
      await client.query(`
        UPDATE stock_updates
           SET status     = 'sold',
               updated_at = NOW()
         WHERE id = $1
      `, [stockUpdateId]);
    }

    await client.query("COMMIT");
    return res.json({ message: "Order confirmed, commissions paid & status updated." });

  } catch (err) {
    await client.query("ROLLBACK");
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    next(err);
  } finally {
    client.release();
  }
}

/**
 * PATCH /api/manage-orders/orders/:orderId/confirm-to-dealer
 */
async function confirmOrderToDealer(req, res, next) {
  try {
    const { orderId } = req.params;
    const { rows } = await pool.query(
      `UPDATE orders
          SET status       = 'confirmed_to_dealer',
              confirmed_at = NOW(),
              updated_at   = NOW()
        WHERE id = $1
        RETURNING *`,
      [orderId]
    );
    if (!rows.length) return res.status(404).json({ message: "Order not found." });
    res.json({ message: "Order confirmed to dealer.", order: rows[0] });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/manage-orders/orders/history
 * Same logic for history: only pull IMEIs from the user‐entered list.
 */
async function getOrderHistory(req, res, next) {
  try {
    const clauses = [];
    const params  = [];
    
    // Always exclude dealers (dealers cannot place orders)
    clauses.push(`u.role != 'Dealer'`);
    
    // Build WHERE clause based on query parameters
    if (req.query.adminId) {
      params.push(req.query.adminId);
      clauses.push(`u.admin_id = (SELECT id FROM users WHERE unique_id = $${params.length})`);
    }
    
    if (req.query.superAdminId) {
      params.push(req.query.superAdminId);
      clauses.push(`sa.unique_id = $${params.length}`);
    }
    
    const where = `WHERE ${clauses.join(" AND ")}`;
    
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { rows } = await pool.query(`
      SELECT
        o.id,
        o.marketer_id,
        o.bnpl_platform,
        o.number_of_devices,
        o.sold_amount,
        o.sale_date,
        o.status,
        o.customer_name,
        u.first_name || ' ' || u.last_name AS user_name,
        u.unique_id AS user_unique_id,
        u.role AS user_role,
        u.location AS user_location,
        a.first_name || ' ' || a.last_name AS admin_name,
        a.unique_id AS admin_unique_id,
        sa.first_name || ' ' || sa.last_name AS super_admin_name,
        sa.unique_id AS super_admin_unique_id,
        p.device_name,
        p.device_model,
        p.device_type,
        ARRAY_AGG(ii.imei ORDER BY ii.id)
          FILTER (WHERE ii.imei IS NOT NULL) AS imeis
      FROM orders o
      JOIN users u ON u.id = o.marketer_id
      LEFT JOIN stock_updates su ON su.id = o.stock_update_id
      LEFT JOIN products p ON p.id = su.product_id
      LEFT JOIN users a ON a.id = u.admin_id
      LEFT JOIN users sa ON sa.id = a.super_admin_id
      LEFT JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN inventory_items ii ON ii.id = oi.inventory_item_id
      ${where}
      GROUP BY
        o.id, o.marketer_id, u.first_name, u.last_name, u.unique_id, u.role, u.location,
        a.first_name, a.last_name, a.unique_id,
        sa.first_name, sa.last_name, sa.unique_id,
        p.device_name, p.device_model, p.device_type,
        o.customer_name, o.bnpl_platform, o.number_of_devices, o.sold_amount, o.sale_date, o.status
      ORDER BY o.sale_date DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `, [...params, limit, offset]);
    
    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM orders o
      JOIN users u ON u.id = o.marketer_id
      LEFT JOIN stock_updates su ON su.id = o.stock_update_id
      LEFT JOIN products p ON p.id = su.product_id
      LEFT JOIN users a ON a.id = u.admin_id
      LEFT JOIN users sa ON sa.id = a.super_admin_id
      ${where}
    `;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);
    
    res.json({ 
      orders: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (err) {
    console.error('Error in getOrderHistory:', err);
    next(err);
  }
}

/**
 * GET /api/manage-orders/user-summary/:userId
 * Get user's order summary for popover display
 */
async function getUserOrderSummary(req, res, next) {
  try {
    const { userId } = req.params;
    
    // Get user's order summary
    const summaryQuery = `
      SELECT 
        u.first_name || ' ' || u.last_name AS user_name,
        u.unique_id AS user_unique_id,
        u.role AS user_role,
        COUNT(o.id) as total_orders,
        COALESCE(SUM(o.sold_amount), 0) as total_value,
        COUNT(CASE WHEN o.status = 'pending' THEN 1 END) as pending_orders,
        COUNT(CASE WHEN o.status = 'released_confirmed' THEN 1 END) as confirmed_orders,
        COUNT(CASE WHEN o.status = 'canceled' THEN 1 END) as canceled_orders
      FROM users u
      LEFT JOIN orders o ON o.marketer_id = u.id
      WHERE u.id = $1 AND u.role != 'Dealer'
      GROUP BY u.id, u.first_name, u.last_name, u.unique_id, u.role
    `;
    
    const { rows: summaryRows } = await pool.query(summaryQuery, [userId]);
    
    if (summaryRows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const summary = summaryRows[0];
    
    // Get recent orders for this user (last 5)
    const recentOrdersQuery = `
      SELECT 
        o.id,
        o.customer_name,
        o.sold_amount,
        o.status,
        o.sale_date,
        p.device_name,
        p.device_model
      FROM orders o
      LEFT JOIN products p ON p.id = o.product_id
      WHERE o.marketer_id = $1
      ORDER BY o.sale_date DESC
      LIMIT 5
    `;
    
    const { rows: recentOrders } = await pool.query(recentOrdersQuery, [userId]);
    
    res.json({
      user: {
        name: summary.user_name,
        unique_id: summary.user_unique_id,
        role: summary.user_role
      },
      summary: {
        total_orders: parseInt(summary.total_orders),
        total_value: parseFloat(summary.total_value),
        pending_orders: parseInt(summary.pending_orders),
        confirmed_orders: parseInt(summary.confirmed_orders),
        canceled_orders: parseInt(summary.canceled_orders)
      },
      recent_orders: recentOrders
    });
    
  } catch (err) {
    console.error('Error in getUserOrderSummary:', err);
    next(err);
  }
}

/**
 * PUT /api/manage-orders/orders/:orderId
 * Update basic order fields (MasterAdmin only)
 */
async function updateOrder(req, res, next) {
  try {
    if (req.user.role !== "MasterAdmin") {
      return res.status(403).json({ message: "Only MasterAdmin can update orders." });
    }
    const { orderId } = req.params;
    const updates = req.body;
    const allowed = ["status", "sold_amount", "number_of_devices", "bnpl_platform"];
    const sets = [];
    const vals = [];
    let idx = 1;

    for (const key of Object.keys(updates)) {
      if (!allowed.includes(key)) continue;
      sets.push(`${key} = $${idx}`);
      vals.push(updates[key]);
      idx++;
    }
    if (!sets.length) {
      return res.status(400).json({ message: "No valid fields to update." });
    }
    vals.push(orderId);

    const { rows } = await pool.query(
      `UPDATE orders
          SET ${sets.join(", ")}, updated_at = NOW()
        WHERE id = $${idx}
        RETURNING *`,
      vals
    );
    if (!rows.length) return res.status(404).json({ message: "Order not found." });
    res.json({ message: "Order updated.", order: rows[0] });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/manage-orders/orders/:orderId
 * Delete an order (MasterAdmin only)
 */
async function deleteOrder(req, res, next) {
  try {
    if (req.user.role !== "MasterAdmin") {
      return res.status(403).json({ message: "Only MasterAdmin can delete orders." });
    }
    const { orderId } = req.params;
    const { rows } = await pool.query(
      `DELETE FROM orders WHERE id = $1 RETURNING *`,
      [orderId]
    );
    if (!rows.length) return res.status(404).json({ message: "Order not found." });
    res.json({ message: "Order deleted.", order: rows[0] });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/manage-orders/orders/:orderId/detail
 * Get detailed profit breakdown for a confirmed order
 */
async function getConfirmedOrderDetail(req, res, next) {
  const { orderId } = req.params;
  try {
    const { rows } = await pool.query(
      `
      SELECT
        p.device_name,
        p.device_model,
        p.device_type,
        o.sold_amount     AS selling_price,
        sr.quantity_sold  AS qty,
        (p.selling_price - p.cost_price) * sr.quantity_sold AS total_profit_before,
        sr.quantity_sold * (cr.marketer_rate + cr.admin_rate + cr.superadmin_rate) AS total_expenses,
        ( (p.selling_price - p.cost_price) * sr.quantity_sold
         - sr.quantity_sold * (cr.marketer_rate + cr.admin_rate + cr.superadmin_rate)
        ) AS total_profit_after
      FROM sales_record sr
      JOIN orders o ON o.id = sr.order_id
      JOIN products p ON p.id = sr.product_id
      JOIN commission_rates cr ON cr.device_type = p.device_type
      WHERE sr.order_id = $1
      `,
      [orderId]
    );
    if (!rows.length) {
      return res.status(404).json({ message: "No confirmed sale found for that order." });
    }
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/manage-orders/orders/:orderId/cancel
 * Cancel a pending pickup order and restore reserved stock
 */
async function cancelOrder(req, res, next) {
  const orderId = parseInt(req.params.orderId, 10);
  if (isNaN(orderId)) {
    return res.status(400).json({ message: "Invalid order ID." });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Fetch the order
    const { rows: ordRows } = await client.query(
      `SELECT status, stock_update_id, number_of_devices
         FROM orders
        WHERE id = $1`,
      [orderId]
    );
    if (!ordRows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: "Order not found." });
    }
    const order = ordRows[0];
    if (order.status !== 'pending') {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: "Only pending orders can be canceled." });
    }
    if (!order.stock_update_id) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: "Only pickup-based orders can be canceled." });
    }

    // Restore reserved IMEIs
    await client.query(
      `UPDATE inventory_items
          SET status = 'available', stock_update_id = NULL
        WHERE stock_update_id = $1`,
      [order.stock_update_id]
    );
    // Reset stock_update status
    await client.query(
      `UPDATE stock_updates
          SET status = 'pending', updated_at = NOW()
        WHERE id = $1`,
      [order.stock_update_id]
    );

    // Mark the order canceled
    const { rows: updRows } = await client.query(
      `UPDATE orders
          SET status     = 'canceled', updated_at = NOW()
        WHERE id = $1
      RETURNING *`,
      [orderId]
    );

    await client.query('COMMIT');
    res.json({ message: "Order canceled and reserved stock restored.", order: updRows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

/**
 * GET /api/manage-orders/user-pending-orders/:userId
 * Get pending orders for a specific user (for popover actions)
 */
async function getUserPendingOrders(req, res, next) {
  try {
    const userId = req.params.userId;
    
    const { rows } = await pool.query(`
      SELECT
        o.id,
        o.bnpl_platform,
        o.number_of_devices,
        o.sold_amount,
        o.sale_date,
        o.status,
        o.customer_name,
        m.first_name || ' ' || m.last_name AS marketer_name,
        m.unique_id AS marketer_unique_id,
        m.role AS marketer_role,

        -- pick product info from either the confirmed product_id or the original stock_update
        COALESCE(p1.device_name, p2.device_name)   AS device_name,
        COALESCE(p1.device_model, p2.device_model) AS device_model,
        COALESCE(p1.device_type,  p2.device_type)  AS device_type,

        COALESCE(
          ARRAY_AGG(ii.imei ORDER BY ii.id)
            FILTER (WHERE ii.imei IS NOT NULL),
          ARRAY[]::text[]
        ) AS imeis

      FROM orders o
      JOIN users m
        ON m.id = o.marketer_id

      -- product if already confirmed
      LEFT JOIN products p1
        ON p1.id = o.product_id
      -- otherwise via the original stock pickup
      LEFT JOIN stock_updates su
        ON su.id = o.stock_update_id
      LEFT JOIN products p2
        ON p2.id = su.product_id

      LEFT JOIN order_items oi
        ON oi.order_id = o.id
      LEFT JOIN inventory_items ii
        ON ii.id = oi.inventory_item_id

      WHERE o.status = 'pending'
        AND m.unique_id = $1

      GROUP BY
        o.id, o.bnpl_platform, o.number_of_devices, o.sold_amount,
        o.sale_date, o.status, o.customer_name,
        m.first_name, m.last_name, m.unique_id, m.role,
        p1.device_name, p1.device_model, p1.device_type,
        p2.device_name, p2.device_model, p2.device_type

      ORDER BY o.sale_date DESC
    `, [userId]);

    res.json({ orders: rows });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/manage-orders/bulk-actions
 * Perform bulk actions on selected orders
 */
async function performBulkActions(req, res, next) {
  const { orderIds, action } = req.body;
  
  if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
    return res.status(400).json({ message: "Order IDs are required." });
  }
  
  if (!action || !['confirm', 'cancel', 'reject'].includes(action)) {
    return res.status(400).json({ message: "Valid action is required (confirm, cancel, reject)." });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const results = [];
    const errors = [];

    for (const orderId of orderIds) {
      try {
        if (action === 'confirm') {
          // Use existing confirmOrder logic
          const { rows: ordRows } = await client.query(
            `SELECT status, stock_update_id, number_of_devices, marketer_id
               FROM orders
              WHERE id = $1`,
            [orderId]
          );
          
          if (!ordRows.length) {
            errors.push({ orderId, error: "Order not found" });
            continue;
          }
          
          const order = ordRows[0];
          if (order.status !== 'pending') {
            errors.push({ orderId, error: "Only pending orders can be confirmed" });
            continue;
          }

          // Confirm the order
          await client.query(
            `UPDATE orders
                SET status = 'confirmed', updated_at = NOW()
              WHERE id = $1`,
            [orderId]
          );

          // Update stock_update status
          if (order.stock_update_id) {
            await client.query(
              `UPDATE stock_updates
                  SET status = 'confirmed', updated_at = NOW()
                WHERE id = $1`,
              [order.stock_update_id]
            );
          }

          results.push({ orderId, status: 'confirmed' });
          
        } else if (action === 'cancel') {
          // Use existing cancelOrder logic
          const { rows: ordRows } = await client.query(
            `SELECT status, stock_update_id, number_of_devices
               FROM orders
              WHERE id = $1`,
            [orderId]
          );
          
          if (!ordRows.length) {
            errors.push({ orderId, error: "Order not found" });
            continue;
          }
          
          const order = ordRows[0];
          if (order.status !== 'pending') {
            errors.push({ orderId, error: "Only pending orders can be canceled" });
            continue;
          }

          if (order.stock_update_id) {
            // Restore reserved IMEIs
            await client.query(
              `UPDATE inventory_items
                  SET status = 'available', stock_update_id = NULL
                WHERE stock_update_id = $1`,
              [order.stock_update_id]
            );
            
            // Reset stock_update status
            await client.query(
              `UPDATE stock_updates
                  SET status = 'pending', updated_at = NOW()
                WHERE id = $1`,
              [order.stock_update_id]
            );
          }

          // Mark the order canceled
          await client.query(
            `UPDATE orders
                SET status = 'canceled', updated_at = NOW()
              WHERE id = $1`,
            [orderId]
          );

          results.push({ orderId, status: 'canceled' });
          
        } else if (action === 'reject') {
          // Mark as rejected
          await client.query(
            `UPDATE orders
                SET status = 'rejected', updated_at = NOW()
              WHERE id = $1`,
            [orderId]
          );

          results.push({ orderId, status: 'rejected' });
        }
      } catch (orderError) {
        errors.push({ orderId, error: orderError.message });
      }
    }

    await client.query('COMMIT');
    
    res.json({
      message: `Bulk ${action} completed`,
      results,
      errors,
      successCount: results.length,
      errorCount: errors.length
    });
    
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

/**
 * GET /api/manage-orders/analytics/bnpl
 * Get BNPL analytics data with daily/monthly/custom filters
 */
async function getBnplAnalytics(req, res, next) {
  try {
    const { period = 'month', startDate, endDate } = req.query;
    
    let dateFilter = '';
    let groupBy = '';
    
    if (period === 'custom' && startDate && endDate) {
      dateFilter = `WHERE o.sale_date >= $1::date AND o.sale_date <= $2::date`;
      groupBy = 'DATE(o.sale_date)';
    } else if (period === 'day') {
      dateFilter = `WHERE o.sale_date >= CURRENT_DATE - INTERVAL '30 days'`;
      groupBy = 'DATE(o.sale_date)';
    } else if (period === 'month') {
      dateFilter = `WHERE o.sale_date >= CURRENT_DATE - INTERVAL '12 months'`;
      groupBy = 'DATE_TRUNC(\'month\', o.sale_date)';
    }
    
    const query = `
      SELECT 
        ${groupBy} as period,
        bnpl_platform,
        COUNT(*) as order_count,
        SUM(number_of_devices) as total_devices,
        SUM(sold_amount) as total_amount,
        AVG(sold_amount) as avg_amount
      FROM orders o
      ${dateFilter}
        AND o.status IN ('confirmed', 'released_confirmed')
        AND o.bnpl_platform IS NOT NULL
      GROUP BY ${groupBy}, bnpl_platform
      ORDER BY period DESC, total_amount DESC
    `;
    
    const params = period === 'custom' && startDate && endDate ? [startDate, endDate] : [];
    const { rows } = await pool.query(query, params);
    
    // Calculate summary statistics
    const summary = {
      total_orders: 0,
      total_devices: 0,
      total_amount: 0,
      platforms: {}
    };
    
    rows.forEach(row => {
      summary.total_orders += parseInt(row.order_count);
      summary.total_devices += parseInt(row.total_devices);
      summary.total_amount += parseFloat(row.total_amount);
      
      if (!summary.platforms[row.bnpl_platform]) {
        summary.platforms[row.bnpl_platform] = {
          orders: 0,
          devices: 0,
          amount: 0
        };
      }
      
      summary.platforms[row.bnpl_platform].orders += parseInt(row.order_count);
      summary.platforms[row.bnpl_platform].devices += parseInt(row.total_devices);
      summary.platforms[row.bnpl_platform].amount += parseFloat(row.total_amount);
    });
    
    res.json({
      period,
      summary,
      data: rows
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getPendingOrders,
  confirmOrder,
  confirmOrderToDealer,
  getOrderHistory,
  getUserOrderSummary,
  getUserPendingOrders,
  performBulkActions,
  updateOrder,
  deleteOrder,
  getConfirmedOrderDetail,
  cancelOrder,
  getBnplAnalytics,
};
