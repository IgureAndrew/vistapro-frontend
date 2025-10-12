-- 0021_verification_system_migration.sql
-- Migration script for existing users to new verification system
-- This script handles the transition from old verification system to new role-based system

-- First, ensure verification_submissions table exists
CREATE TABLE IF NOT EXISTS verification_submissions (
  id SERIAL PRIMARY KEY,
  marketer_id INTEGER NOT NULL,
  admin_id INTEGER NOT NULL,
  super_admin_id INTEGER NOT NULL,
  submission_status VARCHAR(50) NOT NULL DEFAULT 'pending_admin_review',
  -- Status values: pending_admin_review, admin_verified, pending_superadmin_review, 
  -- superadmin_verified, pending_masteradmin_approval, approved, rejected
  
  -- Timestamps for each stage
  admin_reviewed_at TIMESTAMP,
  superadmin_reviewed_at TIMESTAMP,
  masteradmin_approved_at TIMESTAMP,
  
  -- Rejection details
  rejection_reason TEXT,
  rejected_by VARCHAR(50), -- admin, superadmin, masteradmin
  rejected_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key constraints if they don't exist
DO $$
BEGIN
    -- Add marketer foreign key
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_verification_marketer' 
        AND table_name = 'verification_submissions'
    ) THEN
        ALTER TABLE verification_submissions 
        ADD CONSTRAINT fk_verification_marketer 
        FOREIGN KEY (marketer_id) REFERENCES users(id);
    END IF;
    
    -- Add admin foreign key
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_verification_admin' 
        AND table_name = 'verification_submissions'
    ) THEN
        ALTER TABLE verification_submissions 
        ADD CONSTRAINT fk_verification_admin 
        FOREIGN KEY (admin_id) REFERENCES users(id);
    END IF;
    
    -- Add superadmin foreign key
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_verification_superadmin' 
        AND table_name = 'verification_submissions'
    ) THEN
        ALTER TABLE verification_submissions 
        ADD CONSTRAINT fk_verification_superadmin 
        FOREIGN KEY (super_admin_id) REFERENCES users(id);
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_verification_submissions_marketer ON verification_submissions(marketer_id);
CREATE INDEX IF NOT EXISTS idx_verification_submissions_admin ON verification_submissions(admin_id);
CREATE INDEX IF NOT EXISTS idx_verification_submissions_superadmin ON verification_submissions(super_admin_id);
CREATE INDEX IF NOT EXISTS idx_verification_submissions_status ON verification_submissions(submission_status);

-- Ensure users table has verification status columns
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS overall_verification_status VARCHAR(50) DEFAULT 'not_started',
ADD COLUMN IF NOT EXISTS verification_submission_id INTEGER,
ADD COLUMN IF NOT EXISTS verification_completed_at TIMESTAMP;

-- Add foreign key constraint for verification_submission_id if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_user_verification_submission' 
        AND table_name = 'users'
    ) THEN
        ALTER TABLE users 
        ADD CONSTRAINT fk_user_verification_submission 
        FOREIGN KEY (verification_submission_id) REFERENCES verification_submissions(id);
    END IF;
END $$;

-- Create index for verification status
CREATE INDEX IF NOT EXISTS idx_users_verification_status ON users(overall_verification_status);
CREATE INDEX IF NOT EXISTS idx_users_verification_submission ON users(verification_submission_id);

-- Migration logic for existing users
DO $$
DECLARE
    user_record RECORD;
    admin_id INTEGER;
    superadmin_id INTEGER;
    submission_id INTEGER;
BEGIN
    -- Get default admin and superadmin IDs for verification submissions
    -- Use the first available admin and superadmin, or create default entries
    
    -- Get first admin
    SELECT id INTO admin_id FROM users WHERE role = 'Admin' AND deleted = FALSE LIMIT 1;
    IF admin_id IS NULL THEN
        -- If no admin exists, we'll handle this in the application logic
        admin_id := 1; -- Placeholder, will be updated when admin is assigned
    END IF;
    
    -- Get first superadmin
    SELECT id INTO superadmin_id FROM users WHERE role = 'SuperAdmin' AND deleted = FALSE LIMIT 1;
    IF superadmin_id IS NULL THEN
        -- If no superadmin exists, we'll handle this in the application logic
        superadmin_id := 1; -- Placeholder, will be updated when superadmin is assigned
    END IF;
    
    -- Migrate existing verified marketers to re-verification status
    FOR user_record IN 
        SELECT id, unique_id, role, overall_verification_status, admin_id as user_admin_id, super_admin_id
        FROM users 
        WHERE deleted = FALSE
    LOOP
        IF user_record.role = 'Marketer' THEN
            -- Mark existing verified marketers for re-verification
            IF user_record.overall_verification_status = 'approved' OR user_record.overall_verification_status IS NULL THEN
                -- Create verification submission for re-verification
                INSERT INTO verification_submissions (
                    marketer_id, 
                    admin_id, 
                    super_admin_id, 
                    submission_status,
                    created_at,
                    updated_at
                ) VALUES (
                    user_record.id,
                    COALESCE(user_record.user_admin_id, admin_id),
                    COALESCE(user_record.super_admin_id, superadmin_id),
                    'pending_admin_review',
                    NOW(),
                    NOW()
                ) RETURNING id INTO submission_id;
                
                -- Update user status
                UPDATE users SET 
                    overall_verification_status = 'admin_physical_verification_pending',
                    verification_submission_id = submission_id
                WHERE id = user_record.id;
                
                RAISE NOTICE 'Migrated marketer % for re-verification', user_record.unique_id;
                
            ELSIF user_record.overall_verification_status IN ('forms_submitted', 'admin_review', 'superadmin_review') THEN
                -- Mark partially verified marketers to continue process
                UPDATE users SET 
                    overall_verification_status = 'admin_physical_verification_pending'
                WHERE id = user_record.id;
                
                RAISE NOTICE 'Updated marketer % to continue verification', user_record.unique_id;
            END IF;
            
        ELSIF user_record.role IN ('Admin', 'SuperAdmin') THEN
            -- Admin/SuperAdmin get direct approval status (no forms, no verification)
            UPDATE users SET 
                overall_verification_status = 'masteradmin_approval_pending'
            WHERE id = user_record.id;
            
            RAISE NOTICE 'Set % % for direct MasterAdmin approval', user_record.role, user_record.unique_id;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Migration completed successfully';
END $$;

-- Create notification entries for existing users about re-verification
INSERT INTO notifications (user_unique_id, message, created_at)
SELECT 
    u.unique_id,
    CASE 
        WHEN u.role = 'Marketer' THEN 
            'Your account requires re-verification with our new verification system. Please wait for Admin and SuperAdmin verification.'
        WHEN u.role IN ('Admin', 'SuperAdmin') THEN 
            'Your account is pending MasterAdmin approval. No forms or verification required.'
        ELSE 
            'Your account status has been updated. Please contact support if you have any questions.'
    END,
    NOW()
FROM users u
WHERE u.deleted = FALSE 
AND u.overall_verification_status IN ('admin_physical_verification_pending', 'masteradmin_approval_pending');

-- Add comments for documentation
COMMENT ON TABLE verification_submissions IS 'Tracks verification workflow for marketers through Admin → SuperAdmin → MasterAdmin process';
COMMENT ON COLUMN verification_submissions.submission_status IS 'Current status in verification workflow';
COMMENT ON COLUMN users.overall_verification_status IS 'User verification status: not_started, forms_submitted, admin_physical_verification_pending, admin_physical_verification_completed, superadmin_phone_verification_pending, superadmin_phone_verification_completed, masteradmin_approval_pending, approved';
