-- =============================================
-- TalentPatriot Pipeline System - Simplified Migration
-- Only creates new pipeline tables and functionality
-- =============================================

-- =============================================
-- NEW PIPELINE TABLES ONLY
-- =============================================

-- Pipeline Columns Table (Dynamic Kanban columns)
CREATE TABLE IF NOT EXISTS pipeline_columns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL,
    title TEXT NOT NULL,
    position TEXT NOT NULL, -- Sort order: "0", "1", "2", etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Applications Table (Job-Candidate relationships with pipeline assignment)
CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL,
    candidate_id UUID NOT NULL,
    status TEXT DEFAULT 'applied' NOT NULL, -- Use TEXT instead of enum to avoid conflicts
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_job_application UNIQUE (job_id, candidate_id)
);

-- Add column_id column if it doesn't exist
DO $$ BEGIN
    ALTER TABLE applications ADD COLUMN column_id UUID;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Add missing public_slug to jobs table if it doesn't exist
DO $$ BEGIN
    ALTER TABLE jobs ADD COLUMN public_slug VARCHAR(255);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- =============================================
-- ADD FOREIGN KEY CONSTRAINTS
-- =============================================

-- Add foreign key constraints safely
DO $$ BEGIN
    ALTER TABLE pipeline_columns ADD CONSTRAINT fk_pipeline_columns_org_id 
        FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

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

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on new tables
ALTER TABLE pipeline_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Pipeline Columns RLS Policies
DO $$ BEGIN
    CREATE POLICY "Users can view pipeline columns for their organization" ON pipeline_columns
        FOR SELECT USING (
            org_id IN (
                SELECT org_id FROM user_organizations 
                WHERE user_id = auth.uid()
            )
        );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Organization admins can manage pipeline columns" ON pipeline_columns
        FOR ALL USING (
            org_id IN (
                SELECT org_id FROM user_organizations 
                WHERE user_id = auth.uid() 
                AND role IN ('owner', 'admin', 'recruiter')
            )
        );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Applications RLS Policies  
DO $$ BEGIN
    CREATE POLICY "Users can view applications for their organization jobs" ON applications
        FOR SELECT USING (
            job_id IN (
                SELECT j.id FROM jobs j 
                INNER JOIN user_organizations uo ON j.org_id = uo.org_id 
                WHERE uo.user_id = auth.uid()
            )
        );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can create applications" ON applications
        FOR INSERT WITH CHECK (
            job_id IN (
                SELECT j.id FROM jobs j 
                WHERE j.status = 'open'
            )
        );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Organization members can update applications" ON applications
        FOR UPDATE USING (
            job_id IN (
                SELECT j.id FROM jobs j 
                INNER JOIN user_organizations uo ON j.org_id = uo.org_id 
                WHERE uo.user_id = auth.uid()
                AND uo.role IN ('owner', 'admin', 'recruiter')
            )
        );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

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
-- VERIFICATION
-- =============================================

-- Check that default columns were created
SELECT 'Pipeline columns created:' as status, count(*) as count FROM pipeline_columns;
SELECT 'Organizations with pipeline columns:' as status, count(DISTINCT org_id) as count FROM pipeline_columns;

-- Show sample data
SELECT org_id, title, position FROM pipeline_columns ORDER BY org_id, position::INTEGER LIMIT 10;