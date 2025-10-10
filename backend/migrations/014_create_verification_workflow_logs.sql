-- 014_create_verification_workflow_logs.sql
-- Creates table to track all actions in the verification workflow

CREATE TABLE IF NOT EXISTS verification_workflow_logs (
  id SERIAL PRIMARY KEY,
  verification_submission_id INTEGER NOT NULL,
  action_by INTEGER NOT NULL, -- User ID who performed the action
  action_by_role VARCHAR(50) NOT NULL, -- admin, superadmin, masteradmin
  action_type VARCHAR(50) NOT NULL, -- review, verify, approve, reject, send_to_next_level
  action_description TEXT,
  previous_status VARCHAR(50),
  new_status VARCHAR(50),
  notes TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key constraints
ALTER TABLE verification_workflow_logs 
  ADD CONSTRAINT fk_workflow_verification_submission 
  FOREIGN KEY (verification_submission_id) REFERENCES verification_submissions(id) ON DELETE CASCADE;

ALTER TABLE verification_workflow_logs 
  ADD CONSTRAINT fk_workflow_action_by 
  FOREIGN KEY (action_by) REFERENCES users(id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_workflow_submission ON verification_workflow_logs(verification_submission_id);
CREATE INDEX IF NOT EXISTS idx_workflow_action_by ON verification_workflow_logs(action_by);
CREATE INDEX IF NOT EXISTS idx_workflow_action_type ON verification_workflow_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_workflow_created_at ON verification_workflow_logs(created_at);
