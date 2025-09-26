-- Migration: Create user assignments table
-- Description: Establish hierarchical relationships between users (marketers assigned to admins/superadmins)

CREATE TABLE IF NOT EXISTS user_assignments (
  id SERIAL PRIMARY KEY,
  marketer_id VARCHAR(50) NOT NULL REFERENCES users(unique_id) ON DELETE CASCADE,
  assigned_to_id VARCHAR(50) NOT NULL REFERENCES users(unique_id) ON DELETE CASCADE,
  assignment_type VARCHAR(20) NOT NULL CHECK (assignment_type IN ('admin', 'superadmin')),
  is_active BOOLEAN DEFAULT true,
  assigned_at TIMESTAMP DEFAULT NOW(),
  assigned_by VARCHAR(50) REFERENCES users(unique_id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
  
  -- Note: Unique constraint will be handled via partial index
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_user_assignments_marketer_id ON user_assignments(marketer_id);
CREATE INDEX IF NOT EXISTS idx_user_assignments_assigned_to_id ON user_assignments(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_user_assignments_type ON user_assignments(assignment_type);
CREATE INDEX IF NOT EXISTS idx_user_assignments_active ON user_assignments(is_active);

-- Create partial unique index to ensure unique active assignments per marketer
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_assignments_unique_active 
ON user_assignments(marketer_id, assignment_type) 
WHERE is_active = true;

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_user_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_update_user_assignments_updated_at
  BEFORE UPDATE ON user_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_user_assignments_updated_at();

-- Note: Constraints with subqueries are not supported in PostgreSQL
-- We'll handle role validation in the application layer
