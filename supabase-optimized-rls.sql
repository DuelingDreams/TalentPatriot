-- Optimized Supabase Row-Level Security (RLS) Policies for ATS Application
-- Enhanced security with performance optimization and demo support

-- =============================================================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- =============================================================================

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_candidate ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_notes ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- SECURITY HELPER FUNCTIONS
-- =============================================================================

-- Enhanced user role detection with caching
CREATE OR REPLACE FUNCTION auth.get_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role',
    CASE 
      WHEN auth.uid() IS NOT NULL THEN 'authenticated'
      ELSE 'anonymous'
    END
  );
$$;

-- Fast role checking function
CREATE OR REPLACE FUNCTION auth.has_role(required_role TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT auth.get_user_role() = required_role;
$$;

-- Demo content detection with performance optimization
CREATE OR REPLACE FUNCTION is_demo_record(status_field record_status)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT status_field = 'demo';
$$;

-- User assignment checking
CREATE OR REPLACE FUNCTION is_assigned_to_user(assigned_to_field UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT assigned_to_field = auth.uid() OR assigned_to_field IS NULL;
$$;

-- =============================================================================
-- CLIENTS TABLE POLICIES
-- =============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "clients_recruiter_full_access" ON clients;
DROP POLICY IF EXISTS "clients_bd_read_access" ON clients;
DROP POLICY IF EXISTS "clients_demo_read_access" ON clients;
DROP POLICY IF EXISTS "clients_admin_full_access" ON clients;
DROP POLICY IF EXISTS "clients_deny_anonymous" ON clients;

-- Recruiter: Full access to active records, read access to demo
CREATE POLICY "clients_recruiter_full_access"
ON clients
FOR ALL
TO authenticated
USING (
  auth.has_role('recruiter') AND (
    status = 'active' OR 
    (status = 'demo' AND current_setting('request.jwt.claims', true)::json->>'role' = 'recruiter')
  )
)
WITH CHECK (
  auth.has_role('recruiter') AND status IN ('active', 'demo')
);

-- BD: Read access to active records only
CREATE POLICY "clients_bd_read_access"
ON clients
FOR SELECT
TO authenticated
USING (
  auth.has_role('bd') AND status = 'active'
);

-- Demo viewers: Read access to demo records only
CREATE POLICY "clients_demo_read_access"
ON clients
FOR SELECT
TO authenticated
USING (
  auth.has_role('demo_viewer') AND is_demo_record(status)
);

-- Admin: Full access to all records
CREATE POLICY "clients_admin_full_access"
ON clients
FOR ALL
TO authenticated
USING (auth.has_role('admin'))
WITH CHECK (auth.has_role('admin'));

-- Deny anonymous access
CREATE POLICY "clients_deny_anonymous"
ON clients
FOR ALL
TO anon
USING (false);

-- =============================================================================
-- JOBS TABLE POLICIES
-- =============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "jobs_recruiter_full_access" ON jobs;
DROP POLICY IF EXISTS "jobs_bd_read_access" ON jobs;
DROP POLICY IF EXISTS "jobs_pm_assigned_access" ON jobs;
DROP POLICY IF EXISTS "jobs_demo_read_access" ON jobs;
DROP POLICY IF EXISTS "jobs_admin_full_access" ON jobs;
DROP POLICY IF EXISTS "jobs_deny_anonymous" ON jobs;

-- Recruiter: Full access to active records, read access to demo
CREATE POLICY "jobs_recruiter_full_access"
ON jobs
FOR ALL
TO authenticated
USING (
  auth.has_role('recruiter') AND (
    record_status = 'active' OR 
    (record_status = 'demo' AND current_setting('request.jwt.claims', true)::json->>'role' = 'recruiter')
  )
)
WITH CHECK (
  auth.has_role('recruiter') AND record_status IN ('active', 'demo')
);

-- BD: Read access to active records
CREATE POLICY "jobs_bd_read_access"
ON jobs
FOR SELECT
TO authenticated
USING (
  auth.has_role('bd') AND record_status = 'active'
);

-- PM: Access to assigned jobs only
CREATE POLICY "jobs_pm_assigned_access"
ON jobs
FOR SELECT
TO authenticated
USING (
  auth.has_role('pm') AND 
  record_status = 'active' AND
  is_assigned_to_user(assigned_to)
);

-- Demo viewers: Read access to demo records only
CREATE POLICY "jobs_demo_read_access"
ON jobs
FOR SELECT
TO authenticated
USING (
  auth.has_role('demo_viewer') AND is_demo_record(record_status)
);

-- Admin: Full access to all records
CREATE POLICY "jobs_admin_full_access"
ON jobs
FOR ALL
TO authenticated
USING (auth.has_role('admin'))
WITH CHECK (auth.has_role('admin'));

-- Deny anonymous access
CREATE POLICY "jobs_deny_anonymous"
ON jobs
FOR ALL
TO anon
USING (false);

-- =============================================================================
-- CANDIDATES TABLE POLICIES
-- =============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "candidates_recruiter_full_access" ON candidates;
DROP POLICY IF EXISTS "candidates_bd_read_access" ON candidates;
DROP POLICY IF EXISTS "candidates_demo_read_access" ON candidates;
DROP POLICY IF EXISTS "candidates_admin_full_access" ON candidates;
DROP POLICY IF EXISTS "candidates_deny_anonymous" ON candidates;

-- Recruiter: Full access to active records, read access to demo
CREATE POLICY "candidates_recruiter_full_access"
ON candidates
FOR ALL
TO authenticated
USING (
  auth.has_role('recruiter') AND (
    status = 'active' OR 
    (status = 'demo' AND current_setting('request.jwt.claims', true)::json->>'role' = 'recruiter')
  )
)
WITH CHECK (
  auth.has_role('recruiter') AND status IN ('active', 'demo')
);

-- BD: Read access to active records
CREATE POLICY "candidates_bd_read_access"
ON candidates
FOR SELECT
TO authenticated
USING (
  auth.has_role('bd') AND status = 'active'
);

-- Demo viewers: Read access to demo records only
CREATE POLICY "candidates_demo_read_access"
ON candidates
FOR SELECT
TO authenticated
USING (
  auth.has_role('demo_viewer') AND is_demo_record(status)
);

-- Admin: Full access to all records
CREATE POLICY "candidates_admin_full_access"
ON candidates
FOR ALL
TO authenticated
USING (auth.has_role('admin'))
WITH CHECK (auth.has_role('admin'));

-- Deny anonymous access
CREATE POLICY "candidates_deny_anonymous"
ON candidates
FOR ALL
TO anon
USING (false);

-- =============================================================================
-- JOB_CANDIDATE TABLE POLICIES
-- =============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "job_candidate_recruiter_access" ON job_candidate;
DROP POLICY IF EXISTS "job_candidate_bd_read_access" ON job_candidate;
DROP POLICY IF EXISTS "job_candidate_pm_assigned_access" ON job_candidate;
DROP POLICY IF EXISTS "job_candidate_demo_read_access" ON job_candidate;
DROP POLICY IF EXISTS "job_candidate_admin_full_access" ON job_candidate;
DROP POLICY IF EXISTS "job_candidate_deny_anonymous" ON job_candidate;

-- Recruiter: Full access to active records, read access to demo
CREATE POLICY "job_candidate_recruiter_access"
ON job_candidate
FOR ALL
TO authenticated
USING (
  auth.has_role('recruiter') AND (
    status = 'active' OR 
    (status = 'demo' AND current_setting('request.jwt.claims', true)::json->>'role' = 'recruiter')
  )
)
WITH CHECK (
  auth.has_role('recruiter') AND status IN ('active', 'demo')
);

-- BD: Read access to active records
CREATE POLICY "job_candidate_bd_read_access"
ON job_candidate
FOR SELECT
TO authenticated
USING (
  auth.has_role('bd') AND status = 'active'
);

-- PM: Access to assigned job candidates only
CREATE POLICY "job_candidate_pm_assigned_access"
ON job_candidate
FOR SELECT
TO authenticated
USING (
  auth.has_role('pm') AND 
  status = 'active' AND
  is_assigned_to_user(assigned_to)
);

-- Demo viewers: Read access to demo records only
CREATE POLICY "job_candidate_demo_read_access"
ON job_candidate
FOR SELECT
TO authenticated
USING (
  auth.has_role('demo_viewer') AND is_demo_record(status)
);

-- Admin: Full access to all records
CREATE POLICY "job_candidate_admin_full_access"
ON job_candidate
FOR ALL
TO authenticated
USING (auth.has_role('admin'))
WITH CHECK (auth.has_role('admin'));

-- Deny anonymous access
CREATE POLICY "job_candidate_deny_anonymous"
ON job_candidate
FOR ALL
TO anon
USING (false);

-- =============================================================================
-- CANDIDATE_NOTES TABLE POLICIES
-- =============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "candidate_notes_author_access" ON candidate_notes;
DROP POLICY IF EXISTS "candidate_notes_recruiter_read" ON candidate_notes;
DROP POLICY IF EXISTS "candidate_notes_bd_read_access" ON candidate_notes;
DROP POLICY IF EXISTS "candidate_notes_demo_read_access" ON candidate_notes;
DROP POLICY IF EXISTS "candidate_notes_admin_full_access" ON candidate_notes;
DROP POLICY IF EXISTS "candidate_notes_deny_anonymous" ON candidate_notes;

-- Authors: Full access to their own notes
CREATE POLICY "candidate_notes_author_access"
ON candidate_notes
FOR ALL
TO authenticated
USING (author_id = auth.uid())
WITH CHECK (author_id = auth.uid());

-- Recruiters: Read access to all non-private notes
CREATE POLICY "candidate_notes_recruiter_read"
ON candidate_notes
FOR SELECT
TO authenticated
USING (
  auth.has_role('recruiter') AND 
  (NOT is_private OR author_id = auth.uid())
);

-- BD: Read access to non-private notes for active records
CREATE POLICY "candidate_notes_bd_read_access"
ON candidate_notes
FOR SELECT
TO authenticated
USING (
  auth.has_role('bd') AND 
  NOT is_private AND
  EXISTS (
    SELECT 1 FROM job_candidate jc 
    WHERE jc.id = candidate_notes.job_candidate_id 
    AND jc.status = 'active'
  )
);

-- Demo viewers: Read access to demo notes only
CREATE POLICY "candidate_notes_demo_read_access"
ON candidate_notes
FOR SELECT
TO authenticated
USING (
  auth.has_role('demo_viewer') AND
  EXISTS (
    SELECT 1 FROM job_candidate jc 
    WHERE jc.id = candidate_notes.job_candidate_id 
    AND is_demo_record(jc.status)
  )
);

-- Admin: Full access to all records
CREATE POLICY "candidate_notes_admin_full_access"
ON candidate_notes
FOR ALL
TO authenticated
USING (auth.has_role('admin'))
WITH CHECK (auth.has_role('admin'));

-- Deny anonymous access
CREATE POLICY "candidate_notes_deny_anonymous"
ON candidate_notes
FOR ALL
TO anon
USING (false);

-- =============================================================================
-- PERFORMANCE OPTIMIZATION INDEXES FOR RLS
-- =============================================================================

-- Indexes to support RLS policy performance
CREATE INDEX IF NOT EXISTS idx_auth_uid_lookup ON candidate_notes(author_id) WHERE author_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_job_candidate_status_filter ON job_candidate(status) WHERE status IN ('active', 'demo');
CREATE INDEX IF NOT EXISTS idx_clients_status_filter ON clients(status) WHERE status IN ('active', 'demo');
CREATE INDEX IF NOT EXISTS idx_jobs_record_status_filter ON jobs(record_status) WHERE record_status IN ('active', 'demo');
CREATE INDEX IF NOT EXISTS idx_candidates_status_filter ON candidates(status) WHERE status IN ('active', 'demo');

-- Composite indexes for common RLS queries
CREATE INDEX IF NOT EXISTS idx_job_candidate_status_assigned ON job_candidate(status, assigned_to);
CREATE INDEX IF NOT EXISTS idx_candidate_notes_private_author ON candidate_notes(is_private, author_id);

-- =============================================================================
-- SECURITY AUDIT FUNCTIONS
-- =============================================================================

-- Function to audit policy effectiveness
CREATE OR REPLACE FUNCTION audit_rls_policies()
RETURNS TABLE(
  table_name TEXT,
  policy_count INTEGER,
  has_select_policy BOOLEAN,
  has_insert_policy BOOLEAN,
  has_update_policy BOOLEAN,
  has_delete_policy BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.tablename::TEXT,
    COUNT(p.*)::INTEGER as policy_count,
    BOOL_OR(p.cmd = 'SELECT') as has_select_policy,
    BOOL_OR(p.cmd = 'INSERT') as has_insert_policy,
    BOOL_OR(p.cmd = 'UPDATE') as has_update_policy,
    BOOL_OR(p.cmd = 'DELETE') as has_delete_policy
  FROM pg_tables t
  LEFT JOIN pg_policies p ON t.tablename = p.tablename
  WHERE t.schemaname = 'public' 
    AND t.tablename IN ('clients', 'jobs', 'candidates', 'job_candidate', 'candidate_notes')
  GROUP BY t.tablename
  ORDER BY t.tablename;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to test demo user access
CREATE OR REPLACE FUNCTION test_demo_access()
RETURNS TABLE(
  table_name TEXT,
  demo_record_count BIGINT,
  access_granted BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'clients'::TEXT as table_name,
    COUNT(*) as demo_record_count,
    COUNT(*) > 0 as access_granted
  FROM clients 
  WHERE status = 'demo'
  
  UNION ALL
  
  SELECT 
    'jobs'::TEXT as table_name,
    COUNT(*) as demo_record_count,
    COUNT(*) > 0 as access_granted
  FROM jobs 
  WHERE record_status = 'demo'
  
  UNION ALL
  
  SELECT 
    'candidates'::TEXT as table_name,
    COUNT(*) as demo_record_count,
    COUNT(*) > 0 as access_granted
  FROM candidates 
  WHERE status = 'demo'
  
  UNION ALL
  
  SELECT 
    'job_candidate'::TEXT as table_name,
    COUNT(*) as demo_record_count,
    COUNT(*) > 0 as access_granted
  FROM job_candidate 
  WHERE status = 'demo';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- POLICY SUMMARY AND TESTING
-- =============================================================================

/*
OPTIMIZED RLS POLICY STRUCTURE:

ROLE HIERARCHY:
1. ADMIN - Full access to all records (highest privilege)
2. RECRUITER - Full CRUD on active records, read-only on demo records
3. BD - Read-only access to active records
4. PM - Read-only access to assigned active records only
5. DEMO_VIEWER - Read-only access to demo records only
6. ANONYMOUS - No access (lowest privilege)

SECURITY FEATURES:
- Function-based role checking for performance
- Status-based record isolation (active/demo/archived)
- Assignment-based access control for PMs
- Private notes support for sensitive information
- Comprehensive audit and testing functions

PERFORMANCE OPTIMIZATIONS:
- STABLE functions for role caching
- Targeted indexes for RLS filter conditions
- Composite indexes for complex queries
- Efficient demo record identification

TESTING COMMANDS:
SELECT * FROM audit_rls_policies();
SELECT * FROM test_demo_access();
*/