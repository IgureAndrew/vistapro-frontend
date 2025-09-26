// backend/src/routes/profitReportRoutes.js

const express = require('express');
const {
  getInventorySnapshot,
  getDailySales,
  getGoals,
  getInventoryDetails,
  getProductsSold,
  getAggregatedSales,
  getDailyTotals,          // ← make sure your service exports this
  getLocationBreakdown,    // ← location-based breakdown
  getLocationAggregated,   // ← location-based aggregated data
  getOrderStatusSummary    // ← order status summary
} = require('../services/profitReportService');
const { verifyToken } = require('../middlewares/authMiddleware');

const router = express.Router();
// ─── POST /api/profit-report/unlock ─────────────────────────────────────────
router.post('/unlock', (req, res, next) => {
  try {
    // 1) Read the expected access code from environment
    const expected = process.env.PROFIT_REPORT_ACCESS_CODE;
    if (!expected) {
      // If it’s not set, nobody can ever unlock
      return res
        .status(500)
        .json({ message: 'Access code is not configured.' });
    }

    // 2) Extract the submitted code from req.body
    const { code } = req.body;
    if (typeof code !== 'string') {
      return res
        .status(400)
        .json({ message: 'Missing access code in request.' });
    }

    // 3) Compare
    if (code === expected) {
      // Matches → unlock successful
      return res.json({ ok: true });
    }

    // Otherwise → unauthorized
    return res
      .status(401)
      .json({ message: 'Invalid access code.' });
  } catch (err) {
    next(err);
  }
});


// apply auth to *all* profit-report endpoints
router.use(verifyToken);

/**
 * GET /api/profit-report/inventory-snapshot
 */
router.get('/inventory-snapshot', async (req, res, next) => {
  try {
    const data = await getInventorySnapshot();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/profit-report/daily-sales
 */
router.get('/daily-sales', async (req, res, next) => {
  try {
    const { start, end, deviceType, deviceName } = req.query;
    const data = await getDailySales({ start, end, deviceType, deviceName });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/profit-report/goals
 */
router.get('/goals', async (req, res, next) => {
  try {
    const data = await getGoals();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/profit-report/inventory-details
 */
router.get('/inventory-details', async (req, res, next) => {
  try {
    const data = await getInventoryDetails();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/profit-report/products-sold
 */
router.get('/products-sold', async (req, res, next) => {
  try {
    const { start, end, deviceType, deviceName } = req.query;
    const data = await getProductsSold({ start, end, deviceType, deviceName });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/profit-report/aggregated
 * Returns per-day breakdown by device, including:
 *   total_units_sold,
 *   total_revenue,
 *   initial_profit,
 *   commission_expense,
 *   net_profit, etc.
 */
router.get('/aggregated', async (req, res, next) => {
  try {
    const { start, end, deviceType, deviceName } = req.query;
    const data = await getAggregatedSales({ start, end, deviceType, deviceName });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/profit-report/daily-summary
 * Returns overall totals for the given date range:
 *   • sum of total_units_sold
 *   • sum of total_revenue
 *   • sum of total_initial_profit
 *   • sum of total_commission_expense
 *   • sum of total_final_profit
 */
router.get('/daily-summary', async (req, res, next) => {
  try {
    const { start, end } = req.query;
    const totals = await getDailyTotals({ start, end });
    res.json(totals);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/profit-report/location-breakdown
 * Returns location-based profit breakdown:
 *   • location (state)
 *   • total_orders, total_units_sold, total_revenue
 *   • total_initial_profit, total_commission_expense, total_final_profit
 */
router.get('/location-breakdown', async (req, res, next) => {
  try {
    const { start, end } = req.query;
    const data = await getLocationBreakdown({ start, end });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/profit-report/location-aggregated
 * Returns location-based aggregated data with device breakdown:
 *   • location, device_type, device_name
 *   • total_units_sold, total_revenue, total_initial_profit
 *   • total_commission_expense, total_final_profit
 */
router.get('/location-aggregated', async (req, res, next) => {
  try {
    const { start, end } = req.query;
    const data = await getLocationAggregated({ start, end });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/profit-report/status-summary
 * Returns order status summary counts
 */
router.get('/status-summary', async (req, res, next) => {
  try {
    const summary = await getOrderStatusSummary();
    res.json(summary);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
