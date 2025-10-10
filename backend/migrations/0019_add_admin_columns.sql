-- Migration: Add admin_id and super_admin_id columns to users table
-- Description: Add the missing foreign key columns for user hierarchy

-- Add admin_id column (references users.id)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- Add super_admin_id column (references users.id)  
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS super_admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_admin_id ON users(admin_id);
CREATE INDEX IF NOT EXISTS idx_users_super_admin_id ON users(super_admin_id);

-- Add comments for documentation
COMMENT ON COLUMN users.admin_id IS 'ID of the Admin this user is assigned to (for Marketers)';
COMMENT ON COLUMN users.super_admin_id IS 'ID of the SuperAdmin this user is assigned to (for Admins)';
