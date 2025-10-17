// src/routes/kycTrackingRoutes.js
// Routes for KYC tracking

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const { verifyRole } = require('../middlewares/roleMiddleware');
const {
  getKYCTimeline,
  getAllKYCTracking,
  logKYCAction,
  getKYCStatistics
} = require('../controllers/kycTrackingController');

/**
 * KYC Tracking Routes
 * All routes require authentication
 */

// Get KYC timeline for a specific submission (MasterAdmin, SuperAdmin, Admin)
router.get('/:submissionId/timeline', verifyToken, verifyRole(['MasterAdmin', 'SuperAdmin', 'Admin']), getKYCTimeline);

// Get all KYC tracking data (MasterAdmin only)
router.get('/', verifyToken, verifyRole(['MasterAdmin']), getAllKYCTracking);

// Log a KYC action (MasterAdmin, SuperAdmin, Admin)
router.post('/log', verifyToken, verifyRole(['MasterAdmin', 'SuperAdmin', 'Admin']), logKYCAction);

// Get KYC statistics (MasterAdmin only)
router.get('/statistics/overview', verifyToken, verifyRole(['MasterAdmin']), getKYCStatistics);

module.exports = router;

