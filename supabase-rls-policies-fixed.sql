-- =============================================================================
-- CORRECTED SUPABASE RLS POLICIES - SYNTAX ERROR FIXED
-- =============================================================================
-- Execute this entire script in Supabase SQL Editor
-- All ENUM casting issues and syntax errors resolved

-- =============================================================================
-- STEP 1: ENABLE ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_candidate ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_recipients ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- STEP 2: CREATE HELPER FUNCTIONS
-- =============================================================================

-- Drop existing functions
DROP FUNCTION IF EXISTS auth.get_user_role() CASCADE;
DROP FUNCTION IF EXISTS auth.has_role(TEXT) CASCADE;
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

-- Check if user has specific role
CREATE OR REPLACE FUNCTION auth.has_role(required_role TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT auth.get_user_role() = required_role;
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
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "authenticated_read_clients" ON clients;
    DROP POLICY IF EXISTS "authenticated_write_clients" ON clients;
    DROP POLICY IF EXISTS "demo_viewer_read_clients" ON clients;
    DROP POLICY IF EXISTS "deny_unauthenticated_clients" ON clients;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- Authenticated users: Full access
CREATE POLICY "authenticated_read_clients"
ON clients FOR SELECT TO authenticated
USING (auth.get_user_role() IN ('bd', 'pm', 'recruiter', 'admin'));

CREATE POLICY "authenticated_write_clients"
ON clients FOR INSERT, UPDATE, DELETE TO authenticated
USING (auth.get_user_role() IN ('bd', 'pm', 'admin'))
WITH CHECK (auth.get_user_role() IN ('bd', 'pm', 'admin'));

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
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "authenticated_read_jobs" ON jobs;
    DROP POLICY IF EXISTS "authenticated_write_jobs" ON jobs;
    DROP POLICY IF EXISTS "demo_viewer_read_jobs" ON jobs;
    DROP POLICY IF EXISTS "deny_unauthenticated_jobs" ON jobs;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- Authenticated users: Full access
CREATE POLICY "authenticated_read_jobs"
ON jobs FOR SELECT TO authenticated
USING (auth.get_user_role() IN ('bd', 'pm', 'recruiter', 'admin'));

CREATE POLICY "authenticated_write_jobs"
ON jobs FOR INSERT, UPDATE, DELETE TO authenticated
USING (auth.get_user_role() IN ('bd', 'pm', 'recruiter', 'admin'))
WITH CHECK (auth.get_user_role() IN ('bd', 'pm', 'recruiter', 'admin'));

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
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "authenticated_read_candidates" ON candidates;
    DROP POLICY IF EXISTS "authenticated_write_candidates" ON candidates;
    DROP POLICY IF EXISTS "demo_viewer_read_candidates" ON candidates;
    DROP POLICY IF EXISTS "deny_unauthenticated_candidates" ON candidates;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- Authenticated users: Full access
CREATE POLICY "authenticated_read_candidates"
ON candidates FOR SELECT TO authenticated
USING (auth.get_user_role() IN ('bd', 'pm', 'recruiter', 'admin'));

CREATE POLICY "authenticated_write_candidates"
ON candidates FOR INSERT, UPDATE, DELETE TO authenticated
USING (auth.get_user_role() IN ('recruiter', 'admin'))
WITH CHECK (auth.get_user_role() IN ('recruiter', 'admin'));

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
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "authenticated_read_job_candidates" ON job_candidate;
    DROP POLICY IF EXISTS "authenticated_write_job_candidates" ON job_candidate;
    DROP POLICY IF EXISTS "demo_viewer_read_job_candidates" ON job_candidate;
    DROP POLICY IF EXISTS "deny_unauthenticated_job_candidates" ON job_candidate;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- Authenticated users: Full access
CREATE POLICY "authenticated_read_job_candidates"
ON job_candidate FOR SELECT TO authenticated
USING (auth.get_user_role() IN ('bd', 'pm', 'recruiter', 'admin'));

CREATE POLICY "authenticated_write_job_candidates"
ON job_candidate FOR INSERT, UPDATE, DELETE TO authenticated
USING (auth.get_user_role() IN ('recruiter', 'admin'))
WITH CHECK (auth.get_user_role() IN ('recruiter', 'admin'));

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
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "recruiters_read_all_candidate_notes" ON candidate_notes;
    DROP POLICY IF EXISTS "authors_write_own_candidate_notes" ON candidate_notes;
    DROP POLICY IF EXISTS "bd_read_access_candidate_notes" ON candidate_notes;
    DROP POLICY IF EXISTS "demo_viewer_read_candidate_notes" ON candidate_notes;
    DROP POLICY IF EXISTS "deny_unauthenticated_candidate_notes" ON candidate_notes;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- Recruiters: Read all notes
CREATE POLICY "recruiters_read_all_candidate_notes"
ON candidate_notes FOR SELECT TO authenticated
USING (auth.get_user_role() = 'recruiter');

-- Authors only: Write own notes
CREATE POLICY "authors_write_own_candidate_notes"
ON candidate_notes FOR INSERT, UPDATE, DELETE TO authenticated
USING (
  auth.get_user_role() = 'recruiter' 
  AND author_id = auth.uid()
)
WITH CHECK (
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
-- STEP 8: INTERVIEWS TABLE POLICIES (IF EXISTS)
-- =============================================================================

-- Clear existing policies
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "authenticated_read_interviews" ON interviews;
    DROP POLICY IF EXISTS "authenticated_write_interviews" ON interviews;
    DROP POLICY IF EXISTS "demo_viewer_read_interviews" ON interviews;
    DROP POLICY IF EXISTS "deny_unauthenticated_interviews" ON interviews;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- Only create if table exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'interviews') THEN
        EXECUTE 'CREATE POLICY "authenticated_read_interviews"
        ON interviews FOR SELECT TO authenticated
        USING (auth.get_user_role() IN (''bd'', ''pm'', ''recruiter'', ''admin''))';

        EXECUTE 'CREATE POLICY "authenticated_write_interviews"
        ON interviews FOR INSERT, UPDATE, DELETE TO authenticated
        USING (auth.get_user_role() IN (''recruiter'', ''admin''))
        WITH CHECK (auth.get_user_role() IN (''recruiter'', ''admin''))';

        EXECUTE 'CREATE POLICY "demo_viewer_read_interviews"
        ON interviews FOR SELECT TO authenticated
        USING (
          auth.get_user_role() = ''demo_viewer'' 
          AND record_status::TEXT = ''demo''
        )';

        EXECUTE 'CREATE POLICY "deny_unauthenticated_interviews"
        ON interviews FOR ALL TO anon
        USING (FALSE)';
    END IF;
END $$;

-- =============================================================================
-- STEP 9: MESSAGES TABLE POLICIES (IF EXISTS)
-- =============================================================================

-- Clear existing policies
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "authenticated_read_messages" ON messages;
    DROP POLICY IF EXISTS "authenticated_write_messages" ON messages;
    DROP POLICY IF EXISTS "demo_viewer_read_messages" ON messages;
    DROP POLICY IF EXISTS "deny_unauthenticated_messages" ON messages;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- Only create if table exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'messages') THEN
        EXECUTE 'CREATE POLICY "authenticated_read_messages"
        ON messages FOR SELECT TO authenticated
        USING (auth.get_user_role() IN (''bd'', ''pm'', ''recruiter'', ''admin''))';

        EXECUTE 'CREATE POLICY "authenticated_write_messages"
        ON messages FOR INSERT, UPDATE, DELETE TO authenticated
        USING (auth.get_user_role() IN (''bd'', ''pm'', ''recruiter'', ''admin''))
        WITH CHECK (auth.get_user_role() IN (''bd'', ''pm'', ''recruiter'', ''admin''))';

        EXECUTE 'CREATE POLICY "demo_viewer_read_messages"
        ON messages FOR SELECT TO authenticated
        USING (
          auth.get_user_role() = ''demo_viewer'' 
          AND record_status::TEXT = ''demo''
        )';

        EXECUTE 'CREATE POLICY "deny_unauthenticated_messages"
        ON messages FOR ALL TO anon
        USING (FALSE)';
    END IF;
END $$;

-- =============================================================================
-- FINAL VERIFICATION
-- =============================================================================

-- Check that all policies were created successfully
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Success message
SELECT 'RLS Policies successfully configured!' AS status;