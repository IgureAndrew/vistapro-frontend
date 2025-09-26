-- 015_add_verification_status_to_users.sql
-- Adds verification status tracking to users table

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS overall_verification_status VARCHAR(50) DEFAULT 'not_started',
ADD COLUMN IF NOT EXISTS verification_submission_id INTEGER,
ADD COLUMN IF NOT EXISTS verification_completed_at TIMESTAMP;

-- Status values: not_started, forms_submitted, admin_review, superadmin_review, 
-- masteradmin_approval, approved, rejected

-- Add foreign key constraint
ALTER TABLE users 
  ADD CONSTRAINT fk_user_verification_submission 
  FOREIGN KEY (verification_submission_id) REFERENCES verification_submissions(id);

-- Create index
CREATE INDEX IF NOT EXISTS idx_users_verification_status ON users(overall_verification_status);
CREATE INDEX IF NOT EXISTS idx_users_verification_submission ON users(verification_submission_id);
