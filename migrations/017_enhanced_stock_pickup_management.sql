-- Enhanced Stock Pickup Management System
-- This migration adds new statuses and returned stock tracking

-- 1. Add new statuses to stock_update_status enum
DO $$
BEGIN
    -- Add new statuses if they don't exist
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'return_pending' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'stock_update_status')) THEN
        ALTER TYPE stock_update_status ADD VALUE 'return_pending';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'transfer_pending' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'stock_update_status')) THEN
        ALTER TYPE stock_update_status ADD VALUE 'transfer_pending';
    END IF;
END
$$;

-- 2. Add returned_stock field to products table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='returned_stock') THEN
        ALTER TABLE products ADD COLUMN returned_stock INTEGER DEFAULT 0;
    END IF;
END
$$;

-- 3. Add order_confirmation_tracking table to track when orders are confirmed
CREATE TABLE IF NOT EXISTS order_confirmation_tracking (
    id SERIAL PRIMARY KEY,
    stock_update_id INTEGER NOT NULL REFERENCES stock_updates(id) ON DELETE CASCADE,
    order_id INTEGER, -- Reference to orders table if it exists
    confirmed_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- MasterAdmin who confirmed
    confirmed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    confirmation_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_order_confirmation_tracking_stock_update_id ON order_confirmation_tracking(stock_update_id);
CREATE INDEX IF NOT EXISTS idx_order_confirmation_tracking_confirmed_by ON order_confirmation_tracking(confirmed_by);

-- 4. Add return_transfer_confirmation table to track return/transfer confirmations
CREATE TABLE IF NOT EXISTS return_transfer_confirmation (
    id SERIAL PRIMARY KEY,
    stock_update_id INTEGER NOT NULL REFERENCES stock_updates(id) ON DELETE CASCADE,
    confirmation_type VARCHAR(20) NOT NULL CHECK (confirmation_type IN ('return', 'transfer')),
    confirmed_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- MasterAdmin who confirmed
    confirmed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    confirmation_notes TEXT,
    inventory_updated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_return_transfer_confirmation_stock_update_id ON return_transfer_confirmation(stock_update_id);
CREATE INDEX IF NOT EXISTS idx_return_transfer_confirmation_confirmed_by ON return_transfer_confirmation(confirmed_by);

-- 5. Add inventory_update_log table to track inventory changes
CREATE TABLE IF NOT EXISTS inventory_update_log (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    stock_update_id INTEGER REFERENCES stock_updates(id) ON DELETE SET NULL,
    update_type VARCHAR(20) NOT NULL CHECK (update_type IN ('pickup', 'return', 'sale', 'adjustment')),
    quantity_change INTEGER NOT NULL, -- Positive for additions, negative for subtractions
    previous_quantity INTEGER NOT NULL,
    new_quantity INTEGER NOT NULL,
    updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    update_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_inventory_update_log_product_id ON inventory_update_log(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_update_log_stock_update_id ON inventory_update_log(stock_update_id);
CREATE INDEX IF NOT EXISTS idx_inventory_update_log_updated_by ON inventory_update_log(updated_by);

-- 6. Add notification_preferences table for inventory notifications
CREATE TABLE IF NOT EXISTS notification_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, notification_type)
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);

-- 7. Insert default notification preferences for inventory updates
INSERT INTO notification_preferences (user_id, notification_type, enabled)
SELECT 
    u.id,
    'inventory_return_update',
    TRUE
FROM users u
WHERE u.role IN ('MasterAdmin', 'SuperAdmin', 'Admin')
ON CONFLICT (user_id, notification_type) DO NOTHING;

-- 8. Add function to update inventory and log changes
CREATE OR REPLACE FUNCTION update_inventory_with_log(
    p_product_id INTEGER,
    p_stock_update_id INTEGER,
    p_update_type VARCHAR(20),
    p_quantity_change INTEGER,
    p_updated_by INTEGER,
    p_update_reason TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    v_previous_quantity INTEGER;
    v_new_quantity INTEGER;
BEGIN
    -- Get current quantity
    SELECT available_quantity INTO v_previous_quantity
    FROM products
    WHERE id = p_product_id;
    
    -- Calculate new quantity
    v_new_quantity := v_previous_quantity + p_quantity_change;
    
    -- Update products table
    IF p_update_type = 'return' THEN
        -- For returns, update both available_quantity and returned_stock
        UPDATE products 
        SET 
            available_quantity = v_new_quantity,
            returned_stock = returned_stock + ABS(p_quantity_change)
        WHERE id = p_product_id;
    ELSE
        -- For other updates, just update available_quantity
        UPDATE products 
        SET available_quantity = v_new_quantity
        WHERE id = p_product_id;
    END IF;
    
    -- Log the inventory change
    INSERT INTO inventory_update_log (
        product_id,
        stock_update_id,
        update_type,
        quantity_change,
        previous_quantity,
        new_quantity,
        updated_by,
        update_reason
    ) VALUES (
        p_product_id,
        p_stock_update_id,
        p_update_type,
        p_quantity_change,
        v_previous_quantity,
        v_new_quantity,
        p_updated_by,
        p_update_reason
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 9. Add function to get countdown/count-up display
CREATE OR REPLACE FUNCTION get_pickup_time_display(
    p_deadline TIMESTAMP WITH TIME ZONE,
    p_status VARCHAR(20)
) RETURNS TEXT AS $$
DECLARE
    v_now TIMESTAMP WITH TIME ZONE := NOW();
    v_diff INTERVAL;
    v_hours INTEGER;
    v_minutes INTEGER;
    v_seconds INTEGER;
BEGIN
    -- Calculate time difference
    v_diff := p_deadline - v_now;
    
    -- Extract time components
    v_hours := EXTRACT(EPOCH FROM v_diff) / 3600;
    v_minutes := (EXTRACT(EPOCH FROM v_diff) % 3600) / 60;
    v_seconds := EXTRACT(EPOCH FROM v_diff) % 60;
    
    -- Handle different statuses
    IF p_status IN ('sold', 'returned', 'transferred') THEN
        RETURN 'Completed';
    ELSIF p_status IN ('return_pending', 'transfer_pending') THEN
        RETURN 'Pending Confirmation';
    ELSIF v_diff > INTERVAL '0' THEN
        -- Still active - show countdown
        IF v_hours > 0 THEN
            RETURN v_hours || 'h ' || v_minutes || 'm ' || v_seconds || 's';
        ELSIF v_minutes > 0 THEN
            RETURN v_minutes || 'm ' || v_seconds || 's';
        ELSE
            RETURN v_seconds || 's';
        END IF;
    ELSE
        -- Expired - show count-up
        v_hours := ABS(v_hours);
        v_minutes := ABS(v_minutes);
        v_seconds := ABS(v_seconds);
        
        IF v_hours > 0 THEN
            RETURN 'Expired ' || v_hours || 'h ' || v_minutes || 'm ago';
        ELSIF v_minutes > 0 THEN
            RETURN 'Expired ' || v_minutes || 'm ' || v_seconds || 's ago';
        ELSE
            RETURN 'Expired ' || v_seconds || 's ago';
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 10. Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to relevant tables
DROP TRIGGER IF EXISTS update_notification_preferences_updated_at ON notification_preferences;
CREATE TRIGGER update_notification_preferences_updated_at
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 11. Add comments for documentation
COMMENT ON TABLE order_confirmation_tracking IS 'Tracks when orders are confirmed by MasterAdmin';
COMMENT ON TABLE return_transfer_confirmation IS 'Tracks when returns/transfers are confirmed by MasterAdmin';
COMMENT ON TABLE inventory_update_log IS 'Logs all inventory changes for audit trail';
COMMENT ON TABLE notification_preferences IS 'User preferences for different notification types';
COMMENT ON FUNCTION update_inventory_with_log IS 'Updates inventory and logs changes with audit trail';
COMMENT ON FUNCTION get_pickup_time_display IS 'Returns formatted countdown/count-up display for pickups';
