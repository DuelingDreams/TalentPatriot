-- Supabase Performance Optimization Script
-- Addresses common performance warnings and suggestions

-- ========================================
-- 1. ADD MISSING INDEXES
-- ========================================

-- Add indexes for foreign key columns (common warning 0001)
CREATE INDEX IF NOT EXISTS idx_user_profiles_id ON user_profiles(id);
CREATE INDEX IF NOT EXISTS idx_user_orgs_user_id ON user_organizations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_orgs_org_id ON user_organizations(org_id);
CREATE INDEX IF NOT EXISTS idx_clients_org_id ON clients(org_id);
CREATE INDEX IF NOT EXISTS idx_clients_created_by ON clients(created_by);
CREATE INDEX IF NOT EXISTS idx_jobs_org_id ON jobs(org_id);
CREATE INDEX IF NOT EXISTS idx_jobs_client_id ON jobs(client_id);
CREATE INDEX IF NOT EXISTS idx_jobs_created_by ON jobs(created_by);
CREATE INDEX IF NOT EXISTS idx_jobs_assigned_to ON jobs(assigned_to);
CREATE INDEX IF NOT EXISTS idx_candidates_org_id ON candidates(org_id);
CREATE INDEX IF NOT EXISTS idx_candidates_created_by ON candidates(created_by);
CREATE INDEX IF NOT EXISTS idx_candidates_email ON candidates(email);
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_candidate_id ON applications(candidate_id);
CREATE INDEX IF NOT EXISTS idx_job_candidate_org_id ON job_candidate(org_id);
CREATE INDEX IF NOT EXISTS idx_job_candidate_job_id ON job_candidate(job_id);
CREATE INDEX IF NOT EXISTS idx_job_candidate_candidate_id ON job_candidate(candidate_id);
CREATE INDEX IF NOT EXISTS idx_job_candidate_application_id ON job_candidate(application_id);
CREATE INDEX IF NOT EXISTS idx_job_candidate_assigned_to ON job_candidate(assigned_to);
CREATE INDEX IF NOT EXISTS idx_candidate_notes_org_id ON candidate_notes(org_id);
CREATE INDEX IF NOT EXISTS idx_candidate_notes_job_candidate_id ON candidate_notes(job_candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_notes_author_id ON candidate_notes(author_id);
CREATE INDEX IF NOT EXISTS idx_interviews_org_id ON interviews(org_id);
CREATE INDEX IF NOT EXISTS idx_interviews_job_candidate_id ON interviews(job_candidate_id);
CREATE INDEX IF NOT EXISTS idx_interviews_interviewer_id ON interviews(interviewer_id);
CREATE INDEX IF NOT EXISTS idx_messages_org_id ON messages(org_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_client_id ON messages(client_id);
CREATE INDEX IF NOT EXISTS idx_messages_job_id ON messages(job_id);
CREATE INDEX IF NOT EXISTS idx_messages_candidate_id ON messages(candidate_id);
CREATE INDEX IF NOT EXISTS idx_message_recipients_message_id ON message_recipients(message_id);
CREATE INDEX IF NOT EXISTS idx_message_recipients_recipient_id ON message_recipients(recipient_id);

-- Add indexes for commonly queried status columns
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status) WHERE status = 'open';
CREATE INDEX IF NOT EXISTS idx_jobs_record_status ON jobs(record_status);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_candidates_status ON candidates(status);
CREATE INDEX IF NOT EXISTS idx_job_candidate_stage ON job_candidate(stage);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_interviews_status ON interviews(status);
CREATE INDEX IF NOT EXISTS idx_interviews_scheduled_at ON interviews(scheduled_at);

-- Add composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_jobs_org_status ON jobs(org_id, status);
CREATE INDEX IF NOT EXISTS idx_job_candidate_job_stage ON job_candidate(job_id, stage);
CREATE INDEX IF NOT EXISTS idx_messages_org_created ON messages(org_id, created_at DESC);

-- ========================================
-- 2. OPTIMIZE RLS POLICIES
-- ========================================

-- Drop and recreate RLS policies with performance optimizations
-- Using SELECT wrapper for auth functions (100x+ performance improvement)

-- Organizations policies (optimized)
DROP POLICY IF EXISTS "Users can view organizations they belong to" ON organizations;
CREATE POLICY "Users can view organizations they belong to" ON organizations
    FOR SELECT 
    TO authenticated
    USING (
        id = ANY((SELECT get_user_org_ids((SELECT auth.uid()))))
    );

-- Clients policies (optimized)
DROP POLICY IF EXISTS "Users can view clients in their organizations" ON clients;
CREATE POLICY "Users can view clients in their organizations" ON clients
    FOR SELECT 
    TO authenticated
    USING (
        org_id = ANY((SELECT get_user_org_ids((SELECT auth.uid())))) OR
        ((SELECT get_user_role((SELECT auth.uid()))) = 'demo_viewer' AND status = 'demo'::record_status)
    );

DROP POLICY IF EXISTS "Users can manage clients in their organizations" ON clients;
CREATE POLICY "Users can manage clients in their organizations" ON clients
    FOR ALL 
    TO authenticated
    USING (
        org_id = ANY((SELECT get_user_org_ids((SELECT auth.uid())))) AND
        (SELECT get_user_role((SELECT auth.uid()))) != 'demo_viewer'
    );

-- Jobs policies (optimized)
DROP POLICY IF EXISTS "Users can view jobs in their organizations" ON jobs;
CREATE POLICY "Users can view jobs in their organizations" ON jobs
    FOR SELECT 
    TO authenticated
    USING (
        org_id = ANY((SELECT get_user_org_ids((SELECT auth.uid())))) OR
        ((SELECT get_user_role((SELECT auth.uid()))) = 'demo_viewer' AND record_status = 'demo'::record_status)
    );

DROP POLICY IF EXISTS "Users can manage jobs in their organizations" ON jobs;
CREATE POLICY "Users can manage jobs in their organizations" ON jobs
    FOR ALL 
    TO authenticated
    USING (
        org_id = ANY((SELECT get_user_org_ids((SELECT auth.uid())))) AND
        (SELECT get_user_role((SELECT auth.uid()))) != 'demo_viewer'
    );

-- Keep public job view policy as is (already efficient)
DROP POLICY IF EXISTS "Public can view open jobs" ON jobs;
CREATE POLICY "Public can view open jobs" ON jobs
    FOR SELECT 
    TO anon
    USING (status = 'open'::job_status AND record_status = 'active'::record_status);

-- Candidates policies (optimized)
DROP POLICY IF EXISTS "Users can view candidates in their organizations" ON candidates;
CREATE POLICY "Users can view candidates in their organizations" ON candidates
    FOR SELECT 
    TO authenticated
    USING (
        org_id = ANY((SELECT get_user_org_ids((SELECT auth.uid())))) OR
        ((SELECT get_user_role((SELECT auth.uid()))) = 'demo_viewer' AND status = 'demo'::record_status)
    );

-- Job Candidate policies (optimized)
DROP POLICY IF EXISTS "Users can view pipeline in their organizations" ON job_candidate;
CREATE POLICY "Users can view pipeline in their organizations" ON job_candidate
    FOR SELECT 
    TO authenticated
    USING (
        org_id = ANY((SELECT get_user_org_ids((SELECT auth.uid())))) OR
        ((SELECT get_user_role((SELECT auth.uid()))) = 'demo_viewer' AND status = 'demo'::record_status)
    );

-- ========================================
-- 3. CREATE OPTIMIZED HELPER FUNCTIONS
-- ========================================

-- Optimized get_user_org_ids function with caching
DROP FUNCTION IF EXISTS get_user_org_ids(uuid);
CREATE OR REPLACE FUNCTION get_user_org_ids(user_uuid uuid)
RETURNS uuid[] 
LANGUAGE sql 
STABLE 
SECURITY DEFINER
AS $$
    SELECT COALESCE(ARRAY_AGG(org_id), ARRAY[]::uuid[])
    FROM user_organizations 
    WHERE user_id = user_uuid;
$$;

-- Create index on function result
CREATE INDEX IF NOT EXISTS idx_user_orgs_by_user ON user_organizations(user_id);

-- Optimized get_user_role function
DROP FUNCTION IF EXISTS get_user_role(uuid);
CREATE OR REPLACE FUNCTION get_user_role(user_uuid uuid)
RETURNS TEXT 
LANGUAGE sql 
STABLE 
SECURITY DEFINER
AS $$
    SELECT CASE 
        WHEN (SELECT email FROM auth.users WHERE id = user_uuid) = 'demo@yourapp.com' 
        THEN 'demo_viewer'
        ELSE COALESCE(
            (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = user_uuid),
            'hiring_manager'
        )
    END;
$$;

-- ========================================
-- 4. CREATE MATERIALIZED VIEWS FOR EXPENSIVE QUERIES
-- ========================================

-- Materialized view for dashboard statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_stats AS
SELECT 
    org_id,
    COUNT(DISTINCT CASE WHEN status = 'open' THEN id END) as open_jobs_count,
    COUNT(DISTINCT id) as total_jobs_count,
    COUNT(DISTINCT client_id) as active_clients_count
FROM jobs
WHERE record_status = 'active'
GROUP BY org_id;

CREATE INDEX IF NOT EXISTS idx_dashboard_stats_org ON dashboard_stats(org_id);

-- Materialized view for pipeline statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS pipeline_stats AS
SELECT 
    jc.org_id,
    jc.job_id,
    jc.stage,
    COUNT(*) as candidate_count
FROM job_candidate jc
WHERE jc.status = 'active'
GROUP BY jc.org_id, jc.job_id, jc.stage;

CREATE INDEX IF NOT EXISTS idx_pipeline_stats_org_job ON pipeline_stats(org_id, job_id);

-- Create refresh function for materialized views
CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_stats;
    REFRESH MATERIALIZED VIEW CONCURRENTLY pipeline_stats;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 5. OPTIMIZE TABLE STATISTICS
-- ========================================

-- Update table statistics for better query planning
ANALYZE organizations;
ANALYZE user_organizations;
ANALYZE clients;
ANALYZE jobs;
ANALYZE candidates;
ANALYZE applications;
ANALYZE job_candidate;
ANALYZE candidate_notes;
ANALYZE interviews;
ANALYZE messages;
ANALYZE message_recipients;

-- ========================================
-- 6. ADD PERFORMANCE MONITORING
-- ========================================

-- Create a view to monitor slow queries
CREATE OR REPLACE VIEW slow_queries AS
SELECT 
    query,
    calls,
    total_exec_time,
    mean_exec_time,
    max_exec_time,
    rows
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_%'
AND mean_exec_time > 50
ORDER BY mean_exec_time DESC
LIMIT 50;

-- ========================================
-- 7. OPTIMIZE COMMON QUERY PATTERNS
-- ========================================

-- Create optimized function for getting job candidates
CREATE OR REPLACE FUNCTION get_job_candidates(p_job_id uuid, p_user_id uuid)
RETURNS TABLE(
    candidate_id uuid,
    candidate_name text,
    candidate_email text,
    stage candidate_stage,
    applied_at timestamp with time zone
) 
LANGUAGE sql 
STABLE 
SECURITY DEFINER
AS $$
    SELECT 
        c.id,
        c.name,
        c.email,
        jc.stage,
        jc.created_at
    FROM job_candidate jc
    JOIN candidates c ON c.id = jc.candidate_id
    WHERE jc.job_id = p_job_id
    AND jc.org_id = ANY((SELECT get_user_org_ids(p_user_id)))
    ORDER BY jc.created_at DESC;
$$;

-- ========================================
-- 8. ADD TABLE PARTITIONING FOR LARGE TABLES
-- ========================================

-- Note: Consider partitioning messages table by created_at if it grows large
-- This is commented out as it requires data migration
/*
-- Create partitioned messages table
CREATE TABLE messages_partitioned (
    LIKE messages INCLUDING ALL
) PARTITION BY RANGE (created_at);

-- Create monthly partitions
CREATE TABLE messages_2025_01 PARTITION OF messages_partitioned
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
    
CREATE TABLE messages_2025_02 PARTITION OF messages_partitioned
    FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
-- Continue for all months...
*/

-- ========================================
-- 9. CLEAN UP DUPLICATE INDEXES
-- ========================================

-- Query to identify duplicate indexes (informational only)
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ========================================
-- 10. ADD QUERY HINTS VIA COMMENTS
-- ========================================

-- Add optimizer hints for critical queries
COMMENT ON INDEX idx_jobs_org_status IS 'Critical index for dashboard queries';
COMMENT ON INDEX idx_job_candidate_job_stage IS 'Critical index for pipeline visualization';

-- Grant necessary permissions
GRANT SELECT ON dashboard_stats TO authenticated;
GRANT SELECT ON pipeline_stats TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_materialized_views() TO authenticated;