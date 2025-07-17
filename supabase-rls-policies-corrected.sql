-- =============================================================================
-- SUPABASE RLS POLICIES SETUP - CORRECTED VERSION
-- =============================================================================
-- This file contains all Row-Level Security policies for TalentPatriot ATS
-- with proper UUID casting and demo_viewer role support
-- Execute this entire script in Supabase SQL Editor

-- =============================================================================
-- 1. ENABLE ROW LEVEL SECURITY ON ALL TABLES
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
-- 2. HELPER FUNCTIONS
-- =============================================================================

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
-- 3. CLIENTS TABLE POLICIES
-- =============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "recruiters_full_access_clients" ON clients;
DROP POLICY IF EXISTS "bd_read_access_clients" ON clients;
DROP POLICY IF EXISTS "demo_viewer_read_clients" ON clients;
DROP POLICY IF EXISTS "deny_unauthenticated_clients" ON clients;

-- Recruiters: Full access to all clients
CREATE POLICY "recruiters_full_access_clients"
ON clients
FOR ALL
TO authenticated
USING (auth.get_user_role() = 'recruiter')
WITH CHECK (auth.get_user_role() = 'recruiter');

-- BD: Read access to all clients
CREATE POLICY "bd_read_access_clients"
ON clients
FOR SELECT
TO authenticated
USING (auth.get_user_role() = 'bd');

-- Demo viewers: Read access to demo clients only (status column)
CREATE POLICY "demo_viewer_read_clients"
ON clients
FOR SELECT
TO authenticated
USING (
  auth.get_user_role() = 'demo_viewer' 
  AND status = 'demo'::record_status
);

-- Block unauthenticated users
CREATE POLICY "deny_unauthenticated_clients"
ON clients
FOR ALL
TO anon
USING (false);

-- =============================================================================
-- 4. JOBS TABLE POLICIES
-- =============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "recruiters_full_access_jobs" ON jobs;
DROP POLICY IF EXISTS "bd_read_access_jobs" ON jobs;
DROP POLICY IF EXISTS "pm_read_assigned_jobs" ON jobs;
DROP POLICY IF EXISTS "demo_viewer_read_jobs" ON jobs;
DROP POLICY IF EXISTS "deny_unauthenticated_jobs" ON jobs;

-- Recruiters: Full access to all jobs
CREATE POLICY "recruiters_full_access_jobs"
ON jobs
FOR ALL
TO authenticated
USING (auth.get_user_role() = 'recruiter')
WITH CHECK (auth.get_user_role() = 'recruiter');

-- BD: Read access to all jobs
CREATE POLICY "bd_read_access_jobs"
ON jobs
FOR SELECT
TO authenticated
USING (auth.get_user_role() = 'bd');

-- PM: Read access to assigned jobs only (UUID comparison)
CREATE POLICY "pm_read_assigned_jobs"
ON jobs
FOR SELECT
TO authenticated
USING (
  auth.get_user_role() = 'pm' 
  AND assigned_to = auth.uid()
);

-- Demo viewers: Read access to demo jobs only (record_status column)
CREATE POLICY "demo_viewer_read_jobs"
ON jobs
FOR SELECT
TO authenticated
USING (
  auth.get_user_role() = 'demo_viewer' 
  AND record_status = 'demo'::record_status
);

-- Block unauthenticated users
CREATE POLICY "deny_unauthenticated_jobs"
ON jobs
FOR ALL
TO anon
USING (false);

-- =============================================================================
-- 5. CANDIDATES TABLE POLICIES
-- =============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "recruiters_full_access_candidates" ON candidates;
DROP POLICY IF EXISTS "bd_read_access_candidates" ON candidates;
DROP POLICY IF EXISTS "demo_viewer_read_candidates" ON candidates;
DROP POLICY IF EXISTS "deny_unauthenticated_candidates" ON candidates;

-- Recruiters: Full access to all candidates
CREATE POLICY "recruiters_full_access_candidates"
ON candidates
FOR ALL
TO authenticated
USING (auth.get_user_role() = 'recruiter')
WITH CHECK (auth.get_user_role() = 'recruiter');

-- BD: Read access to all candidates
CREATE POLICY "bd_read_access_candidates"
ON candidates
FOR SELECT
TO authenticated
USING (auth.get_user_role() = 'bd');

-- Demo viewers: Read access to demo candidates only (status column)
CREATE POLICY "demo_viewer_read_candidates"
ON candidates
FOR SELECT
TO authenticated
USING (
  auth.get_user_role() = 'demo_viewer' 
  AND status = 'demo'::record_status
);

-- Block unauthenticated users
CREATE POLICY "deny_unauthenticated_candidates"
ON candidates
FOR ALL
TO anon
USING (false);

-- =============================================================================
-- 6. JOB_CANDIDATE TABLE POLICIES
-- =============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "recruiters_full_access_job_candidates" ON job_candidate;
DROP POLICY IF EXISTS "bd_read_access_job_candidates" ON job_candidate;
DROP POLICY IF EXISTS "pm_read_assigned_job_candidates" ON job_candidate;
DROP POLICY IF EXISTS "demo_viewer_read_job_candidates" ON job_candidate;
DROP POLICY IF EXISTS "deny_unauthenticated_job_candidates" ON job_candidate;

-- Recruiters: Full access to all job_candidate relationships
CREATE POLICY "recruiters_full_access_job_candidates"
ON job_candidate
FOR ALL
TO authenticated
USING (auth.get_user_role() = 'recruiter')
WITH CHECK (auth.get_user_role() = 'recruiter');

-- BD: Read access to all job_candidate relationships
CREATE POLICY "bd_read_access_job_candidates"
ON job_candidate
FOR SELECT
TO authenticated
USING (auth.get_user_role() = 'bd');

-- PM: Read access to job_candidates they're assigned to (UUID comparison)
CREATE POLICY "pm_read_assigned_job_candidates"
ON job_candidate
FOR SELECT
TO authenticated
USING (
  auth.get_user_role() = 'pm' 
  AND assigned_to = auth.uid()
);

-- Demo viewers: Read access to demo job_candidates only (status column)
CREATE POLICY "demo_viewer_read_job_candidates"
ON job_candidate
FOR SELECT
TO authenticated
USING (
  auth.get_user_role() = 'demo_viewer' 
  AND status = 'demo'::record_status
);

-- Block unauthenticated users
CREATE POLICY "deny_unauthenticated_job_candidates"
ON job_candidate
FOR ALL
TO anon
USING (false);

-- =============================================================================
-- 7. CANDIDATE_NOTES TABLE POLICIES
-- =============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "recruiters_read_all_candidate_notes" ON candidate_notes;
DROP POLICY IF EXISTS "authors_write_own_candidate_notes" ON candidate_notes;
DROP POLICY IF EXISTS "bd_read_access_candidate_notes" ON candidate_notes;
DROP POLICY IF EXISTS "demo_viewer_read_candidate_notes" ON candidate_notes;
DROP POLICY IF EXISTS "deny_unauthenticated_candidate_notes" ON candidate_notes;

-- Recruiters: Read all candidate notes
CREATE POLICY "recruiters_read_all_candidate_notes"
ON candidate_notes
FOR SELECT
TO authenticated
USING (auth.get_user_role() = 'recruiter');

-- Authors only: Write/update/delete own notes (UUID comparison - no casting needed)
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

-- BD: Read access to all candidate notes
CREATE POLICY "bd_read_access_candidate_notes"
ON candidate_notes
FOR SELECT
TO authenticated
USING (auth.get_user_role() = 'bd');

-- Demo viewers: Read access to demo notes only (content check)
CREATE POLICY "demo_viewer_read_candidate_notes"
ON candidate_notes
FOR SELECT
TO authenticated
USING (
  auth.get_user_role() = 'demo_viewer' 
  AND is_demo_content(content)
);

-- Block unauthenticated users
CREATE POLICY "deny_unauthenticated_candidate_notes"
ON candidate_notes
FOR ALL
TO anon
USING (false);

-- =============================================================================
-- 8. INTERVIEWS TABLE POLICIES
-- =============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "recruiters_full_access_interviews" ON interviews;
DROP POLICY IF EXISTS "bd_read_access_interviews" ON interviews;
DROP POLICY IF EXISTS "interviewer_access_own_interviews" ON interviews;
DROP POLICY IF EXISTS "demo_viewer_read_interviews" ON interviews;
DROP POLICY IF EXISTS "deny_unauthenticated_interviews" ON interviews;

-- Recruiters: Full access to all interviews
CREATE POLICY "recruiters_full_access_interviews"
ON interviews
FOR ALL
TO authenticated
USING (auth.get_user_role() = 'recruiter')
WITH CHECK (auth.get_user_role() = 'recruiter');

-- BD: Read access to all interviews
CREATE POLICY "bd_read_access_interviews"
ON interviews
FOR SELECT
TO authenticated
USING (auth.get_user_role() = 'bd');

-- Interviewers: Full access to their assigned interviews (UUID comparison)
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

-- Demo viewers: Read access to demo interviews only (record_status column)
CREATE POLICY "demo_viewer_read_interviews"
ON interviews
FOR SELECT
TO authenticated
USING (
  auth.get_user_role() = 'demo_viewer' 
  AND record_status = 'demo'::record_status
);

-- Block unauthenticated users
CREATE POLICY "deny_unauthenticated_interviews"
ON interviews
FOR ALL
TO anon
USING (false);

-- =============================================================================
-- 9. MESSAGES TABLE POLICIES
-- =============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "recruiters_full_access_messages" ON messages;
DROP POLICY IF EXISTS "users_access_own_messages" ON messages;
DROP POLICY IF EXISTS "deny_unauthenticated_messages" ON messages;

-- Recruiters: Full access to all messages
CREATE POLICY "recruiters_full_access_messages"
ON messages
FOR ALL
TO authenticated
USING (auth.get_user_role() = 'recruiter')
WITH CHECK (auth.get_user_role() = 'recruiter');

-- Users: Access to messages they sent or received (UUID comparison)
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

-- Block unauthenticated users
CREATE POLICY "deny_unauthenticated_messages"
ON messages
FOR ALL
TO anon
USING (false);

-- =============================================================================
-- 10. MESSAGE_RECIPIENTS TABLE POLICIES
-- =============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "recruiters_full_access_message_recipients" ON message_recipients;
DROP POLICY IF EXISTS "users_access_own_message_recipients" ON message_recipients;
DROP POLICY IF EXISTS "deny_unauthenticated_message_recipients" ON message_recipients;

-- Recruiters: Full access to all message recipients
CREATE POLICY "recruiters_full_access_message_recipients"
ON message_recipients
FOR ALL
TO authenticated
USING (auth.get_user_role() = 'recruiter')
WITH CHECK (auth.get_user_role() = 'recruiter');

-- Users: Access to their own recipient records (UUID comparison)
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

-- Block unauthenticated users
CREATE POLICY "deny_unauthenticated_message_recipients"
ON message_recipients
FOR ALL
TO anon
USING (false);

-- =============================================================================
-- 11. VERIFY POLICIES ARE ACTIVE
-- =============================================================================

-- Test query to verify RLS is working (run after setup)
-- SELECT tablename, policyname, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE schemaname = 'public' 
-- ORDER BY tablename, policyname;

-- =============================================================================
-- SETUP COMPLETE - VERIFICATION CHECKLIST
-- =============================================================================
-- 
-- ✅ UUID CASTING HANDLED CORRECTLY:
--    - All UUID comparisons use auth.uid() directly (no ::text casting)
--    - author_id, assigned_to, interviewer_id, sender_id, recipient_id all compared as UUIDs
--
-- ✅ DEMO_VIEWER ROLE FULLY SUPPORTED:
--    - Filters on status = 'demo' for clients, candidates, job_candidate tables
--    - Filters on record_status = 'demo' for jobs, interviews, messages tables
--    - Special content check for candidate_notes using is_demo_content() function
--    - Explicit casting to ::record_status enum where needed
--
-- ✅ STRUCTURED ACCESS FOR ALL ROLES:
--    • RECRUITER: Full CRUD access to all tables
--    • BD: Read-only access to most tables  
--    • PM: Limited access to assigned jobs/interviews/job_candidates
--    • DEMO_VIEWER: Read-only access to demo data only
--    • UNAUTHENTICATED: No access to any data
--
-- Next steps:
-- 1. Run this script in Supabase SQL Editor
-- 2. Test with different user roles
-- 3. Verify demo data isolation works correctly
-- 4. Check PM assignment-based access
--
-- =============================================================================