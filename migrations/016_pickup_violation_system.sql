-- Migration: Pickup Violation System
-- Description: Adds violation tracking, account blocking, and MasterAdmin control

-- Add violation tracking columns to users table
DO $$
BEGIN
    -- Add violation count
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='pickup_violation_count') THEN
        ALTER TABLE users ADD COLUMN pickup_violation_count INTEGER DEFAULT 0;
    END IF;
    
    -- Add account blocked status
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='account_blocked') THEN
        ALTER TABLE users ADD COLUMN account_blocked BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add blocking reason
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='blocking_reason') THEN
        ALTER TABLE users ADD COLUMN blocking_reason TEXT;
    END IF;
    
    -- Add blocked at timestamp
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='blocked_at') THEN
        ALTER TABLE users ADD COLUMN blocked_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Add blocked by (MasterAdmin ID)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='blocked_by') THEN
        ALTER TABLE users ADD COLUMN blocked_by INTEGER REFERENCES users(id) ON DELETE SET NULL;
    END IF;
    
    -- Add unlocked at timestamp
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='unlocked_at') THEN
        ALTER TABLE users ADD COLUMN unlocked_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Add unlocked by (MasterAdmin ID)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='unlocked_by') THEN
        ALTER TABLE users ADD COLUMN unlocked_by INTEGER REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END
$$;

-- Create pickup_violation_logs table
CREATE TABLE IF NOT EXISTS pickup_violation_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    violation_type VARCHAR(50) NOT NULL, -- 'attempted_pickup_with_active_stock'
    violation_count INTEGER NOT NULL, -- 1, 2, 3, 4 (blocked)
    active_stock_count INTEGER NOT NULL, -- Number of active stock units when violation occurred
    attempted_pickup_quantity INTEGER NOT NULL, -- Quantity they tried to pickup
    violation_message TEXT NOT NULL, -- Warning message or blocking reason
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE, -- When violation was resolved (if applicable)
    resolved_by INTEGER REFERENCES users(id) ON DELETE SET NULL -- MasterAdmin who resolved
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_pickup_violation_logs_user_id ON pickup_violation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_pickup_violation_logs_created_at ON pickup_violation_logs(created_at);

-- Create account_unlock_requests table
CREATE TABLE IF NOT EXISTS account_unlock_requests (
    id SERIAL PRIMARY KEY,
    blocked_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    requested_by INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Admin/SuperAdmin who requested unlock
    request_reason TEXT NOT NULL,
    request_status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL, -- MasterAdmin who reviewed
    review_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP WITH TIME ZONE
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_account_unlock_requests_blocked_user_id ON account_unlock_requests(blocked_user_id);
CREATE INDEX IF NOT EXISTS idx_account_unlock_requests_status ON account_unlock_requests(request_status);

-- Update pickup_allowance_history to reset to default after completion
-- This will be handled in the application logic, but we add a comment for clarity
COMMENT ON TABLE pickup_allowance_history IS 'Tracks pickup allowances. After additional pickup completion, allowance resets to default (1 unit) for next cycle.';

-- Add function to check if user has active stock
CREATE OR REPLACE FUNCTION has_active_pickup_stock(user_id_param INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    active_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO active_count
    FROM stock_updates su
    WHERE su.marketer_id = user_id_param 
      AND su.status IN ('pending', 'return_pending', 'transfer_pending')
      AND su.id NOT IN (
          SELECT DISTINCT pickup_id 
          FROM pickup_completion_tracking 
          WHERE confirmation_status = 'confirmed'
      );
    
    RETURN active_count > 0;
END;
$$ LANGUAGE plpgsql;

-- Add function to get active stock count for user
CREATE OR REPLACE FUNCTION get_active_pickup_stock_count(user_id_param INTEGER)
RETURNS INTEGER AS $$
DECLARE
    active_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO active_count
    FROM stock_updates su
    WHERE su.marketer_id = user_id_param 
      AND su.status IN ('pending', 'return_pending', 'transfer_pending')
      AND su.id NOT IN (
          SELECT DISTINCT pickup_id 
          FROM pickup_completion_tracking 
          WHERE confirmation_status = 'confirmed'
      );
    
    RETURN COALESCE(active_count, 0);
END;
$$ LANGUAGE plpgsql;
