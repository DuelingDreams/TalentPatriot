-- Add missing columns to jobs table for TalentPatriot ATS
-- Run this in Supabase SQL Editor

-- First, create the enum types if they don't exist
DO $$ BEGIN
    CREATE TYPE experience_level AS ENUM ('entry', 'mid', 'senior', 'executive');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE remote_option AS ENUM ('onsite', 'remote', 'hybrid');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add the missing columns to the jobs table
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS experience_level experience_level DEFAULT 'mid',
ADD COLUMN IF NOT EXISTS remote_option remote_option DEFAULT 'onsite';

-- Update any existing jobs to have default values
UPDATE jobs 
SET 
    experience_level = 'mid' 
WHERE experience_level IS NULL;

UPDATE jobs 
SET 
    remote_option = 'onsite' 
WHERE remote_option IS NULL;

-- Optional: Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_jobs_experience_level ON jobs(experience_level);
CREATE INDEX IF NOT EXISTS idx_jobs_remote_option ON jobs(remote_option);

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'jobs' 
  AND column_name IN ('experience_level', 'remote_option')
ORDER BY column_name;