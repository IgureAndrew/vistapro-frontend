-- Migration: Create enhanced target management system
-- Description: Allow Master Admin to manage targets for all users with audit trail

-- Create target types table
CREATE TABLE IF NOT EXISTS target_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  metric_unit VARCHAR(20) NOT NULL, -- 'count', 'currency', 'percentage'
  supports_bnpl BOOLEAN DEFAULT false, -- Whether this target type supports BNPL platform selection
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert default target types
INSERT INTO target_types (name, description, metric_unit, supports_bnpl) VALUES
('orders', 'Number of orders to complete', 'count', false),
('sales', 'Sales revenue target', 'currency', true),
('customers', 'Number of new customers', 'count', false),
('conversion_rate', 'Order conversion rate', 'percentage', false),
('recruitment', 'Number of new marketers recruited', 'count', false)
ON CONFLICT (name) DO NOTHING;

-- Create enhanced targets table (replaces marketer_targets)
CREATE TABLE IF NOT EXISTS targets (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL REFERENCES users(unique_id) ON DELETE CASCADE,
  target_type_id INTEGER NOT NULL REFERENCES target_types(id),
  target_value DECIMAL(15,2) NOT NULL CHECK (target_value > 0),
  period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  bnpl_platform VARCHAR(50), -- BNPL platform for sales targets (WATU, EASYBUY, PALMPAY, CREDLOCK)
  is_active BOOLEAN DEFAULT true,
  created_by VARCHAR(50) REFERENCES users(unique_id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
  
  -- Note: Unique constraint will be handled via partial index
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_targets_user_id ON targets(user_id);
CREATE INDEX IF NOT EXISTS idx_targets_type_id ON targets(target_type_id);
CREATE INDEX IF NOT EXISTS idx_targets_period ON targets(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_targets_active ON targets(is_active);
CREATE INDEX IF NOT EXISTS idx_targets_period_type ON targets(period_type);

-- Create partial unique index to ensure unique active targets per user per type per period
CREATE UNIQUE INDEX IF NOT EXISTS idx_targets_unique_active 
ON targets(user_id, target_type_id, period_type, period_start, period_end) 
WHERE is_active = true;

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_targets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_update_targets_updated_at
  BEFORE UPDATE ON targets
  FOR EACH ROW
  EXECUTE FUNCTION update_targets_updated_at();

-- Create target history table for audit trail
CREATE TABLE IF NOT EXISTS target_history (
  id SERIAL PRIMARY KEY,
  target_id INTEGER NOT NULL REFERENCES targets(id) ON DELETE CASCADE,
  action VARCHAR(20) NOT NULL CHECK (action IN ('created', 'updated', 'deactivated', 'reactivated')),
  old_value DECIMAL(15,2),
  new_value DECIMAL(15,2),
  old_period_start DATE,
  new_period_start DATE,
  old_period_end DATE,
  new_period_end DATE,
  changed_by VARCHAR(50) REFERENCES users(unique_id),
  change_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for target history
CREATE INDEX IF NOT EXISTS idx_target_history_target_id ON target_history(target_id);
CREATE INDEX IF NOT EXISTS idx_target_history_created_at ON target_history(created_at);

-- Create trigger to log target changes
CREATE OR REPLACE FUNCTION log_target_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO target_history (target_id, action, new_value, new_period_start, new_period_end, changed_by)
    VALUES (NEW.id, 'created', NEW.target_value, NEW.period_start, NEW.period_end, NEW.created_by);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.is_active = true AND NEW.is_active = false THEN
      INSERT INTO target_history (target_id, action, old_value, changed_by, change_reason)
      VALUES (OLD.id, 'deactivated', OLD.target_value, NEW.created_by, 'Target deactivated');
    ELSIF OLD.is_active = false AND NEW.is_active = true THEN
      INSERT INTO target_history (target_id, action, new_value, changed_by, change_reason)
      VALUES (NEW.id, 'reactivated', NEW.target_value, NEW.created_by, 'Target reactivated');
    ELSIF OLD.target_value != NEW.target_value OR OLD.period_start != NEW.period_start OR OLD.period_end != NEW.period_end THEN
      INSERT INTO target_history (target_id, action, old_value, new_value, old_period_start, new_period_start, old_period_end, new_period_end, changed_by)
      VALUES (NEW.id, 'updated', OLD.target_value, NEW.target_value, OLD.period_start, NEW.period_start, OLD.period_end, NEW.period_end, NEW.created_by);
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_log_target_changes
  AFTER INSERT OR UPDATE ON targets
  FOR EACH ROW
  EXECUTE FUNCTION log_target_changes();

-- Note: Migration of existing marketer_targets data will be handled separately
-- to avoid dependency issues during initial setup
