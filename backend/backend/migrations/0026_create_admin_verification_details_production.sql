-- Create admin_verification_details table for production
-- This table stores admin verification details for marketer submissions

CREATE TABLE IF NOT EXISTS admin_verification_details (
    id SERIAL PRIMARY KEY,
    verification_submission_id INTEGER NOT NULL,
    admin_id INTEGER NOT NULL,
    admin_verification_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verification_notes TEXT,
    location_photo_url TEXT,
    admin_marketer_photo_url TEXT,
    landmark_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key constraints
ALTER TABLE admin_verification_details 
ADD CONSTRAINT fk_admin_verification_submission 
FOREIGN KEY (verification_submission_id) REFERENCES verification_submissions(id) ON DELETE CASCADE;

ALTER TABLE admin_verification_details 
ADD CONSTRAINT fk_admin_verification_admin 
FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_verification_details_submission 
ON admin_verification_details(verification_submission_id);

CREATE INDEX IF NOT EXISTS idx_admin_verification_details_admin 
ON admin_verification_details(admin_id);

CREATE INDEX IF NOT EXISTS idx_admin_verification_details_date 
ON admin_verification_details(admin_verification_date);
