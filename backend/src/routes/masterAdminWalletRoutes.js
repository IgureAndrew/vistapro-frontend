const express = require('express');
const { pool } = require('../config/database');

const router = express.Router();

// Access code for MasterAdmin Wallet (same as profit report pattern)
const MASTERADMIN_WALLET_ACCESS_CODE = '2r?dbA534GwN';

// POST /api/wallets/master-admin/unlock
router.post('/unlock', (req, res, next) => {
  try {
    const { code } = req.body;
    if (code === MASTERADMIN_WALLET_ACCESS_CODE) {
      return res.json({ success: true, message: 'Access granted' });
    }
    return res.status(401).json({ success: false, message: 'Invalid access code' });
  } catch (err) {
    next(err);
  }
});

// GET /api/wallets/master-admin/summary
router.get('/summary', async (req, res, next) => {
  try {
    // Get totals
    const totalsResult = await pool.query(`
      SELECT 
        COALESCE(SUM(w.total_balance), 0)    AS total_balance,
        COALESCE(SUM(w.available_balance), 0) AS available_balance,
        COALESCE(SUM(w.withheld_balance), 0)  AS withheld_balance
      FROM wallets w
    `);

    // Get breakdown by role
    const breakdownResult = await pool.query(`
      SELECT 
        u.role,
        COALESCE(SUM(w.total_balance), 0) AS total_balance,
        COALESCE(SUM(w.available_balance), 0) AS available_balance,
        COALESCE(SUM(w.withheld_balance), 0) AS withheld_balance,
        COUNT(DISTINCT u.id) AS user_count
      FROM wallets w
      LEFT JOIN users u ON u.unique_id = w.user_unique_id
      WHERE u.role IN ('Marketer', 'Admin', 'SuperAdmin')
      GROUP BY u.role
      ORDER BY u.role
    `);

    const monthlyResult = await pool.query(`
      SELECT COALESCE(SUM(o.sold_amount), 0) AS monthly_earnings
      FROM orders o
      WHERE DATE_TRUNC('month', o.created_at) = DATE_TRUNC('month', CURRENT_DATE)
    `);

    const pendingResult = await pool.query(`
      SELECT COUNT(*)::int AS pending_count
      FROM withdrawal_requests wr
      WHERE wr.status = 'pending'
    `);

    const totalEarningsResult = await pool.query(`
      SELECT COALESCE(SUM(o.sold_amount), 0) AS total_earnings
      FROM orders o
    `);

    const totals = totalsResult.rows[0] || { total_balance: 0, available_balance: 0, withheld_balance: 0 };
    
    // Format breakdown
    const breakdown = breakdownResult.rows.map(row => ({
      role: row.role,
      totalBalance: Number(row.total_balance) || 0,
      availableBalance: Number(row.available_balance) || 0,
      withheldBalance: Number(row.withheld_balance) || 0,
      userCount: Number(row.user_count) || 0
    }));

    return res.json({
      totalBalance: Number(totals.total_balance) || 0,
      availableBalance: Number(totals.available_balance) || 0,
      withheldBalance: Number(totals.withheld_balance) || 0,
      pendingWithdrawals: Number(pendingResult.rows[0]?.pending_count || 0),
      monthlyEarnings: Number(monthlyResult.rows[0]?.monthly_earnings || 0),
      totalEarnings: Number(totalEarningsResult.rows[0]?.total_earnings || 0),
      breakdown: breakdown
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/wallets/master-admin/pending
router.get('/pending', async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT 
        wr.id,
        wr.amount_requested::int AS amount_requested,
        wr.net_amount::int       AS net_amount,
        wr.fee::int              AS fee,
        wr.status,
        wr.requested_at          AS requested_at,
        wr.account_name,
        wr.account_number,
        wr.bank_name,
        (u.first_name || ' ' || u.last_name) AS user_name,
        u.unique_id              AS user_unique_id,
        u.location               AS user_location,
        u.role                   AS user_role
      FROM withdrawal_requests wr
      LEFT JOIN users u ON u.unique_id = wr.user_unique_id
      WHERE wr.status = 'pending'
      ORDER BY wr.requested_at DESC
      LIMIT 100
    `);
    const pending = result.rows.map(r => ({
      id: r.id,
      amount_requested: Number(r.amount_requested || 0),
      amount: Number(r.net_amount || 0),
      net_amount: Number(r.net_amount || 0),
      fee: Number(r.fee || 0),
      status: r.status,
      createdAt: r.requested_at,
      requested_at: r.requested_at,
      account_name: r.account_name,
      account_number: r.account_number,
      bank_name: r.bank_name,
      user_name: r.user_name,
      user_unique_id: r.user_unique_id,
      user_location: r.user_location,
      user_role: r.user_role
    }));
    return res.json({ pending });
  } catch (err) {
    next(err);
  }
});

// GET /api/wallets/master-admin/withheld-releases
router.get('/withheld-releases', async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.unique_id AS "userUniqueId",
        (u.first_name || ' ' || u.last_name) AS name,
        w.withheld_balance AS amount,
        u.location AS location,
        u.role AS role
      FROM wallets w
      LEFT JOIN users u ON u.unique_id = w.user_unique_id
      WHERE w.withheld_balance > 0
      ORDER BY w.withheld_balance DESC
      LIMIT 200
    `);
    return res.json({ withheld: result.rows });
  } catch (err) {
    next(err);
  }
});

// GET /api/wallets/master-admin/release-history
router.get('/release-history', async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT 
        wr.id,
        u.unique_id AS user_unique_id,
        (u.first_name || ' ' || u.last_name) AS user_name,
        wr.net_amount::int AS amount,
        wr.status,
        wr.reviewed_at AS decided_at,
        wr.reviewed_by AS reviewed_by_id,
        (reviewer.first_name || ' ' || reviewer.last_name) AS reviewed_by_name,
        u.location AS user_location,
        u.role AS user_role
      FROM withdrawal_requests wr
      LEFT JOIN users u ON u.unique_id = wr.user_unique_id
      LEFT JOIN users reviewer ON reviewer.unique_id = wr.reviewed_by
      WHERE wr.status IN ('approved','rejected')
      ORDER BY wr.reviewed_at DESC NULLS LAST
      LIMIT 200
    `);
    return res.json({ releases: result.rows });
  } catch (err) {
    next(err);
  }
});

// GET /api/wallets/master-admin/fee-history
router.get('/fee-history', async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT 
        wr.requested_at AS date,
        (u.first_name || ' ' || u.last_name) AS name,
        u.unique_id     AS unique_id,
        u.role          AS role,
        wr.amount_requested::int AS amount,
        wr.fee::int     AS fee,
        wr.status       AS status,
        u.location      AS location
      FROM withdrawal_requests wr
      LEFT JOIN users u ON u.unique_id = wr.user_unique_id
      WHERE wr.status IN ('approved','completed')
      ORDER BY wr.requested_at DESC
      LIMIT 200
    `);
    return res.json({ fees: result.rows });
  } catch (err) {
    next(err);
  }
});

// GET /api/wallets/master-admin/withdrawal-history
router.get('/withdrawal-history', async (req, res, next) => {
  try {
    const { startDate, endDate, name, role } = req.query;
    const params = [];
    const where = [];
    if (startDate) { params.push(startDate); where.push(`wr.created_at >= $${params.length}`); }
    if (endDate)   { params.push(endDate);   where.push(`wr.created_at <= $${params.length}`); }
    if (name)      { params.push(`%${name}%`); where.push(`(u.name ILIKE $${params.length} OR u.unique_id ILIKE $${params.length})`); }
    if (role)      { params.push(role); where.push(`u.role = $${params.length}`); }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const sql = `
      SELECT 
        wr.id,
        wr.requested_at AS date,
        (u.first_name || ' ' || u.last_name) AS name,
        u.unique_id     AS unique_id,
        u.role          AS role,
        wr.amount_requested::int AS amount,
        wr.fee::int     AS fee,
        wr.net_amount::int AS net_amount,
        wr.status       AS status,
        u.location      AS location
      FROM withdrawal_requests wr
      LEFT JOIN users u ON u.unique_id = wr.user_unique_id
      ${whereSql}
      ORDER BY wr.requested_at DESC
      LIMIT 500
    `;
    const result = await pool.query(sql, params);
    return res.json({ withdrawals: result.rows });
  } catch (err) {
    next(err);
  }
});

// Helper to fetch wallets by role
async function getWalletsByRole(role) {
  const result = await pool.query(`
    SELECT 
      u.unique_id     AS user_unique_id,
      (u.first_name || ' ' || u.last_name) AS user_name,
      COALESCE(w.total_balance, 0)     AS total_balance,
      COALESCE(w.available_balance, 0) AS available_balance,
      COALESCE(w.withheld_balance, 0)  AS withheld_balance,
      NULL::timestamp                  AS last_commission_date
    FROM users u
    LEFT JOIN wallets w ON w.user_unique_id = u.unique_id
    WHERE u.role = $1
    ORDER BY w.user_unique_id DESC NULLS LAST
    LIMIT 500
  `, [role]);
  return { wallets: result.rows };
}

// GET /api/wallets/master-admin/marketers
router.get('/marketers', async (req, res, next) => {
  try {
    const data = await getWalletsByRole('Marketer');
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// GET /api/wallets/master-admin/admins
router.get('/admins', async (req, res, next) => {
  try {
    const data = await getWalletsByRole('Admin');
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// GET /api/wallets/master-admin/superadmins
router.get('/superadmins', async (req, res, next) => {
  try {
    const data = await getWalletsByRole('SuperAdmin');
    res.json(data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
