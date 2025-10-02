-- Migration to update profile_image column to support Base64 strings
-- This allows storing both legacy filenames and Base64 image data

-- First, check if the column exists and its current type
DO $$
BEGIN
    -- Check if profile_image column exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'profile_image'
    ) THEN
        -- Check current column type
        IF (
            SELECT data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users' 
            AND column_name = 'profile_image'
        ) = 'character varying' THEN
            -- Alter column to TEXT to support longer Base64 strings
            ALTER TABLE users 
            ALTER COLUMN profile_image TYPE TEXT;
            
            RAISE NOTICE 'Updated profile_image column to TEXT type for Base64 support';
        ELSE
            RAISE NOTICE 'profile_image column already supports TEXT or is different type';
        END IF;
    ELSE
        -- Create the column if it doesn't exist
        ALTER TABLE users 
        ADD COLUMN profile_image TEXT;
        
        RAISE NOTICE 'Created profile_image column as TEXT type';
    END IF;
END $$;

-- Add index for better performance on profile_image queries
CREATE INDEX IF NOT EXISTS idx_users_profile_image 
ON users(profile_image) 
WHERE profile_image IS NOT NULL;

-- Add comment to document the column purpose
COMMENT ON COLUMN users.profile_image IS 'Profile image data - can be filename (legacy) or Base64 string (new)';
