-- Add missing device_name and device_model columns to orders table
-- This migration adds the columns that getRecentActivities function expects

-- Add device_name column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'device_name'
    ) THEN
        ALTER TABLE orders ADD COLUMN device_name VARCHAR(255);
    END IF;
END $$;

-- Add device_model column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'device_model'
    ) THEN
        ALTER TABLE orders ADD COLUMN device_model VARCHAR(255);
    END IF;
END $$;

-- Add device_type column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'device_type'
    ) THEN
        ALTER TABLE orders ADD COLUMN device_type VARCHAR(50);
    END IF;
END $$;

-- Add dealer_cost_price column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'dealer_cost_price'
    ) THEN
        ALTER TABLE orders ADD COLUMN dealer_cost_price NUMERIC(10,2);
    END IF;
END $$;

-- Add marketer_selling_price column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'marketer_selling_price'
    ) THEN
        ALTER TABLE orders ADD COLUMN marketer_selling_price NUMERIC(10,2);
    END IF;
END $$;

-- Add sold_amount column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'sold_amount'
    ) THEN
        ALTER TABLE orders ADD COLUMN sold_amount NUMERIC(10,2);
    END IF;
END $$;

-- Add customer_phone column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'customer_phone'
    ) THEN
        ALTER TABLE orders ADD COLUMN customer_phone VARCHAR(50);
    END IF;
END $$;

-- Add customer_address column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'customer_address'
    ) THEN
        ALTER TABLE orders ADD COLUMN customer_address TEXT;
    END IF;
END $$;

-- Add bnpl_platform column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'bnpl_platform'
    ) THEN
        ALTER TABLE orders ADD COLUMN bnpl_platform VARCHAR(50);
    END IF;
END $$;

-- Add sale_date column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'sale_date'
    ) THEN
        ALTER TABLE orders ADD COLUMN sale_date TIMESTAMP;
    END IF;
END $$;

-- Update existing orders with device information from products table
-- This will populate the device_name and device_model for existing orders
UPDATE orders 
SET 
    device_name = p.device_name,
    device_model = p.device_model,
    device_type = p.device_type,
    dealer_cost_price = p.cost_price,
    marketer_selling_price = p.selling_price,
    sold_amount = p.selling_price * number_of_devices
FROM products p
WHERE orders.product_id = p.id 
  AND (orders.device_name IS NULL OR orders.device_model IS NULL);

-- Set default values for any remaining NULL values
UPDATE orders 
SET 
    device_name = COALESCE(device_name, 'Unknown Device'),
    device_model = COALESCE(device_model, 'Unknown Model'),
    device_type = COALESCE(device_type, 'Unknown Type'),
    dealer_cost_price = COALESCE(dealer_cost_price, 0),
    marketer_selling_price = COALESCE(marketer_selling_price, 0),
    sold_amount = COALESCE(sold_amount, 0),
    customer_phone = COALESCE(customer_phone, ''),
    customer_address = COALESCE(customer_address, ''),
    sale_date = COALESCE(sale_date, created_at)
WHERE device_name IS NULL OR device_model IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN orders.device_name IS 'Name of the device/product ordered';
COMMENT ON COLUMN orders.device_model IS 'Model of the device/product ordered';
COMMENT ON COLUMN orders.device_type IS 'Type/category of the device';
COMMENT ON COLUMN orders.dealer_cost_price IS 'Cost price from dealer';
COMMENT ON COLUMN orders.marketer_selling_price IS 'Selling price set by marketer';
COMMENT ON COLUMN orders.sold_amount IS 'Total amount sold (selling_price * quantity)';
COMMENT ON COLUMN orders.customer_phone IS 'Customer phone number';
COMMENT ON COLUMN orders.customer_address IS 'Customer delivery address';
COMMENT ON COLUMN orders.bnpl_platform IS 'Buy Now Pay Later platform used';
COMMENT ON COLUMN orders.sale_date IS 'Date when the sale was made';
