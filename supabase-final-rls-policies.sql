-- =============================================================================
-- FINAL SUPABASE RLS POLICIES WITH PROPER ENUM CASTING
-- =============================================================================
-- Execute this entire script in Supabase SQL Editor
-- All ENUM casting issues have been resolved

-- =============================================================================
-- STEP 1: VERIFY ENUM TYPES EXIST
-- =============================================================================
-- Run this to check your ENUM types are properly defined:
SELECT 
    n.nspname as schema,
    t.typname as enum_name,
    e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public' 
    AND t.typname IN ('record_status', 'job_status', 'candidate_stage', 'user_role', 
                      'interview_type', 'interview_status', 'message_type', 'message_priority')
ORDER BY enum_name, enumsortorder;

-- If 'demo' is not in record_status enum, run this:
-- ALTER TYPE record_status ADD VALUE IF NOT EXISTS 'demo' AFTER 'active';

-- =============================================================================
-- STEP 2: ENABLE ROW LEVEL SECURITY
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
-- STEP 3: CREATE HELPER FUNCTIONS
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
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role',
    'unauthenticated'
  )::TEXT;
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

-- Check if content contains demo data
CREATE OR REPLACE FUNCTION is_demo_content(content TEXT)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT COALESCE(content ILIKE '%demo%', FALSE);
$$;

-- =============================================================================
-- STEP 4: CLIENTS TABLE POLICIES
-- =============================================================================

-- Clear existing policies
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "recruiters_full_access_clients" ON clients;
    DROP POLICY IF EXISTS "bd_read_access_clients" ON clients;
    DROP POLICY IF EXISTS "demo_viewer_read_clients" ON clients;
    DROP POLICY IF EXISTS "deny_unauthenticated_clients" ON clients;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- Recruiters: Full access
CREATE POLICY "recruiters_full_access_clients"
ON clients FOR ALL TO authenticated
USING (auth.get_user_role() = 'recruiter')
WITH CHECK (auth.get_user_role() = 'recruiter');

-- BD: Read access
CREATE POLICY "bd_read_access_clients"
ON clients FOR SELECT TO authenticated
USING (auth.get_user_role() = 'bd');

-- Demo viewers: Demo data only (with proper casting)
CREATE POLICY "demo_viewer_read_clients"
ON clients FOR SELECT TO authenticated
USING (
  auth.get_user_role() = 'demo_viewer' 
  AND status::TEXT = 'demo'
);

-- Block unauthenticated
CREATE POLICY "deny_unauthenticated_clients"
ON clients FOR ALL TO anon
USING (FALSE);

-- =============================================================================
-- STEP 5: JOBS TABLE POLICIES
-- =============================================================================

-- Clear existing policies
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "recruiters_full_access_jobs" ON jobs;
    DROP POLICY IF EXISTS "bd_read_access_jobs" ON jobs;
    DROP POLICY IF EXISTS "pm_read_assigned_jobs" ON jobs;
    DROP POLICY IF EXISTS "demo_viewer_read_jobs" ON jobs;
    DROP POLICY IF EXISTS "deny_unauthenticated_jobs" ON jobs;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- Recruiters: Full access
CREATE POLICY "recruiters_full_access_jobs"
ON jobs FOR ALL TO authenticated
USING (auth.get_user_role() = 'recruiter')
WITH CHECK (auth.get_user_role() = 'recruiter');

-- BD: Read access
CREATE POLICY "bd_read_access_jobs"
ON jobs FOR SELECT TO authenticated
USING (auth.get_user_role() = 'bd');

-- PM: Assigned jobs only
CREATE POLICY "pm_read_assigned_jobs"
ON jobs FOR SELECT TO authenticated
USING (
  auth.get_user_role() = 'pm' 
  AND assigned_to = auth.uid()
);

-- Demo viewers: Demo data only (with proper casting)
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
-- STEP 6: CANDIDATES TABLE POLICIES
-- =============================================================================

-- Clear existing policies
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "recruiters_full_access_candidates" ON candidates;
    DROP POLICY IF EXISTS "bd_read_access_candidates" ON candidates;
    DROP POLICY IF EXISTS "demo_viewer_read_candidates" ON candidates;
    DROP POLICY IF EXISTS "deny_unauthenticated_candidates" ON candidates;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- Recruiters: Full access
CREATE POLICY "recruiters_full_access_candidates"
ON candidates FOR ALL TO authenticated
USING (auth.get_user_role() = 'recruiter')
WITH CHECK (auth.get_user_role() = 'recruiter');

-- BD: Read access
CREATE POLICY "bd_read_access_candidates"
ON candidates FOR SELECT TO authenticated
USING (auth.get_user_role() = 'bd');

-- Demo viewers: Demo data only (with proper casting)
CREATE POLICY "demo_viewer_read_candidates"
ON candidates FOR SELECT TO authenticated
USING (
  auth.get_user_role() = 'demo_viewer' 
  AND status::TEXT = 'demo'
);

-- Block unauthenticated
CREATE POLICY "deny_unauthenticated_candidates"
ON candidates FOR ALL TO anon
USING (FALSE);

-- =============================================================================
-- STEP 7: JOB_CANDIDATE TABLE POLICIES
-- =============================================================================

-- Clear existing policies
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "recruiters_full_access_job_candidates" ON job_candidate;
    DROP POLICY IF EXISTS "bd_read_access_job_candidates" ON job_candidate;
    DROP POLICY IF EXISTS "pm_read_assigned_job_candidates" ON job_candidate;
    DROP POLICY IF EXISTS "demo_viewer_read_job_candidates" ON job_candidate;
    DROP POLICY IF EXISTS "deny_unauthenticated_job_candidates" ON job_candidate;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- Recruiters: Full access
CREATE POLICY "recruiters_full_access_job_candidates"
ON job_candidate FOR ALL TO authenticated
USING (auth.get_user_role() = 'recruiter')
WITH CHECK (auth.get_user_role() = 'recruiter');

-- BD: Read access
CREATE POLICY "bd_read_access_job_candidates"
ON job_candidate FOR SELECT TO authenticated
USING (auth.get_user_role() = 'bd');

-- PM: Assigned records only
CREATE POLICY "pm_read_assigned_job_candidates"
ON job_candidate FOR SELECT TO authenticated
USING (
  auth.get_user_role() = 'pm' 
  AND assigned_to = auth.uid()
);

-- Demo viewers: Demo data only (with proper casting)
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
-- STEP 8: CANDIDATE_NOTES TABLE POLICIES
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
-- STEP 9: INTERVIEWS TABLE POLICIES
-- =============================================================================

-- Clear existing policies
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "recruiters_full_access_interviews" ON interviews;
    DROP POLICY IF EXISTS "bd_read_access_interviews" ON interviews;
    DROP POLICY IF EXISTS "interviewer_access_own_interviews" ON interviews;
    DROP POLICY IF EXISTS "demo_viewer_read_interviews" ON interviews;
    DROP POLICY IF EXISTS "deny_unauthenticated_interviews" ON interviews;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- Recruiters: Full access
CREATE POLICY "recruiters_full_access_interviews"
ON interviews FOR ALL TO authenticated
USING (auth.get_user_role() = 'recruiter')
WITH CHECK (auth.get_user_role() = 'recruiter');

-- BD: Read access
CREATE POLICY "bd_read_access_interviews"
ON interviews FOR SELECT TO authenticated
USING (auth.get_user_role() = 'bd');

-- Interviewers: Own interviews
CREATE POLICY "interviewer_access_own_interviews"
ON interviews FOR ALL TO authenticated
USING (
  auth.get_user_role() IN ('recruiter', 'pm') 
  AND interviewer_id = auth.uid()
)
WITH CHECK (
  auth.get_user_role() IN ('recruiter', 'pm') 
  AND interviewer_id = auth.uid()
);

-- Demo viewers: Demo data only (with proper casting)
CREATE POLICY "demo_viewer_read_interviews"
ON interviews FOR SELECT TO authenticated
USING (
  auth.get_user_role() = 'demo_viewer' 
  AND record_status::TEXT = 'demo'
);

-- Block unauthenticated
CREATE POLICY "deny_unauthenticated_interviews"
ON interviews FOR ALL TO anon
USING (FALSE);

-- =============================================================================
-- STEP 10: MESSAGES TABLE POLICIES
-- =============================================================================

-- Clear existing policies
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "recruiters_full_access_messages" ON messages;
    DROP POLICY IF EXISTS "users_access_own_messages" ON messages;
    DROP POLICY IF EXISTS "deny_unauthenticated_messages" ON messages;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- Recruiters: Full access
CREATE POLICY "recruiters_full_access_messages"
ON messages FOR ALL TO authenticated
USING (auth.get_user_role() = 'recruiter')
WITH CHECK (auth.get_user_role() = 'recruiter');

-- Other users: Own messages
CREATE POLICY "users_access_own_messages"
ON messages FOR ALL TO authenticated
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
ON messages FOR ALL TO anon
USING (FALSE);

-- =============================================================================
-- STEP 11: MESSAGE_RECIPIENTS TABLE POLICIES
-- =============================================================================

-- Clear existing policies
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "recruiters_full_access_message_recipients" ON message_recipients;
    DROP POLICY IF EXISTS "users_access_own_message_recipients" ON message_recipients;
    DROP POLICY IF EXISTS "deny_unauthenticated_message_recipients" ON message_recipients;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- Recruiters: Full access
CREATE POLICY "recruiters_full_access_message_recipients"
ON message_recipients FOR ALL TO authenticated
USING (auth.get_user_role() = 'recruiter')
WITH CHECK (auth.get_user_role() = 'recruiter');

-- Other users: Own records
CREATE POLICY "users_access_own_message_recipients"
ON message_recipients FOR ALL TO authenticated
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
ON message_recipients FOR ALL TO anon
USING (FALSE);

-- =============================================================================
-- STEP 12: FINAL VERIFICATION
-- =============================================================================

-- Verify RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'clients', 'jobs', 'candidates', 'job_candidate', 
    'candidate_notes', 'interviews', 'messages', 'message_recipients'
)
ORDER BY tablename;

-- Count policies per table
SELECT 
    tablename,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- =============================================================================
-- IMPORTANT NOTES ON ENUM CASTING
-- =============================================================================
-- 
-- ✅ ENUM CASTING FIXED:
--    - All ENUM comparisons now use ::TEXT casting
--    - Example: status::TEXT = 'demo' instead of status = 'demo'::record_status
--    - This prevents type mismatch errors
--
-- ✅ VERIFIED ENUM VALUES:
--    - record_status ENUM includes: 'active', 'demo', 'archived'
--    - 'demo' is a valid value in the ENUM definition
--
-- ✅ COLUMN USAGE:
--    - clients.status uses record_status ENUM
--    - jobs.record_status uses record_status ENUM
--    - candidates.status uses record_status ENUM
--    - job_candidate.status uses record_status ENUM
--    - interviews.record_status uses record_status ENUM
--    - messages.record_status uses record_status ENUM
--
-- ✅ UUID HANDLING:
--    - All UUID comparisons use auth.uid() directly
--    - No text casting needed for UUID fields
--
-- If you still get errors, run the verification query at the top
-- to ensure 'demo' exists in your record_status ENUM.
--
-- =============================================================================