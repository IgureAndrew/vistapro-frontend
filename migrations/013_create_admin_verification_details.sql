-- 013_create_admin_verification_details.sql
-- Creates table for Admin's verification details (photos, location, etc.)

CREATE TABLE IF NOT EXISTS admin_verification_details (
  id SERIAL PRIMARY KEY,
  verification_submission_id INTEGER NOT NULL,
  admin_id INTEGER NOT NULL,
  marketer_id INTEGER NOT NULL,
  
  -- Location verification
  marketer_address TEXT NOT NULL,
  landmark_description TEXT,
  location_photo_url TEXT, -- Photo of the marketer's residence with landmarks
  
  -- Admin and Marketer together
  admin_marketer_photo_url TEXT, -- Photo of Admin and Marketer together at residence
  
  -- Additional verification details
  verification_notes TEXT,
  admin_verification_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Document uploads
  additional_documents JSONB, -- Store array of additional document URLs
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key constraints
ALTER TABLE admin_verification_details 
  ADD CONSTRAINT fk_admin_verification_submission 
  FOREIGN KEY (verification_submission_id) REFERENCES verification_submissions(id) ON DELETE CASCADE;

ALTER TABLE admin_verification_details 
  ADD CONSTRAINT fk_admin_verification_admin 
  FOREIGN KEY (admin_id) REFERENCES users(id);

ALTER TABLE admin_verification_details 
  ADD CONSTRAINT fk_admin_verification_marketer 
  FOREIGN KEY (marketer_id) REFERENCES users(id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_admin_verification_submission ON admin_verification_details(verification_submission_id);
CREATE INDEX IF NOT EXISTS idx_admin_verification_admin ON admin_verification_details(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_verification_marketer ON admin_verification_details(marketer_id);
