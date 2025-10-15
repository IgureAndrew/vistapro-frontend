// src/routes/targetRoutes.js
// Routes for marketer target management

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const { verifyRole } = require('../middlewares/roleMiddleware');
const targetController = require('../controllers/targetController');

// All routes require authentication and MasterAdmin role
router.use(verifyToken);
router.use(verifyRole(['MasterAdmin']));

// Get all active targets
router.get('/', targetController.getAllTargets);

// Get targets for a specific marketer
router.get('/marketer/:marketerId', targetController.getMarketerTargets);

// Create a new target
router.post('/', targetController.createTarget);

// Update an existing target
router.put('/:targetId', targetController.updateTarget);

// Deactivate a target
router.delete('/:targetId', targetController.deactivateTarget);

// Get performance data for a specific marketer
router.get('/performance/marketer/:marketerId', targetController.getMarketerPerformance);

// Get performance data for all marketers
router.get('/performance/all', targetController.getAllMarketersPerformance);

// Get performance summary
router.get('/performance/summary', targetController.getPerformanceSummary);

module.exports = router;
