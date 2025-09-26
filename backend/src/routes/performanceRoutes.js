// src/routes/performanceRoutes.js
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const { verifyRole } = require('../middlewares/roleMiddleware');
const { 
  getPerformanceOverview, 
  getMarketerPerformance, 
  getAdminPerformance, 
  getSuperAdminPerformance 
} = require('../controllers/performanceController');

// Apply authentication to all routes
router.use(verifyToken);

// Get performance overview for all roles
router.get('/overview', getPerformanceOverview);

// Get performance for a specific marketer
router.get('/marketer/:marketerId', getMarketerPerformance);

// Get performance for a specific admin
router.get('/admin/:adminId', getAdminPerformance);

// Get performance for a specific superadmin
router.get('/superadmin/:superAdminId', getSuperAdminPerformance);

module.exports = router;
