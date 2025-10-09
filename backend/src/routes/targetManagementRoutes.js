// src/routes/targetManagementRoutes.js
// Routes for target management with Master Admin control

const express = require('express');
const router = express.Router();
const targetManagementController = require('../controllers/targetManagementController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { verifyRole } = require('../middlewares/roleMiddleware');

// Debug endpoint to check and create tables (no auth required for debugging)
router.get('/debug/check-tables', async (req, res) => {
  try {
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });

    // Check if target_types table exists
    const targetTypesCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'target_types'
      );
    `);

    // Check if targets table exists
    const targetsCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'targets'
      );
    `);

    await pool.end();

    res.json({
      success: true,
      tables: {
        target_types: targetTypesCheck.rows[0].exists,
        targets: targetsCheck.rows[0].exists
      }
    });
  } catch (error) {
    console.error('Error checking tables:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Apply authentication to all other routes
router.use(verifyToken);

// Get target types (all authenticated users)
router.get('/types', targetManagementController.getTargetTypes);

// Get targets for a specific user
router.get('/user/:userId', targetManagementController.getUserTargets);

// Get all targets with optional filters (Master Admin only)
router.get('/all', verifyRole(['MasterAdmin']), targetManagementController.getAllTargets);

// Get targets by period (Master Admin only)
router.get('/period', verifyRole(['MasterAdmin']), targetManagementController.getTargetsByPeriod);

// Get target statistics (Master Admin only)
router.get('/stats', verifyRole(['MasterAdmin']), targetManagementController.getTargetStats);

// Get users without targets (Master Admin only)
router.get('/users-without-targets', verifyRole(['MasterAdmin']), targetManagementController.getUsersWithoutTargets);

// Get users filtered by role and location for target creation (Master Admin only)
router.get('/users-for-target-creation', verifyRole(['MasterAdmin']), targetManagementController.getUsersForTargetCreation);

// Get target history (Master Admin only)
router.get('/history/:targetId', verifyRole(['MasterAdmin']), targetManagementController.getTargetHistory);

// Create a new target (Master Admin only)
router.post('/create', verifyRole(['MasterAdmin']), targetManagementController.createTarget);

// Bulk create targets (Master Admin only)
router.post('/bulk-create', verifyRole(['MasterAdmin']), targetManagementController.bulkCreateTargets);

// Update an existing target (Master Admin only)
router.put('/:targetId', verifyRole(['MasterAdmin']), targetManagementController.updateTarget);

// Deactivate a target (Master Admin only)
router.delete('/:targetId', verifyRole(['MasterAdmin']), targetManagementController.deactivateTarget);

module.exports = router;
