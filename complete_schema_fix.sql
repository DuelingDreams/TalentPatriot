-- Complete schema fix for TalentPatriot ATS
-- This adds ALL missing columns that the application expects
-- Run this in Supabase SQL Editor

-- First, ensure all enum types exist
DO $$ BEGIN
    CREATE TYPE job_status AS ENUM ('draft', 'open', 'closed', 'on_hold', 'filled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE job_type AS ENUM ('full-time', 'part-time', 'contract', 'internship');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

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

DO $$ BEGIN
    CREATE TYPE record_status AS ENUM ('active', 'demo', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add ALL missing columns to jobs table that the schema expects
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS org_id UUID,
ADD COLUMN IF NOT EXISTS job_type job_type DEFAULT 'full-time',
ADD COLUMN IF NOT EXISTS department VARCHAR(100),
ADD COLUMN IF NOT EXISTS salary_range VARCHAR(100),
ADD COLUMN IF NOT EXISTS experience_level experience_level DEFAULT 'mid',
ADD COLUMN IF NOT EXISTS remote_option remote_option DEFAULT 'onsite',
ADD COLUMN IF NOT EXISTS client_id UUID,
ADD COLUMN IF NOT EXISTS record_status record_status DEFAULT 'active',
ADD COLUMN IF NOT EXISTS public_slug VARCHAR(255),
ADD COLUMN IF NOT EXISTS published_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS created_by UUID,
ADD COLUMN IF NOT EXISTS assigned_to UUID;

-- Ensure status column uses the correct enum
DO $$ BEGIN
    -- First check if status column exists and has wrong type
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'jobs' AND column_name = 'status' 
               AND data_type != 'USER-DEFINED') THEN
        -- Drop and recreate with correct type
        ALTER TABLE jobs DROP COLUMN IF EXISTS status;
        ALTER TABLE jobs ADD COLUMN status job_status DEFAULT 'draft' NOT NULL;
    ELSE
        -- Just add if it doesn't exist
        ALTER TABLE jobs ADD COLUMN IF NOT EXISTS status job_status DEFAULT 'draft' NOT NULL;
    END IF;
END $$;

-- Add foreign key constraints if they don't exist
DO $$ BEGIN
    -- Add org_id foreign key if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'jobs_org_id_fkey' AND table_name = 'jobs') THEN
        ALTER TABLE jobs ADD CONSTRAINT jobs_org_id_fkey 
        FOREIGN KEY (org_id) REFERENCES organizations(id);
    END IF;
    
    -- Add client_id foreign key if it doesn't exist  
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'jobs_client_id_fkey' AND table_name = 'jobs') THEN
        ALTER TABLE jobs ADD CONSTRAINT jobs_client_id_fkey 
        FOREIGN KEY (client_id) REFERENCES clients(id);
    END IF;
EXCEPTION
    WHEN others THEN 
        -- If organizations or clients tables don't exist, skip foreign keys
        NULL;
END $$;

-- Update existing records to have valid default values
UPDATE jobs SET 
    org_id = (SELECT id FROM organizations LIMIT 1)
WHERE org_id IS NULL AND EXISTS (SELECT 1 FROM organizations);

UPDATE jobs SET 
    job_type = 'full-time' 
WHERE job_type IS NULL;

UPDATE jobs SET 
    experience_level = 'mid' 
WHERE experience_level IS NULL;

UPDATE jobs SET 
    remote_option = 'onsite' 
WHERE remote_option IS NULL;

UPDATE jobs SET 
    record_status = 'active' 
WHERE record_status IS NULL;

UPDATE jobs SET 
    status = 'draft' 
WHERE status IS NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_jobs_org_id ON jobs(org_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_job_type ON jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_jobs_experience_level ON jobs(experience_level);
CREATE INDEX IF NOT EXISTS idx_jobs_remote_option ON jobs(remote_option);
CREATE INDEX IF NOT EXISTS idx_jobs_public_slug ON jobs(public_slug);
CREATE INDEX IF NOT EXISTS idx_jobs_client_id ON jobs(client_id);

-- Add unique constraint on public_slug if it doesn't exist
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'unique_public_slug' AND table_name = 'jobs') THEN
        CREATE UNIQUE INDEX unique_public_slug ON jobs(public_slug) WHERE public_slug IS NOT NULL;
    END IF;
EXCEPTION
    WHEN others THEN NULL;
END $$;

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    udt_name,
    is_nullable, 
    column_default 
FROM information_schema.columns 
WHERE table_name = 'jobs' 
ORDER BY ordinal_position;