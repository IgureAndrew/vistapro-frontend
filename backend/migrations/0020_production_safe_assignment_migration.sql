-- Migration: Production-Safe Assignment Migration
-- Description: Safely migrate user assignments from user_assignments table to users table
-- Date: 2024-12-19
-- Safety: This migration preserves all existing data and can be rolled back

-- Step 1: Create backup table of original assignments
CREATE TABLE IF NOT EXISTS user_assignments_backup AS 
SELECT *, NOW() as backup_created_at 
FROM user_assignments 
WHERE is_active = TRUE;

-- Step 2: Add new columns if they don't exist (idempotent)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS admin_id INTEGER,
ADD COLUMN IF NOT EXISTS super_admin_id INTEGER;

-- Step 3: Add foreign key constraints (if not already added)
DO $$
BEGIN
    -- Add admin_id foreign key constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_admin' 
        AND table_name = 'users'
    ) THEN
        ALTER TABLE users 
        ADD CONSTRAINT fk_admin 
        FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL;
    END IF;
    
    -- Add super_admin_id foreign key constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_super_admin' 
        AND table_name = 'users'
    ) THEN
        ALTER TABLE users 
        ADD CONSTRAINT fk_super_admin 
        FOREIGN KEY (super_admin_id) REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Step 4: Create indexes for performance (if not already created)
CREATE INDEX IF NOT EXISTS idx_users_admin_id ON users(admin_id);
CREATE INDEX IF NOT EXISTS idx_users_super_admin_id ON users(super_admin_id);

-- Step 5: Migrate assignments (only if new columns are NULL)
-- This ensures we don't overwrite existing data
UPDATE users 
SET admin_id = assignee_internal_id,
    updated_at = NOW()
FROM (
    SELECT 
        u.id as marketer_internal_id,
        assignee.id as assignee_internal_id,
        ua.assignment_type
    FROM user_assignments ua
    JOIN users u ON u.unique_id = ua.marketer_id
    JOIN users assignee ON assignee.unique_id = ua.assigned_to_id
    WHERE ua.is_active = TRUE 
    AND ua.assignment_type = 'admin'
    AND u.admin_id IS NULL  -- Only update if not already set
) migration_data
WHERE users.id = migration_data.marketer_internal_id;

UPDATE users 
SET super_admin_id = assignee_internal_id,
    updated_at = NOW()
FROM (
    SELECT 
        u.id as admin_internal_id,
        assignee.id as assignee_internal_id,
        ua.assignment_type
    FROM user_assignments ua
    JOIN users u ON u.unique_id = ua.marketer_id
    JOIN users assignee ON assignee.unique_id = ua.assigned_to_id
    WHERE ua.is_active = TRUE 
    AND ua.assignment_type = 'superadmin'
    AND u.super_admin_id IS NULL  -- Only update if not already set
) migration_data
WHERE users.id = migration_data.admin_internal_id;

-- Step 6: Add comments for documentation
COMMENT ON COLUMN users.admin_id IS 'ID of the Admin user this Marketer is assigned to (migrated from user_assignments)';
COMMENT ON COLUMN users.super_admin_id IS 'ID of the SuperAdmin user this Admin is assigned to (migrated from user_assignments)';
COMMENT ON TABLE user_assignments_backup IS 'Backup of original user_assignments data before migration to users table columns';

-- Step 7: Create validation view to compare old vs new data
CREATE OR REPLACE VIEW assignment_migration_validation AS
SELECT 
    'admin' as assignment_type,
    COUNT(*) as original_count,
    (SELECT COUNT(*) FROM users WHERE admin_id IS NOT NULL AND role = 'Marketer') as migrated_count,
    CASE 
        WHEN COUNT(*) = (SELECT COUNT(*) FROM users WHERE admin_id IS NOT NULL AND role = 'Marketer') 
        THEN 'MATCH' 
        ELSE 'MISMATCH' 
    END as status
FROM user_assignments 
WHERE is_active = TRUE AND assignment_type = 'admin'

UNION ALL

SELECT 
    'superadmin' as assignment_type,
    COUNT(*) as original_count,
    (SELECT COUNT(*) FROM users WHERE super_admin_id IS NOT NULL AND role = 'Admin') as migrated_count,
    CASE 
        WHEN COUNT(*) = (SELECT COUNT(*) FROM users WHERE super_admin_id IS NOT NULL AND role = 'Admin') 
        THEN 'MATCH' 
        ELSE 'MISMATCH' 
    END as status
FROM user_assignments 
WHERE is_active = TRUE AND assignment_type = 'superadmin';

-- Step 8: Log migration completion
INSERT INTO migration_log (migration_name, executed_at, status, notes) 
VALUES (
    '0020_production_safe_assignment_migration', 
    NOW(), 
    'COMPLETED', 
    'Safely migrated user assignments from user_assignments table to users table columns. Original data preserved in user_assignments_backup table.'
) ON CONFLICT DO NOTHING;
