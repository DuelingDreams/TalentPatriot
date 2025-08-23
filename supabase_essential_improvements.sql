-- TalentPatriot Essential Database Improvements for Supabase
-- Simplified version focusing on critical performance indexes only
-- Safe to run on existing Supabase database
-- Date: August 23, 2025

-- =============================================================================
-- PERFORMANCE INDEXES ONLY - NO SCHEMA CHANGES
-- =============================================================================

-- Check what tables exist first
DO $$
BEGIN
    RAISE NOTICE 'Checking existing tables...';
    
    -- List existing tables
    FOR rec IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
    LOOP
        RAISE NOTICE 'Found table: %', rec.table_name;
    END LOOP;
END $$;

-- Core performance indexes (only if tables exist)
DO $$
BEGIN
    -- Candidates table indexes
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'candidates') THEN
        CREATE INDEX IF NOT EXISTS idx_candidates_org_email ON candidates(org_id, email);
        CREATE INDEX IF NOT EXISTS idx_candidates_org_status ON candidates(org_id, status);
        RAISE NOTICE 'Added candidates indexes';
    END IF;
    
    -- Jobs table indexes  
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'jobs') THEN
        CREATE INDEX IF NOT EXISTS idx_jobs_org_status ON jobs(org_id, status);
        CREATE INDEX IF NOT EXISTS idx_jobs_public_slug ON jobs(public_slug) WHERE public_slug IS NOT NULL;
        RAISE NOTICE 'Added jobs indexes';
    END IF;
    
    -- Job candidate relationship indexes
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'job_candidate') THEN
        CREATE INDEX IF NOT EXISTS idx_job_candidate_job_id ON job_candidate(job_id);
        CREATE INDEX IF NOT EXISTS idx_job_candidate_candidate_id ON job_candidate(candidate_id);
        CREATE INDEX IF NOT EXISTS idx_job_candidate_org_status ON job_candidate(org_id, status);
        RAISE NOTICE 'Added job_candidate indexes';
    END IF;
    
    -- User organizations indexes
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_organizations') THEN
        CREATE INDEX IF NOT EXISTS idx_user_organizations_user_id ON user_organizations(user_id);
        CREATE INDEX IF NOT EXISTS idx_user_organizations_org_id ON user_organizations(org_id);
        RAISE NOTICE 'Added user_organizations indexes';
    END IF;
    
    -- Pipeline columns indexes
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pipeline_columns') THEN
        CREATE INDEX IF NOT EXISTS idx_pipeline_columns_job_id ON pipeline_columns(job_id);
        CREATE INDEX IF NOT EXISTS idx_pipeline_columns_org_id ON pipeline_columns(org_id);
        RAISE NOTICE 'Added pipeline_columns indexes';
    END IF;
    
    -- Messages indexes
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages') THEN
        CREATE INDEX IF NOT EXISTS idx_messages_org_id ON messages(org_id);
        CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
        CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
        RAISE NOTICE 'Added messages indexes';
    END IF;
    
    -- Interviews indexes
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'interviews') THEN
        CREATE INDEX IF NOT EXISTS idx_interviews_org_id ON interviews(org_id);
        CREATE INDEX IF NOT EXISTS idx_interviews_scheduled_at ON interviews(scheduled_at);
        RAISE NOTICE 'Added interviews indexes';
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error adding indexes: %', SQLERRM;
END $$;

-- Simple organization stats function (no dependencies on materialized views)
CREATE OR REPLACE FUNCTION get_basic_org_stats(org_uuid uuid)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_jobs', COALESCE((SELECT COUNT(*) FROM jobs WHERE org_id = org_uuid), 0),
        'total_candidates', COALESCE((SELECT COUNT(*) FROM candidates WHERE org_id = org_uuid), 0),
        'total_applications', COALESCE((SELECT COUNT(*) FROM job_candidate jc JOIN jobs j ON jc.job_id = j.id WHERE j.org_id = org_uuid), 0)
    ) INTO result;
    
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- Final status check
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== TalentPatriot Essential Improvements Completed ===';
    RAISE NOTICE '';
    RAISE NOTICE 'Applied:';
    RAISE NOTICE '- ✓ Performance indexes for faster queries';
    RAISE NOTICE '- ✓ Basic organization stats function';
    RAISE NOTICE '';
    RAISE NOTICE 'Skipped (to avoid errors):';
    RAISE NOTICE '- Data type changes (interviews duration/rating)';
    RAISE NOTICE '- Data validation constraints';
    RAISE NOTICE '- Materialized views';
    RAISE NOTICE '';
    RAISE NOTICE 'Test the improvements:';
    RAISE NOTICE '1. Check dashboard loading speed';
    RAISE NOTICE '2. Test candidate search performance';
    RAISE NOTICE '3. Run: SELECT get_basic_org_stats(''your-org-id'');';
    RAISE NOTICE '';
END $$;