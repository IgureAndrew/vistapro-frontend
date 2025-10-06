-- 0025_create_verification_submissions_production.sql
-- Creates the verification_submissions table for production

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

-- Add foreign key constraints
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
