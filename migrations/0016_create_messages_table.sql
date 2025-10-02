-- Create messages table for internal messaging system
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  read_at TIMESTAMP NULL,
  is_deleted BOOLEAN DEFAULT FALSE
);

-- Create indexes for performance
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_receiver ON messages(receiver_id);
CREATE INDEX idx_messages_conversation ON messages(sender_id, receiver_id, created_at);
CREATE INDEX idx_messages_unread ON messages(receiver_id, read_at) WHERE read_at IS NULL;

-- Add comments for documentation
COMMENT ON TABLE messages IS 'Internal messaging system for user communication';
COMMENT ON COLUMN messages.sender_id IS 'ID of the user who sent the message';
COMMENT ON COLUMN messages.receiver_id IS 'ID of the user who received the message';
COMMENT ON COLUMN messages.message IS 'The message content';
COMMENT ON COLUMN messages.read_at IS 'Timestamp when the message was read (NULL if unread)';
COMMENT ON COLUMN messages.is_deleted IS 'Soft delete flag for message deletion';
