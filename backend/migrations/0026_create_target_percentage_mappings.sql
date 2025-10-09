-- Migration: Create target percentage mappings system
-- This enables Master Admin to set custom percentage-to-orders mappings

-- Create target_percentage_mappings table
CREATE TABLE IF NOT EXISTS target_percentage_mappings (
    id SERIAL PRIMARY KEY,
    percentage INTEGER NOT NULL CHECK (percentage > 0 AND percentage <= 100),
    orders_count INTEGER NOT NULL CHECK (orders_count > 0),
    target_type VARCHAR(50) DEFAULT 'orders',
    bnpl_platform VARCHAR(50),
    location VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_percentage_target_type_platform_location 
        UNIQUE (percentage, target_type, bnpl_platform, location)
);

-- Add percentage-based target columns to existing targets table
ALTER TABLE targets ADD COLUMN IF NOT EXISTS target_percentage INTEGER CHECK (target_percentage > 0 AND target_percentage <= 100);
ALTER TABLE targets ADD COLUMN IF NOT EXISTS calculated_target_value DECIMAL(15,2);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_target_percentage_mappings_percentage ON target_percentage_mappings(percentage);
CREATE INDEX IF NOT EXISTS idx_target_percentage_mappings_target_type ON target_percentage_mappings(target_type);
CREATE INDEX IF NOT EXISTS idx_target_percentage_mappings_bnpl_platform ON target_percentage_mappings(bnpl_platform);
CREATE INDEX IF NOT EXISTS idx_target_percentage_mappings_location ON target_percentage_mappings(location);
CREATE INDEX IF NOT EXISTS idx_target_percentage_mappings_active ON target_percentage_mappings(is_active);

-- Create index on new targets columns
CREATE INDEX IF NOT EXISTS idx_targets_percentage ON targets(target_percentage);
CREATE INDEX IF NOT EXISTS idx_targets_calculated_value ON targets(calculated_target_value);

-- Insert default percentage mappings for orders
INSERT INTO target_percentage_mappings (percentage, orders_count, target_type, is_active) VALUES
(10, 15, 'orders', true),
(20, 25, 'orders', true),
(30, 35, 'orders', true),
(40, 45, 'orders', true),
(50, 60, 'orders', true),
(60, 75, 'orders', true),
(70, 90, 'orders', true),
(80, 110, 'orders', true),
(90, 135, 'orders', true),
(100, 150, 'orders', true)
ON CONFLICT (percentage, target_type, bnpl_platform, location) DO NOTHING;

-- Insert default percentage mappings for sales (currency-based)
INSERT INTO target_percentage_mappings (percentage, orders_count, target_type, is_active) VALUES
(10, 15000, 'sales', true),
(20, 25000, 'sales', true),
(30, 35000, 'sales', true),
(40, 45000, 'sales', true),
(50, 60000, 'sales', true),
(60, 75000, 'sales', true),
(70, 90000, 'sales', true),
(80, 110000, 'sales', true),
(90, 135000, 'sales', true),
(100, 150000, 'sales', true)
ON CONFLICT (percentage, target_type, bnpl_platform, location) DO NOTHING;

-- Insert default percentage mappings for recruitment
INSERT INTO target_percentage_mappings (percentage, orders_count, target_type, is_active) VALUES
(10, 2, 'recruitment', true),
(20, 4, 'recruitment', true),
(30, 6, 'recruitment', true),
(40, 8, 'recruitment', true),
(50, 10, 'recruitment', true),
(60, 12, 'recruitment', true),
(70, 14, 'recruitment', true),
(80, 16, 'recruitment', true),
(90, 18, 'recruitment', true),
(100, 20, 'recruitment', true)
ON CONFLICT (percentage, target_type, bnpl_platform, location) DO NOTHING;

-- Update existing targets to use percentage system (optional - for existing data)
-- This will set existing targets to use the closest percentage mapping
UPDATE targets 
SET target_percentage = CASE 
    WHEN target_value <= 15 THEN 10
    WHEN target_value <= 25 THEN 20
    WHEN target_value <= 35 THEN 30
    WHEN target_value <= 45 THEN 40
    WHEN target_value <= 60 THEN 50
    WHEN target_value <= 75 THEN 60
    WHEN target_value <= 90 THEN 70
    WHEN target_value <= 110 THEN 80
    WHEN target_value <= 135 THEN 90
    ELSE 100
END,
calculated_target_value = target_value
WHERE target_percentage IS NULL;

-- Add comments for documentation
COMMENT ON TABLE target_percentage_mappings IS 'Stores custom percentage-to-orders mappings configured by Master Admin';
COMMENT ON COLUMN target_percentage_mappings.percentage IS 'Percentage value (10-100)';
COMMENT ON COLUMN target_percentage_mappings.orders_count IS 'Number of orders/units this percentage represents';
COMMENT ON COLUMN target_percentage_mappings.target_type IS 'Type of target (orders, sales, recruitment, customers)';
COMMENT ON COLUMN target_percentage_mappings.bnpl_platform IS 'BNPL platform filter (optional)';
COMMENT ON COLUMN target_percentage_mappings.location IS 'Location filter (optional)';

COMMENT ON COLUMN targets.target_percentage IS 'Percentage target set for this user';
COMMENT ON COLUMN targets.calculated_target_value IS 'Calculated target value based on percentage mapping';
