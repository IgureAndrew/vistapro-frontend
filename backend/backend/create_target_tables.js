// create_target_tables.js
// Script to manually create target management tables in production

require('dotenv').config();
const { Pool } = require('pg');

async function createTargetTables() {
  console.log('🚀 Creating target management tables...');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    // Check if target_types table exists
    const targetTypesCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'target_types'
      );
    `);

    if (!targetTypesCheck.rows[0].exists) {
      console.log('🔧 Creating target_types table...');
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

      console.log('✅ target_types table created');
    } else {
      console.log('✅ target_types table already exists');
    }

    // Check if targets table exists
    const targetsCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'targets'
      );
    `);

    if (!targetsCheck.rows[0].exists) {
      console.log('🔧 Creating targets table...');
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

      // Create indexes
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_targets_user_id ON targets(user_id);
        CREATE INDEX IF NOT EXISTS idx_targets_target_type_id ON targets(target_type_id);
        CREATE INDEX IF NOT EXISTS idx_targets_period_type ON targets(period_type);
        CREATE INDEX IF NOT EXISTS idx_targets_is_active ON targets(is_active);
        CREATE INDEX IF NOT EXISTS idx_targets_bnpl_platform ON targets(bnpl_platform);
      `);

      console.log('✅ targets table created');
    } else {
      console.log('✅ targets table already exists');
    }

    // Check if target_percentage_mappings table exists
    const mappingsCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'target_percentage_mappings'
      );
    `);

    if (!mappingsCheck.rows[0].exists) {
      console.log('🔧 Creating target_percentage_mappings table...');
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

      // Create indexes
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_percentage_mappings_percentage ON target_percentage_mappings(percentage);
        CREATE INDEX IF NOT EXISTS idx_percentage_mappings_target_type ON target_percentage_mappings(target_type);
        CREATE INDEX IF NOT EXISTS idx_percentage_mappings_bnpl_platform ON target_percentage_mappings(bnpl_platform);
        CREATE INDEX IF NOT EXISTS idx_percentage_mappings_location ON target_percentage_mappings(location);
        CREATE INDEX IF NOT EXISTS idx_percentage_mappings_is_active ON target_percentage_mappings(is_active);
      `);

      // Insert default percentage mappings
      await pool.query(`
        INSERT INTO target_percentage_mappings (percentage, orders_count, target_type, bnpl_platform, location, is_active) VALUES
        (10, 15, 'orders', NULL, NULL, true),
        (20, 25, 'orders', NULL, NULL, true),
        (30, 40, 'orders', NULL, NULL, true),
        (50, 60, 'orders', NULL, NULL, true),
        (100, 100, 'orders', NULL, NULL, true),
        (10, 5000, 'sales', NULL, NULL, true),
        (20, 10000, 'sales', NULL, NULL, true),
        (30, 15000, 'sales', NULL, NULL, true),
        (50, 25000, 'sales', NULL, NULL, true),
        (100, 50000, 'sales', NULL, NULL, true),
        (10, 2, 'recruitment', NULL, NULL, true),
        (20, 3, 'recruitment', NULL, NULL, true),
        (30, 5, 'recruitment', NULL, NULL, true),
        (50, 8, 'recruitment', NULL, NULL, true),
        (100, 15, 'recruitment', NULL, NULL, true)
        ON CONFLICT (percentage, target_type, bnpl_platform, location) DO NOTHING;
      `);

      console.log('✅ target_percentage_mappings table created');
    } else {
      console.log('✅ target_percentage_mappings table already exists');
    }

    console.log('🎉 All target management tables are ready!');

  } catch (error) {
    console.error('❌ Error creating target tables:', error);
  } finally {
    await pool.end();
  }
}

// Run the script
createTargetTables();
