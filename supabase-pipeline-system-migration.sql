-- =============================================
-- TalentPatriot Pipeline System Migration
-- Complete database schema update for dynamic Kanban pipeline
-- =============================================

-- Create ENUMs (if they don't exist)
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
    CREATE TYPE application_status AS ENUM ('applied', 'in_review', 'interview', 'offer', 'hired', 'rejected');
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
    CREATE TYPE interview_type AS ENUM ('phone', 'video', 'onsite', 'technical', 'cultural');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE interview_status AS ENUM ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE message_type AS ENUM ('internal', 'client', 'candidate', 'system');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE message_priority AS ENUM ('low', 'normal', 'high', 'urgent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =============================================
-- NEW PIPELINE TABLES
-- =============================================

-- Pipeline Columns Table (Dynamic Kanban columns)
CREATE TABLE IF NOT EXISTS pipeline_columns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    position TEXT NOT NULL, -- Sort order: "0", "1", "2", etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Applications Table (Job-Candidate relationships with pipeline assignment)
CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL,
    candidate_id UUID NOT NULL,
    column_id UUID, -- Auto-assigned to first column
    status application_status DEFAULT 'applied' NOT NULL,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_job_application UNIQUE (job_id, candidate_id)
);

-- Add foreign key constraints after table creation
DO $$ BEGIN
    ALTER TABLE applications ADD CONSTRAINT fk_applications_job_id 
        FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE applications ADD CONSTRAINT fk_applications_candidate_id 
        FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE applications ADD CONSTRAINT fk_applications_column_id 
        FOREIGN KEY (column_id) REFERENCES pipeline_columns(id) ON DELETE SET NULL;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =============================================
-- UPDATE EXISTING TABLES
-- =============================================

-- Add missing columns to jobs table
DO $$ BEGIN
    ALTER TABLE jobs ADD COLUMN IF NOT EXISTS public_slug VARCHAR(255);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Create unique index for public_slug if it doesn't exist
DO $$ BEGIN
    CREATE UNIQUE INDEX IF NOT EXISTS unique_public_slug ON jobs(public_slug);
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Pipeline Columns indexes
CREATE INDEX IF NOT EXISTS idx_pipeline_columns_org_id ON pipeline_columns(org_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_columns_position ON pipeline_columns(org_id, position);

-- Applications indexes
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_candidate_id ON applications(candidate_id);
CREATE INDEX IF NOT EXISTS idx_applications_column_id ON applications(column_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_applied_at ON applications(applied_at);

-- Jobs table indexes
CREATE INDEX IF NOT EXISTS idx_jobs_public_slug ON jobs(public_slug) WHERE public_slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_org_id_status ON jobs(org_id, status);

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on new tables
ALTER TABLE pipeline_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Pipeline Columns RLS Policies
CREATE POLICY "Users can view pipeline columns for their organization" ON pipeline_columns
    FOR SELECT USING (
        org_id IN (
            SELECT org_id FROM user_organizations 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Organization admins can manage pipeline columns" ON pipeline_columns
    FOR ALL USING (
        org_id IN (
            SELECT org_id FROM user_organizations 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin', 'hiring_manager')
        )
    );

-- Applications RLS Policies  
CREATE POLICY "Users can view applications for their organization jobs" ON applications
    FOR SELECT USING (
        job_id IN (
            SELECT j.id FROM jobs j 
            INNER JOIN user_organizations uo ON j.org_id = uo.org_id 
            WHERE uo.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create applications" ON applications
    FOR INSERT WITH CHECK (
        job_id IN (
            SELECT j.id FROM jobs j 
            WHERE j.status = 'open'
        )
    );

CREATE POLICY "Organization members can update applications" ON applications
    FOR UPDATE USING (
        job_id IN (
            SELECT j.id FROM jobs j 
            INNER JOIN user_organizations uo ON j.org_id = uo.org_id 
            WHERE uo.user_id = auth.uid()
            AND uo.role IN ('owner', 'admin', 'hiring_manager', 'recruiter')
        )
    );

-- =============================================
-- DEFAULT PIPELINE COLUMNS FUNCTION
-- =============================================

-- Function to create default pipeline columns for new organizations
CREATE OR REPLACE FUNCTION create_default_pipeline_columns(org_id_param UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO pipeline_columns (org_id, title, position) VALUES
        (org_id_param, 'New', '0'),
        (org_id_param, 'Screening', '1'),
        (org_id_param, 'Interview', '2'),
        (org_id_param, 'Offer', '3'),
        (org_id_param, 'Hired', '4'),
        (org_id_param, 'Rejected', '5')
    ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGERS FOR AUTO-PIPELINE CREATION
-- =============================================

-- Trigger to create default pipeline columns when organization is created
CREATE OR REPLACE FUNCTION trigger_create_default_pipeline_columns()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM create_default_pipeline_columns(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DO $$ BEGIN
    DROP TRIGGER IF EXISTS trigger_default_pipeline_columns ON organizations;
    CREATE TRIGGER trigger_default_pipeline_columns
        AFTER INSERT ON organizations
        FOR EACH ROW
        EXECUTE FUNCTION trigger_create_default_pipeline_columns();
EXCEPTION
    WHEN others THEN null;
END $$;

-- =============================================
-- AUTO-ASSIGN APPLICATION TO FIRST COLUMN
-- =============================================

-- Function to auto-assign applications to first pipeline column
CREATE OR REPLACE FUNCTION auto_assign_application_column()
RETURNS TRIGGER AS $$
DECLARE
    first_column_id UUID;
    job_org_id UUID;
BEGIN
    -- Get the organization ID for the job
    SELECT org_id INTO job_org_id FROM jobs WHERE id = NEW.job_id;
    
    -- If column_id is not provided, assign to first column
    IF NEW.column_id IS NULL THEN
        -- Get the first column (lowest position) for the organization
        SELECT id INTO first_column_id 
        FROM pipeline_columns 
        WHERE org_id = job_org_id 
        ORDER BY position::INTEGER ASC 
        LIMIT 1;
        
        -- Assign to first column if found
        IF first_column_id IS NOT NULL THEN
            NEW.column_id := first_column_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-assignment
DO $$ BEGIN
    DROP TRIGGER IF EXISTS trigger_auto_assign_application_column ON applications;
    CREATE TRIGGER trigger_auto_assign_application_column
        BEFORE INSERT ON applications
        FOR EACH ROW
        EXECUTE FUNCTION auto_assign_application_column();
EXCEPTION
    WHEN others THEN null;
END $$;

-- =============================================
-- CREATE DEFAULT COLUMNS FOR EXISTING ORGS
-- =============================================

-- Create default pipeline columns for existing organizations that don't have any
DO $$
DECLARE
    org_record RECORD;
BEGIN
    FOR org_record IN 
        SELECT o.id FROM organizations o 
        WHERE NOT EXISTS (
            SELECT 1 FROM pipeline_columns pc WHERE pc.org_id = o.id
        )
    LOOP
        PERFORM create_default_pipeline_columns(org_record.id);
    END LOOP;
END $$;

-- =============================================
-- PUBLIC CAREERS PAGE POLICIES
-- =============================================

-- Allow anonymous users to view published jobs
CREATE POLICY "Anonymous users can view published jobs" ON jobs
    FOR SELECT USING (
        status = 'open' AND public_slug IS NOT NULL
    );

-- Allow anonymous users to view candidates (for application submission)
CREATE POLICY "Anonymous users can create candidates" ON candidates
    FOR INSERT WITH CHECK (true);

-- Allow anonymous users to create applications
CREATE POLICY "Anonymous users can submit applications" ON applications
    FOR INSERT WITH CHECK (
        job_id IN (
            SELECT id FROM jobs WHERE status = 'open' AND public_slug IS NOT NULL
        )
    );

-- =============================================
-- PERFORMANCE OPTIMIZATIONS
-- =============================================

-- Add composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_jobs_org_status_public ON jobs(org_id, status, public_slug) WHERE public_slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_applications_job_column ON applications(job_id, column_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_columns_org_position ON pipeline_columns(org_id, position);

-- Update table statistics
ANALYZE pipeline_columns;
ANALYZE applications;
ANALYZE jobs;

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Check that default columns were created
SELECT 'Pipeline columns created:' as status, count(*) as count FROM pipeline_columns;
SELECT 'Organizations with pipeline columns:' as status, count(DISTINCT org_id) as count FROM pipeline_columns;

-- Show pipeline columns structure
SELECT 
    'pipeline_columns' as table_name,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'pipeline_columns' 
ORDER BY ordinal_position;

-- Show applications structure  
SELECT 
    'applications' as table_name,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'applications' 
ORDER BY ordinal_position;