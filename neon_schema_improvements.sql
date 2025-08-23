-- TalentPatriot Database Schema Improvements for Neon Database
-- Phase 1: High-Impact Performance & Data Integrity Optimizations
-- Safe to run on existing production database
-- Date: August 23, 2025

-- =============================================================================
-- SECTION 1: CRITICAL PERFORMANCE INDEXES
-- =============================================================================

-- Core query performance indexes for common application queries
CREATE INDEX IF NOT EXISTS idx_candidates_org_email ON candidates(org_id, email);
CREATE INDEX IF NOT EXISTS idx_candidates_org_status ON candidates(org_id, status);
CREATE INDEX IF NOT EXISTS idx_job_candidate_status ON job_candidate(status, org_id);
CREATE INDEX IF NOT EXISTS idx_job_candidate_pipeline ON job_candidate(job_id, pipeline_column_id, status);
CREATE INDEX IF NOT EXISTS idx_jobs_status_published ON jobs(status, published_at, org_id);
CREATE INDEX IF NOT EXISTS idx_jobs_org_status ON jobs(org_id, status);
CREATE INDEX IF NOT EXISTS idx_messages_thread ON messages(thread_id, created_at);
CREATE INDEX IF NOT EXISTS idx_interviews_scheduled ON interviews(scheduled_at, status);

-- Full-text search indexes for AI and search functionality
CREATE INDEX IF NOT EXISTS idx_candidates_skills_gin ON candidates USING gin(skills);
CREATE INDEX IF NOT EXISTS idx_candidates_search_gin ON candidates USING gin(to_tsvector('english', coalesce(searchable_content, '')));
CREATE INDEX IF NOT EXISTS idx_jobs_description_gin ON jobs USING gin(to_tsvector('english', coalesce(description, '')));

-- Dashboard and reporting performance indexes
CREATE INDEX IF NOT EXISTS idx_candidates_experience ON candidates(org_id, experience_level, total_years_experience);
CREATE INDEX IF NOT EXISTS idx_jobs_filters ON jobs(org_id, status, job_type, remote_option);
CREATE INDEX IF NOT EXISTS idx_job_candidate_created ON job_candidate(org_id, created_at);
CREATE INDEX IF NOT EXISTS idx_interviews_org_date ON interviews(org_id, scheduled_at);

-- =============================================================================
-- SECTION 2: DATA INTEGRITY CONSTRAINTS
-- =============================================================================

-- Email format validation for candidates
DO $$
BEGIN
    ALTER TABLE candidates ADD CONSTRAINT chk_candidates_email_format 
    CHECK (email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Email format validation for clients
DO $$
BEGIN
    ALTER TABLE clients ADD CONSTRAINT chk_clients_contact_email_format 
    CHECK (contact_email IS NULL OR contact_email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Phone number validation for candidates
DO $$
BEGIN
    ALTER TABLE candidates ADD CONSTRAINT chk_candidates_phone_format 
    CHECK (phone IS NULL OR phone ~ '^[\+]?[0-9\-\s\(\)\.]{7,20}$');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Phone number validation for user profiles
DO $$
BEGIN
    ALTER TABLE user_profiles ADD CONSTRAINT chk_user_profiles_phone_format 
    CHECK (phone IS NULL OR phone ~ '^[\+]?[0-9\-\s\(\)\.]{7,20}$');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Salary range validation for jobs
DO $$
BEGIN
    ALTER TABLE jobs ADD CONSTRAINT chk_jobs_salary_range_format 
    CHECK (salary_range IS NULL OR salary_range ~ '^\$?[\d,]+(k|K)?(\s*-\s*\$?[\d,]+(k|K)?)?$');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- SECTION 3: CREATE MATERIALIZED VIEW FOR ANALYTICS
-- =============================================================================

-- Drop existing view if it exists
DROP MATERIALIZED VIEW IF EXISTS recruitment_metrics;

-- Create recruitment metrics materialized view
CREATE MATERIALIZED VIEW recruitment_metrics AS
SELECT 
    j.org_id,
    j.id as job_id,
    j.title as job_title,
    j.status as job_status,
    COUNT(jc.id) as total_applications,
    COUNT(CASE WHEN jc.stage = 'hired' THEN 1 END) as total_hires,
    COUNT(CASE WHEN jc.stage = 'interview' THEN 1 END) as total_interviews,
    COUNT(CASE WHEN jc.stage = 'offer' THEN 1 END) as total_offers,
    COUNT(CASE WHEN jc.stage = 'rejected' THEN 1 END) as total_rejected,
    ROUND(AVG(EXTRACT(days FROM COALESCE(jc.updated_at, jc.created_at) - jc.created_at))::numeric, 1) as avg_days_in_pipeline,
    DATE_TRUNC('month', jc.created_at) as application_month,
    MAX(jc.created_at) as last_application_date
FROM jobs j
LEFT JOIN job_candidate jc ON j.id = jc.job_id AND jc.status = 'active'
WHERE j.record_status = 'active'
GROUP BY j.org_id, j.id, j.title, j.status, DATE_TRUNC('month', jc.created_at);

-- Create unique index on the materialized view
CREATE UNIQUE INDEX idx_recruitment_metrics_unique ON recruitment_metrics(job_id, application_month);

-- Create additional indexes for common queries
CREATE INDEX idx_recruitment_metrics_org ON recruitment_metrics(org_id, application_month);
CREATE INDEX idx_recruitment_metrics_status ON recruitment_metrics(job_status, application_month);

-- =============================================================================
-- SECTION 4: UTILITY FUNCTIONS
-- =============================================================================

-- Create function to refresh recruitment metrics
CREATE OR REPLACE FUNCTION refresh_recruitment_metrics()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY recruitment_metrics;
END;
$$ LANGUAGE plpgsql;

-- Create function to get organization stats
CREATE OR REPLACE FUNCTION get_org_stats(org_uuid uuid)
RETURNS TABLE (
    total_jobs bigint,
    active_jobs bigint,
    total_candidates bigint,
    total_applications bigint,
    this_month_applications bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM jobs WHERE org_id = org_uuid AND record_status = 'active'),
        (SELECT COUNT(*) FROM jobs WHERE org_id = org_uuid AND status = 'open' AND record_status = 'active'),
        (SELECT COUNT(*) FROM candidates WHERE org_id = org_uuid AND status = 'active'),
        (SELECT COUNT(*) FROM job_candidate jc 
         JOIN jobs j ON jc.job_id = j.id 
         WHERE j.org_id = org_uuid AND jc.status = 'active'),
        (SELECT COUNT(*) FROM job_candidate jc 
         JOIN jobs j ON jc.job_id = j.id 
         WHERE j.org_id = org_uuid 
         AND jc.status = 'active' 
         AND jc.created_at >= DATE_TRUNC('month', CURRENT_DATE));
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- COMPLETION MESSAGE
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE 'TalentPatriot Schema Improvements Applied Successfully!';
    RAISE NOTICE '';
    RAISE NOTICE 'Phase 1 Improvements Completed:';
    RAISE NOTICE '- ✓ Added 12 performance indexes for faster queries';
    RAISE NOTICE '- ✓ Added data validation constraints for emails, phones, salary ranges';
    RAISE NOTICE '- ✓ Created recruitment_metrics materialized view for analytics';
    RAISE NOTICE '- ✓ Added utility functions for stats and metrics refresh';
    RAISE NOTICE '';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '1. Run "SELECT refresh_recruitment_metrics();" to populate analytics data';
    RAISE NOTICE '2. Test query performance on dashboard and reports pages';
    RAISE NOTICE '3. Consider implementing Phase 2 improvements (departments, skills taxonomy)';
    RAISE NOTICE '';
    RAISE NOTICE 'For ongoing maintenance:';
    RAISE NOTICE '- Refresh materialized views weekly: SELECT refresh_recruitment_metrics();';
    RAISE NOTICE '- Monitor slow query logs and add indexes as needed';
    RAISE NOTICE '- Check constraint violations in application logs';
END $$;