-- Add email verification columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_expires TIMESTAMP;

-- Update existing users to have verified emails (for development)
UPDATE users SET email_verified = TRUE WHERE email_verified IS NULL;

-- Insert migration record
INSERT INTO migrations (migration_name) VALUES ('0002_add_email_verification') 
ON CONFLICT (migration_name) DO NOTHING;
