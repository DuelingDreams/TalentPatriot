-- User Profile and Settings Migration
-- Adds profile fields and settings table for user preferences

BEGIN;

-- Update user_profiles table with additional fields
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS first_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS last_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS job_title VARCHAR(255),
ADD COLUMN IF NOT EXISTS department VARCHAR(255),
ADD COLUMN IF NOT EXISTS location VARCHAR(255),
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    email_notifications BOOLEAN DEFAULT TRUE,
    browser_notifications BOOLEAN DEFAULT TRUE,
    weekly_reports BOOLEAN DEFAULT FALSE,
    team_invites BOOLEAN DEFAULT TRUE,
    public_profile BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique index on user_id for user_settings
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_settings ON user_settings(user_id);

-- Insert default settings for existing users
INSERT INTO user_settings (user_id, email_notifications, browser_notifications, weekly_reports, team_invites, public_profile)
SELECT id, TRUE, TRUE, FALSE, TRUE, FALSE 
FROM user_profiles 
WHERE id NOT IN (SELECT user_id FROM user_settings)
ON CONFLICT (user_id) DO NOTHING;

COMMIT;

SELECT 'User profile and settings migration completed successfully!' as status;