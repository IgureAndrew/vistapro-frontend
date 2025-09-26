-- migrations/009_add_location_column.sql
-- This migration adds the location column to the users table
-- which is required for location-based transfers

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS location VARCHAR(100);

-- Add a comment to document the column
COMMENT ON COLUMN users.location IS 'User location for location-based transfers and filtering';

-- Create an index for faster location-based queries
CREATE INDEX IF NOT EXISTS idx_users_location ON users(location);
