-- 0020_enhanced_verification_system.sql
-- Enhanced verification system with physical verification and phone verification

-- Create verification_status enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE verification_status AS ENUM (
        'pending',
        'forms_submitted',
        'admin_physical_verification_pending',
        'admin_physical_verification_completed',
        'superadmin_phone_verification_pending',
        'superadmin_phone_verification_completed',
        'masteradmin_approval_pending',
        'masteradmin_approved',
        'admin_reviewed',
        'superadmin_verified',
        'superadmin_rejected',
        'approved'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create physical verification table
CREATE TABLE IF NOT EXISTS physical_verifications (
    id SERIAL PRIMARY KEY,
    marketer_unique_id VARCHAR(255) NOT NULL REFERENCES users(unique_id) ON DELETE CASCADE,
    admin_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    verification_date TIMESTAMP DEFAULT NOW(),
    location_latitude DECIMAL(10, 8),
    location_longitude DECIMAL(11, 8),
    location_address TEXT,
    landmark_description TEXT,
    admin_at_location_photo_url TEXT,
    marketer_at_location_photo_url TEXT,
    verification_notes TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rejected')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create phone verification table
CREATE TABLE IF NOT EXISTS phone_verifications (
    id SERIAL PRIMARY KEY,
    marketer_unique_id VARCHAR(255) NOT NULL REFERENCES users(unique_id) ON DELETE CASCADE,
    superadmin_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    verification_date TIMESTAMP DEFAULT NOW(),
    phone_number VARCHAR(20),
    call_duration_seconds INTEGER,
    verification_notes TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'no_answer')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create verification progress tracking table
CREATE TABLE IF NOT EXISTS verification_progress (
    id SERIAL PRIMARY KEY,
    marketer_unique_id VARCHAR(255) NOT NULL REFERENCES users(unique_id) ON DELETE CASCADE,
    current_step VARCHAR(100) NOT NULL,
    step_status VARCHAR(50) NOT NULL CHECK (step_status IN ('pending', 'in_progress', 'completed', 'failed')),
    step_data JSONB,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create verification reminders table
CREATE TABLE IF NOT EXISTS verification_reminders (
    id SERIAL PRIMARY KEY,
    marketer_unique_id VARCHAR(255) NOT NULL REFERENCES users(unique_id) ON DELETE CASCADE,
    reminder_type VARCHAR(50) NOT NULL CHECK (reminder_type IN ('form_incomplete', 'admin_verification_pending', 'superadmin_verification_pending')),
    reminder_message TEXT,
    sent_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_physical_verifications_marketer ON physical_verifications(marketer_unique_id);
CREATE INDEX IF NOT EXISTS idx_physical_verifications_admin ON physical_verifications(admin_id);
CREATE INDEX IF NOT EXISTS idx_phone_verifications_marketer ON phone_verifications(marketer_unique_id);
CREATE INDEX IF NOT EXISTS idx_phone_verifications_superadmin ON phone_verifications(superadmin_id);
CREATE INDEX IF NOT EXISTS idx_verification_progress_marketer ON verification_progress(marketer_unique_id);
CREATE INDEX IF NOT EXISTS idx_verification_reminders_marketer ON verification_reminders(marketer_unique_id);

-- Add triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER update_physical_verifications_updated_at BEFORE UPDATE ON physical_verifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_phone_verifications_updated_at BEFORE UPDATE ON phone_verifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_verification_progress_updated_at BEFORE UPDATE ON verification_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
