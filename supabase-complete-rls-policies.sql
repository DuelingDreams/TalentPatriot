-- =============================================================================
-- COMPLETE SUPABASE RLS POLICIES - ALL TABLES WITH CORRECT REFERENCES
-- =============================================================================
-- Execute this entire script in Supabase SQL Editor
-- This includes all 8 tables with proper naming (no "notes" table, it's "candidate_notes")

-- =============================================================================
-- 1. VERIFY ALL TABLES EXIST
-- =============================================================================
-- The following tables should exist in your database:
-- - clients
-- - jobs  
-- - candidates
-- - job_candidate
-- - candidate_notes (NOT "notes")
-- - interviews
-- - messages
-- - message_recipients

-- =============================================================================
-- 2. ENABLE ROW LEVEL SECURITY ON ALL TABLES
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
-- 3. HELPER FUNCTIONS
-- =============================================================================

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS auth.get_user_role();
DROP FUNCTION IF EXISTS auth.has_role(TEXT);
DROP FUNCTION IF EXISTS is_demo_content(TEXT);

-- Function to get user role from JWT metadata
CREATE OR REPLACE FUNCTION auth.get_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role',
    'unauthenticated'
  );
$$;

-- Function to check if user has specific role
CREATE OR REPLACE FUNCTION auth.has_role(required_role TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT auth.get_user_role() = required_role;
$$;

-- Function to check if content is demo data
CREATE OR REPLACE FUNCTION is_demo_content(content TEXT)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT content ILIKE '%demo%';
$$;

-- =============================================================================
-- 4. CLIENTS TABLE POLICIES
-- =============================================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "recruiters_full_access_clients" ON clients;
DROP POLICY IF EXISTS "bd_read_access_clients" ON clients;
DROP POLICY IF EXISTS "demo_viewer_read_clients" ON clients;
DROP POLICY IF EXISTS "deny_unauthenticated_clients" ON clients;

-- Recruiters: Full CRUD access
CREATE POLICY "recruiters_full_access_clients"
ON clients
FOR ALL
TO authenticated
USING (auth.get_user_role() = 'recruiter')
WITH CHECK (auth.get_user_role() = 'recruiter');

-- BD: Read-only access
CREATE POLICY "bd_read_access_clients"
ON clients
FOR SELECT
TO authenticated
USING (auth.get_user_role() = 'bd');

-- Demo viewers: Demo data only
CREATE POLICY "demo_viewer_read_clients"
ON clients
FOR SELECT
TO authenticated
USING (
  auth.get_user_role() = 'demo_viewer' 
  AND status = 'demo'::record_status
);

-- Block unauthenticated
CREATE POLICY "deny_unauthenticated_clients"
ON clients
FOR ALL
TO anon
USING (false);

-- =============================================================================
-- 5. JOBS TABLE POLICIES
-- =============================================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "recruiters_full_access_jobs" ON jobs;
DROP POLICY IF EXISTS "bd_read_access_jobs" ON jobs;
DROP POLICY IF EXISTS "pm_read_assigned_jobs" ON jobs;
DROP POLICY IF EXISTS "demo_viewer_read_jobs" ON jobs;
DROP POLICY IF EXISTS "deny_unauthenticated_jobs" ON jobs;

-- Recruiters: Full CRUD access
CREATE POLICY "recruiters_full_access_jobs"
ON jobs
FOR ALL
TO authenticated
USING (auth.get_user_role() = 'recruiter')
WITH CHECK (auth.get_user_role() = 'recruiter');

-- BD: Read-only access
CREATE POLICY "bd_read_access_jobs"
ON jobs
FOR SELECT
TO authenticated
USING (auth.get_user_role() = 'bd');

-- PM: Assigned jobs only
CREATE POLICY "pm_read_assigned_jobs"
ON jobs
FOR SELECT
TO authenticated
USING (
  auth.get_user_role() = 'pm' 
  AND assigned_to = auth.uid()
);

-- Demo viewers: Demo data only
CREATE POLICY "demo_viewer_read_jobs"
ON jobs
FOR SELECT
TO authenticated
USING (
  auth.get_user_role() = 'demo_viewer' 
  AND record_status = 'demo'::record_status
);

-- Block unauthenticated
CREATE POLICY "deny_unauthenticated_jobs"
ON jobs
FOR ALL
TO anon
USING (false);

-- =============================================================================
-- 6. CANDIDATES TABLE POLICIES
-- =============================================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "recruiters_full_access_candidates" ON candidates;
DROP POLICY IF EXISTS "bd_read_access_candidates" ON candidates;
DROP POLICY IF EXISTS "demo_viewer_read_candidates" ON candidates;
DROP POLICY IF EXISTS "deny_unauthenticated_candidates" ON candidates;

-- Recruiters: Full CRUD access
CREATE POLICY "recruiters_full_access_candidates"
ON candidates
FOR ALL
TO authenticated
USING (auth.get_user_role() = 'recruiter')
WITH CHECK (auth.get_user_role() = 'recruiter');

-- BD: Read-only access
CREATE POLICY "bd_read_access_candidates"
ON candidates
FOR SELECT
TO authenticated
USING (auth.get_user_role() = 'bd');

-- Demo viewers: Demo data only
CREATE POLICY "demo_viewer_read_candidates"
ON candidates
FOR SELECT
TO authenticated
USING (
  auth.get_user_role() = 'demo_viewer' 
  AND status = 'demo'::record_status
);

-- Block unauthenticated
CREATE POLICY "deny_unauthenticated_candidates"
ON candidates
FOR ALL
TO anon
USING (false);

-- =============================================================================
-- 7. JOB_CANDIDATE TABLE POLICIES
-- =============================================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "recruiters_full_access_job_candidates" ON job_candidate;
DROP POLICY IF EXISTS "bd_read_access_job_candidates" ON job_candidate;
DROP POLICY IF EXISTS "pm_read_assigned_job_candidates" ON job_candidate;
DROP POLICY IF EXISTS "demo_viewer_read_job_candidates" ON job_candidate;
DROP POLICY IF EXISTS "deny_unauthenticated_job_candidates" ON job_candidate;

-- Recruiters: Full CRUD access
CREATE POLICY "recruiters_full_access_job_candidates"
ON job_candidate
FOR ALL
TO authenticated
USING (auth.get_user_role() = 'recruiter')
WITH CHECK (auth.get_user_role() = 'recruiter');

-- BD: Read-only access
CREATE POLICY "bd_read_access_job_candidates"
ON job_candidate
FOR SELECT
TO authenticated
USING (auth.get_user_role() = 'bd');

-- PM: Assigned records only
CREATE POLICY "pm_read_assigned_job_candidates"
ON job_candidate
FOR SELECT
TO authenticated
USING (
  auth.get_user_role() = 'pm' 
  AND assigned_to = auth.uid()
);

-- Demo viewers: Demo data only
CREATE POLICY "demo_viewer_read_job_candidates"
ON job_candidate
FOR SELECT
TO authenticated
USING (
  auth.get_user_role() = 'demo_viewer' 
  AND status = 'demo'::record_status
);

-- Block unauthenticated
CREATE POLICY "deny_unauthenticated_job_candidates"
ON job_candidate
FOR ALL
TO anon
USING (false);

-- =============================================================================
-- 8. CANDIDATE_NOTES TABLE POLICIES (NOT "notes" table)
-- =============================================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "recruiters_read_all_candidate_notes" ON candidate_notes;
DROP POLICY IF EXISTS "authors_write_own_candidate_notes" ON candidate_notes;
DROP POLICY IF EXISTS "bd_read_access_candidate_notes" ON candidate_notes;
DROP POLICY IF EXISTS "demo_viewer_read_candidate_notes" ON candidate_notes;
DROP POLICY IF EXISTS "deny_unauthenticated_candidate_notes" ON candidate_notes;

-- Recruiters: Read all notes
CREATE POLICY "recruiters_read_all_candidate_notes"
ON candidate_notes
FOR SELECT
TO authenticated
USING (auth.get_user_role() = 'recruiter');

-- Authors only: Write/update/delete own notes (no UUID casting needed)
CREATE POLICY "authors_write_own_candidate_notes"
ON candidate_notes
FOR INSERT, UPDATE, DELETE
TO authenticated
USING (
  auth.get_user_role() = 'recruiter' 
  AND author_id = auth.uid()
)
WITH CHECK (
  auth.get_user_role() = 'recruiter' 
  AND author_id = auth.uid()
);

-- BD: Read all notes
CREATE POLICY "bd_read_access_candidate_notes"
ON candidate_notes
FOR SELECT
TO authenticated
USING (auth.get_user_role() = 'bd');

-- Demo viewers: Demo content only
CREATE POLICY "demo_viewer_read_candidate_notes"
ON candidate_notes
FOR SELECT
TO authenticated
USING (
  auth.get_user_role() = 'demo_viewer' 
  AND is_demo_content(content)
);

-- Block unauthenticated
CREATE POLICY "deny_unauthenticated_candidate_notes"
ON candidate_notes
FOR ALL
TO anon
USING (false);

-- =============================================================================
-- 9. INTERVIEWS TABLE POLICIES
-- =============================================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "recruiters_full_access_interviews" ON interviews;
DROP POLICY IF EXISTS "bd_read_access_interviews" ON interviews;
DROP POLICY IF EXISTS "interviewer_access_own_interviews" ON interviews;
DROP POLICY IF EXISTS "demo_viewer_read_interviews" ON interviews;
DROP POLICY IF EXISTS "deny_unauthenticated_interviews" ON interviews;

-- Recruiters: Full CRUD access
CREATE POLICY "recruiters_full_access_interviews"
ON interviews
FOR ALL
TO authenticated
USING (auth.get_user_role() = 'recruiter')
WITH CHECK (auth.get_user_role() = 'recruiter');

-- BD: Read-only access
CREATE POLICY "bd_read_access_interviews"
ON interviews
FOR SELECT
TO authenticated
USING (auth.get_user_role() = 'bd');

-- Interviewers: Own interviews (recruiters and PMs)
CREATE POLICY "interviewer_access_own_interviews"
ON interviews
FOR ALL
TO authenticated
USING (
  auth.get_user_role() IN ('recruiter', 'pm') 
  AND interviewer_id = auth.uid()
)
WITH CHECK (
  auth.get_user_role() IN ('recruiter', 'pm') 
  AND interviewer_id = auth.uid()
);

-- Demo viewers: Demo data only
CREATE POLICY "demo_viewer_read_interviews"
ON interviews
FOR SELECT
TO authenticated
USING (
  auth.get_user_role() = 'demo_viewer' 
  AND record_status = 'demo'::record_status
);

-- Block unauthenticated
CREATE POLICY "deny_unauthenticated_interviews"
ON interviews
FOR ALL
TO anon
USING (false);

-- =============================================================================
-- 10. MESSAGES TABLE POLICIES
-- =============================================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "recruiters_full_access_messages" ON messages;
DROP POLICY IF EXISTS "users_access_own_messages" ON messages;
DROP POLICY IF EXISTS "deny_unauthenticated_messages" ON messages;

-- Recruiters: Full CRUD access
CREATE POLICY "recruiters_full_access_messages"
ON messages
FOR ALL
TO authenticated
USING (auth.get_user_role() = 'recruiter')
WITH CHECK (auth.get_user_role() = 'recruiter');

-- Other users: Own messages
CREATE POLICY "users_access_own_messages"
ON messages
FOR ALL
TO authenticated
USING (
  auth.get_user_role() IN ('bd', 'pm', 'demo_viewer')
  AND (
    sender_id = auth.uid() 
    OR recipient_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM message_recipients 
      WHERE message_id = messages.id 
      AND recipient_id = auth.uid()
    )
  )
)
WITH CHECK (
  auth.get_user_role() IN ('bd', 'pm', 'demo_viewer')
  AND sender_id = auth.uid()
);

-- Block unauthenticated
CREATE POLICY "deny_unauthenticated_messages"
ON messages
FOR ALL
TO anon
USING (false);

-- =============================================================================
-- 11. MESSAGE_RECIPIENTS TABLE POLICIES
-- =============================================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "recruiters_full_access_message_recipients" ON message_recipients;
DROP POLICY IF EXISTS "users_access_own_message_recipients" ON message_recipients;
DROP POLICY IF EXISTS "deny_unauthenticated_message_recipients" ON message_recipients;

-- Recruiters: Full CRUD access
CREATE POLICY "recruiters_full_access_message_recipients"
ON message_recipients
FOR ALL
TO authenticated
USING (auth.get_user_role() = 'recruiter')
WITH CHECK (auth.get_user_role() = 'recruiter');

-- Other users: Own recipient records
CREATE POLICY "users_access_own_message_recipients"
ON message_recipients
FOR ALL
TO authenticated
USING (
  auth.get_user_role() IN ('bd', 'pm', 'demo_viewer')
  AND recipient_id = auth.uid()
)
WITH CHECK (
  auth.get_user_role() IN ('bd', 'pm', 'demo_viewer')
  AND recipient_id = auth.uid()
);

-- Block unauthenticated
CREATE POLICY "deny_unauthenticated_message_recipients"
ON message_recipients
FOR ALL
TO anon
USING (false);

-- =============================================================================
-- 12. VERIFICATION QUERIES
-- =============================================================================

-- Check all tables have RLS enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'clients', 'jobs', 'candidates', 'job_candidate', 
  'candidate_notes', 'interviews', 'messages', 'message_recipients'
)
ORDER BY tablename;

-- Check all policies are created
SELECT tablename, policyname, roles, cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;

-- =============================================================================
-- IMPORTANT NOTES
-- =============================================================================
-- 
-- 1. There is NO "notes" table - it's called "candidate_notes"
-- 2. All UUID comparisons use auth.uid() directly (no casting)
-- 3. Demo data filtering uses explicit ::record_status casting
-- 4. All 8 tables now have RLS policies applied
-- 5. Role hierarchy is maintained:
--    - RECRUITER: Full access
--    - BD: Read access to most data
--    - PM: Limited to assigned items
--    - DEMO_VIEWER: Demo data only
--    - UNAUTHENTICATED: No access
--
-- If you get "relation 'notes' does not exist" error, check your code
-- for references to 'notes' table and change them to 'candidate_notes'
--
-- =============================================================================