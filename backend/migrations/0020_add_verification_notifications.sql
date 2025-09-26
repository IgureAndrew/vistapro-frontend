-- Migration: Add verification notifications table
-- Description: Creates table for storing verification-related notifications

-- Create verification_notifications table
CREATE TABLE IF NOT EXISTS verification_notifications (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    type VARCHAR(50) NOT NULL,
    data JSONB NOT NULL,
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_verification_notifications_user_id ON verification_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_notifications_type ON verification_notifications(type);
CREATE INDEX IF NOT EXISTS idx_verification_notifications_created_at ON verification_notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_verification_notifications_read_at ON verification_notifications(read_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_verification_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE OR REPLACE TRIGGER trigger_update_verification_notifications_updated_at
    BEFORE UPDATE ON verification_notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_verification_notifications_updated_at();

-- Add comments
COMMENT ON TABLE verification_notifications IS 'Stores verification-related notifications for users';
COMMENT ON COLUMN verification_notifications.user_id IS 'User unique_id who receives the notification';
COMMENT ON COLUMN verification_notifications.type IS 'Type of notification (verification_status_update, verification_reminder, verification_approved)';
COMMENT ON COLUMN verification_notifications.data IS 'JSON data containing notification details';
COMMENT ON COLUMN verification_notifications.read_at IS 'Timestamp when notification was read';
COMMENT ON COLUMN verification_notifications.created_at IS 'Timestamp when notification was created';
COMMENT ON COLUMN verification_notifications.updated_at IS 'Timestamp when notification was last updated';
