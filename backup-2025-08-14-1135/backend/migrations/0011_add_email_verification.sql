-- 0011_add_email_verification.sql
-- Add email verification fields to users table

ALTER TABLE users
ADD COLUMN email_verified BOOLEAN DEFAULT false,
ADD COLUMN email_verification_token VARCHAR(255),
ADD COLUMN email_verification_expires TIMESTAMP,
ADD COLUMN email_verification_sent_at TIMESTAMP;

-- Create index for faster token lookups
CREATE INDEX idx_users_email_verification_token ON users(email_verification_token);
CREATE INDEX idx_users_email_verified ON users(email_verified);

