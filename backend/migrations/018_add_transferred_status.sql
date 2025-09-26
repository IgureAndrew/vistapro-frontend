-- Add transferred status to stock_update_status enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'transferred' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'stock_update_status')) THEN
        ALTER TYPE stock_update_status ADD VALUE 'transferred';
    END IF;
END
$$;

