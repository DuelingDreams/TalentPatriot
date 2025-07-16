-- TalentPatriot ATS - Database Optimization Implementation Script
-- Priority 1: Immediate Performance Improvements

-- =============================================================================
-- 1. DATA TYPE FIXES
-- =============================================================================

-- Fix boolean type for candidate_notes.is_private
ALTER TABLE candidate_notes 
ALTER COLUMN is_private TYPE BOOLEAN 
USING CASE 
  WHEN is_private = 'true' THEN true 
  WHEN is_private = 'false' THEN false 
  ELSE false 
END;

-- Update default constraint
ALTER TABLE candidate_notes 
ALTER COLUMN is_private SET DEFAULT false;

-- =============================================================================
-- 2. CRITICAL PERFORMANCE INDEXES
-- =============================================================================

-- Composite indexes for common query patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_client_status_created 
ON jobs(client_id, status, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_candidate_compound 
ON job_candidate(job_id, stage, status, updated_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_candidates_email_status 
ON candidates(email, status) WHERE status = 'active';

-- Partial indexes for filtered queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_active_jobs 
ON jobs(created_at DESC) WHERE record_status = 'active';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_demo_jobs 
ON jobs(created_at DESC) WHERE record_status = 'demo';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_active_candidates 
ON candidates(created_at DESC) WHERE status = 'active';

-- Pipeline-specific indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pipeline_stage_status 
ON job_candidate(stage, status, updated_at DESC) WHERE status IN ('active', 'demo');

-- Message system indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_recipient_unread 
ON messages(recipient_id, created_at DESC) WHERE is_read = false;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_sender_created 
ON messages(sender_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_thread 
ON messages(thread_id, created_at ASC) WHERE thread_id IS NOT NULL;

-- =============================================================================
-- 3. FULL-TEXT SEARCH OPTIMIZATION
-- =============================================================================

-- Enhanced search vectors for candidates
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS search_vector tsvector 
GENERATED ALWAYS AS (
  setweight(to_tsvector('english', name), 'A') ||
  setweight(to_tsvector('english', email), 'B') ||
  setweight(to_tsvector('english', COALESCE(phone, '')), 'C')
) STORED;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_candidates_search 
ON candidates USING gin(search_vector);

-- Enhanced search vectors for clients
ALTER TABLE clients ADD COLUMN IF NOT EXISTS search_vector tsvector 
GENERATED ALWAYS AS (
  setweight(to_tsvector('english', name), 'A') ||
  setweight(to_tsvector('english', COALESCE(industry, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(contact_name, '')), 'C') ||
  setweight(to_tsvector('english', COALESCE(contact_email, '')), 'D')
) STORED;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clients_search 
ON clients USING gin(search_vector);

-- =============================================================================
-- 4. RLS PERFORMANCE OPTIMIZATION
-- =============================================================================

-- Optimized role caching function
CREATE OR REPLACE FUNCTION auth.get_user_role_cached()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  cached_role TEXT;
BEGIN
  -- Try to get cached role from session
  BEGIN
    cached_role := current_setting('app.cached_user_role', true);
  EXCEPTION
    WHEN others THEN
      cached_role := null;
  END;
  
  -- If no cache or empty, compute and cache
  IF cached_role IS NULL OR cached_role = '' THEN
    SELECT COALESCE(
      (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role',
      CASE 
        WHEN auth.uid() IS NOT NULL THEN 'authenticated'
        ELSE 'anonymous'
      END
    ) INTO cached_role;
    
    -- Set session-level cache
    PERFORM set_config('app.cached_user_role', cached_role, false);
  END IF;
  
  RETURN cached_role;
END;
$$;

-- RLS-optimized indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rls_clients_status 
ON clients(status) WHERE status IN ('active', 'demo');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rls_jobs_status_assigned 
ON jobs(record_status, assigned_to) WHERE record_status IN ('active', 'demo');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rls_job_candidate_status_assigned 
ON job_candidate(status, assigned_to) WHERE status IN ('active', 'demo');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rls_candidate_notes_private_author 
ON candidate_notes(is_private, author_id);

-- =============================================================================
-- 5. DASHBOARD PERFORMANCE VIEWS
-- =============================================================================

-- Create materialized view for dashboard statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_stats AS
SELECT 
  -- Client statistics
  (SELECT COUNT(*) FROM clients WHERE status = 'active') as active_clients,
  (SELECT COUNT(*) FROM clients WHERE status = 'demo') as demo_clients,
  
  -- Job statistics
  (SELECT COUNT(*) FROM jobs WHERE record_status = 'active' AND status = 'open') as open_jobs,
  (SELECT COUNT(*) FROM jobs WHERE record_status = 'active' AND status = 'filled') as filled_jobs,
  (SELECT COUNT(*) FROM jobs WHERE record_status = 'demo') as demo_jobs,
  
  -- Candidate statistics
  (SELECT COUNT(*) FROM candidates WHERE status = 'active') as active_candidates,
  (SELECT COUNT(*) FROM candidates WHERE status = 'demo') as demo_candidates,
  
  -- Pipeline statistics by stage
  (SELECT COUNT(*) FROM job_candidate WHERE status = 'active' AND stage = 'applied') as applied_count,
  (SELECT COUNT(*) FROM job_candidate WHERE status = 'active' AND stage = 'screening') as screening_count,
  (SELECT COUNT(*) FROM job_candidate WHERE status = 'active' AND stage = 'interview') as interview_count,
  (SELECT COUNT(*) FROM job_candidate WHERE status = 'active' AND stage = 'technical') as technical_count,
  (SELECT COUNT(*) FROM job_candidate WHERE status = 'active' AND stage = 'final') as final_count,
  (SELECT COUNT(*) FROM job_candidate WHERE status = 'active' AND stage = 'offer') as offer_count,
  (SELECT COUNT(*) FROM job_candidate WHERE status = 'active' AND stage = 'hired') as hired_count,
  (SELECT COUNT(*) FROM job_candidate WHERE status = 'active' AND stage = 'rejected') as rejected_count,
  
  -- Demo pipeline statistics
  (SELECT COUNT(*) FROM job_candidate WHERE status = 'demo' AND stage = 'applied') as demo_applied_count,
  (SELECT COUNT(*) FROM job_candidate WHERE status = 'demo' AND stage = 'screening') as demo_screening_count,
  (SELECT COUNT(*) FROM job_candidate WHERE status = 'demo' AND stage = 'interview') as demo_interview_count,
  (SELECT COUNT(*) FROM job_candidate WHERE status = 'demo' AND stage = 'technical') as demo_technical_count,
  (SELECT COUNT(*) FROM job_candidate WHERE status = 'demo' AND stage = 'final') as demo_final_count,
  (SELECT COUNT(*) FROM job_candidate WHERE status = 'demo' AND stage = 'offer') as demo_offer_count,
  (SELECT COUNT(*) FROM job_candidate WHERE status = 'demo' AND stage = 'hired') as demo_hired_count,
  (SELECT COUNT(*) FROM job_candidate WHERE status = 'demo' AND stage = 'rejected') as demo_rejected_count,
  
  -- Recent activity
  (SELECT COUNT(*) FROM job_candidate WHERE status = 'active' AND updated_at > NOW() - INTERVAL '7 days') as recent_activity_count,
  (SELECT COUNT(*) FROM messages WHERE created_at > NOW() - INTERVAL '24 hours') as recent_messages_count,
  
  -- Last updated
  NOW() as last_updated;

-- Create unique index for materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_dashboard_stats_unique ON dashboard_stats(last_updated);

-- =============================================================================
-- 6. OPTIMIZED PIPELINE VIEW
-- =============================================================================

-- Enhanced pipeline view with better performance
CREATE OR REPLACE VIEW optimized_pipeline_view AS
SELECT 
  j.id as job_id,
  j.title as job_title,
  j.status as job_status,
  c.name as client_name,
  jc.stage,
  jc.status as record_status,
  json_agg(
    json_build_object(
      'id', jc.id,
      'candidateId', cand.id,
      'candidateName', cand.name,
      'candidateEmail', cand.email,
      'candidatePhone', cand.phone,
      'resumeUrl', cand.resume_url,
      'notes', jc.notes,
      'assignedTo', jc.assigned_to,
      'updatedAt', jc.updated_at,
      'stage', jc.stage
    ) ORDER BY jc.updated_at DESC
  ) as candidates
FROM jobs j
JOIN clients c ON j.client_id = c.id
JOIN job_candidate jc ON j.id = jc.job_id
JOIN candidates cand ON jc.candidate_id = cand.id
WHERE j.record_status IN ('active', 'demo')
  AND jc.status IN ('active', 'demo')
  AND cand.status IN ('active', 'demo')
GROUP BY j.id, j.title, j.status, c.name, jc.stage, jc.status
ORDER BY j.created_at DESC;

-- =============================================================================
-- 7. PERFORMANCE MONITORING SETUP
-- =============================================================================

-- Enable pg_stat_statements if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Performance monitoring view
CREATE OR REPLACE VIEW performance_metrics AS
SELECT 
  schemaname,
  tablename,
  seq_scan,
  seq_tup_read,
  idx_scan,
  idx_tup_fetch,
  n_tup_ins,
  n_tup_upd,
  n_tup_del,
  n_live_tup,
  n_dead_tup,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY seq_scan DESC;

-- Table size monitoring
CREATE OR REPLACE VIEW table_sizes AS
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- =============================================================================
-- 8. AUTOMATIC MAINTENANCE FUNCTIONS
-- =============================================================================

-- Function to refresh dashboard statistics
CREATE OR REPLACE FUNCTION refresh_dashboard_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_stats;
END;
$$ LANGUAGE plpgsql;

-- Function to update table statistics
CREATE OR REPLACE FUNCTION update_table_stats()
RETURNS void AS $$
BEGIN
  ANALYZE clients;
  ANALYZE jobs;
  ANALYZE candidates;
  ANALYZE job_candidate;
  ANALYZE candidate_notes;
  ANALYZE messages;
  ANALYZE message_recipients;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old data
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
  -- Archive old demo data (older than 30 days)
  UPDATE clients SET status = 'archived' 
  WHERE status = 'demo' AND created_at < NOW() - INTERVAL '30 days';
  
  UPDATE jobs SET record_status = 'archived'
  WHERE record_status = 'demo' AND created_at < NOW() - INTERVAL '30 days';
  
  UPDATE candidates SET status = 'archived'
  WHERE status = 'demo' AND created_at < NOW() - INTERVAL '30 days';
  
  UPDATE job_candidate SET status = 'archived'
  WHERE status = 'demo' AND created_at < NOW() - INTERVAL '30 days';
  
  -- Clean up old audit logs (if exists)
  DELETE FROM audit_log 
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  -- Vacuum tables after cleanup
  VACUUM (ANALYZE) clients;
  VACUUM (ANALYZE) jobs;
  VACUUM (ANALYZE) candidates;
  VACUUM (ANALYZE) job_candidate;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 9. CONSTRAINTS AND VALIDATION IMPROVEMENTS
-- =============================================================================

-- Add email validation constraints
ALTER TABLE clients 
ADD CONSTRAINT valid_contact_email 
CHECK (contact_email IS NULL OR contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

ALTER TABLE candidates 
ADD CONSTRAINT valid_candidate_email 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Add phone validation
ALTER TABLE candidates 
ADD CONSTRAINT valid_phone 
CHECK (phone IS NULL OR phone ~* '^\+?[\d\s\-\(\)]{10,}$');

-- Add URL validation for websites
ALTER TABLE clients 
ADD CONSTRAINT valid_website 
CHECK (website IS NULL OR website ~* '^https?://.*');

-- =============================================================================
-- 10. INITIAL DATA REFRESH
-- =============================================================================

-- Refresh materialized views
SELECT refresh_dashboard_stats();

-- Update table statistics
SELECT update_table_stats();

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Check index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY idx_tup_read DESC;

-- Check table scan ratios
SELECT 
  tablename,
  seq_scan,
  idx_scan,
  CASE 
    WHEN seq_scan + idx_scan > 0 
    THEN ROUND(100.0 * idx_scan / (seq_scan + idx_scan), 2) 
    ELSE 0 
  END as index_usage_percent
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY index_usage_percent DESC;

-- Verify dashboard stats
SELECT * FROM dashboard_stats;

COMMENT ON MATERIALIZED VIEW dashboard_stats IS 'Cached dashboard statistics for improved performance';
COMMENT ON VIEW optimized_pipeline_view IS 'Optimized view for pipeline data with reduced joins';
COMMENT ON VIEW performance_metrics IS 'Database performance monitoring metrics';
COMMENT ON VIEW table_sizes IS 'Table and index size monitoring';