// src/controllers/stockupdateController.js
const { pool } = require('../config/database');

/**
 * Helper function to notify stakeholders about pickup violations
 */
async function notifyViolationStakeholders(client, marketerId, violationMessage) {
  try {
    // Get marketer details
    const { rows: marketerRows } = await client.query(
      `SELECT unique_id, first_name, last_name, admin_id, super_admin_id 
       FROM users WHERE id = $1`,
      [marketerId]
    );
    
    if (!marketerRows.length) return;
    
    const marketer = marketerRows[0];
    const marketerName = `${marketer.first_name} ${marketer.last_name}`;
    
    // Get Admin details
    if (marketer.admin_id) {
      const { rows: adminRows } = await client.query(
        `SELECT unique_id FROM users WHERE id = $1`,
        [marketer.admin_id]
      );
      
      if (adminRows.length) {
        await client.query(
          `INSERT INTO notifications (user_unique_id, message, created_at)
           VALUES ($1, $2, NOW())`,
          [
            adminRows[0].unique_id,
            `VIOLATION ALERT: Marketer ${marketerName} (${marketer.unique_id}) has been blocked due to pickup violations. ${violationMessage}`
          ]
        );
      }
    }
    
    // Get SuperAdmin details
    if (marketer.super_admin_id) {
      const { rows: superAdminRows } = await client.query(
        `SELECT unique_id FROM users WHERE id = $1`,
        [marketer.super_admin_id]
      );
      
      if (superAdminRows.length) {
        await client.query(
          `INSERT INTO notifications (user_unique_id, message, created_at)
           VALUES ($1, $2, NOW())`,
          [
            superAdminRows[0].unique_id,
            `VIOLATION ALERT: Marketer ${marketerName} (${marketer.unique_id}) has been blocked due to pickup violations. ${violationMessage}`
          ]
        );
      }
    }
    
    // Notify all MasterAdmins
    const { rows: masterAdminRows } = await client.query(
      `SELECT unique_id FROM users WHERE role = 'MasterAdmin'`
    );
    
    for (const masterAdmin of masterAdminRows) {
      await client.query(
        `INSERT INTO notifications (user_unique_id, message, created_at)
         VALUES ($1, $2, NOW())`,
        [
          masterAdmin.unique_id,
          `ACCOUNT BLOCKED: Marketer ${marketerName} (${marketer.unique_id}) has been blocked due to pickup violations. Only MasterAdmin can unlock this account. ${violationMessage}`
        ]
      );
    }
  } catch (error) {
    console.error('Error notifying violation stakeholders:', error);
  }
}

/**
 * GET /api/marketer/stock-pickup/dealers
 * Returns all dealers in the logged-in marketer’s state.
 */
async function listStockPickupDealers(req, res, next) {
  try {
    const marketerId = req.user.id;
    const { rows: me } = await pool.query(
      `SELECT location FROM users WHERE id = $1`,
      [marketerId]
    );
    if (!me.length) {
      return res.status(404).json({ message: "Marketer not found." });
    }
    const state = me[0].location;

    const { rows: dealers } = await pool.query(
      `SELECT unique_id, business_name, location
         FROM users
        WHERE role = 'Dealer'
          AND location = $1
        ORDER BY business_name`,
      [state]
    );

    res.json({ dealers });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/marketer/stock-pickup/dealers/:dealerUniqueId/products
 * Returns all available products for that dealer (same state only).
 */
async function listStockProductsByDealer(req, res, next) {
  try {
    const marketerId = req.user.id;
    const { dealerUniqueId } = req.params;

    const { rows: me } = await pool.query(
      `SELECT location FROM users WHERE id = $1`,
      [marketerId]
    );
    if (!me.length) {
      return res.status(404).json({ message: "Marketer not found." });
    }
    const state = me[0].location;

    const { rows: dq } = await pool.query(
      `SELECT id FROM users
         WHERE unique_id = $1
           AND role      = 'Dealer'
           AND location  = $2`,
      [dealerUniqueId, state]
    );
    if (!dq.length) {
      return res.status(403).json({ message: "Dealer not in your location." });
    }
    const dealerId = dq[0].id;

    const { rows: products } = await pool.query(
      `SELECT
         p.id               AS product_id,
         p.device_name,
         p.device_model,
         p.device_type,
         p.selling_price,
         COUNT(i.*) FILTER (WHERE i.status = 'available')        AS qty_available,
         ARRAY_AGG(i.imei) FILTER (WHERE i.status = 'available') AS imeis_available
       FROM products p
       JOIN inventory_items i
         ON i.product_id = p.id
        AND i.status     = 'available'
      WHERE p.dealer_id = $1
      GROUP BY p.id, p.device_name, p.device_model, p.device_type, p.selling_price
      HAVING COUNT(i.*) FILTER (WHERE i.status = 'available') > 0`,
      [dealerId]
    );

    res.json({ products });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/marketer/stock-pickup
 * Create a new stock pickup (status = 'pending', reserves inventory_items).
 */
/**
 * 1) createStockUpdate
 *    Marketer picks up stock → creates a pending record.
 *    Only from dealers in the same state as the marketer.
 *    Deadline is 48 hrs from pickup.
 *    Enforces one active pickup AND quantity=1.
 */
const createStockUpdate = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const marketerUID = req.user.unique_id;

    await client.query('BEGIN');

    // 1) Fetch internal user ID & location
    const { rows: userRows } = await client.query(
      `SELECT id, location, locked FROM users WHERE unique_id = $1`,
      [marketerUID]
    );
    if (!userRows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Marketer not found.' });
    }
    const marketerId = userRows[0].id;
    const marketerState = userRows[0].location;
    const isLocked = userRows[0].locked;

    // 1.1) Check if account is locked
    if (isLocked) {
      await client.query('ROLLBACK');
      return res.status(403).json({ 
        message: 'Your account is locked. Please contact your Admin or MasterAdmin to unlock your account.',
        accountLocked: true
      });
    }

    // 2) Determine allowance (simplified - no allowance system)
    let allowance = 1; // Default to 1 unit per pickup
    let allowanceType = 'default';

    // 3) Check for active stock (including pending returns/transfers)
    const { rows: activeStockRows } = await client.query(
      `SELECT COUNT(*)::int AS cnt
         FROM stock_updates su
        WHERE su.marketer_id = $1 
          AND su.status IN ('picked_up', 'in_transit', 'return_pending', 'transfer_pending', 'pending_order')`,
      [marketerId]
    );
    const activeStockCount = activeStockRows[0].cnt;

    // 3.1) If user has active stock, prevent pickup (simplified - no violation tracking)
    if (activeStockCount > 0) {
      // Check for specific pending statuses to provide better error message
      const { rows: pendingStatusRows } = await client.query(`
        SELECT status, COUNT(*) as count
        FROM stock_updates 
        WHERE marketer_id = $1 AND status IN ('return_pending', 'transfer_pending')
        GROUP BY status
      `, [marketerId]);
      
      const hasPendingReturn = pendingStatusRows.some(row => row.status === 'return_pending');
      const hasPendingTransfer = pendingStatusRows.some(row => row.status === 'transfer_pending');
      
      let errorMessage = `You have ${activeStockCount} active stock unit(s). You must complete or return all active stock before picking up new stock.`;
      
      if (hasPendingReturn) {
        errorMessage = 'You have a pending return. Wait for MasterAdmin confirmation before picking up new stock.';
      } else if (hasPendingTransfer) {
        errorMessage = 'You have a pending transfer. Wait for MasterAdmin confirmation before picking up new stock.';
      }
      
      await client.query('ROLLBACK');
      return res.status(400).json({
        message: errorMessage,
        activeStockCount
      });
    }

    // 4) Count existing pending lines (original logic)
    const { rows: activeRows } = await client.query(
      `SELECT COUNT(*)::int AS cnt
         FROM stock_updates
        WHERE marketer_id = $1
          AND status = 'pending'`,
      [marketerId]
    );
    if (activeRows[0].cnt >= allowance) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        message: `You have reached your pickup allowance of ${allowance}.`
      });
    }

    // 4) Parse inputs
    const product_id = parseInt(req.body.product_id, 10);
    const qty = 1;  // always one unit

    // 5) Verify dealer is in same location
    const { rows: pdRows } = await client.query(
      `SELECT u.location
         FROM products p
         JOIN users u ON p.dealer_id = u.id
        WHERE p.id = $1`,
      [product_id]
    );
    if (!pdRows.length || pdRows[0].location !== marketerState) {
      await client.query('ROLLBACK');
      return res.status(403).json({
        message: 'Cannot pick up from a dealer outside your location.'
      });
    }

    // 6) Check available stock
    const { rows: cntRows } = await client.query(
      `SELECT COUNT(*)::int AS cnt
         FROM inventory_items
        WHERE product_id = $1
          AND status = 'available'`,
      [product_id]
    );
    if (cntRows[0].cnt < qty) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Not enough stock available.' });
    }

    // 7) Set fresh deadline for new pickup (48 hours from now)
    const deadline = new Date(Date.now() + 48 * 60 * 60 * 1000); // +48h

    // 8) Insert pickup line
    const insertQ = `
      INSERT INTO stock_updates
        (marketer_id, product_id, quantity, pickup_date, deadline, status)
      VALUES ($1, $2, $3, NOW(), $4, 'pending')
      RETURNING id, product_id, quantity, pickup_date, deadline, status
    `;
    const { rows: suRows } = await client.query(insertQ, [
      marketerId,
      product_id,
      qty,
      deadline
    ]);
    const stock = suRows[0];

    // 9) Reserve an inventory item
    const { rows: itemsToReserve } = await client.query(
      `SELECT id
         FROM inventory_items
        WHERE product_id = $1
          AND status = 'available'
        LIMIT $2
        FOR UPDATE SKIP LOCKED`,
      [product_id, qty]
    );
    const itemIds = itemsToReserve.map(r => r.id);
    await client.query(
      `UPDATE inventory_items
         SET status = 'reserved', stock_update_id = $1
       WHERE id = ANY($2::int[])`,
      [stock.id, itemIds]
    );

    // 10) Notify admin
    const { rows: adminQ } = await client.query(
      `SELECT u2.unique_id
         FROM users u
         JOIN users u2 ON u.admin_id = u2.id
        WHERE u.unique_id = $1`,
      [marketerUID]
    );
    const adminUniqueId = adminQ[0]?.unique_id;
    if (adminUniqueId) {
      await client.query(
        `INSERT INTO notifications (user_unique_id, message, created_at)
         VALUES ($1, $2, NOW())`,
        [
          adminUniqueId,
          `Marketer ${marketerUID} picked up 1 unit of product ${product_id}.`
        ]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({
      message: 'Stock pickup recorded successfully.',
      stock
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

/**
 * POST /api/marketer/stock-pickup/order
 * Place an order only from a pending pickup, record exact IMEIs sold.
 */
async function placeOrder(req, res, next) {
  const marketerUID = req.user.unique_id;
  const stock_update_id   = parseInt(req.body.stock_update_id,   10);
  const number_of_devices = parseInt(req.body.number_of_devices, 10);
  const sold_amount       = parseFloat(req.body.sold_amount);
  const {
    customer_name,
    customer_phone,
    customer_address,
    bnpl_platform
  } = req.body;

  // 0) Require a pickup
  if (!stock_update_id) {
    return res.status(400).json({
      message: "This endpoint only supports orders from an existing stock pickup. Please supply stock_update_id."
    });
  }
  if (!number_of_devices || number_of_devices < 1) {
    return res.status(400).json({ message: "Must supply a valid number_of_devices." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1) Lock & fetch the pending pickup
    const { rows: [pickup] } = await client.query(`
      SELECT id, product_id, quantity
        FROM stock_updates
       WHERE id           = $1
         AND marketer_id  = (SELECT id FROM users WHERE unique_id = $2)
         AND status       = 'pending'
         AND deadline > NOW()
       FOR UPDATE
    `, [ stock_update_id, marketerUID ]);

    if (!pickup) {
      return res.status(404).json({ message: "No active pending pickup found with that ID." });
    }
    if (pickup.quantity < number_of_devices) {
      return res.status(400).json({ message: "Not enough quantity remaining on that pickup." });
    }

    // 2) Update stock pickup status to 'pending_order' when order is placed
    await client.query(`
      UPDATE stock_updates
         SET status = 'pending_order',
             updated_at = NOW()
       WHERE id = $1
    `, [stock_update_id]);

    // 3) Create the order (pending until MasterAdmin confirms)
    const { rows: [order] } = await client.query(`
      INSERT INTO orders (
        marketer_id,
        product_id,
        stock_update_id,
        number_of_devices,
        sold_amount,
        customer_name,
        customer_phone,
        customer_address,
        bnpl_platform,
        earnings_per_device,
        status,
        sale_date,
        created_at
      ) VALUES (
        (SELECT id FROM users WHERE unique_id = $1),
        $2, $3, $4, $5,
        $6, $7, $8, $9, 0,
        'pending', NOW(), NOW()
      )
      RETURNING id
    `, [
      marketerUID,
      pickup.product_id,
      stock_update_id,
      number_of_devices,
      sold_amount,
      customer_name,
      customer_phone,
      customer_address,
      bnpl_platform || null
    ]);

    // 4) DO NOT mark inventory items as sold yet - they remain 'reserved' until MasterAdmin confirms
    // The inventory items will be marked as 'sold' when MasterAdmin confirms the order
    // This ensures the stock pickup countdown continues and values display correctly

    // 5) Record the reserved inventory items in order_items for tracking
    const { rows: items } = await client.query(`
      SELECT id
        FROM inventory_items
       WHERE stock_update_id = $1
         AND status          = 'reserved'
       LIMIT $2
       FOR UPDATE SKIP LOCKED
    `, [ stock_update_id, number_of_devices ]);

    const reservedItemIds = items.map(r => r.id);
    if (reservedItemIds.length) {
      // Record them in order_items but keep inventory status as 'reserved'
      for (let iid of reservedItemIds) {
      await client.query(`
        INSERT INTO order_items (order_id, inventory_item_id)
        VALUES ($1, $2)
      `, [ order.id, iid ]);
      }
    }

    // 6) Order confirmed (simplified - no allowance tracking)
    console.log(`Order confirmed for marketer ${marketerUID}`);

    await client.query("COMMIT");
    return res.status(201).json({
      message: "Order placed successfully. Stock pickup remains active until MasterAdmin confirms the order.",
      order
    });
  } catch (err) {
    await client.query("ROLLBACK");
    next(err);
  } finally {
    client.release();
  }
}

/**
 * POST /api/marketer/stock-pickup/:id/transfer
 * Request a transfer – only if status = 'pending'
 */
/**
 * 3) requestStockTransfer
 *    Marketer requests to move one of their own 'pending' pickups to another marketer.
 */
async function requestStockTransfer(req, res, next) {
  try {
    const stockUpdateId     = parseInt(req.params.id, 10);
    const { targetIdentifier, reason } = req.body;        // unique_id and reason
    const currentUserId = req.user.id;

    // 1) Verify this pickup exists, belongs to current user, and is still pending
    const { rows: suRows } = await pool.query(`
      SELECT marketer_id, status
        FROM stock_updates
       WHERE id = $1
    `, [stockUpdateId]);
    if (!suRows.length) {
      return res.status(404).json({ message: "Stock pickup not found." });
    }
    const su = suRows[0];
    if (su.marketer_id !== currentUserId) {
      return res.status(403).json({ message: "Not your stock pickup." });
    }
    if (su.status !== 'pending') {
      return res.status(400).json({ message: "Only pending pickups can be transferred." });
    }

    // 2) Resolve the target user (Marketer, Admin, or SuperAdmin)
    const { rows: tgtRows } = await pool.query(`
      SELECT id, unique_id, first_name, last_name, location, role
        FROM users
       WHERE role IN ('Marketer', 'Admin', 'SuperAdmin')
         AND unique_id = $1
    `, [targetIdentifier]);
    if (!tgtRows.length) {
      return res.status(404).json({ message: "Target user not found." });
    }
    const target = tgtRows[0];

    // 3) Ensure they're in the same location
    const { rows: meRows } = await pool.query(`
      SELECT location
        FROM users
       WHERE id = $1
    `, [currentUserId]);
    const myLoc = meRows[0].location;
    if (target.location !== myLoc) {
      return res.status(400).json({ message: "Transfers must stay within the same location." });
    }

    // 4) Ensure target has no live pickups
    const { rows: active } = await pool.query(`
      SELECT 1
        FROM stock_updates
       WHERE marketer_id = $1
         AND status IN ('pending','transfer_pending')
       LIMIT 1
    `, [ target.id ]);
    if (active.length) {
      return res.status(400).json({
        message: "Target user already has an active pickup—cannot transfer."
      });
    }

    // 5) Mark this pickup as transfer_pending with reason
    await pool.query(`
      UPDATE stock_updates
         SET status          = 'transfer_pending',
             transfer_to_marketer_id = $1,
             transfer_reason = $2,
             updated_at       = NOW()
       WHERE id = $3
    `, [ target.id, reason || '', stockUpdateId ]);

    res.json({
      message: "Transfer requested successfully.",
      transfer: {
        stock_update_id: stockUpdateId,
        to: {
          unique_id: target.unique_id,
          name:      `${target.first_name} ${target.last_name}`,
          location:  target.location,
          role:      target.role
        },
        reason: reason || '',
        status: 'transfer_pending'
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * 4) approveStockTransfer
 *    MasterAdmin approves or rejects pending transfers.
 */
async function approveStockTransfer(req, res, next) {
  try {
    if (req.user.role !== 'MasterAdmin') {
      return res.status(403).json({ message: "Only MasterAdmin may approve or reject." });
    }
    const id = parseInt(req.params.id, 10);
    const { action } = req.body; // 'approve' or 'reject'
    if (!['approve','reject'].includes(action)) {
      return res.status(400).json({ message: "Invalid action." });
    }

    let result;
    if (action === 'approve') {
      // FINALIZE transfer: mark as 'transfer_approved' (a terminal state)
      const { rows } = await pool.query(`
        UPDATE stock_updates
           SET marketer_id      = transfer_to_marketer_id,
               transfer_to_marketer_id = NULL,
               status           = 'transfer_approved',
               transfer_approved_at   = NOW(),
               updated_at       = NOW()
         WHERE id = $1
         RETURNING *
      `, [id]);
      result = rows;
    } else {
      // reject transfer: back to 'pending'
      const { rows } = await pool.query(`
        UPDATE stock_updates
           SET transfer_to_marketer_id = NULL,
               status           = 'pending',
               updated_at       = NOW()
         WHERE id = $1
         RETURNING *
      `, [id]);
      result = rows;
    }

    if (!result.length) {
      return res.status(404).json({ message: "Transfer record not found." });
    }
    res.json({
      message: `Transfer ${action}d successfully.`,
      stock: result[0]
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/marketer/stock-pickup/marketer
 * List this marketer’s pickups.
 */
async function getMarketerStockUpdates(req, res, next) {
  try {
    const marketerUid = req.user.unique_id;
    if (!marketerUid) {
      return res.status(400).json({ message: "Missing marketer unique_id" });
    }

    const sql = `
      SELECT
        su.id,
        su.product_id,
        su.quantity,
        su.pickup_date,
        su.deadline,
        su.status,
        p.device_name,
        p.device_model,
        p.selling_price,
        (su.quantity * p.selling_price) AS total_value
      FROM stock_updates su
      JOIN users u
        ON su.marketer_id = u.id
      JOIN products p
        ON su.product_id = p.id
      WHERE u.unique_id = $1
      ORDER BY su.pickup_date DESC
    `;

    const { rows } = await pool.query(sql, [marketerUid]);
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/marketer/stock-pickup
 * (Master/Admin) list all pickups with human-friendly status
 */
async function getStockUpdates(req, res, next) {
  try {
    const { rows } = await pool.query(`
      SELECT
        su.id,
        p.device_name,
        p.device_model,
        d.business_name       AS dealer_name,
        d.location            AS dealer_location,
        su.quantity,
        su.pickup_date,
        su.deadline,

        -- map every status to a friendly label
        CASE
          WHEN su.status = 'return_pending'   THEN 'Pending Return'
          WHEN su.status = 'returned'         THEN 'Returned'
          WHEN su.status = 'transfer_pending' THEN 'Pending Transfer'
          WHEN su.status = 'transfer_approved' THEN 'Transfer Approved'
          WHEN su.status = 'transfer_rejected' THEN 'Transfer Rejected'
          WHEN su.status = 'pending_order'    THEN 'Pending Order'
          WHEN EXISTS (
            SELECT 1
              FROM orders o
             WHERE o.stock_update_id = su.id
               AND o.status IN ('confirmed','released_confirmed')
          ) THEN 'Sold'
          WHEN su.deadline < NOW() THEN 'Expired'
          ELSE 'Pending'
        END AS status,

        m.first_name || ' ' || m.last_name   AS marketer_name,
        m.unique_id                         AS marketer_unique_id,
        tgt.first_name || ' ' || tgt.last_name AS transfer_to_name,
        tgt.unique_id                           AS transfer_to_uid
      FROM stock_updates su
      JOIN products p    ON p.id = su.product_id
      JOIN users d       ON d.id = p.dealer_id
      JOIN users m       ON m.id = su.marketer_id
      LEFT JOIN users tgt ON tgt.id = su.transfer_to_marketer_id
      ORDER BY su.pickup_date DESC;
    `);

    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/marketer/stock-pickup/:id/return
 * MasterAdmin confirms a return → status='returned', stop timer,
 * release any reserved IMEIs back to 'available', clear their stock_update_id.
 */
// PATCH /api/marketer/stock-pickup/:id/return
// src/controllers/stockupdateController.js

// src/controllers/stockupdateController.js

async function confirmReturn(req, res, next) {
  if (req.user.role !== 'MasterAdmin') {
    return res.status(403).json({ message: "Only MasterAdmin may confirm returns." });
  }

  const stockUpdateId = Number(req.params.id);
  if (!Number.isInteger(stockUpdateId)) {
    return res.status(400).json({ message: "Invalid pickup ID." });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1) Lock the pending-return row and get product_id + quantity
    const { rows: [lockRow] } = await client.query(
      `SELECT product_id, quantity
         FROM stock_updates
        WHERE id = $1
          AND status = 'return_pending'
        FOR UPDATE`,
      [stockUpdateId]
    );
    if (!lockRow) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: "No pending return found." });
    }
    const { product_id, quantity } = lockRow;

    // 2) Mark the stock_update as returned
    const { rows: [pickup] } = await client.query(
      `UPDATE stock_updates
          SET status      = 'returned',
              returned_at = NOW(),
              updated_at  = NOW()
        WHERE id = $1
        RETURNING *`,
      [stockUpdateId]
    );

    // 3) Release any reserved IMEIs
    await client.query(
      `UPDATE inventory_items
          SET status          = 'available',
              stock_update_id = NULL
        WHERE stock_update_id = $1
          AND status = 'reserved'`,
      [stockUpdateId]
    );

    // 4) **Restock the product** by bumping the `quantity` column
    await client.query(
      `UPDATE products
          SET quantity   = quantity + $1,
              updated_at = NOW()
        WHERE id = $2`,
      [quantity, product_id]
    );

    // 5) Notify all parties involved
    const { rows: [user] } = await client.query(
      `SELECT u.unique_id, u.admin_id, a.super_admin_id
         FROM users u
         LEFT JOIN users a ON u.admin_id = a.id
         JOIN stock_updates su ON su.marketer_id = u.id
        WHERE su.id = $1`,
      [stockUpdateId]
    );
    
    if (user?.unique_id) {
      // Notify marketer
      await client.query(
        `INSERT INTO notifications (user_unique_id, message, created_at)
         VALUES ($1, $2, NOW())`,
        [
          user.unique_id,
          `Your stock pickup #${stockUpdateId} has been returned and restocked by MasterAdmin.`
        ]
      );
      
      // Notify marketer's admin
      if (user.admin_id) {
        const { rows: [admin] } = await client.query(
          `SELECT unique_id FROM users WHERE id = $1`,
          [user.admin_id]
        );
        if (admin?.unique_id) {
          await client.query(
            `INSERT INTO notifications (user_unique_id, message, created_at)
             VALUES ($1, $2, NOW())`,
            [
              admin.unique_id,
              `Marketer ${user.unique_id}'s stock pickup #${stockUpdateId} has been returned and restocked.`
            ]
          );
        }
      }
      
      // Notify marketer's superadmin
      if (user.super_admin_id) {
        const { rows: [superadmin] } = await client.query(
          `SELECT unique_id FROM users WHERE id = $1`,
          [user.super_admin_id]
        );
        if (superadmin?.unique_id) {
          await client.query(
            `INSERT INTO notifications (user_unique_id, message, created_at)
             VALUES ($1, $2, NOW())`,
            [
              superadmin.unique_id,
              `Stock pickup #${stockUpdateId} in your chain has been returned and restocked.`
            ]
          );
        }
      }
      
      // Notify all MasterAdmins
      await client.query(
        `INSERT INTO notifications (user_unique_id, message, created_at)
         SELECT unique_id, $1, NOW()
         FROM users WHERE role = 'MasterAdmin'`,
        [
          `Stock pickup #${stockUpdateId} has been returned and restocked.`
        ]
      );
    }

    await client.query('COMMIT');
    res.json({
      message: "Return confirmed, reserved units released and product inventory restocked.",
      stock: pickup
    });

  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

/**
 * PATCH /api/marketer/stock-pickup/:id/transfer
 * MasterAdmin only: approve or reject a pending transfer
 */
async function reviewStockTransfer(req, res, next) {
  try {
    if (req.user.role !== 'MasterAdmin') {
      return res.status(403).json({ message: "Only MasterAdmin may approve or reject transfers." });
    }

    const transferId = Number(req.params.id);
    const { action } = req.body; // 'approve' or 'reject'
    if (!['approve','reject'].includes(action)) {
      return res.status(400).json({ message: "Invalid action. Must be 'approve' or 'reject'." });
    }

    let query, params = [transferId];

    if (action === 'approve') {
      // move the stock to the new marketer, mark transfer approved
      query = `
        UPDATE stock_updates
           SET marketer_id             = transfer_to_marketer_id,
               transfer_to_marketer_id = NULL,
               status                   = 'transfer_approved',
               transfer_approved_at    = NOW(),
               updated_at              = NOW()
         WHERE id = $1
         RETURNING *
      `;
    } else {
      // clear the pending transfer, mark transfer rejected
      query = `
        UPDATE stock_updates
           SET transfer_to_marketer_id = NULL,
               status                   = 'transfer_rejected',
               updated_at              = NOW()
         WHERE id = $1
         RETURNING *
      `;
    }

    const { rows } = await pool.query(query, params);
    if (!rows.length) {
      return res.status(404).json({ message: "Transfer record not found." });
    }

    const transfer = rows[0];

    // Notify all parties involved
    const { rows: [user] } = await pool.query(
      `SELECT u.unique_id, u.admin_id, a.super_admin_id
         FROM users u
         LEFT JOIN users a ON u.admin_id = a.id
         JOIN stock_updates su ON su.id = $1`,
      [transferId]
    );
    
    if (user?.unique_id) {
      // Notify marketer
      await pool.query(
        `INSERT INTO notifications (user_unique_id, message, created_at)
         VALUES ($1, $2, NOW())`,
        [
          user.unique_id,
          `Your stock pickup #${transferId} transfer has been ${action}d by MasterAdmin.`
        ]
      );
      
      // Notify marketer's admin
      if (user.admin_id) {
        const { rows: [admin] } = await pool.query(
          `SELECT unique_id FROM users WHERE id = $1`,
          [user.admin_id]
        );
        if (admin?.unique_id) {
          await pool.query(
            `INSERT INTO notifications (user_unique_id, message, created_at)
             VALUES ($1, $2, NOW())`,
            [
              admin.unique_id,
              `Marketer ${user.unique_id}'s stock pickup #${transferId} transfer has been ${action}d.`
            ]
          );
        }
      }
      
      // Notify marketer's superadmin
      if (user.super_admin_id) {
        const { rows: [superadmin] } = await pool.query(
          `SELECT unique_id FROM users WHERE id = $1`,
          [user.super_admin_id]
        );
        if (superadmin?.unique_id) {
          await pool.query(
            `INSERT INTO notifications (user_unique_id, message, created_at)
             VALUES ($1, $2, NOW())`,
            [
              superadmin.unique_id,
              `Stock pickup #${transferId} transfer in your chain has been ${action}d.`
            ]
          );
        }
      }
      
      // Notify all MasterAdmins
      await pool.query(
        `INSERT INTO notifications (user_unique_id, message, created_at)
         SELECT unique_id, $1, NOW()
         FROM users WHERE role = 'MasterAdmin'`,
        [
          `Stock pickup #${transferId} transfer has been ${action}d.`
        ]
      );
    }

    return res.json({
      message: `Transfer ${action}d successfully.`,
      stock: transfer
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/superadmin/stock-updates
 * Returns *only* those stock‐pickups for marketers whose admin_id → super_admin_id  
 * matches the current super-admin’s unique_id. Includes deadline for countdown.
 */
async function listSuperAdminStockUpdates(req, res, next) {
  try {
    const superUid = req.user.unique_id;
    if (!superUid) {
      return res.status(400).json({ message: "SuperAdmin unique_id missing." });
    }

    const { rows } = await pool.query(`
      SELECT
        su.id,
        p.device_name,
        p.device_model,
        su.quantity,
        su.pickup_date,
        su.deadline,

        -- derive status
        CASE
          WHEN EXISTS (
            SELECT 1
            FROM orders o
            WHERE o.stock_update_id = su.id
              AND o.status IN ('confirmed','released_confirmed')
          ) THEN 'sold'
          WHEN su.deadline < NOW() THEN 'expired'
          ELSE 'pending'
        END AS status,

        m.unique_id                         AS marketer_unique_id,
        m.first_name || ' ' || m.last_name  AS marketer_name,
        a.unique_id                         AS admin_unique_id,
        a.first_name  || ' ' || a.last_name AS admin_name

      FROM stock_updates su
      JOIN products p ON p.id = su.product_id
      JOIN users m   ON m.id = su.marketer_id
      JOIN users a   ON a.id = m.admin_id
      JOIN users s   ON s.id = a.super_admin_id
      WHERE s.unique_id = $1
      ORDER BY su.pickup_date DESC
    `, [superUid]);

    // Match your frontend’s expectation: { data: rows }
    return res.json({ data: rows });
  } catch (err) {
    next(err);
  }
}


/**
 * GET /api/marketer/stock-pickup/:admin
 * (Admin view) list all pickups under this admin
 */
async function getStockUpdatesForAdmin(req, res, next) {
  try {
    const adminId = req.user.id;
    const { rows } = await pool.query(`
      SELECT
        su.id,
        m.first_name || ' ' || m.last_name AS marketer_name,
        p.device_name,
        p.device_model,
        su.quantity,
        su.pickup_date,
        su.deadline,

        CASE
          WHEN su.status = 'return_pending'   THEN 'Pending Return'
          WHEN su.status = 'returned'         THEN 'Returned'
          WHEN su.status = 'transfer_pending' THEN 'Pending Transfer'
          WHEN su.status = 'transfer_approved' THEN 'Transfer Approved'
          WHEN su.status = 'transfer_rejected' THEN 'Transfer Rejected'
          WHEN su.status = 'pending_order'    THEN 'Pending Order'
          WHEN EXISTS (
            SELECT 1
              FROM orders o
             WHERE o.stock_update_id = su.id
               AND o.status IN ('confirmed','released_confirmed')
          ) THEN 'Sold'
          WHEN su.deadline < NOW() THEN 'Expired'
          ELSE 'Pending'
        END AS status

      FROM stock_updates su
      JOIN users m    ON su.marketer_id = m.id
      JOIN products p ON su.product_id  = p.id
     WHERE m.admin_id = $1
     ORDER BY su.pickup_date DESC;
    `, [adminId]);

    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/marketer/stock-pickup/:id/return-request
async function requestReturn(req, res, next) {
  try {
    const marketerId = req.user.id;
    const id = parseInt(req.params.id, 10);

    // 1) Ensure it’s your own pending pickup
    const { rows } = await pool.query(
      `SELECT status, marketer_id
         FROM stock_updates
        WHERE id = $1`,
      [id]
    );
    const pickup = rows[0];
    if (!pickup || pickup.marketer_id !== marketerId) {
      return res.status(403).json({ message: "Not your pickup." });
    }
    if (pickup.status !== 'pending') {
      return res.status(400).json({ message: "Can only request return on pending pickups." });
    }

    // 2) Mark as return_pending
    const { rows: updated } = await pool.query(
      `UPDATE stock_updates
          SET status              = 'return_pending',
              return_requested_at = NOW(),
              updated_at          = NOW()
        WHERE id = $1
        RETURNING *`,
      [id]
    );

    res.json({
      message: "Return requested, awaiting MasterAdmin confirmation.",
      stock: updated[0]
    });
  } catch (err) {
    next(err);
  }
}

// … all your existing methods (listStockPickupDealers, createStockUpdate, placeOrder, etc.) …

/**
 * POST /api/marketer/stock-pickup/request
 * Marketer asks for permission to pick up up to 3 units instead of the default 1.
 */
async function requestAdditionalPickup(req, res, next) {
  const marketerId = req.user.id;

  try {
    // Try to insert a new “pending” request.
    // If one already exists with status 'pending' or 'approved',
    // the unique constraint on (marketer_id) will throw 23505.
    const { rows } = await pool.query(`
      INSERT INTO additional_pickup_requests
        (marketer_id, status)
      VALUES ($1, 'pending')
      RETURNING id, status;
    `, [marketerId]);

    // Insert succeeded ⇒ return success JSON.
    res.status(201).json({
      message: "Additional pickup request submitted.",
      request: rows[0]
    });
  } catch (err) {
    if (err.code === '23505') {
      // Already have a “pending” or “approved” request
      return res.status(400).json({
        message: "You already have an active additional-pickup request."
      });
    }
    next(err);
  }
}
/**
 * GET /api/marketer/stock-pickup/allowance
 * Returns { allowance: 1 } by default, or 3 if they have an approved request.
 */
// GET /marketer/allowance
async function getAllowance(req, res, next) {
  try {
    // 1) look up your internal user ID
    const marketerUnique = req.user.unique_id;
    const { rows: [u] } = await pool.query(
      `SELECT id FROM users WHERE unique_id = $1`, 
      [marketerUnique]
    );
    if (!u) return res.status(404).json({ message: 'User not found' });
    const marketerId = u.id;

    // 2) fetch any extra-pickup request
    const { rows } = await pool.query(
    `SELECT status, next_request_allowed_at
       FROM additional_pickup_requests
      WHERE marketer_id = $1
      ORDER BY reviewed_at DESC, created_at DESC
      LIMIT 1`,
    [marketerId]
  );
    
    // 3) default values
    let allowance             = 1;
    let request_status        = null;
    let next_request_allowed_at = null;

    if (rows.length) {
      const rec = rows[0];
      request_status           = rec.status;
      next_request_allowed_at  = rec.next_request_allowed_at;

      // if approved *and* not locked out by next_request_allowed_at
      if (
        rec.status === 'approved' &&
        (!rec.next_request_allowed_at || rec.next_request_allowed_at < new Date())
      ) {
        allowance = 3;   // <-- bump this to however many lines you want
        next_request_allowed_at = null;
      }
    }

    return res.json({
      allowance,
      request_status,
      next_request_allowed_at
    });
  } catch (err) {
    next(err);
  }
}
/**
 * GET /api/stock-pickup/requests
 * MasterAdmin: list all pending additional-pickup requests.
 */
async function listExtraPickupRequests(req, res, next) {
  if (req.user.role !== 'MasterAdmin') {
    return res.status(403).json({ message: "Only MasterAdmin may review." });
  }

  try {
    const { rows } = await pool.query(`
      SELECT
        r.id,
        u.first_name || ' ' || u.last_name AS marketer_name,
        u.unique_id                       AS marketer_uid,
        r.created_at                      AS requested_at,
        r.status
      FROM additional_pickup_requests r
      JOIN users u ON r.marketer_id = u.id
      WHERE r.status = 'pending'
      ORDER BY r.created_at DESC
    `);

    // match what your front-end expects:
    res.json({ requests: rows });
  } catch (err) {
    next(err);
  }
}
/**
 * PATCH /api/stock-pickup/requests/:id
 * MasterAdmin approves or rejects a pending extra-pickup request.
 * We will no longer set a 7-day next_request_allowed_at; instead, if rejected,
 * we delete the row so the marketer can submit again immediately.
 */
async function reviewExtraPickupRequest(req, res, next) {
  if (req.user.role !== 'MasterAdmin') {
    return res.status(403).json({ message: "Only MasterAdmin may review." });
  }

  const id     = parseInt(req.params.id, 10);
  const action = req.body.action; // 'approve' or 'reject'
  if (!['approve','reject'].includes(action)) {
    return res.status(400).json({ message: "Invalid action." });
  }

  const status      = action === 'approve' ? 'approved' : 'rejected';
  const reviewerUid = req.user.unique_id;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1) Update status and reviewer_id
    const { rows: updatedRows } = await client.query(`
      UPDATE additional_pickup_requests
         SET status      = $2,
             reviewed_at = NOW(),
             reviewer_id = (
               SELECT id
                 FROM users
                WHERE unique_id = $3
             )
       WHERE id = $1
       RETURNING *
    `, [id, status, reviewerUid]);

    if (!updatedRows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: "Request not found." });
    }

    const updatedRequest = updatedRows[0];

    // 2) Notify the marketer (whoever owns this request)
    const { rows: marketerRows } = await client.query(`
      SELECT u.unique_id
        FROM users u
        JOIN additional_pickup_requests r
          ON r.marketer_id = u.id
       WHERE r.id = $1
    `, [id]);

    if (marketerRows[0]?.unique_id) {
      await client.query(`
        INSERT INTO notifications (user_unique_id, message, created_at)
        VALUES ($1, $2, NOW())
      `, [
        marketerRows[0].unique_id,
        status === 'approved'
          ? `Your extra-pickup request has been approved. You may now pick up up to 3 items.`
          : `Your extra-pickup request has been rejected. You may request again at any time.`
      ]);
    }

    // 3) If rejected, delete that row so they can insert a new one immediately
    if (status === 'rejected') {
      await client.query(`
        DELETE FROM additional_pickup_requests
         WHERE id = $1
      `, [id]);
    }

    await client.query('COMMIT');
    return res.json({
      message: `Request ${status}.`,
      request: updatedRequest
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}



/**
 * PATCH /api/marketer/notifications/:id/read
 * Mark one notification as read.
 */
async function markNotificationRead(req, res, next) {
  await pool.query(`
    UPDATE notifications
       SET is_read = TRUE
     WHERE id = $1
       AND user_unique_id = $2
  `, [ Number(req.params.id), req.user.unique_id ]);
  res.sendStatus(204);
}


async function createBulkPickup(req, res, next) {
  const marketerId = req.user.id;
  const { lines, total } = req.bulk;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1) Check for a one-time “approved” extra-pickup. If found, allow 3 and delete it.
    const { rows: arows } = await client.query(
      `
      SELECT id
        FROM additional_pickup_requests
       WHERE marketer_id = $1
         AND status = 'approved'
       LIMIT 1
      `,
      [marketerId]
    );

    let allowance = 1;
    if (arows.length) {
      allowance = 3;
      // Consume that approval so it won’t be used again
      await client.query(
        `
        DELETE FROM additional_pickup_requests
         WHERE id = $1
        `,
        [arows[0].id]
      );
    }

    if (total > allowance) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: `Your allowance is ${allowance}` });
    }

    // 2) verify each product has enough stock
    for (let { product_id, quantity } of lines) {
      const { rows: crow } = await client.query(
        `
        SELECT COUNT(*)::int AS cnt
          FROM inventory_items
         WHERE product_id = $1
           AND status     = 'available'
        `,
        [product_id]
      );
      if (crow[0].cnt < quantity) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          message: `Not enough stock for product ${product_id}`
        });
      }
    }

    // 3) insert stock_update (48h deadline)
    const { rows: suRows } = await client.query(
      `
      INSERT INTO stock_updates
        (marketer_id, pickup_date, deadline, status)
      VALUES
        ($1, NOW(), NOW() + INTERVAL '48 hours', 'pending')
      RETURNING id
      `,
      [marketerId]
    );
    const stockId = suRows[0].id;

    // 4) insert pickup_items and reserve inventory
    for (let { product_id, quantity } of lines) {
      // record how many of this product in pickup_items
      await client.query(
        `
        INSERT INTO pickup_items (stock_update_id, product_id, quantity)
        VALUES ($1, $2, $3)
        `,
        [stockId, product_id, quantity]
      );

      // reserve exactly “quantity” available inventory_ids
      const { rows: items } = await client.query(
        `
        SELECT id
          FROM inventory_items
         WHERE product_id = $1
           AND status     = 'available'
         LIMIT $2
         FOR UPDATE SKIP LOCKED
        `,
        [product_id, quantity]
      );
      const ids = items.map(r => r.id);

      await client.query(
        `
        UPDATE inventory_items
           SET status          = 'reserved',
               stock_update_id = $1
         WHERE id = ANY($2::int[])
        `,
        [stockId, ids]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({
      message: "Bulk pickup recorded",
      stock_update_id: stockId
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

/**
 * Check if marketer is eligible for additional pickup
 */
async function checkAdditionalPickupEligibility(req, res, next) {
  try {
    const marketerId = req.user.id;
    
    // Check if marketer has placed at least one confirmed order
    const orderCheck = await pool.query(`
      SELECT COUNT(*) as confirmed_orders
      FROM orders o
      JOIN stock_updates su ON su.id = o.stock_update_id
      WHERE su.marketer_id = $1 AND o.status = 'confirmed'
    `, [marketerId]);
    
    const hasConfirmedOrder = parseInt(orderCheck.rows[0].confirmed_orders) > 0;
    
    // Initialize defaults for tables that might not exist
    let hasPendingCompletion = false;
    let hasPendingRequest = false;
    
    // Check if previous additional pickup is completed (with error handling)
    try {
      const completionCheck = await pool.query(`
        SELECT COUNT(*) as pending_completions
        FROM pickup_allowance_history pah
        WHERE pah.marketer_id = $1 
          AND pah.allowance_type = 'additional'
          AND pah.status = 'active'
          AND pah.units_completed < pah.units_allocated
      `, [marketerId]);
      
      hasPendingCompletion = parseInt(completionCheck.rows[0].pending_completions) > 0;
    } catch (tableError) {
      console.log('pickup_allowance_history table does not exist, skipping check');
      hasPendingCompletion = false;
    }
    
    // Check if there's already a pending additional pickup request (with error handling)
    let cooldownActive = false;
    let cooldownUntil = null;
    
    try {
      const requestCheck = await pool.query(`
        SELECT COUNT(*) as pending_requests
        FROM additional_pickup_requests
        WHERE marketer_id = $1 AND status = 'pending'
      `, [marketerId]);
      
      hasPendingRequest = parseInt(requestCheck.rows[0].pending_requests) > 0;
      
      // Check for cooldown (24 hours after rejection)
      const cooldownCheck = await pool.query(`
        SELECT reviewed_at
        FROM additional_pickup_requests
        WHERE marketer_id = $1 AND status = 'rejected'
        ORDER BY reviewed_at DESC
        LIMIT 1
      `, [marketerId]);
      
      if (cooldownCheck.rows.length > 0) {
        const rejectedAt = new Date(cooldownCheck.rows[0].reviewed_at);
        const cooldownEnd = new Date(rejectedAt.getTime() + 24 * 60 * 60 * 1000); // 24 hours
        const now = new Date();
        
        if (now < cooldownEnd) {
          cooldownActive = true;
          cooldownUntil = cooldownEnd.toISOString();
        }
      }
    } catch (tableError) {
      console.log('additional_pickup_requests table does not exist, skipping check');
      hasPendingRequest = false;
      cooldownActive = false;
    }
    
    const isEligible = hasConfirmedOrder && !hasPendingCompletion && !hasPendingRequest && !cooldownActive;
    
    let message = 'You are eligible for additional pickup request';
    if (!hasConfirmedOrder) {
      message = 'You must have at least one confirmed order to request additional pickup';
    } else if (hasPendingCompletion) {
      message = 'You must complete your current additional pickup before requesting another';
    } else if (hasPendingRequest) {
      message = 'You already have a pending additional pickup request';
    } else if (cooldownActive) {
      message = 'You must wait 24 hours after rejection before requesting additional pickup again';
    } else if (!isEligible) {
      message = 'You are not eligible for additional pickup request';
    }
    
    res.json({
      success: true,
      eligible: isEligible,
      hasConfirmedOrder,
      hasPendingCompletion,
      hasPendingRequest,
      cooldownActive,
      cooldownUntil,
      message
    });
    
  } catch (error) {
    console.error('Check eligibility error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check eligibility',
      error: error.message
    });
  }
}

/**
 * Track pickup completion (sold/returned/transferred)
 */
async function trackPickupCompletion(req, res, next) {
  try {
    const { pickupId, completionType, notes } = req.body;
    const marketerId = req.user.id;
    
    // Verify pickup belongs to marketer
    const pickupCheck = await pool.query(`
      SELECT id FROM stock_updates 
      WHERE id = $1 AND marketer_id = $2
    `, [pickupId, marketerId]);
    
    if (pickupCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Pickup not found' });
    }
    
    // Track completion (simplified - no completion tracking table)
    console.log(`Pickup completion tracked: ${pickupId}, type: ${completionType}`);
    
    // Update stock_updates status
    await pool.query(`
      UPDATE stock_updates 
      SET status = $1, updated_at = NOW()
      WHERE id = $2
    `, [completionType === 'sold' ? 'sold' : 'returned', pickupId]);
    
    // Notify MasterAdmin for confirmation (if not sold)
    if (completionType !== 'sold') {
      await pool.query(`
        INSERT INTO notifications (user_unique_id, message, created_at)
        SELECT unique_id, $1, NOW()
        FROM users WHERE role = 'MasterAdmin'
      `, [`Pickup ${pickupId} requires confirmation for ${completionType}`]);
    }
    
    res.json({
      success: true,
      message: `Pickup completion tracked successfully`,
      completionId: pickupId
    });
    
  } catch (error) {
    console.error('Track completion error:', error);
    next(error);
  }
}

/**
 * MasterAdmin confirm return/transfer
 */
async function confirmReturnTransfer(req, res, next) {
  try {
    const { completionId, action } = req.body; // action: 'confirm' or 'reject'
    const masterAdminId = req.user.id;
    
    if (req.user.role !== 'MasterAdmin') {
      return res.status(403).json({ message: 'Only MasterAdmin can confirm returns/transfers' });
    }
    
    // Completion confirmation (simplified - no completion tracking table)
    console.log(`Completion ${action} by MasterAdmin ${masterAdminId} for completion ${completionId}`);
    
    // For now, just return success - in a real system you'd need to track this differently
    const pickup_id = completionId; // Simplified
    const completion_type = 'unknown';
    
    if (action === 'confirm') {
      // Return/transfer confirmed (simplified - no allowance tracking)
      console.log(`Return/transfer confirmed for pickup ${pickup_id}`);
    }
    
    // Notify marketer about confirmation
    await pool.query(`
      INSERT INTO notifications (user_unique_id, message, created_at)
      SELECT unique_id, $1, NOW()
      FROM users WHERE id = (
        SELECT marketer_id FROM stock_updates WHERE id = $2
      )
    `, [
      `Your ${completion_type} has been ${action === 'confirm' ? 'confirmed' : 'rejected'} by MasterAdmin`,
      pickup_id
    ]);
    
    res.json({
      success: true,
      message: `Return/transfer ${action === 'confirm' ? 'confirmed' : 'rejected'} successfully`
    });
    
  } catch (error) {
    console.error('Confirm return/transfer error:', error);
    next(error);
  }
}

/**
 * MasterAdmin unlock blocked account
 */
async function unlockBlockedAccount(req, res, next) {
  try {
    const { userId } = req.params;
    const { unlockReason } = req.body;
    const masterAdminId = req.user.id;
    
    if (req.user.role !== 'MasterAdmin') {
      return res.status(403).json({ message: 'Only MasterAdmin can unlock accounts' });
    }
    
    // Check if user exists and is locked
    const { rows: userRows } = await pool.query(
      `SELECT id, unique_id, first_name, last_name, locked 
       FROM users WHERE id = $1`,
      [userId]
    );
    
    if (!userRows.length) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = userRows[0];
    
    if (!user.locked) {
      return res.status(400).json({ message: 'User account is not locked' });
    }
    
    // Unlock the account
    await pool.query(
      `UPDATE users SET 
       locked = false
       WHERE id = $1`,
      [userId]
    );
    
    // Log the unlock action (simplified - no violation logs table)
    console.log(`Account unlocked by MasterAdmin ${masterAdminId} for user ${userId}. Reason: ${unlockReason}`);
    
    // Notify the user
    await pool.query(
      `INSERT INTO notifications (user_unique_id, message, created_at)
       VALUES ($1, $2, NOW())`,
      [
        user.unique_id,
        `Your account has been unlocked by MasterAdmin. Reason: ${unlockReason}. You can now access pickup features again.`
      ]
    );
    
    res.json({
      success: true,
      message: `Account unlocked successfully for ${user.first_name} ${user.last_name}`,
      user: {
        id: user.id,
        unique_id: user.unique_id,
        name: `${user.first_name} ${user.last_name}`
      }
    });
    
  } catch (error) {
    console.error('Unlock account error:', error);
    next(error);
  }
}

/**
 * Get all blocked accounts for MasterAdmin
 */
async function getBlockedAccounts(req, res, next) {
  try {
    if (req.user.role !== 'MasterAdmin') {
      return res.status(403).json({ message: 'Only MasterAdmin can view blocked accounts' });
    }
    
    // First, check what columns actually exist in the users table
    const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('blocking_reason', 'blocked_at', 'unlocked_at', 'account_blocked')
    `);
    
    const existingColumns = columnCheck.rows.map(row => row.column_name);
    console.log('Available columns:', existingColumns);
    
    // Build query based on available columns
    let selectColumns = ['u.id', 'u.unique_id', 'u.first_name', 'u.last_name', 'u.role', 'u.pickup_violation_count'];
    
    if (existingColumns.includes('blocking_reason')) {
      selectColumns.push('u.blocking_reason');
    }
    if (existingColumns.includes('blocked_at')) {
      selectColumns.push('u.blocked_at');
    }
    if (existingColumns.includes('unlocked_at')) {
      selectColumns.push('u.unlocked_at');
    }
    
    const whereClause = existingColumns.includes('account_blocked') 
      ? 'WHERE u.account_blocked = TRUE'
      : 'WHERE u.locked = true'; // fallback using locked status
    
    const orderClause = existingColumns.includes('blocked_at')
      ? 'ORDER BY u.blocked_at DESC'
      : 'ORDER BY u.id DESC';
    
    const query = `
      SELECT ${selectColumns.join(', ')}
      FROM users u
      ${whereClause}
      ${orderClause}
    `;
    
    console.log('Executing query:', query);
    
    const result = await pool.query(query);
    
    res.json({
      success: true,
      blockedAccounts: result.rows
    });
    
  } catch (error) {
    console.error('Get blocked accounts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load blocked accounts',
      error: error.message
    });
  }
}

/**
 * Get violation logs for a specific user
 */
async function getUserViolationLogs(req, res, next) {
  try {
    const { userId } = req.params;
    
    if (req.user.role !== 'MasterAdmin') {
      return res.status(403).json({ message: 'Only MasterAdmin can view violation logs' });
    }
    
    const result = await pool.query(`
      SELECT 
        pvl.*,
        u.first_name || ' ' || u.last_name as user_name,
        u.unique_id as user_unique_id,
        resolver.first_name || ' ' || resolver.last_name as resolved_by_name
      FROM pickup_violation_logs pvl
      JOIN users u ON u.id = pvl.user_id
      LEFT JOIN users resolver ON resolver.id = pvl.resolved_by
      WHERE pvl.user_id = $1
      ORDER BY pvl.created_at DESC
    `, [userId]);
    
    res.json({
      success: true,
      violationLogs: result.rows
    });
    
  } catch (error) {
    console.error('Get user violation logs error:', error);
    next(error);
  }
}

/**
 * Get pending confirmations for MasterAdmin
 */
async function getPendingConfirmations(req, res, next) {
  try {
    if (req.user.role !== 'MasterAdmin') {
      return res.status(403).json({ message: 'Only MasterAdmin can view pending confirmations' });
    }
    
    // No pending confirmations (simplified - no completion tracking table)
    res.json({
      success: true,
      confirmations: []
    });
    
  } catch (error) {
    console.error('Get pending confirmations error:', error);
    next(error);
  }
}

/**
 * Auto-return expired stock pickups after 48 hours
 * This function should be called by a cron job or scheduled task
 */
async function autoReturnExpiredPickups() {
  try {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Find stock pickups that are expired (deadline passed) and still pending
      const { rows: expiredPickups } = await client.query(`
        SELECT id, marketer_id, product_id, quantity
        FROM stock_updates
        WHERE deadline < NOW()
          AND status IN ('pending', 'pending_order')
      `);
      
      for (const pickup of expiredPickups) {
        // Update status to return_pending
        await client.query(`
          UPDATE stock_updates
             SET status = 'return_pending',
                 return_requested_at = NOW(),
                 updated_at = NOW()
           WHERE id = $1
        `, [pickup.id]);
        
        // Notify the marketer
        const { rows: [marketer] } = await client.query(`
          SELECT unique_id FROM users WHERE id = $1
        `, [pickup.marketer_id]);
        
        if (marketer?.unique_id) {
          await client.query(`
            INSERT INTO notifications (user_unique_id, message, created_at)
            VALUES ($1, $2, NOW())
          `, [
            marketer.unique_id,
            `Your stock pickup has expired and been automatically returned. Please wait for MasterAdmin confirmation.`
          ]);
        }
        
        // Notify MasterAdmins
        await client.query(`
          INSERT INTO notifications (user_unique_id, message, created_at)
          SELECT unique_id, $1, NOW()
          FROM users WHERE role = 'MasterAdmin'
        `, [
          `Stock pickup #${pickup.id} has expired and been automatically returned for confirmation.`
        ]);
      }
      
      await client.query('COMMIT');
      
      if (expiredPickups.length > 0) {
        console.log(`Auto-returned ${expiredPickups.length} expired stock pickups`);
      }
      
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Error in auto-return expired pickups:', error);
  }
}

/**
 * Confirm order and update pickup status to sold
 * This function is called when MasterAdmin confirms an order
 */
async function confirmOrder(req, res, next) {
  const client = await pool.connect();
  
  try {
    if (req.user.role !== 'MasterAdmin') {
      return res.status(403).json({ message: 'Only MasterAdmin can confirm orders' });
    }
    
    const { stockUpdateId, orderId, confirmationNotes } = req.body;
    
    if (!stockUpdateId) {
      return res.status(400).json({ message: 'Stock update ID is required' });
    }
    
    await client.query('BEGIN');
    
    // Check if stock update exists and is in pending status
    const { rows: stockRows } = await client.query(`
      SELECT id, marketer_id, product_id, quantity, status
      FROM stock_updates
      WHERE id = $1 AND status = 'pending'
    `, [stockUpdateId]);
    
    if (stockRows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Stock update not found or not in pending status' });
    }
    
    const stockUpdate = stockRows[0];
    
    // Update stock status to sold
    await client.query(`
      UPDATE stock_updates
      SET status = 'sold', updated_at = NOW()
      WHERE id = $1
    `, [stockUpdateId]);
    
    // Log the order confirmation
    await client.query(`
      INSERT INTO order_confirmation_tracking (
        stock_update_id, order_id, confirmed_by, confirmation_notes
      ) VALUES ($1, $2, $3, $4)
    `, [stockUpdateId, orderId, req.user.id, confirmationNotes]);
    
    // Update inventory (subtract from available quantity)
    await client.query(`
      SELECT update_inventory_with_log(
        $1, $2, 'sale', $3, $4, 'Order confirmed by MasterAdmin'
      )
    `, [stockUpdate.product_id, stockUpdateId, -stockUpdate.quantity, req.user.id]);
    
    await client.query('COMMIT');
    
    // Send notifications
    await notifyOrderConfirmation(stockUpdate.marketer_id, stockUpdateId, req.user.id);
    
    res.json({
      success: true,
      message: 'Order confirmed successfully',
      stockUpdateId: stockUpdateId
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Confirm order error:', error);
    next(error);
  } finally {
    client.release();
  }
}

/**
 * Confirm return/transfer and update inventory
 * This function is called when MasterAdmin confirms a return or transfer
 */
async function confirmReturnTransferNew(req, res, next) {
  const client = await pool.connect();
  
  try {
    if (req.user.role !== 'MasterAdmin') {
      return res.status(403).json({ message: 'Only MasterAdmin can confirm returns/transfers' });
    }
    
    const { stockUpdateId, confirmationType, confirmationNotes } = req.body;
    
    if (!stockUpdateId || !confirmationType) {
      return res.status(400).json({ message: 'Stock update ID and confirmation type are required' });
    }
    
    if (!['return', 'transfer'].includes(confirmationType)) {
      return res.status(400).json({ message: 'Confirmation type must be return or transfer' });
    }
    
    await client.query('BEGIN');
    
    // Check if stock update exists and is in pending confirmation status
    const expectedStatus = confirmationType === 'return' ? 'return_pending' : 'transfer_pending';
    const { rows: stockRows } = await client.query(`
      SELECT id, marketer_id, product_id, quantity, status
      FROM stock_updates
      WHERE id = $1 AND status = $2
    `, [stockUpdateId, expectedStatus]);
    
    if (stockRows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ 
        message: `Stock update not found or not in ${expectedStatus} status` 
      });
    }
    
    const stockUpdate = stockRows[0];
    
    // Update stock status
    const newStatus = confirmationType === 'return' ? 'returned' : 'transferred';
    await client.query(`
      UPDATE stock_updates
      SET status = $1, updated_at = NOW()
      WHERE id = $2
    `, [newStatus, stockUpdateId]);
    
    // Log the confirmation
    await client.query(`
      INSERT INTO return_transfer_confirmation (
        stock_update_id, confirmation_type, confirmed_by, confirmation_notes, inventory_updated
      ) VALUES ($1, $2, $3, $4, $5)
    `, [stockUpdateId, confirmationType, req.user.id, confirmationNotes, true]);
    
    // Update inventory (add back to available quantity)
    if (confirmationType === 'return') {
      await client.query(`
        SELECT update_inventory_with_log(
          $1, $2, 'return', $3, $4, 'Return confirmed by MasterAdmin'
        )
      `, [stockUpdate.product_id, stockUpdateId, stockUpdate.quantity, req.user.id]);
    }
    
    await client.query('COMMIT');
    
    // Send notifications
    await notifyReturnTransferConfirmation(stockUpdate.marketer_id, stockUpdateId, confirmationType, req.user.id);
    
    res.json({
      success: true,
      message: `${confirmationType} confirmed successfully`,
      stockUpdateId: stockUpdateId,
      newStatus: newStatus
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Confirm return/transfer error:', error);
    next(error);
  } finally {
    client.release();
  }
}

/**
 * Get pending order confirmations for MasterAdmin
 */
async function getPendingOrderConfirmations(req, res, next) {
  try {
    if (req.user.role !== 'MasterAdmin') {
      return res.status(403).json({ message: 'Only MasterAdmin can view pending order confirmations' });
    }
    
    const result = await pool.query(`
      SELECT 
        su.id as stock_update_id,
        su.quantity,
        su.pickup_date,
        su.deadline,
        p.device_name,
        p.device_model,
        u.first_name || ' ' || u.last_name as marketer_name,
        u.unique_id as marketer_unique_id,
        u.location as marketer_location
      FROM stock_updates su
      JOIN products p ON p.id = su.product_id
      JOIN users u ON u.id = su.marketer_id
      WHERE su.status = 'pending'
        AND su.id NOT IN (
          SELECT stock_update_id 
          FROM order_confirmation_tracking 
          WHERE stock_update_id IS NOT NULL
        )
      ORDER BY su.pickup_date ASC
    `);
    
    res.json({
      success: true,
      pendingOrders: result.rows
    });
    
  } catch (error) {
    console.error('Get pending order confirmations error:', error);
    next(error);
  }
}

/**
 * Get pending return/transfer confirmations for MasterAdmin
 */
async function getPendingReturnTransferConfirmations(req, res, next) {
  try {
    if (req.user.role !== 'MasterAdmin') {
      return res.status(403).json({ message: 'Only MasterAdmin can view pending return/transfer confirmations' });
    }
    
    const result = await pool.query(`
      SELECT 
        su.id as stock_update_id,
        su.quantity,
        su.pickup_date,
        su.deadline,
        su.status,
        p.device_name,
        p.device_model,
        u.first_name || ' ' || u.last_name as marketer_name,
        u.unique_id as marketer_unique_id,
        u.location as marketer_location
      FROM stock_updates su
      JOIN products p ON p.id = su.product_id
      JOIN users u ON u.id = su.marketer_id
      WHERE su.status IN ('return_pending', 'transfer_pending')
      ORDER BY su.updated_at ASC
    `);
    
    res.json({
      success: true,
      pendingConfirmations: result.rows
    });
    
  } catch (error) {
    console.error('Get pending return/transfer confirmations error:', error);
    next(error);
  }
}

/**
 * Helper function to notify stakeholders about order confirmation
 */
async function notifyOrderConfirmation(marketerId, stockUpdateId, confirmedBy) {
  try {
    // Get marketer details
    const { rows: marketerRows } = await pool.query(`
      SELECT unique_id, first_name, last_name
      FROM users
      WHERE id = $1
    `, [marketerId]);
    
    if (marketerRows.length === 0) return;
    
    const marketer = marketerRows[0];
    
    // Create notification for marketer
    await pool.query(`
      INSERT INTO notifications (
        user_id, title, message, type, related_id, created_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())
    `, [
      marketerId,
      'Order Confirmed',
      'Your order has been confirmed by MasterAdmin and is now marked as sold.',
      'order_confirmed',
      stockUpdateId
    ]);
    
    // Emit WebSocket notification
    const io = require('../socket');
    if (io) {
      io.to(marketer.unique_id).emit('orderConfirmed', {
        stockUpdateId,
        message: 'Your order has been confirmed by MasterAdmin'
      });
    }
    
  } catch (error) {
    console.error('Notify order confirmation error:', error);
  }
}

/**
 * Helper function to notify stakeholders about return/transfer confirmation
 */
async function notifyReturnTransferConfirmation(marketerId, stockUpdateId, confirmationType, confirmedBy) {
  try {
    // Get marketer details
    const { rows: marketerRows } = await pool.query(`
      SELECT unique_id, first_name, last_name
      FROM users
      WHERE id = $1
    `, [marketerId]);
    
    if (marketerRows.length === 0) return;
    
    const marketer = marketerRows[0];
    
    // Create notification for marketer
    await pool.query(`
      INSERT INTO notifications (
        user_id, title, message, type, related_id, created_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())
    `, [
      marketerId,
      `${confirmationType.charAt(0).toUpperCase() + confirmationType.slice(1)} Confirmed`,
      `Your ${confirmationType} has been confirmed by MasterAdmin.`,
      `${confirmationType}_confirmed`,
      stockUpdateId
    ]);
    
    // Emit WebSocket notification
    const io = require('../socket');
    if (io) {
      io.to(marketer.unique_id).emit('returnTransferConfirmed', {
        stockUpdateId,
        confirmationType,
        message: `Your ${confirmationType} has been confirmed by MasterAdmin`
      });
    }
    
    // Send inventory update notification to all stakeholders
    await notifyInventoryUpdate(stockUpdateId, confirmationType);
    
  } catch (error) {
    console.error('Notify return/transfer confirmation error:', error);
  }
}

/**
 * Helper function to notify all stakeholders about inventory updates
 */
async function notifyInventoryUpdate(stockUpdateId, updateType) {
  try {
    // Get all users who should receive inventory notifications
    const { rows: users } = await pool.query(`
      SELECT u.id, u.unique_id, u.first_name, u.last_name
      FROM users u
      JOIN notification_preferences np ON np.user_id = u.id
      WHERE np.notification_type = 'inventory_return_update'
        AND np.enabled = true
        AND u.role IN ('MasterAdmin', 'SuperAdmin', 'Admin')
    `);
    
    // Create notifications for all stakeholders
    for (const user of users) {
      await pool.query(`
        INSERT INTO notifications (
          user_id, title, message, type, related_id, created_at
        ) VALUES ($1, $2, $3, $4, $5, NOW())
      `, [
        user.id,
        'Inventory Updated',
        `Stock has been ${updateType === 'return' ? 'returned to' : 'transferred from'} inventory.`,
        'inventory_update',
        stockUpdateId
      ]);
    }
    
    // Emit WebSocket notifications
    const io = require('../socket');
    if (io) {
      for (const user of users) {
        io.to(user.unique_id).emit('inventoryUpdated', {
          stockUpdateId,
          updateType,
          message: `Stock has been ${updateType === 'return' ? 'returned to' : 'transferred from'} inventory`
        });
      }
    }
    
  } catch (error) {
    console.error('Notify inventory update error:', error);
  }
}

/**
 * GET /api/stock
 * List stock pickups for current user based on role
 */
async function listStockPickups(req, res, next) {
  try {
    const userRole = req.user.role;
    const userId = req.user.id;
    const userUniqueId = req.user.unique_id;

    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Search parameters
    const search = req.query.search || '';
    const statusFilter = req.query.status || '';
    const locationFilter = req.query.location || '';

    let baseQuery;
    let countQuery;
    let params = [];
    let paramCount = 0;

    // Build WHERE clause based on role
    let whereClause = '';
    if (userRole === 'MasterAdmin') {
      // MasterAdmin sees all pickups - no additional WHERE clause needed
    } else if (userRole === 'SuperAdmin') {
      // SuperAdmin sees own pickups + assigned admins' marketers' pickups
      whereClause = `WHERE (u.super_admin_id = $${++paramCount} OR u.id = $${++paramCount})`;
      params.push(userId, userId);
    } else if (userRole === 'Admin') {
      // Admin sees own pickups + assigned marketers' pickups
      whereClause = `WHERE (u.admin_id = $${++paramCount} OR u.id = $${++paramCount})`;
      params.push(userId, userId);
    } else {
      // Marketer sees only their own pickups
      whereClause = `WHERE u.id = $${++paramCount}`;
      params.push(userId);
    }

    // Add search filters
    const searchConditions = [];
    if (search) {
      searchConditions.push(`(
        u.first_name ILIKE $${++paramCount} OR 
        u.last_name ILIKE $${++paramCount} OR 
        u.unique_id ILIKE $${++paramCount} OR 
        p.device_name ILIKE $${++paramCount} OR 
        p.device_model ILIKE $${++paramCount} OR
        su.id::text ILIKE $${++paramCount}
      )`);
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (statusFilter) {
      searchConditions.push(`su.status = $${++paramCount}`);
      params.push(statusFilter);
    }

    if (locationFilter) {
      searchConditions.push(`u.location ILIKE $${++paramCount}`);
      params.push(`%${locationFilter}%`);
    }

    // Combine WHERE clauses
    const allConditions = [];
    if (whereClause) allConditions.push(whereClause.replace('WHERE ', ''));
    if (searchConditions.length > 0) allConditions.push(...searchConditions);
    
    const finalWhereClause = allConditions.length > 0 ? `WHERE ${allConditions.join(' AND ')}` : '';

    // Count query for pagination
    countQuery = `
      SELECT COUNT(*) as total
      FROM stock_updates su
      JOIN users u ON su.marketer_id = u.id
      JOIN products p ON su.product_id = p.id
      JOIN users d ON d.id = p.dealer_id AND d.role = 'Dealer'
      ${finalWhereClause}
    `;

    // Main query with pagination
    baseQuery = `
      SELECT 
        su.*,
        u.first_name, u.last_name, u.unique_id as marketer_unique_id, u.location,
        u.role as user_role,
        p.device_name as product_name, p.device_model as model, p.device_type as brand,
        d.business_name as dealer_name, d.unique_id as dealer_unique_id,
        -- User hierarchy
        admin_user.first_name as admin_first_name, admin_user.last_name as admin_last_name, 
        admin_user.unique_id as admin_unique_id,
        superadmin_user.first_name as superadmin_first_name, superadmin_user.last_name as superadmin_last_name,
        superadmin_user.unique_id as superadmin_unique_id
      FROM stock_updates su
      JOIN users u ON su.marketer_id = u.id
      JOIN products p ON su.product_id = p.id
      JOIN users d ON d.id = p.dealer_id AND d.role = 'Dealer'
      LEFT JOIN users admin_user ON u.admin_id = admin_user.id
      LEFT JOIN users superadmin_user ON admin_user.super_admin_id = superadmin_user.id
      ${finalWhereClause}
      ORDER BY su.pickup_date DESC
      LIMIT $${++paramCount} OFFSET $${++paramCount}
    `;
    params.push(limit, offset);

    // Execute queries
    const [countResult, dataResult] = await Promise.all([
      pool.query(countQuery, params.slice(0, -2)), // Remove limit and offset for count
      pool.query(baseQuery, params)
    ]);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: dataResult.rows,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('List stock pickups error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint
    });
    res.status(500).json({
      success: false,
      message: 'Failed to load stock pickups',
      error: error.message
    });
  }
}

module.exports = {
  listStockPickups,
  listStockPickupDealers,
  listStockProductsByDealer,
  createStockUpdate,
  placeOrder,
  requestStockTransfer,
  approveStockTransfer,
  getMarketerStockUpdates,
  getStockUpdates,
  confirmReturn,
  reviewStockTransfer,
  listSuperAdminStockUpdates,
  getStockUpdatesForAdmin,
  requestReturn,
  requestAdditionalPickup,
  getAllowance,
  listExtraPickupRequests,
  reviewExtraPickupRequest,
  markNotificationRead,
  createBulkPickup,
  checkAdditionalPickupEligibility,
  trackPickupCompletion,
  confirmReturnTransfer,
  getPendingConfirmations,
  unlockBlockedAccount,
  getBlockedAccounts,
  getUserViolationLogs,
  confirmOrder,
  autoReturnExpiredPickups
  confirmReturnTransferNew,
  getPendingOrderConfirmations,
  getPendingReturnTransferConfirmations,
  getUserStockSummary
};

/**
 * GET /api/stock/user/:userId/summary
 * Get user stock summary for popover (MasterAdmin only)
 */
async function getUserStockSummary(req, res, next) {
  try {
    if (req.user.role !== 'MasterAdmin') {
      return res.status(403).json({ message: 'Only MasterAdmin can view user stock summaries' });
    }

    const userId = req.params.userId;
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Get user details
    const { rows: userRows } = await pool.query(`
      SELECT 
        u.id, u.unique_id, u.first_name, u.last_name, u.role, u.location,
        admin_user.first_name as admin_first_name, admin_user.last_name as admin_last_name,
        admin_user.unique_id as admin_unique_id,
        superadmin_user.first_name as superadmin_first_name, superadmin_user.last_name as superadmin_last_name,
        superadmin_user.unique_id as superadmin_unique_id
      FROM users u
      LEFT JOIN users admin_user ON u.admin_id = admin_user.id
      LEFT JOIN users superadmin_user ON admin_user.super_admin_id = superadmin_user.id
      WHERE u.id = $1
    `, [userId]);

    if (userRows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = userRows[0];

    // Get all stock pickups for this user
    const { rows: stockRows } = await pool.query(`
      SELECT 
        su.*,
        p.device_name, p.device_model, p.device_type,
        d.business_name as dealer_name, d.unique_id as dealer_unique_id
      FROM stock_updates su
      JOIN products p ON su.product_id = p.id
      JOIN users d ON d.id = p.dealer_id AND d.role = 'Dealer'
      WHERE su.marketer_id = $1
      ORDER BY su.pickup_date DESC
    `, [userId]);

    // Calculate summary stats
    const totalPickups = stockRows.length;
    const pendingPickups = stockRows.filter(s => s.status === 'pending').length;
    const soldPickups = stockRows.filter(s => s.status === 'sold' || 
      (s.status === 'pending' && stockRows.some(o => o.stock_update_id === s.id))).length;
    const returnedPickups = stockRows.filter(s => s.status === 'returned').length;
    const expiredPickups = stockRows.filter(s => s.status === 'expired').length;
    const returnPendingPickups = stockRows.filter(s => s.status === 'return_pending').length;
    const transferPendingPickups = stockRows.filter(s => s.status === 'transfer_pending').length;

    res.json({
      success: true,
      user: {
        id: user.id,
        unique_id: user.unique_id,
        name: `${user.first_name} ${user.last_name}`,
        role: user.role,
        location: user.location,
        hierarchy: {
          admin: user.admin_unique_id ? `${user.admin_first_name} ${user.admin_last_name} (${user.admin_unique_id})` : null,
          superadmin: user.superadmin_unique_id ? `${user.superadmin_first_name} ${user.superadmin_last_name} (${user.superadmin_unique_id})` : null
        }
      },
      summary: {
        total: totalPickups,
        pending: pendingPickups,
        sold: soldPickups,
        returned: returnedPickups,
        expired: expiredPickups,
        return_pending: returnPendingPickups,
        transfer_pending: transferPendingPickups
      },
      stockPickups: stockRows
    });

  } catch (error) {
    console.error('Get user stock summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load user stock summary',
      error: error.message
    });
  }
}
