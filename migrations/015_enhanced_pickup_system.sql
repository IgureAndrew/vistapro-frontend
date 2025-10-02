-- Enhanced Stock Pickup System Migration
-- This migration adds tables to support the enhanced pickup system with order-based eligibility

-- Table to track pickup allowance history and eligibility
CREATE TABLE IF NOT EXISTS pickup_allowance_history (
  id SERIAL PRIMARY KEY,
  marketer_id INTEGER NOT NULL,
  allowance_type VARCHAR(20) NOT NULL CHECK (allowance_type IN ('default', 'additional')),
  units_allocated INTEGER NOT NULL DEFAULT 1,
  units_completed INTEGER NOT NULL DEFAULT 0,
  order_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP,
  FOREIGN KEY (marketer_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Table to track pickup completion details
CREATE TABLE IF NOT EXISTS pickup_completion_tracking (
  id SERIAL PRIMARY KEY,
  pickup_id INTEGER NOT NULL,
  completion_type VARCHAR(20) NOT NULL CHECK (completion_type IN ('sold', 'returned', 'transferred')),
  completion_date TIMESTAMP NOT NULL DEFAULT NOW(),
  confirmed_by INTEGER, -- MasterAdmin who confirmed
  confirmation_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (confirmation_status IN ('pending', 'confirmed', 'rejected')),
  confirmation_date TIMESTAMP,
  notes TEXT,
  FOREIGN KEY (pickup_id) REFERENCES stock_updates(id) ON DELETE CASCADE,
  FOREIGN KEY (confirmed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Add new columns to existing additional_pickup_requests table
ALTER TABLE additional_pickup_requests 
ADD COLUMN IF NOT EXISTS order_confirmation_required BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS units_remaining INTEGER,
ADD COLUMN IF NOT EXISTS completion_status VARCHAR(20) DEFAULT 'pending' CHECK (completion_status IN ('pending', 'in_progress', 'completed'));

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_pickup_allowance_marketer ON pickup_allowance_history(marketer_id);
CREATE INDEX IF NOT EXISTS idx_pickup_allowance_status ON pickup_allowance_history(status);
CREATE INDEX IF NOT EXISTS idx_pickup_completion_pickup ON pickup_completion_tracking(pickup_id);
CREATE INDEX IF NOT EXISTS idx_pickup_completion_status ON pickup_completion_tracking(confirmation_status);

-- Add comments for documentation
COMMENT ON TABLE pickup_allowance_history IS 'Tracks pickup allowance history and eligibility for marketers';
COMMENT ON TABLE pickup_completion_tracking IS 'Tracks completion of pickups (sold/returned/transferred) with MasterAdmin confirmation';
COMMENT ON COLUMN pickup_allowance_history.allowance_type IS 'Type of allowance: default (1 unit) or additional (3 units)';
COMMENT ON COLUMN pickup_allowance_history.order_confirmed IS 'Whether marketer has placed at least one confirmed order';
COMMENT ON COLUMN pickup_completion_tracking.confirmed_by IS 'MasterAdmin who confirmed the return/transfer';
