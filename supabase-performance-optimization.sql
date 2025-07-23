-- TalentPatriot ATS Performance Optimization Suite
-- Addresses query performance bottlenecks and implements enterprise-grade optimizations

-- ==========================================
-- PART 1: CRITICAL PERFORMANCE INDEXES
-- ==========================================

-- Core application indexes for fast queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clients_org_status_active 
  ON clients(org_id, status) WHERE status = 'active';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_org_status_open 
  ON jobs(org_id, status) WHERE status = 'open';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_candidates_org_status_active 
  ON candidates(org_id, status) WHERE status = 'active';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_candidate_org_stage 
  ON job_candidate(org_id, stage);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_candidate_notes_org_created 
  ON candidate_notes(org_id, created_at DESC);

-- Search optimization indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clients_search 
  ON clients USING gin(to_tsvector('english', name || ' ' || COALESCE(industry, '') || ' ' || COALESCE(location, '')));

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_search 
  ON jobs USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_candidates_search 
  ON candidates USING gin(to_tsvector('english', name || ' ' || COALESCE(email, '')));

-- Foreign key performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_client_id ON jobs(client_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_candidate_job_id ON job_candidate(job_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_candidate_candidate_id ON job_candidate(candidate_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_candidate_notes_job_candidate_id ON candidate_notes(job_candidate_id);

-- Time-based queries optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clients_created_at ON clients(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_candidates_created_at ON candidates(created_at DESC);

-- User and organization performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_organizations_user_role ON user_organizations(user_id, role);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_organizations_org_role ON user_organizations(org_id, role);

-- ==========================================
-- PART 2: QUERY OPTIMIZATION FUNCTIONS
-- ==========================================

-- Optimized function to get user's organizations with role caching
CREATE OR REPLACE FUNCTION get_user_orgs_fast(user_id UUID)
RETURNS TABLE(org_id UUID, role TEXT, org_name TEXT)
LANGUAGE sql
STABLE
PARALLEL SAFE
AS $$
  SELECT 
    uo.org_id,
    uo.role::TEXT,
    o.name
  FROM user_organizations uo
  JOIN organizations o ON o.id = uo.org_id
  WHERE uo.user_id = get_user_orgs_fast.user_id;
$$;

-- Fast candidate pipeline query with optimized joins
CREATE OR REPLACE FUNCTION get_pipeline_candidates(job_id_param UUID, org_id_param UUID)
RETURNS TABLE(
  candidate_id UUID,
  candidate_name TEXT,
  candidate_email TEXT,
  stage TEXT,
  notes_count INTEGER,
  last_update TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
STABLE
PARALLEL SAFE
AS $$
  SELECT 
    c.id,
    c.name,
    c.email,
    jc.stage::TEXT,
    (SELECT COUNT(*) FROM candidate_notes cn WHERE cn.job_candidate_id = jc.id)::INTEGER,
    jc.updated_at
  FROM candidates c
  JOIN job_candidate jc ON jc.candidate_id = c.id
  WHERE jc.job_id = job_id_param 
    AND c.org_id = org_id_param
    AND c.status = 'active'
  ORDER BY jc.updated_at DESC;
$$;

-- Optimized dashboard statistics with single query
CREATE OR REPLACE FUNCTION get_dashboard_stats(org_id_param UUID)
RETURNS JSON
LANGUAGE sql
STABLE
PARALLEL SAFE
AS $$
  SELECT json_build_object(
    'total_clients', (SELECT COUNT(*) FROM clients WHERE org_id = org_id_param AND status = 'active'),
    'active_jobs', (SELECT COUNT(*) FROM jobs WHERE org_id = org_id_param AND status = 'open'),
    'total_candidates', (SELECT COUNT(*) FROM candidates WHERE org_id = org_id_param AND status = 'active'),
    'candidates_this_week', (
      SELECT COUNT(*) 
      FROM candidates 
      WHERE org_id = org_id_param 
        AND status = 'active' 
        AND created_at >= CURRENT_DATE - INTERVAL '7 days'
    ),
    'pipeline_summary', (
      SELECT json_agg(json_build_object('stage', stage, 'count', count))
      FROM (
        SELECT jc.stage::TEXT, COUNT(*) as count
        FROM job_candidate jc
        WHERE jc.org_id = org_id_param AND jc.status = 'active'
        GROUP BY jc.stage
      ) pipeline_data
    )
  );
$$;

-- ==========================================
-- PART 3: OPTIMIZED RLS POLICIES
-- ==========================================

-- Drop existing policies to recreate with better performance
DROP POLICY IF EXISTS "clients_secure_access" ON clients;
DROP POLICY IF EXISTS "jobs_secure_access" ON jobs;
DROP POLICY IF EXISTS "candidates_secure_access" ON candidates;
DROP POLICY IF EXISTS "job_candidate_secure_access" ON job_candidate;

-- Create optimized RLS policies with better indexing strategy
CREATE POLICY "clients_fast_access" ON clients
  FOR SELECT TO authenticated
  USING (
    CASE 
      WHEN is_demo_viewer(auth.uid()) THEN 
        org_id = '550e8400-e29b-41d4-a716-446655440000'::UUID
      ELSE 
        org_id = ANY(
          SELECT uo.org_id 
          FROM user_organizations uo 
          WHERE uo.user_id = auth.uid()
          LIMIT 10  -- Limit for performance
        )
    END
  );

CREATE POLICY "jobs_fast_access" ON jobs
  FOR SELECT TO authenticated
  USING (
    CASE 
      WHEN is_demo_viewer(auth.uid()) THEN 
        org_id = '550e8400-e29b-41d4-a716-446655440000'::UUID
      ELSE 
        org_id = ANY(
          SELECT uo.org_id 
          FROM user_organizations uo 
          WHERE uo.user_id = auth.uid()
          LIMIT 10
        )
    END
  );

CREATE POLICY "candidates_fast_access" ON candidates
  FOR SELECT TO authenticated
  USING (
    CASE 
      WHEN is_demo_viewer(auth.uid()) THEN 
        org_id = '550e8400-e29b-41d4-a716-446655440000'::UUID
      ELSE 
        org_id = ANY(
          SELECT uo.org_id 
          FROM user_organizations uo 
          WHERE uo.user_id = auth.uid()
          LIMIT 10
        )
    END
  );

CREATE POLICY "job_candidate_fast_access" ON job_candidate
  FOR SELECT TO authenticated
  USING (
    CASE 
      WHEN is_demo_viewer(auth.uid()) THEN 
        org_id = '550e8400-e29b-41d4-a716-446655440000'::UUID
      ELSE 
        org_id = ANY(
          SELECT uo.org_id 
          FROM user_organizations uo 
          WHERE uo.user_id = auth.uid()
          LIMIT 10
        )
    END
  );

-- ==========================================
-- PART 4: MATERIALIZED VIEWS FOR HEAVY QUERIES
-- ==========================================

-- Materialized view for dashboard analytics (refreshed periodically)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_org_analytics AS
SELECT 
  o.id as org_id,
  o.name as org_name,
  COUNT(DISTINCT c.id) as total_clients,
  COUNT(DISTINCT j.id) as total_jobs,
  COUNT(DISTINCT cand.id) as total_candidates,
  COUNT(DISTINCT jc.id) as total_applications,
  json_agg(DISTINCT json_build_object('stage', jc.stage, 'count', 1)) as pipeline_distribution
FROM organizations o
LEFT JOIN clients c ON c.org_id = o.id AND c.status = 'active'
LEFT JOIN jobs j ON j.org_id = o.id AND j.status = 'open'
LEFT JOIN candidates cand ON cand.org_id = o.id AND cand.status = 'active'
LEFT JOIN job_candidate jc ON jc.org_id = o.id AND jc.status = 'active'
WHERE o.id != '550e8400-e29b-41d4-a716-446655440000'::UUID  -- Exclude demo org
GROUP BY o.id, o.name;

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_mv_org_analytics_org_id ON mv_org_analytics(org_id);

-- ==========================================
-- PART 5: CACHING AND PERFORMANCE FUNCTIONS
-- ==========================================

-- Create timezone cache table to eliminate expensive pg_timezone_names queries
CREATE TABLE IF NOT EXISTS timezone_cache (
  name TEXT PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Populate timezone cache (run once)
INSERT INTO timezone_cache (name)
SELECT name FROM pg_timezone_names
ON CONFLICT (name) DO NOTHING;

-- Function to get cached timezones
CREATE OR REPLACE FUNCTION get_timezones_cached()
RETURNS TABLE(name TEXT)
LANGUAGE sql
STABLE
PARALLEL SAFE
AS $$
  SELECT tc.name FROM timezone_cache tc ORDER BY tc.name;
$$;

-- ==========================================
-- PART 6: MAINTENANCE AND MONITORING
-- ==========================================

-- Function to refresh materialized views (call periodically)
CREATE OR REPLACE FUNCTION refresh_analytics()
RETURNS VOID
LANGUAGE sql
AS $$
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_org_analytics;
$$;

-- Performance monitoring view
CREATE VIEW performance_summary AS
SELECT 
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation,
  most_common_vals,
  most_common_freqs
FROM pg_stats 
WHERE schemaname = 'public'
  AND tablename IN ('clients', 'jobs', 'candidates', 'job_candidate', 'candidate_notes');

-- Query to analyze slow queries (run as needed)
CREATE VIEW slow_query_analysis AS
SELECT 
  query,
  calls,
  total_time,
  total_time/calls as avg_time,
  rows,
  100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements 
WHERE query NOT LIKE '%pg_stat_statements%'
ORDER BY total_time DESC
LIMIT 20;

-- ==========================================
-- FINAL RECOMMENDATIONS
-- ==========================================

-- 1. Run: SELECT refresh_analytics(); -- Every hour
-- 2. Monitor: SELECT * FROM slow_query_analysis; -- Weekly
-- 3. Update stats: ANALYZE; -- After bulk operations
-- 4. Vacuum: VACUUM (ANALYZE, VERBOSE); -- Weekly during maintenance window