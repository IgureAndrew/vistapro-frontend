-- Rollback Script: Assignment Migration Rollback
-- Description: Safely rollback assignment migration if needed
-- WARNING: Only run this if you need to rollback the migration

-- Step 1: Clear the new assignment columns
UPDATE users 
SET admin_id = NULL, 
    super_admin_id = NULL,
    updated_at = NOW()
WHERE admin_id IS NOT NULL OR super_admin_id IS NOT NULL;

-- Step 2: Verify rollback
SELECT 
    'admin' as type,
    COUNT(*) as remaining_admin_assignments
FROM users 
WHERE admin_id IS NOT NULL

UNION ALL

SELECT 
    'superadmin' as type,
    COUNT(*) as remaining_superadmin_assignments
FROM users 
WHERE super_admin_id IS NOT NULL;

-- Step 3: Log rollback
INSERT INTO migration_log (migration_name, executed_at, status, notes) 
VALUES (
    '0020_production_safe_assignment_migration_ROLLBACK', 
    NOW(), 
    'ROLLED_BACK', 
    'Assignment migration has been rolled back. Original data preserved in user_assignments table.'
) ON CONFLICT DO NOTHING;
