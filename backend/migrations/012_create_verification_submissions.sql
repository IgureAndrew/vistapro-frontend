-- 012_create_verification_submissions.sql
-- Creates the main verification submissions table to track the complete workflow

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
ALTER TABLE verification_submissions 
  ADD CONSTRAINT fk_verification_marketer 
  FOREIGN KEY (marketer_id) REFERENCES users(id);

ALTER TABLE verification_submissions 
  ADD CONSTRAINT fk_verification_admin 
  FOREIGN KEY (admin_id) REFERENCES users(id);

ALTER TABLE verification_submissions 
  ADD CONSTRAINT fk_verification_superadmin 
  FOREIGN KEY (super_admin_id) REFERENCES users(id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_verification_submissions_marketer ON verification_submissions(marketer_id);
CREATE INDEX IF NOT EXISTS idx_verification_submissions_admin ON verification_submissions(admin_id);
CREATE INDEX IF NOT EXISTS idx_verification_submissions_superadmin ON verification_submissions(super_admin_id);
CREATE INDEX IF NOT EXISTS idx_verification_submissions_status ON verification_submissions(submission_status);
