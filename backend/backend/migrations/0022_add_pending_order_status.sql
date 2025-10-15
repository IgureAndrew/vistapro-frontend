-- Add pending_order status to stock_update_status enum
-- This migration adds the missing 'pending_order' status that is used in the code

DO $$
BEGIN
    -- Add pending_order status if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'pending_order' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'stock_update_status')) THEN
        ALTER TYPE stock_update_status ADD VALUE 'pending_order';
        RAISE NOTICE 'Added pending_order to stock_update_status enum';
    ELSE
        RAISE NOTICE 'pending_order already exists in stock_update_status enum';
    END IF;
END
$$;

-- Add comment for documentation
COMMENT ON TYPE stock_update_status IS 'Status values for stock updates: pending, picked_up, in_transit, sold, returned, expired, return_pending, transfer_pending, transferred, pending_order';
