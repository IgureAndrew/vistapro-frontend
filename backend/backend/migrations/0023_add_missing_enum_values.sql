-- Add missing enum values to stock_update_status
-- This migration adds enum values that are used in the code but missing from production

DO $$
BEGIN
    -- Add transfer_approved if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'transfer_approved' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'stock_update_status')) THEN
        ALTER TYPE stock_update_status ADD VALUE 'transfer_approved';
    END IF;
    
    -- Add transfer_rejected if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'transfer_rejected' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'stock_update_status')) THEN
        ALTER TYPE stock_update_status ADD VALUE 'transfer_rejected';
    END IF;
    
    -- Add pending_order if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'pending_order' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'stock_update_status')) THEN
        ALTER TYPE stock_update_status ADD VALUE 'pending_order';
    END IF;
    
    -- Add return_pending if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'return_pending' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'stock_update_status')) THEN
        ALTER TYPE stock_update_status ADD VALUE 'return_pending';
    END IF;
    
    -- Add transfer_pending if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'transfer_pending' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'stock_update_status')) THEN
        ALTER TYPE stock_update_status ADD VALUE 'transfer_pending';
    END IF;
    
    -- Add transferred if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'transferred' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'stock_update_status')) THEN
        ALTER TYPE stock_update_status ADD VALUE 'transferred';
    END IF;
    
    -- Add expired if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'expired' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'stock_update_status')) THEN
        ALTER TYPE stock_update_status ADD VALUE 'expired';
    END IF;
    
    -- Add completed if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'completed' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'stock_update_status')) THEN
        ALTER TYPE stock_update_status ADD VALUE 'completed';
    END IF;
    
    -- Add rejected if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'rejected' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'stock_update_status')) THEN
        ALTER TYPE stock_update_status ADD VALUE 'rejected';
    END IF;
    
    -- Add none if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'none' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'stock_update_status')) THEN
        ALTER TYPE stock_update_status ADD VALUE 'none';
    END IF;
END
$$;

-- Add comments for documentation
COMMENT ON TYPE stock_update_status IS 'Status enum for stock updates: none, pending, transfer_pending, completed, rejected, sold, transfer_approved, transfer_rejected, return_pending, returned, expired, transferred, pending_order';
