-- 016_add_unique_constraint_admin_verification.sql
-- Add unique constraint to admin_verification_details table

-- Add unique constraint on verification_submission_id to prevent duplicates
ALTER TABLE admin_verification_details 
ADD CONSTRAINT unique_verification_submission 
UNIQUE (verification_submission_id);
