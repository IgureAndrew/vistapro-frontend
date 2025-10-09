-- Migration: Enhance Target Management with BNPL Support
-- Description: Add BNPL platform support to target management system

-- Add supports_bnpl column to target_types table
ALTER TABLE target_types ADD COLUMN IF NOT EXISTS supports_bnpl BOOLEAN DEFAULT false;

-- Add bnpl_platform column to targets table
ALTER TABLE targets ADD COLUMN IF NOT EXISTS bnpl_platform VARCHAR(50);

-- Update existing target types to set supports_bnpl flag
UPDATE target_types SET supports_bnpl = true WHERE name = 'sales';
UPDATE target_types SET supports_bnpl = false WHERE name IN ('orders', 'customers', 'conversion_rate');

-- Add recruitment target type if it doesn't exist
INSERT INTO target_types (name, description, metric_unit, supports_bnpl) 
VALUES ('recruitment', 'Number of new marketers recruited', 'count', false)
ON CONFLICT (name) DO NOTHING;

-- Create index for bnpl_platform for better query performance
CREATE INDEX IF NOT EXISTS idx_targets_bnpl_platform ON targets(bnpl_platform);

-- Add constraint to ensure bnpl_platform is one of the valid values
ALTER TABLE targets ADD CONSTRAINT IF NOT EXISTS chk_bnpl_platform 
CHECK (bnpl_platform IS NULL OR bnpl_platform IN ('WATU', 'EASYBUY', 'PALMPAY', 'CREDLOCK'));
