-- Create migrations table to track applied migrations
CREATE TABLE IF NOT EXISTS migrations (
    id SERIAL PRIMARY KEY,
    migration_name VARCHAR(255) NOT NULL UNIQUE,
    applied_at TIMESTAMP DEFAULT NOW()
);

-- Insert initial migration record
INSERT INTO migrations (migration_name) VALUES ('0001_create_migrations_table') 
ON CONFLICT (migration_name) DO NOTHING;
