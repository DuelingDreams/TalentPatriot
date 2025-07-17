-- =============================================================================
-- CORRECTED SUPABASE RLS POLICIES - SYNTAX FIXED
-- =============================================================================
-- Execute this entire script in Supabase SQL Editor

-- =============================================================================
-- STEP 1: ENABLE ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_candidate ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_notes ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- STEP 2: CREATE HELPER FUNCTIONS
-- =============================================================================

-- Drop existing functions
DROP FUNCTION IF EXISTS auth.get_user_role() CASCADE;
DROP FUNCTION IF EXISTS is_demo_content(TEXT) CASCADE;

-- Get user role from JWT
CREATE OR REPLACE FUNCTION auth.get_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    auth.jwt() ->> 'user_role',
    (auth.jwt() -> 'user_metadata' ->> 'role'),
    'unauthenticated'
  );
$$;

-- Check if content is demo
CREATE OR REPLACE FUNCTION is_demo_content(content_text TEXT)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT content_text LIKE '%demo%' OR content_text LIKE '%Demo%';
$$;

-- =============================================================================
-- STEP 3: CLIENTS TABLE POLICIES
-- =============================================================================

-- Clear existing policies
DROP POLICY IF EXISTS "authenticated_read_clients" ON clients;
DROP POLICY IF EXISTS "authenticated_insert_clients" ON clients;
DROP POLICY IF EXISTS "authenticated_update_clients" ON clients;
DROP POLICY IF EXISTS "authenticated_delete_clients" ON clients;
DROP POLICY IF EXISTS "demo_viewer_read_clients" ON clients;
DROP POLICY IF EXISTS "deny_unauthenticated_clients" ON clients;

-- Authenticated users: Read access
CREATE POLICY "authenticated_read_clients"
ON clients FOR SELECT TO authenticated
USING (auth.get_user_role() IN ('bd', 'pm', 'recruiter', 'admin'));

-- Authenticated users: Insert access
CREATE POLICY "authenticated_insert_clients"
ON clients FOR INSERT TO authenticated
WITH CHECK (auth.get_user_role() IN ('bd', 'pm', 'admin'));

-- Authenticated users: Update access
CREATE POLICY "authenticated_update_clients"
ON clients FOR UPDATE TO authenticated
USING (auth.get_user_role() IN ('bd', 'pm', 'admin'))
WITH CHECK (auth.get_user_role() IN ('bd', 'pm', 'admin'));

-- Authenticated users: Delete access
CREATE POLICY "authenticated_delete_clients"
ON clients FOR DELETE TO authenticated
USING (auth.get_user_role() IN ('bd', 'pm', 'admin'));

-- Demo viewers: Demo content only
CREATE POLICY "demo_viewer_read_clients"
ON clients FOR SELECT TO authenticated
USING (
  auth.get_user_role() = 'demo_viewer' 
  AND record_status::TEXT = 'demo'
);

-- Block unauthenticated
CREATE POLICY "deny_unauthenticated_clients"
ON clients FOR ALL TO anon
USING (FALSE);

-- =============================================================================
-- STEP 4: JOBS TABLE POLICIES
-- =============================================================================

-- Clear existing policies
DROP POLICY IF EXISTS "authenticated_read_jobs" ON jobs;
DROP POLICY IF EXISTS "authenticated_insert_jobs" ON jobs;
DROP POLICY IF EXISTS "authenticated_update_jobs" ON jobs;
DROP POLICY IF EXISTS "authenticated_delete_jobs" ON jobs;
DROP POLICY IF EXISTS "demo_viewer_read_jobs" ON jobs;
DROP POLICY IF EXISTS "deny_unauthenticated_jobs" ON jobs;

-- Authenticated users: Read access
CREATE POLICY "authenticated_read_jobs"
ON jobs FOR SELECT TO authenticated
USING (auth.get_user_role() IN ('bd', 'pm', 'recruiter', 'admin'));

-- Authenticated users: Insert access
CREATE POLICY "authenticated_insert_jobs"
ON jobs FOR INSERT TO authenticated
WITH CHECK (auth.get_user_role() IN ('bd', 'pm', 'recruiter', 'admin'));

-- Authenticated users: Update access
CREATE POLICY "authenticated_update_jobs"
ON jobs FOR UPDATE TO authenticated
USING (auth.get_user_role() IN ('bd', 'pm', 'recruiter', 'admin'))
WITH CHECK (auth.get_user_role() IN ('bd', 'pm', 'recruiter', 'admin'));

-- Authenticated users: Delete access
CREATE POLICY "authenticated_delete_jobs"
ON jobs FOR DELETE TO authenticated
USING (auth.get_user_role() IN ('bd', 'pm', 'recruiter', 'admin'));

-- Demo viewers: Demo content only
CREATE POLICY "demo_viewer_read_jobs"
ON jobs FOR SELECT TO authenticated
USING (
  auth.get_user_role() = 'demo_viewer' 
  AND record_status::TEXT = 'demo'
);

-- Block unauthenticated
CREATE POLICY "deny_unauthenticated_jobs"
ON jobs FOR ALL TO anon
USING (FALSE);

-- =============================================================================
-- STEP 5: CANDIDATES TABLE POLICIES
-- =============================================================================

-- Clear existing policies
DROP POLICY IF EXISTS "authenticated_read_candidates" ON candidates;
DROP POLICY IF EXISTS "authenticated_insert_candidates" ON candidates;
DROP POLICY IF EXISTS "authenticated_update_candidates" ON candidates;
DROP POLICY IF EXISTS "authenticated_delete_candidates" ON candidates;
DROP POLICY IF EXISTS "demo_viewer_read_candidates" ON candidates;
DROP POLICY IF EXISTS "deny_unauthenticated_candidates" ON candidates;

-- Authenticated users: Read access
CREATE POLICY "authenticated_read_candidates"
ON candidates FOR SELECT TO authenticated
USING (auth.get_user_role() IN ('bd', 'pm', 'recruiter', 'admin'));

-- Authenticated users: Insert access
CREATE POLICY "authenticated_insert_candidates"
ON candidates FOR INSERT TO authenticated
WITH CHECK (auth.get_user_role() IN ('recruiter', 'admin'));

-- Authenticated users: Update access
CREATE POLICY "authenticated_update_candidates"
ON candidates FOR UPDATE TO authenticated
USING (auth.get_user_role() IN ('recruiter', 'admin'))
WITH CHECK (auth.get_user_role() IN ('recruiter', 'admin'));

-- Authenticated users: Delete access
CREATE POLICY "authenticated_delete_candidates"
ON candidates FOR DELETE TO authenticated
USING (auth.get_user_role() IN ('recruiter', 'admin'));

-- Demo viewers: Demo content only
CREATE POLICY "demo_viewer_read_candidates"
ON candidates FOR SELECT TO authenticated
USING (
  auth.get_user_role() = 'demo_viewer' 
  AND record_status::TEXT = 'demo'
);

-- Block unauthenticated
CREATE POLICY "deny_unauthenticated_candidates"
ON candidates FOR ALL TO anon
USING (FALSE);

-- =============================================================================
-- STEP 6: JOB_CANDIDATE TABLE POLICIES
-- =============================================================================

-- Clear existing policies
DROP POLICY IF EXISTS "authenticated_read_job_candidates" ON job_candidate;
DROP POLICY IF EXISTS "authenticated_insert_job_candidates" ON job_candidate;
DROP POLICY IF EXISTS "authenticated_update_job_candidates" ON job_candidate;
DROP POLICY IF EXISTS "authenticated_delete_job_candidates" ON job_candidate;
DROP POLICY IF EXISTS "demo_viewer_read_job_candidates" ON job_candidate;
DROP POLICY IF EXISTS "deny_unauthenticated_job_candidates" ON job_candidate;

-- Authenticated users: Read access
CREATE POLICY "authenticated_read_job_candidates"
ON job_candidate FOR SELECT TO authenticated
USING (auth.get_user_role() IN ('bd', 'pm', 'recruiter', 'admin'));

-- Authenticated users: Insert access
CREATE POLICY "authenticated_insert_job_candidates"
ON job_candidate FOR INSERT TO authenticated
WITH CHECK (auth.get_user_role() IN ('recruiter', 'admin'));

-- Authenticated users: Update access
CREATE POLICY "authenticated_update_job_candidates"
ON job_candidate FOR UPDATE TO authenticated
USING (auth.get_user_role() IN ('recruiter', 'admin'))
WITH CHECK (auth.get_user_role() IN ('recruiter', 'admin'));

-- Authenticated users: Delete access
CREATE POLICY "authenticated_delete_job_candidates"
ON job_candidate FOR DELETE TO authenticated
USING (auth.get_user_role() IN ('recruiter', 'admin'));

-- Demo viewers: Demo content only
CREATE POLICY "demo_viewer_read_job_candidates"
ON job_candidate FOR SELECT TO authenticated
USING (
  auth.get_user_role() = 'demo_viewer' 
  AND status::TEXT = 'demo'
);

-- Block unauthenticated
CREATE POLICY "deny_unauthenticated_job_candidates"
ON job_candidate FOR ALL TO anon
USING (FALSE);

-- =============================================================================
-- STEP 7: CANDIDATE_NOTES TABLE POLICIES
-- =============================================================================

-- Clear existing policies
DROP POLICY IF EXISTS "recruiters_read_all_candidate_notes" ON candidate_notes;
DROP POLICY IF EXISTS "authors_insert_own_candidate_notes" ON candidate_notes;
DROP POLICY IF EXISTS "authors_update_own_candidate_notes" ON candidate_notes;
DROP POLICY IF EXISTS "authors_delete_own_candidate_notes" ON candidate_notes;
DROP POLICY IF EXISTS "bd_read_access_candidate_notes" ON candidate_notes;
DROP POLICY IF EXISTS "demo_viewer_read_candidate_notes" ON candidate_notes;
DROP POLICY IF EXISTS "deny_unauthenticated_candidate_notes" ON candidate_notes;

-- Recruiters: Read all notes
CREATE POLICY "recruiters_read_all_candidate_notes"
ON candidate_notes FOR SELECT TO authenticated
USING (auth.get_user_role() = 'recruiter');

-- Authors only: Insert own notes
CREATE POLICY "authors_insert_own_candidate_notes"
ON candidate_notes FOR INSERT TO authenticated
WITH CHECK (
  auth.get_user_role() = 'recruiter' 
  AND author_id = auth.uid()
);

-- Authors only: Update own notes
CREATE POLICY "authors_update_own_candidate_notes"
ON candidate_notes FOR UPDATE TO authenticated
USING (
  auth.get_user_role() = 'recruiter' 
  AND author_id = auth.uid()
)
WITH CHECK (
  auth.get_user_role() = 'recruiter' 
  AND author_id = auth.uid()
);

-- Authors only: Delete own notes
CREATE POLICY "authors_delete_own_candidate_notes"
ON candidate_notes FOR DELETE TO authenticated
USING (
  auth.get_user_role() = 'recruiter' 
  AND author_id = auth.uid()
);

-- BD: Read access
CREATE POLICY "bd_read_access_candidate_notes"
ON candidate_notes FOR SELECT TO authenticated
USING (auth.get_user_role() = 'bd');

-- Demo viewers: Demo content only
CREATE POLICY "demo_viewer_read_candidate_notes"
ON candidate_notes FOR SELECT TO authenticated
USING (
  auth.get_user_role() = 'demo_viewer' 
  AND is_demo_content(content)
);

-- Block unauthenticated
CREATE POLICY "deny_unauthenticated_candidate_notes"
ON candidate_notes FOR ALL TO anon
USING (FALSE);

-- =============================================================================
-- FINAL VERIFICATION
-- =============================================================================

-- Check that all policies were created successfully
SELECT 
    tablename,
    policyname,
    permissive,
    roles
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Success message
SELECT 'RLS Policies successfully configured for TalentPatriot ATS!' AS status;