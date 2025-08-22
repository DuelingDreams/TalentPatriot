-- Database Consistency Update - August 2025
-- Ensures database schema matches all recent application updates

-- 1. Ensure the jobs table has the correct public_slug field structure
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS public_slug VARCHAR(255);

-- Create unique index on public_slug if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'jobs' 
        AND indexname = 'unique_public_slug'
    ) THEN
        CREATE UNIQUE INDEX unique_public_slug ON jobs(public_slug);
    END IF;
END $$;

-- 2. Ensure pipeline_columns table has proper job-specific structure
ALTER TABLE pipeline_columns 
ADD COLUMN IF NOT EXISTS job_id UUID REFERENCES jobs(id);

-- Create indexes for job-specific pipeline queries
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'pipeline_columns' 
        AND indexname = 'idx_pipeline_cols_job_pos'
    ) THEN
        CREATE INDEX idx_pipeline_cols_job_pos ON pipeline_columns(job_id, position);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'pipeline_columns' 
        AND indexname = 'idx_pipeline_cols_org_pos'
    ) THEN
        CREATE INDEX idx_pipeline_cols_org_pos ON pipeline_columns(org_id, position);
    END IF;
END $$;

-- 3. Ensure beta program fields are properly set up in organizations table
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS beta_program BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS beta_applied_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS beta_approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS beta_notes TEXT;

-- 4. Create beta_users table if it doesn't exist
CREATE TABLE IF NOT EXISTS beta_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    company_size VARCHAR(50),
    current_ats VARCHAR(255),
    pain_points TEXT,
    features_interested TEXT[],
    contact_preference VARCHAR(50) DEFAULT 'email',
    referral_source VARCHAR(255),
    additional_comments TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    priority_score INTEGER DEFAULT 0,
    contacted_at TIMESTAMP WITH TIME ZONE,
    onboarded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Ensure proper enum types exist
DO $$
BEGIN
    -- Check and create missing enum types
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'experience_level') THEN
        CREATE TYPE experience_level AS ENUM ('entry', 'mid', 'senior', 'executive');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'remote_option') THEN
        CREATE TYPE remote_option AS ENUM ('onsite', 'remote', 'hybrid');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'org_role') THEN
        CREATE TYPE org_role AS ENUM ('owner', 'admin', 'hiring_manager', 'recruiter', 'interviewer', 'viewer');
    END IF;
END $$;

-- 6. Update any existing data inconsistencies
-- Ensure all published jobs have valid public_slug values
UPDATE jobs 
SET public_slug = LOWER(REPLACE(REPLACE(title, ' ', '-'), '--', '-')) || '-' || EXTRACT(EPOCH FROM created_at)::INTEGER
WHERE status = 'open' 
AND published_at IS NOT NULL 
AND (public_slug IS NULL OR public_slug = '');

-- 7. Ensure job candidates have proper pipeline column assignments
-- This will be handled by the application logic, but we can ensure the foreign key exists
ALTER TABLE job_candidate 
ADD COLUMN IF NOT EXISTS pipeline_column_id UUID REFERENCES pipeline_columns(id);

-- 8. Clean up any orphaned records (optional - run with caution in production)
-- Delete pipeline columns without valid job or org references
-- DELETE FROM pipeline_columns WHERE job_id IS NOT NULL AND job_id NOT IN (SELECT id FROM jobs);
-- DELETE FROM pipeline_columns WHERE org_id NOT IN (SELECT id FROM organizations);

-- 9. Update schema versioning for tracking
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'schema_migrations') THEN
        CREATE TABLE schema_migrations (
            version VARCHAR(255) PRIMARY KEY,
            applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
    
    INSERT INTO schema_migrations (version) 
    VALUES ('database_consistency_update_august_2025')
    ON CONFLICT (version) DO UPDATE SET applied_at = NOW();
END $$;

-- 10. Verify data integrity
-- Check for any jobs without proper slugs
SELECT 
    'Warning: Jobs without public_slug' as check_type,
    COUNT(*) as count
FROM jobs 
WHERE status = 'open' 
AND published_at IS NOT NULL 
AND (public_slug IS NULL OR public_slug = '');

-- Check for organizations without proper setup
SELECT 
    'Info: Organizations count' as check_type,
    COUNT(*) as count
FROM organizations;

-- Check for pipeline columns distribution
SELECT 
    'Info: Pipeline columns by type' as check_type,
    CASE 
        WHEN job_id IS NOT NULL THEN 'Job-specific'
        ELSE 'Organization-wide'
    END as pipeline_type,
    COUNT(*) as count
FROM pipeline_columns
GROUP BY CASE WHEN job_id IS NOT NULL THEN 'Job-specific' ELSE 'Organization-wide' END;

COMMIT;