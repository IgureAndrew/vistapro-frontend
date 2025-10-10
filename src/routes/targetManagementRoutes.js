// src/routes/targetManagementRoutes.js
// Routes for target management with Master Admin control

const express = require('express');
const router = express.Router();

// Get unique user locations
router.get('/locations', async (req, res) => {
  try {
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });

    console.log('🔍 Fetching unique user locations...');

    // Get unique locations from users table (excluding NULL and empty values)
    const result = await pool.query(`
      SELECT DISTINCT location 
      FROM users 
      WHERE location IS NOT NULL 
      AND location != '' 
      AND location != 'null'
      ORDER BY location ASC
    `);

    await pool.end();

    const locations = result.rows.map(row => row.location);
    
    console.log('✅ Found locations:', locations);

    res.json({
      success: true,
      locations: locations,
      count: locations.length
    });

  } catch (error) {
    console.error('❌ Error fetching locations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch locations',
      error: error.message
    });
  }
});

// Validate location exists in users table
async function validateLocation(location) {
  if (!location || location === 'All Locations') {
    return true; // Allow "All Locations" and empty values
  }

  try {
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });

    const result = await pool.query(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE location = $1
    `, [location]);

    await pool.end();

    return parseInt(result.rows[0].count) > 0;
  } catch (error) {
    console.error('❌ Error validating location:', error);
    return false;
  }
}

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

    // Check targets table structure
    const targetsStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'targets' 
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);

    await pool.end();

    res.json({
      success: true,
      tables: {
        target_types: targetTypesCheck.rows[0].exists,
        targets: targetsCheck.rows[0].exists
      },
      targets_structure: targetsStructure.rows
    });
  } catch (error) {
    console.error('Error checking tables:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Debug endpoint to create tables (no auth required for debugging)
router.post('/debug/create-tables', async (req, res) => {
  try {
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });

    console.log('🚀 Creating target management tables...');

    // Create target_types table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS target_types (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        description TEXT,
        metric_unit VARCHAR(20) NOT NULL,
        supports_bnpl BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
        target_percentage INTEGER,
        calculated_target_value DECIMAL(15,2),
        period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
        period_start DATE NOT NULL,
        period_end DATE NOT NULL,
        bnpl_platform VARCHAR(50),
        is_active BOOLEAN DEFAULT true,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes for targets
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_targets_user_id ON targets(user_id);
      CREATE INDEX IF NOT EXISTS idx_targets_target_type_id ON targets(target_type_id);
      CREATE INDEX IF NOT EXISTS idx_targets_period_type ON targets(period_type);
      CREATE INDEX IF NOT EXISTS idx_targets_is_active ON targets(is_active);
      CREATE INDEX IF NOT EXISTS idx_targets_bnpl_platform ON targets(bnpl_platform);
    `);

    // Create target_percentage_mappings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS target_percentage_mappings (
        id SERIAL PRIMARY KEY,
        percentage INTEGER NOT NULL CHECK (percentage >= 1 AND percentage <= 100),
        orders_count INTEGER NOT NULL CHECK (orders_count > 0),
        target_type VARCHAR(50) NOT NULL,
        bnpl_platform VARCHAR(50),
        location VARCHAR(100),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_percentage_target_type_platform_location 
          UNIQUE (percentage, target_type, bnpl_platform, location)
      );
    `);

    // Create indexes for mappings
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_percentage_mappings_percentage ON target_percentage_mappings(percentage);
      CREATE INDEX IF NOT EXISTS idx_percentage_mappings_target_type ON target_percentage_mappings(target_type);
      CREATE INDEX IF NOT EXISTS idx_percentage_mappings_bnpl_platform ON target_percentage_mappings(bnpl_platform);
      CREATE INDEX IF NOT EXISTS idx_percentage_mappings_location ON target_percentage_mappings(location);
      CREATE INDEX IF NOT EXISTS idx_percentage_mappings_is_active ON target_percentage_mappings(is_active);
    `);

    // Insert default percentage mappings with all percentages (10-100)
    await pool.query(`
      INSERT INTO target_percentage_mappings (percentage, orders_count, target_type, bnpl_platform, location, is_active) VALUES
      -- Orders targets
      (10, 15, 'orders', NULL, NULL, true),
      (20, 25, 'orders', NULL, NULL, true),
      (30, 35, 'orders', NULL, NULL, true),
      (40, 45, 'orders', NULL, NULL, true),
      (50, 60, 'orders', NULL, NULL, true),
      (60, 75, 'orders', NULL, NULL, true),
      (70, 85, 'orders', NULL, NULL, true),
      (80, 95, 'orders', NULL, NULL, true),
      (90, 110, 'orders', NULL, NULL, true),
      (100, 125, 'orders', NULL, NULL, true),
      -- Sales targets
      (10, 5000, 'sales', NULL, NULL, true),
      (20, 10000, 'sales', NULL, NULL, true),
      (30, 15000, 'sales', NULL, NULL, true),
      (40, 20000, 'sales', NULL, NULL, true),
      (50, 25000, 'sales', NULL, NULL, true),
      (60, 30000, 'sales', NULL, NULL, true),
      (70, 35000, 'sales', NULL, NULL, true),
      (80, 40000, 'sales', NULL, NULL, true),
      (90, 45000, 'sales', NULL, NULL, true),
      (100, 50000, 'sales', NULL, NULL, true),
      -- Recruitment targets
      (10, 2, 'recruitment', NULL, NULL, true),
      (20, 3, 'recruitment', NULL, NULL, true),
      (30, 4, 'recruitment', NULL, NULL, true),
      (40, 5, 'recruitment', NULL, NULL, true),
      (50, 6, 'recruitment', NULL, NULL, true),
      (60, 7, 'recruitment', NULL, NULL, true),
      (70, 8, 'recruitment', NULL, NULL, true),
      (80, 9, 'recruitment', NULL, NULL, true),
      (90, 10, 'recruitment', NULL, NULL, true),
      (100, 12, 'recruitment', NULL, NULL, true),
      -- Customer targets
      (10, 5, 'customers', NULL, NULL, true),
      (20, 10, 'customers', NULL, NULL, true),
      (30, 15, 'customers', NULL, NULL, true),
      (40, 20, 'customers', NULL, NULL, true),
      (50, 25, 'customers', NULL, NULL, true),
      (60, 30, 'customers', NULL, NULL, true),
      (70, 35, 'customers', NULL, NULL, true),
      (80, 40, 'customers', NULL, NULL, true),
      (90, 45, 'customers', NULL, NULL, true),
      (100, 50, 'customers', NULL, NULL, true)
      ON CONFLICT (percentage, target_type, bnpl_platform, location) DO NOTHING;
    `);

    await pool.end();

    console.log('🎉 All target management tables created successfully!');

    res.json({
      success: true,
      message: 'Target management tables created successfully'
    });
  } catch (error) {
    console.error('Error creating tables:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Debug endpoint to fix missing columns (no auth required for debugging)
router.post('/debug/fix-columns', async (req, res) => {
  try {
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });

    console.log('🔧 Adding missing columns to targets table...');

    // Add missing columns to targets table
    const columnsToAdd = [
      'target_percentage INTEGER',
      'calculated_target_value DECIMAL(15,2)'
    ];

    const results = [];

    for (const column of columnsToAdd) {
      try {
        const columnName = column.split(' ')[0];
        console.log(`🔄 Adding column: ${columnName}`);
        
        await pool.query(`ALTER TABLE targets ADD COLUMN IF NOT EXISTS ${column};`);
        results.push(`✅ Added column: ${columnName}`);
        console.log(`✅ Added column: ${columnName}`);
      } catch (error) {
        if (error.code === '42701') {
          results.push(`⏭️ Column already exists: ${column.split(' ')[0]}`);
          console.log(`⏭️ Column already exists: ${column.split(' ')[0]}`);
        } else {
          results.push(`❌ Error adding column ${column.split(' ')[0]}: ${error.message}`);
          console.log(`❌ Error adding column ${column.split(' ')[0]}:`, error.message);
        }
      }
    }

    // Check final table structure
    const tableInfo = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'targets' 
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);

    await pool.end();

    console.log('🎉 Missing columns added successfully!');

    res.json({
      success: true,
      message: 'Missing columns added to targets table successfully',
      results: results,
      finalTableStructure: tableInfo.rows
    });
  } catch (error) {
    console.error('❌ Error adding missing columns:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add missing columns',
      error: error.message
    });
  }
});

const targetManagementController = require('../controllers/targetManagementController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { verifyRole } = require('../middlewares/roleMiddleware');

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
