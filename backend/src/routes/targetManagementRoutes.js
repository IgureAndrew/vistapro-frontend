// src/routes/targetManagementRoutes.js
// Routes for target management with Master Admin control

const express = require('express');
const router = express.Router();
const targetManagementController = require('../controllers/targetManagementController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { verifyRole } = require('../middlewares/roleMiddleware');

// Create tables endpoint (no auth required for debugging) - MUST BE FIRST
router.get('/create-tables', async (req, res) => {
  try {
    console.log('🔧 Creating target management tables...');
    const { pool } = require('../config/database');
    
    // Create target_types table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS target_types (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        description TEXT,
        metric_unit VARCHAR(20) NOT NULL,
        supports_bnpl BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // Insert default target types
    await pool.query(`
      INSERT INTO target_types (name, description, metric_unit, supports_bnpl) VALUES
      ('orders', 'Number of orders to complete', 'count', false),
      ('sales', 'Sales revenue target', 'currency', true),
      ('customers', 'Number of new customers', 'count', false),
      ('conversion_rate', 'Order conversion rate', 'percentage', false),
      ('recruitment', 'Number of new marketers recruited', 'count', false)
      ON CONFLICT (name) DO NOTHING;
    `);
    
    // Create targets table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS targets (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL REFERENCES users(unique_id) ON DELETE CASCADE,
        target_type_id INTEGER NOT NULL REFERENCES target_types(id),
        target_value DECIMAL(15,2) NOT NULL CHECK (target_value > 0),
        period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
        period_start DATE NOT NULL,
        period_end DATE NOT NULL,
        bnpl_platform VARCHAR(50),
        is_active BOOLEAN DEFAULT true,
        created_by VARCHAR(50) REFERENCES users(unique_id),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // Create indexes
    await pool.query('CREATE INDEX IF NOT EXISTS idx_targets_user_id ON targets(user_id);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_targets_type_id ON targets(target_type_id);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_targets_period ON targets(period_start, period_end);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_targets_bnpl_platform ON targets(bnpl_platform);');
    
    // Add constraint for BNPL platform values
    await pool.query(`
      ALTER TABLE targets ADD CONSTRAINT IF NOT EXISTS chk_bnpl_platform 
      CHECK (bnpl_platform IS NULL OR bnpl_platform IN ('WATU', 'EASYBUY', 'PALMPAY', 'CREDLOCK'));
    `);
    
    console.log('✅ Target management tables created successfully');
    
    res.json({
      success: true,
      message: 'Target management tables created successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating tables',
      error: error.message
    });
  }
});

// Test endpoint to check if tables exist (no auth required for debugging)
router.get('/test-tables', async (req, res) => {
  try {
    const { pool } = require('../config/database');
    
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
    
    // Try to get target types count
    let targetTypesCount = 0;
    try {
      const countResult = await pool.query('SELECT COUNT(*) as count FROM target_types');
      targetTypesCount = parseInt(countResult.rows[0].count);
    } catch (error) {
      console.log('Error counting target types:', error.message);
    }
    
    res.json({
      success: true,
      message: 'Table check completed',
      tables: {
        target_types: {
          exists: targetTypesCheck.rows[0].exists,
          count: targetTypesCount
        },
        targets: {
          exists: targetsCheck.rows[0].exists
        }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error checking tables:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking tables',
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
