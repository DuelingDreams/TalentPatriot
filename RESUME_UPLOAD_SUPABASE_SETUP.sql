-- =============================================================================
-- RESUME UPLOAD & JOB APPLICATIONS SETUP FOR SUPABASE
-- Copy and paste this ENTIRE script into Supabase SQL Editor and run it
-- Ensures all tables and functionality needed for resume uploads are ready
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create all required enums
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
    CREATE TYPE candidate_stage AS ENUM ('applied', 'screening', 'interview', 'technical', 'final', 'offer', 'hired', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE record_status AS ENUM ('active', 'demo', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('hiring_manager', 'recruiter', 'admin', 'interviewer', 'demo_viewer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE org_role AS ENUM ('owner', 'admin', 'hiring_manager', 'recruiter', 'interviewer', 'viewer');
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

-- Create organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    owner_id UUID NOT NULL,
    slug TEXT UNIQUE
);

-- Create clients table  
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id) NOT NULL,
    name VARCHAR(255) NOT NULL,
    industry VARCHAR(100),
    location VARCHAR(255),
    website VARCHAR(255),
    contact_name VARCHAR(255),
    contact_email VARCHAR(255),
    notes TEXT,
    status record_status DEFAULT 'active' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    created_by UUID
);

-- Create jobs table with public_slug for careers page
CREATE TABLE IF NOT EXISTS public.jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255),
    job_type job_type DEFAULT 'full-time' NOT NULL,
    department VARCHAR(100),
    salary_range VARCHAR(100),
    experience_level experience_level DEFAULT 'mid',
    remote_option remote_option DEFAULT 'onsite',
    client_id UUID REFERENCES clients(id),
    status job_status DEFAULT 'draft' NOT NULL,
    record_status record_status DEFAULT 'active' NOT NULL,
    public_slug VARCHAR(255) UNIQUE,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    created_by UUID,
    assigned_to UUID
);

-- Create unique index on public_slug
CREATE UNIQUE INDEX IF NOT EXISTS unique_public_slug ON jobs(public_slug);

-- Create candidates table with resume fields
CREATE TABLE IF NOT EXISTS public.candidates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id) NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    resume_url TEXT,
    status record_status DEFAULT 'active' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    created_by UUID,
    -- Resume parsing fields for AI integration
    resume_parsed BOOLEAN DEFAULT false,
    skills TEXT[],
    experience_level experience_level,
    total_years_experience INTEGER DEFAULT 0,
    education TEXT,
    summary TEXT,
    searchable_content TEXT
);

-- Create pipeline_columns table for Kanban stages
CREATE TABLE IF NOT EXISTS public.pipeline_columns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id) NOT NULL,
    job_id UUID REFERENCES jobs(id),
    title TEXT NOT NULL,
    position INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for pipeline performance
CREATE INDEX IF NOT EXISTS idx_pipeline_cols_job_pos ON pipeline_columns(job_id, position);
CREATE INDEX IF NOT EXISTS idx_pipeline_cols_org_pos ON pipeline_columns(org_id, position);

-- Create job_candidate table for applications
CREATE TABLE IF NOT EXISTS public.job_candidate (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id) NOT NULL,
    job_id UUID REFERENCES jobs(id) NOT NULL,
    candidate_id UUID REFERENCES candidates(id) NOT NULL,
    pipeline_column_id UUID REFERENCES pipeline_columns(id),
    stage candidate_stage DEFAULT 'applied' NOT NULL,
    notes TEXT,
    assigned_to UUID,
    status record_status DEFAULT 'active' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(job_id, candidate_id)
);

-- Create indexes for job_candidate performance
CREATE INDEX IF NOT EXISTS idx_job_candidate_job ON job_candidate(job_id);
CREATE INDEX IF NOT EXISTS idx_job_candidate_candidate ON job_candidate(candidate_id);
CREATE INDEX IF NOT EXISTS idx_job_candidate_org ON job_candidate(org_id);

-- Create user_profiles table for authentication
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY,
    role user_role DEFAULT 'hiring_manager' NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    phone VARCHAR(50),
    job_title VARCHAR(255),
    department VARCHAR(255),
    location VARCHAR(255),
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create user_organizations table for multi-tenancy
CREATE TABLE IF NOT EXISTS public.user_organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    org_id UUID REFERENCES organizations(id) NOT NULL,
    role org_role NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, org_id)
);

-- Insert demo organization if it doesn't exist
INSERT INTO public.organizations (id, name, owner_id, slug)
VALUES (
    '90531171-d56b-4732-baba-35be47b0cb08',
    'Demo Organization', 
    'demo-user',
    'demo-org'
) ON CONFLICT (id) DO NOTHING;

-- Create default pipeline columns for demo organization
DO $$
DECLARE
    org_uuid UUID := '90531171-d56b-4732-baba-35be47b0cb08';
BEGIN
    -- Check if pipeline columns exist for this org
    IF NOT EXISTS (SELECT 1 FROM pipeline_columns WHERE org_id = org_uuid) THEN
        INSERT INTO pipeline_columns (org_id, title, position) VALUES
        (org_uuid, 'Applied', 0),
        (org_uuid, 'Screening', 1),
        (org_uuid, 'Interview', 2),
        (org_uuid, 'Final Review', 3),
        (org_uuid, 'Offer', 4),
        (org_uuid, 'Hired', 5);
    END IF;
END $$;

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_candidate ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_columns ENABLE ROW LEVEL SECURITY;

-- Create storage bucket for resumes (if not exists)
-- Note: This needs to be done in Supabase dashboard Storage section
-- or run: INSERT INTO storage.buckets (id, name, public) VALUES ('resumes', 'resumes', true);

-- Create policies for public job access (careers page)
DROP POLICY IF EXISTS "Allow public read access to published jobs" ON jobs;
CREATE POLICY "Allow public read access to published jobs" ON jobs
FOR SELECT USING (status = 'open' AND record_status = 'active');

-- Create policies for job applications
DROP POLICY IF EXISTS "Allow public job application creation" ON candidates;
CREATE POLICY "Allow public job application creation" ON candidates
FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public job candidate creation" ON job_candidate;
CREATE POLICY "Allow public job candidate creation" ON job_candidate
FOR INSERT WITH CHECK (true);

-- Create policies for organization-based access
DROP POLICY IF EXISTS "Organization members can view candidates" ON candidates;
CREATE POLICY "Organization members can view candidates" ON candidates
FOR SELECT USING (
    org_id IN (
        SELECT org_id FROM user_organizations 
        WHERE user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Organization members can view jobs" ON jobs;
CREATE POLICY "Organization members can view jobs" ON jobs
FOR SELECT USING (
    org_id IN (
        SELECT org_id FROM user_organizations 
        WHERE user_id = auth.uid()
    )
);

-- Grant necessary permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Resume upload and job applications setup complete!';
    RAISE NOTICE '📁 Don''t forget to create the "resumes" storage bucket in Supabase Dashboard > Storage';
    RAISE NOTICE '🔗 Make the bucket public for file access';
    RAISE NOTICE '📊 Demo organization and pipeline columns have been created';
    RAISE NOTICE '🛡️ Row Level Security policies are enabled';
END $$;