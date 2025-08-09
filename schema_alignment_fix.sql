-- Schema Alignment Fix for TalentPatriot ATS
-- This SQL script aligns the Supabase database with the application schema
-- Run this in Supabase SQL Editor

-- ====================================
-- ENUM UPDATES AND ADDITIONS
-- ====================================

-- Update job_status enum to include 'filled' value that's missing in Supabase
DROP TYPE IF EXISTS job_status CASCADE;
CREATE TYPE job_status AS ENUM ('draft', 'open', 'closed', 'on_hold', 'filled');

-- Update job_type enum to include 'internship' instead of 'freelance' 
DROP TYPE IF EXISTS job_type CASCADE;
CREATE TYPE job_type AS ENUM ('full-time', 'part-time', 'contract', 'internship');

-- Update candidate_stage enum to match application schema
DROP TYPE IF EXISTS candidate_stage CASCADE;
CREATE TYPE candidate_stage AS ENUM ('applied', 'screening', 'interview', 'technical', 'final', 'offer', 'hired', 'rejected');

-- Update record_status enum to include 'archived' instead of 'inactive'
DROP TYPE IF EXISTS record_status CASCADE;
CREATE TYPE record_status AS ENUM ('active', 'demo', 'archived');

-- Update interview_type enum to match application schema
DROP TYPE IF EXISTS interview_type CASCADE;
CREATE TYPE interview_type AS ENUM ('phone', 'video', 'onsite', 'technical', 'cultural');

-- Update interview_status enum to include 'confirmed' 
DROP TYPE IF EXISTS interview_status CASCADE;
CREATE TYPE interview_status AS ENUM ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show');

-- Update message_type enum to match application schema
DROP TYPE IF EXISTS message_type CASCADE;
CREATE TYPE message_type AS ENUM ('internal', 'client', 'candidate', 'system');

-- Add missing organization_role enum (application uses 'org_role')
DROP TYPE IF EXISTS org_role CASCADE;
CREATE TYPE org_role AS ENUM ('owner', 'admin', 'hiring_manager', 'recruiter', 'interviewer', 'viewer');

-- Add missing application_status enum used by the application
DO $$ BEGIN
    CREATE TYPE application_status AS ENUM ('applied', 'in_review', 'interview', 'offer', 'hired', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ====================================
-- TABLE UPDATES
-- ====================================

-- Update jobs table with corrected enum types and ensure all columns exist
ALTER TABLE jobs 
DROP COLUMN IF EXISTS status CASCADE,
DROP COLUMN IF EXISTS job_type CASCADE;

ALTER TABLE jobs
ADD COLUMN status job_status DEFAULT 'draft' NOT NULL,
ADD COLUMN job_type job_type DEFAULT 'full-time' NOT NULL;

-- Ensure all expected columns exist in jobs table
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS org_id UUID,
ADD COLUMN IF NOT EXISTS title VARCHAR(255) NOT NULL DEFAULT 'Untitled Position',
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS location VARCHAR(255),
ADD COLUMN IF NOT EXISTS department VARCHAR(100),
ADD COLUMN IF NOT EXISTS salary_range VARCHAR(100),
ADD COLUMN IF NOT EXISTS experience_level experience_level DEFAULT 'mid',
ADD COLUMN IF NOT EXISTS remote_option remote_option DEFAULT 'onsite',
ADD COLUMN IF NOT EXISTS client_id UUID,
ADD COLUMN IF NOT EXISTS record_status record_status DEFAULT 'active' NOT NULL,
ADD COLUMN IF NOT EXISTS public_slug VARCHAR(255),
ADD COLUMN IF NOT EXISTS published_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW() NOT NULL,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
ADD COLUMN IF NOT EXISTS created_by UUID,
ADD COLUMN IF NOT EXISTS assigned_to UUID;

-- Update user_organizations table to use correct enum
ALTER TABLE user_organizations 
DROP COLUMN IF EXISTS role CASCADE;

ALTER TABLE user_organizations
ADD COLUMN role org_role NOT NULL DEFAULT 'viewer';

-- Ensure organizations table has all required columns
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT 'Organization',
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW() NOT NULL,
ADD COLUMN IF NOT EXISTS owner_id UUID NOT NULL DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS slug TEXT;

-- Ensure user_profiles table exists with correct schema
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY, -- references auth.users(id)
    role user_role DEFAULT 'hiring_manager' NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Ensure clients table exists with correct schema
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    industry VARCHAR(100),
    location VARCHAR(255),
    website VARCHAR(255),
    contact_name VARCHAR(255),
    contact_email VARCHAR(255),
    notes TEXT,
    status record_status DEFAULT 'active' NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    created_by UUID
);

-- Ensure candidates table exists with correct schema
CREATE TABLE IF NOT EXISTS candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    resume_url TEXT,
    status record_status DEFAULT 'active' NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    created_by UUID
);

-- Ensure pipeline_columns table exists
CREATE TABLE IF NOT EXISTS pipeline_columns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL,
    job_id UUID, -- Nullable for backward compatibility
    title TEXT NOT NULL,
    position INTEGER NOT NULL, -- 0, 1, 2, etc. for sort order
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Ensure applications table exists
CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL,
    job_id UUID NOT NULL,
    candidate_id UUID NOT NULL,
    status application_status DEFAULT 'applied' NOT NULL,
    pipeline_column_id UUID,
    stage candidate_stage DEFAULT 'applied' NOT NULL,
    applied_at TIMESTAMP DEFAULT NOW() NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    created_by UUID
);

-- ====================================
-- FOREIGN KEY CONSTRAINTS
-- ====================================

-- Add foreign key constraints (with error handling)
DO $$ BEGIN
    -- Jobs table foreign keys
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'jobs_org_id_fkey' AND table_name = 'jobs') THEN
        ALTER TABLE jobs ADD CONSTRAINT jobs_org_id_fkey 
        FOREIGN KEY (org_id) REFERENCES organizations(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'jobs_client_id_fkey' AND table_name = 'jobs') THEN
        ALTER TABLE jobs ADD CONSTRAINT jobs_client_id_fkey 
        FOREIGN KEY (client_id) REFERENCES clients(id);
    END IF;
    
    -- Clients table foreign keys
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'clients_org_id_fkey' AND table_name = 'clients') THEN
        ALTER TABLE clients ADD CONSTRAINT clients_org_id_fkey 
        FOREIGN KEY (org_id) REFERENCES organizations(id);
    END IF;
    
    -- Candidates table foreign keys
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'candidates_org_id_fkey' AND table_name = 'candidates') THEN
        ALTER TABLE candidates ADD CONSTRAINT candidates_org_id_fkey 
        FOREIGN KEY (org_id) REFERENCES organizations(id);
    END IF;
    
    -- User organizations foreign keys
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'user_organizations_org_id_fkey' AND table_name = 'user_organizations') THEN
        ALTER TABLE user_organizations ADD CONSTRAINT user_organizations_org_id_fkey 
        FOREIGN KEY (org_id) REFERENCES organizations(id);
    END IF;
    
    -- Pipeline columns foreign keys
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'pipeline_columns_org_id_fkey' AND table_name = 'pipeline_columns') THEN
        ALTER TABLE pipeline_columns ADD CONSTRAINT pipeline_columns_org_id_fkey 
        FOREIGN KEY (org_id) REFERENCES organizations(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'pipeline_columns_job_id_fkey' AND table_name = 'pipeline_columns') THEN
        ALTER TABLE pipeline_columns ADD CONSTRAINT pipeline_columns_job_id_fkey 
        FOREIGN KEY (job_id) REFERENCES jobs(id);
    END IF;
    
    -- Applications foreign keys
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'applications_org_id_fkey' AND table_name = 'applications') THEN
        ALTER TABLE applications ADD CONSTRAINT applications_org_id_fkey 
        FOREIGN KEY (org_id) REFERENCES organizations(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'applications_job_id_fkey' AND table_name = 'applications') THEN
        ALTER TABLE applications ADD CONSTRAINT applications_job_id_fkey 
        FOREIGN KEY (job_id) REFERENCES jobs(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'applications_candidate_id_fkey' AND table_name = 'applications') THEN
        ALTER TABLE applications ADD CONSTRAINT applications_candidate_id_fkey 
        FOREIGN KEY (candidate_id) REFERENCES candidates(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'applications_pipeline_column_id_fkey' AND table_name = 'applications') THEN
        ALTER TABLE applications ADD CONSTRAINT applications_pipeline_column_id_fkey 
        FOREIGN KEY (pipeline_column_id) REFERENCES pipeline_columns(id);
    END IF;
    
EXCEPTION
    WHEN others THEN 
        -- Skip foreign keys if referenced tables don't exist
        NULL;
END $$;

-- ====================================
-- INDEXES FOR PERFORMANCE
-- ====================================

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_jobs_org_id ON jobs(org_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_job_type ON jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_jobs_experience_level ON jobs(experience_level);
CREATE INDEX IF NOT EXISTS idx_jobs_remote_option ON jobs(remote_option);
CREATE INDEX IF NOT EXISTS idx_jobs_client_id ON jobs(client_id);
CREATE INDEX IF NOT EXISTS idx_clients_org_id ON clients(org_id);
CREATE INDEX IF NOT EXISTS idx_candidates_org_id ON candidates(org_id);
CREATE INDEX IF NOT EXISTS idx_candidates_email ON candidates(email);
CREATE INDEX IF NOT EXISTS idx_user_organizations_user_id ON user_organizations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_organizations_org_id ON user_organizations(org_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_columns_org_id ON pipeline_columns(org_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_columns_job_id ON pipeline_columns(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_org_id ON applications(org_id);
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_candidate_id ON applications(candidate_id);

-- Add unique constraints
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'unique_public_slug' AND table_name = 'jobs') THEN
        CREATE UNIQUE INDEX unique_public_slug ON jobs(public_slug) WHERE public_slug IS NOT NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'unique_org_slug' AND table_name = 'organizations') THEN
        CREATE UNIQUE INDEX unique_org_slug ON organizations(slug) WHERE slug IS NOT NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'unique_user_org' AND table_name = 'user_organizations') THEN
        CREATE UNIQUE INDEX unique_user_org ON user_organizations(user_id, org_id);
    END IF;
EXCEPTION
    WHEN others THEN NULL;
END $$;

-- ====================================
-- DATA UPDATES
-- ====================================

-- Update existing records to use new enum values where needed
UPDATE jobs SET 
    status = 'draft' 
WHERE status IS NULL;

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

-- Set org_id for existing jobs if they don't have one
UPDATE jobs SET 
    org_id = (SELECT id FROM organizations LIMIT 1)
WHERE org_id IS NULL AND EXISTS (SELECT 1 FROM organizations);

-- ====================================
-- VERIFICATION
-- ====================================

-- Verify the schema alignment
SELECT 
    'ENUMS' as category,
    enumtypid::regtype as enum_name,
    array_agg(enumlabel ORDER BY enumsortorder) as values
FROM pg_enum 
WHERE enumtypid::regtype::text IN (
    'job_status', 'job_type', 'candidate_stage', 'record_status', 
    'interview_type', 'interview_status', 'message_type', 'org_role',
    'application_status', 'experience_level', 'remote_option', 'user_role'
)
GROUP BY enumtypid::regtype
ORDER BY enum_name;

-- Verify table columns
SELECT 
    'JOBS_TABLE' as category,
    column_name, 
    data_type, 
    udt_name,
    is_nullable, 
    column_default 
FROM information_schema.columns 
WHERE table_name = 'jobs' 
ORDER BY ordinal_position;