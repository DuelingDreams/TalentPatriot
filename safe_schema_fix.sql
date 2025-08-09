-- Safe Schema Fix for TalentPatriot ATS
-- This script carefully adds missing columns and updates enums step by step
-- Run this in Supabase SQL Editor

-- Step 1: Check what exists first
DO $$ 
DECLARE
    column_exists boolean;
BEGIN
    -- Check if org_id column exists in jobs table
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'jobs' AND column_name = 'org_id'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        RAISE NOTICE 'org_id column does not exist in jobs table, will add it';
        ALTER TABLE jobs ADD COLUMN org_id UUID;
    ELSE
        RAISE NOTICE 'org_id column already exists in jobs table';
    END IF;
END $$;

-- Step 2: Add other missing columns to jobs table one by one
DO $$ 
BEGIN
    -- Add job_type column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'job_type') THEN
        -- First create the enum if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_type') THEN
            CREATE TYPE job_type AS ENUM ('full-time', 'part-time', 'contract', 'internship');
        END IF;
        ALTER TABLE jobs ADD COLUMN job_type job_type DEFAULT 'full-time';
    END IF;

    -- Add department column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'department') THEN
        ALTER TABLE jobs ADD COLUMN department VARCHAR(100);
    END IF;

    -- Add salary_range column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'salary_range') THEN
        ALTER TABLE jobs ADD COLUMN salary_range VARCHAR(100);
    END IF;

    -- Add experience_level column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'experience_level') THEN
        -- First create the enum if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'experience_level') THEN
            CREATE TYPE experience_level AS ENUM ('entry', 'mid', 'senior', 'executive');
        END IF;
        ALTER TABLE jobs ADD COLUMN experience_level experience_level DEFAULT 'mid';
    END IF;

    -- Add remote_option column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'remote_option') THEN
        -- First create the enum if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'remote_option') THEN
            CREATE TYPE remote_option AS ENUM ('onsite', 'remote', 'hybrid');
        END IF;
        ALTER TABLE jobs ADD COLUMN remote_option remote_option DEFAULT 'onsite';
    END IF;

    -- Add client_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'client_id') THEN
        ALTER TABLE jobs ADD COLUMN client_id UUID;
    END IF;

    -- Add record_status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'record_status') THEN
        -- First create the enum if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'record_status') THEN
            CREATE TYPE record_status AS ENUM ('active', 'demo', 'archived');
        END IF;
        ALTER TABLE jobs ADD COLUMN record_status record_status DEFAULT 'active';
    END IF;

    -- Add public_slug column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'public_slug') THEN
        ALTER TABLE jobs ADD COLUMN public_slug VARCHAR(255);
    END IF;

    -- Add published_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'published_at') THEN
        ALTER TABLE jobs ADD COLUMN published_at TIMESTAMP;
    END IF;

    -- Add created_by column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'created_by') THEN
        ALTER TABLE jobs ADD COLUMN created_by UUID;
    END IF;

    -- Add assigned_to column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'assigned_to') THEN
        ALTER TABLE jobs ADD COLUMN assigned_to UUID;
    END IF;

    RAISE NOTICE 'All missing columns have been added to jobs table';
END $$;

-- Step 3: Update job_status enum to include 'filled' if needed
DO $$ 
BEGIN
    -- Check if 'filled' exists in job_status enum
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'filled' AND enumtypid = 'job_status'::regtype) THEN
        ALTER TYPE job_status ADD VALUE 'filled';
        RAISE NOTICE 'Added filled to job_status enum';
    END IF;
EXCEPTION
    WHEN undefined_object THEN
        -- job_status enum doesn't exist, create it
        CREATE TYPE job_status AS ENUM ('draft', 'open', 'closed', 'on_hold', 'filled');
        RAISE NOTICE 'Created job_status enum with all values including filled';
END $$;

-- Step 4: Ensure status column uses job_status enum
DO $$ 
BEGIN
    -- Check if status column exists and what type it is
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'status') THEN
        -- Check if it's already the right type
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'jobs' AND column_name = 'status' 
                      AND udt_name = 'job_status') THEN
            -- Convert existing status column to use job_status enum
            ALTER TABLE jobs ALTER COLUMN status TYPE job_status USING status::text::job_status;
            RAISE NOTICE 'Updated existing status column to use job_status enum';
        END IF;
    ELSE
        -- Add status column with job_status enum
        ALTER TABLE jobs ADD COLUMN status job_status DEFAULT 'draft' NOT NULL;
        RAISE NOTICE 'Added status column with job_status enum';
    END IF;
END $$;

-- Step 5: Set default values for existing records
UPDATE jobs SET 
    org_id = (SELECT id FROM organizations LIMIT 1)
WHERE org_id IS NULL AND EXISTS (SELECT 1 FROM organizations);

UPDATE jobs SET job_type = 'full-time' WHERE job_type IS NULL;
UPDATE jobs SET experience_level = 'mid' WHERE experience_level IS NULL;
UPDATE jobs SET remote_option = 'onsite' WHERE remote_option IS NULL;
UPDATE jobs SET record_status = 'active' WHERE record_status IS NULL;
UPDATE jobs SET status = 'draft' WHERE status IS NULL;

-- Step 6: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_jobs_org_id ON jobs(org_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_job_type ON jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_jobs_experience_level ON jobs(experience_level);
CREATE INDEX IF NOT EXISTS idx_jobs_remote_option ON jobs(remote_option);
CREATE INDEX IF NOT EXISTS idx_jobs_public_slug ON jobs(public_slug);
CREATE INDEX IF NOT EXISTS idx_jobs_client_id ON jobs(client_id);

-- Step 7: Add unique constraint on public_slug
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_public_slug') THEN
        CREATE UNIQUE INDEX unique_public_slug ON jobs(public_slug) WHERE public_slug IS NOT NULL;
    END IF;
EXCEPTION
    WHEN others THEN 
        RAISE NOTICE 'Could not create unique constraint on public_slug, may already exist';
END $$;

-- Step 8: Verify the results
SELECT 
    column_name, 
    data_type, 
    udt_name,
    is_nullable, 
    column_default 
FROM information_schema.columns 
WHERE table_name = 'jobs' 
ORDER BY ordinal_position;