-- Migration: Create marketer targets table
-- Description: Add target-based performance tracking for marketers

CREATE TABLE IF NOT EXISTS marketer_targets (
  id SERIAL PRIMARY KEY,
  marketer_id VARCHAR(50) NOT NULL REFERENCES users(unique_id) ON DELETE CASCADE,
  target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('weekly', 'monthly')),
  metric_type VARCHAR(20) NOT NULL CHECK (metric_type IN ('orders', 'sales', 'customers')),
  target_value INTEGER NOT NULL CHECK (target_value > 0),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Ensure unique active targets per marketer per period
  UNIQUE(marketer_id, target_type, metric_type, period_start, period_end)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_marketer_targets_marketer_id ON marketer_targets(marketer_id);
CREATE INDEX IF NOT EXISTS idx_marketer_targets_period ON marketer_targets(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_marketer_targets_active ON marketer_targets(is_active);

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_marketer_targets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_update_marketer_targets_updated_at
  BEFORE UPDATE ON marketer_targets
  FOR EACH ROW
  EXECUTE FUNCTION update_marketer_targets_updated_at();

-- Insert default targets for existing marketers
INSERT INTO marketer_targets (marketer_id, target_type, metric_type, target_value, period_start, period_end)
SELECT 
  u.unique_id,
  'weekly',
  'orders',
  15, -- Default 15 orders per week
  DATE_TRUNC('week', CURRENT_DATE),
  DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '6 days'
FROM users u
WHERE u.role = 'Marketer'
  AND NOT EXISTS (
    SELECT 1 FROM marketer_targets mt 
    WHERE mt.marketer_id = u.unique_id 
      AND mt.target_type = 'weekly' 
      AND mt.metric_type = 'orders'
      AND mt.is_active = true
  );

INSERT INTO marketer_targets (marketer_id, target_type, metric_type, target_value, period_start, period_end)
SELECT 
  u.unique_id,
  'monthly',
  'orders',
  60, -- Default 60 orders per month
  DATE_TRUNC('month', CURRENT_DATE),
  (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')
FROM users u
WHERE u.role = 'Marketer'
  AND NOT EXISTS (
    SELECT 1 FROM marketer_targets mt 
    WHERE mt.marketer_id = u.unique_id 
      AND mt.target_type = 'monthly' 
      AND mt.metric_type = 'orders'
      AND mt.is_active = true
  );
