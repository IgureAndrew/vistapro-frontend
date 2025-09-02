-- 0015_fix_user_deletion.sql
-- Migration to fix user deletion issues by adding cascade delete and soft delete options

-- First, let's add soft delete columns to the users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS deleted_by INTEGER NULL REFERENCES users(id);

-- Create an index for better performance on soft delete queries
CREATE INDEX IF NOT EXISTS idx_users_deleted ON users(deleted);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);

-- Now let's handle the foreign key constraint issue
-- First, check if user_assignments table exists and has the problematic constraint
DO $$
BEGIN
    -- Check if user_assignments table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_assignments') THEN
        -- Drop the existing foreign key constraint if it exists
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'user_assignments_user_id_fkey' 
            AND table_name = 'user_assignments'
        ) THEN
            ALTER TABLE user_assignments DROP CONSTRAINT user_assignments_user_id_fkey;
        END IF;
        
        -- Add the new constraint with CASCADE DELETE
        ALTER TABLE user_assignments 
        ADD CONSTRAINT user_assignments_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES users(unique_id) 
        ON DELETE CASCADE;
        
        RAISE NOTICE 'Updated user_assignments foreign key constraint with CASCADE DELETE';
    ELSE
        RAISE NOTICE 'user_assignments table does not exist, skipping constraint update';
    END IF;
END $$;

-- Also handle any other tables that might reference users
-- Check for other foreign key constraints that reference users table
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    -- Find all foreign key constraints that reference the users table
    FOR constraint_record IN
        SELECT 
            tc.table_name,
            tc.constraint_name,
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND ccu.table_name = 'users'
        AND tc.table_name != 'users'
    LOOP
        -- Skip if it's already a CASCADE constraint or if it's the one we just updated
        IF constraint_record.constraint_name != 'user_assignments_user_id_fkey' THEN
            BEGIN
                -- Drop the existing constraint
                EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', 
                    constraint_record.table_name, 
                    constraint_record.constraint_name);
                
                -- Add new constraint with CASCADE DELETE
                EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES %I(%I) ON DELETE CASCADE',
                    constraint_record.table_name,
                    constraint_record.constraint_name,
                    constraint_record.column_name,
                    constraint_record.foreign_table_name,
                    constraint_record.foreign_column_name
                );
                
                RAISE NOTICE 'Updated constraint % on table % with CASCADE DELETE', 
                    constraint_record.constraint_name, 
                    constraint_record.table_name;
            EXCEPTION
                WHEN OTHERS THEN
                    RAISE NOTICE 'Could not update constraint % on table %: %', 
                        constraint_record.constraint_name, 
                        constraint_record.table_name, 
                        SQLERRM;
            END;
        END IF;
    END LOOP;
END $$;

-- Create a function to safely delete users (soft delete by default)
CREATE OR REPLACE FUNCTION safe_delete_user(user_id_param INTEGER, deleted_by_param INTEGER DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
    user_record RECORD;
    result JSON;
BEGIN
    -- Get the user record
    SELECT * INTO user_record FROM users WHERE id = user_id_param AND deleted = FALSE;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'message', 'User not found or already deleted');
    END IF;
    
    -- Perform soft delete
    UPDATE users 
    SET 
        deleted = TRUE,
        deleted_at = NOW(),
        deleted_by = deleted_by_param
    WHERE id = user_id_param;
    
    -- Log the activity
    INSERT INTO audit_logs (user_id, action, details, created_at)
    VALUES (
        deleted_by_param,
        'SOFT_DELETE_USER',
        json_build_object(
            'deleted_user_id', user_id_param,
            'deleted_user_unique_id', user_record.unique_id,
            'deleted_user_name', user_record.first_name || ' ' || user_record.last_name
        ),
        NOW()
    );
    
    RETURN json_build_object(
        'success', true, 
        'message', 'User soft deleted successfully',
        'user', row_to_json(user_record)
    );
END;
$$ LANGUAGE plpgsql;

-- Create a function to permanently delete users (hard delete with cascade)
CREATE OR REPLACE FUNCTION permanent_delete_user(user_id_param INTEGER, deleted_by_param INTEGER DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
    user_record RECORD;
    result JSON;
BEGIN
    -- Get the user record
    SELECT * INTO user_record FROM users WHERE id = user_id_param;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'message', 'User not found');
    END IF;
    
    -- Log the activity before deletion
    INSERT INTO audit_logs (user_id, action, details, created_at)
    VALUES (
        deleted_by_param,
        'PERMANENT_DELETE_USER',
        json_build_object(
            'deleted_user_id', user_id_param,
            'deleted_user_unique_id', user_record.unique_id,
            'deleted_user_name', user_record.first_name || ' ' || user_record.last_name
        ),
        NOW()
    );
    
    -- Perform hard delete (CASCADE will handle related records)
    DELETE FROM users WHERE id = user_id_param;
    
    RETURN json_build_object(
        'success', true, 
        'message', 'User permanently deleted successfully',
        'user', row_to_json(user_record)
    );
END;
$$ LANGUAGE plpgsql;

-- Create a function to restore soft-deleted users
CREATE OR REPLACE FUNCTION restore_user(user_id_param INTEGER, restored_by_param INTEGER DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
    user_record RECORD;
BEGIN
    -- Get the soft-deleted user record
    SELECT * INTO user_record FROM users WHERE id = user_id_param AND deleted = TRUE;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'message', 'User not found or not deleted');
    END IF;
    
    -- Restore the user
    UPDATE users 
    SET 
        deleted = FALSE,
        deleted_at = NULL,
        deleted_by = NULL
    WHERE id = user_id_param;
    
    -- Log the activity
    INSERT INTO audit_logs (user_id, action, details, created_at)
    VALUES (
        restored_by_param,
        'RESTORE_USER',
        json_build_object(
            'restored_user_id', user_id_param,
            'restored_user_unique_id', user_record.unique_id,
            'restored_user_name', user_record.first_name || ' ' || user_record.last_name
        ),
        NOW()
    );
    
    RETURN json_build_object(
        'success', true, 
        'message', 'User restored successfully',
        'user', row_to_json(user_record)
    );
END;
$$ LANGUAGE plpgsql;

-- Update existing queries to exclude soft-deleted users by default
-- This ensures that soft-deleted users don't appear in normal queries
CREATE OR REPLACE VIEW active_users AS
SELECT * FROM users WHERE deleted = FALSE;

-- Add a comment to document the migration
COMMENT ON COLUMN users.deleted IS 'Soft delete flag - TRUE means user is deleted';
COMMENT ON COLUMN users.deleted_at IS 'Timestamp when user was soft deleted';
COMMENT ON COLUMN users.deleted_by IS 'ID of user who performed the soft delete';
