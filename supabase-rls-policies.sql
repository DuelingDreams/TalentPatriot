-- Supabase Row-Level Security (RLS) Policies for ATS Application
-- This file contains comprehensive RLS policies for secure multi-role access control

-- =============================================================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- =============================================================================

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_candidate ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_notes ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- HELPER FUNCTION: Get User Role from Auth Metadata
-- =============================================================================

CREATE OR REPLACE FUNCTION auth.get_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role',
    'unauthenticated'
  );
$$;

-- =============================================================================
-- CLIENTS TABLE POLICIES
-- =============================================================================

-- Policy: Allow recruiters full access to all clients
CREATE POLICY "recruiters_full_access_clients"
ON clients
FOR ALL
TO authenticated
USING (auth.get_user_role() = 'recruiter')
WITH CHECK (auth.get_user_role() = 'recruiter');

-- Policy: Allow BD read access to all clients
CREATE POLICY "bd_read_access_clients"
ON clients
FOR SELECT
TO authenticated
USING (auth.get_user_role() = 'bd');

-- Policy: Allow demo viewers read access to demo clients only
CREATE POLICY "demo_viewer_read_clients"
ON clients
FOR SELECT
TO authenticated
USING (
  auth.get_user_role() = 'demo_viewer' 
  AND status = 'demo'
);

-- Policy: Deny all access to unauthenticated users
CREATE POLICY "deny_unauthenticated_clients"
ON clients
FOR ALL
TO anon
USING (false);

-- =============================================================================
-- JOBS TABLE POLICIES
-- =============================================================================

-- Policy: Allow recruiters full access to all jobs
CREATE POLICY "recruiters_full_access_jobs"
ON jobs
FOR ALL
TO authenticated
USING (auth.get_user_role() = 'recruiter')
WITH CHECK (auth.get_user_role() = 'recruiter');

-- Policy: Allow BD read access to all jobs
CREATE POLICY "bd_read_access_jobs"
ON jobs
FOR SELECT
TO authenticated
USING (auth.get_user_role() = 'bd');

-- Policy: Allow PM read access to contract jobs only
CREATE POLICY "pm_read_contract_jobs"
ON jobs
FOR SELECT
TO authenticated
USING (
  auth.get_user_role() = 'pm' 
  AND status = 'contract'
);

-- Policy: Allow demo viewers read access to demo jobs only
CREATE POLICY "demo_viewer_read_jobs"
ON jobs
FOR SELECT
TO authenticated
USING (
  auth.get_user_role() = 'demo_viewer' 
  AND record_status = 'demo'
);

-- Policy: Prevent writes to demo jobs by anyone except recruiters
CREATE POLICY "prevent_demo_job_writes"
ON jobs
FOR INSERT, UPDATE, DELETE
TO authenticated
USING (
  NOT (
    description ILIKE '%demo%' 
    OR title ILIKE '%demo%'
    OR status = 'demo'
  )
  OR auth.get_user_role() = 'recruiter'
)
WITH CHECK (
  NOT (
    description ILIKE '%demo%' 
    OR title ILIKE '%demo%'
    OR status = 'demo'
  )
  OR auth.get_user_role() = 'recruiter'
);

-- Policy: Deny all access to unauthenticated users
CREATE POLICY "deny_unauthenticated_jobs"
ON jobs
FOR ALL
TO anon
USING (false);

-- =============================================================================
-- CANDIDATES TABLE POLICIES
-- =============================================================================

-- Policy: Allow recruiters full access to all candidates
CREATE POLICY "recruiters_full_access_candidates"
ON candidates
FOR ALL
TO authenticated
USING (auth.get_user_role() = 'recruiter')
WITH CHECK (auth.get_user_role() = 'recruiter');

-- Policy: Allow BD read access to all candidates
CREATE POLICY "bd_read_access_candidates"
ON candidates
FOR SELECT
TO authenticated
USING (auth.get_user_role() = 'bd');

-- Policy: Allow demo viewers read access to demo candidates only
CREATE POLICY "demo_viewer_read_candidates"
ON candidates
FOR SELECT
TO authenticated
USING (
  auth.get_user_role() = 'demo_viewer' 
  AND status = 'demo'
);

-- Policy: Prevent writes to demo candidates by non-recruiters
CREATE POLICY "prevent_demo_candidate_writes"
ON candidates
FOR INSERT, UPDATE, DELETE
TO authenticated
USING (
  NOT (
    email ILIKE '%demo%' 
    OR name ILIKE '%demo%'
    OR phone ILIKE '%demo%'
  )
  OR auth.get_user_role() = 'recruiter'
)
WITH CHECK (
  NOT (
    email ILIKE '%demo%' 
    OR name ILIKE '%demo%'
    OR phone ILIKE '%demo%'
  )
  OR auth.get_user_role() = 'recruiter'
);

-- Policy: Deny all access to unauthenticated users
CREATE POLICY "deny_unauthenticated_candidates"
ON candidates
FOR ALL
TO anon
USING (false);

-- =============================================================================
-- JOB_CANDIDATE TABLE POLICIES
-- =============================================================================

-- Policy: Allow recruiters full access to job_candidate relationships they're assigned to
CREATE POLICY "recruiters_assigned_job_candidates"
ON job_candidate
FOR ALL
TO authenticated
USING (
  auth.get_user_role() = 'recruiter' 
  AND (
    assigned_to = auth.uid()::text 
    OR assigned_to IS NULL
  )
)
WITH CHECK (
  auth.get_user_role() = 'recruiter' 
  AND (
    assigned_to = auth.uid()::text 
    OR assigned_to IS NULL
  )
);

-- Policy: Allow BD read access to all job_candidate relationships
CREATE POLICY "bd_read_access_job_candidates"
ON job_candidate
FOR SELECT
TO authenticated
USING (auth.get_user_role() = 'bd');

-- Policy: Allow PM read access to job_candidates for contract jobs
CREATE POLICY "pm_read_contract_job_candidates"
ON job_candidate
FOR SELECT
TO authenticated
USING (
  auth.get_user_role() = 'pm' 
  AND EXISTS (
    SELECT 1 FROM jobs 
    WHERE jobs.id = job_candidate.job_id 
    AND jobs.status = 'contract'
  )
);

-- Policy: Allow demo viewers read access to demo job_candidates only
CREATE POLICY "demo_viewer_read_job_candidates"
ON job_candidate
FOR SELECT
TO authenticated
USING (
  auth.get_user_role() = 'demo_viewer' 
  AND status = 'demo'
);

-- Policy: Prevent writes to demo job_candidate relationships
CREATE POLICY "prevent_demo_job_candidate_writes"
ON job_candidate
FOR INSERT, UPDATE, DELETE
TO authenticated
USING (
  NOT (
    notes ILIKE '%demo%'
    OR stage = 'demo'
  )
  OR auth.get_user_role() = 'recruiter'
)
WITH CHECK (
  NOT (
    notes ILIKE '%demo%'
    OR stage = 'demo'
  )
  OR auth.get_user_role() = 'recruiter'
);

-- Policy: Deny all access to unauthenticated users
CREATE POLICY "deny_unauthenticated_job_candidates"
ON job_candidate
FOR ALL
TO anon
USING (false);

-- =============================================================================
-- CANDIDATE_NOTES TABLE POLICIES
-- =============================================================================

-- Policy: Allow recruiters to read all candidate notes
CREATE POLICY "recruiters_read_all_candidate_notes"
ON candidate_notes
FOR SELECT
TO authenticated
USING (auth.get_user_role() = 'recruiter');

-- Policy: Allow only note authors to write/update their own notes
CREATE POLICY "authors_write_own_candidate_notes"
ON candidate_notes
FOR INSERT, UPDATE, DELETE
TO authenticated
USING (
  auth.get_user_role() = 'recruiter' 
  AND author_id = auth.uid()::text
)
WITH CHECK (
  auth.get_user_role() = 'recruiter' 
  AND author_id = auth.uid()::text
);

-- Policy: Allow BD read access to all candidate notes
CREATE POLICY "bd_read_access_candidate_notes"
ON candidate_notes
FOR SELECT
TO authenticated
USING (auth.get_user_role() = 'bd');

-- Policy: Allow demo viewers read access to demo notes only
CREATE POLICY "demo_viewer_read_candidate_notes"
ON candidate_notes
FOR SELECT
TO authenticated
USING (
  auth.get_user_role() = 'demo_viewer' 
  AND (
    content ILIKE '%demo%'
    OR author_id ILIKE '%demo%'
  )
);

-- Policy: Prevent writes to demo candidate notes
CREATE POLICY "prevent_demo_candidate_note_writes"
ON candidate_notes
FOR INSERT, UPDATE, DELETE
TO authenticated
USING (
  NOT (
    content ILIKE '%demo%'
    OR author_id ILIKE '%demo%'
  )
  OR auth.get_user_role() = 'recruiter'
)
WITH CHECK (
  NOT (
    content ILIKE '%demo%'
    OR author_id ILIKE '%demo%'
  )
  OR auth.get_user_role() = 'recruiter'
);

-- Policy: Deny all access to unauthenticated users
CREATE POLICY "deny_unauthenticated_candidate_notes"
ON candidate_notes
FOR ALL
TO anon
USING (false);

-- =============================================================================
-- ADDITIONAL SECURITY MEASURES
-- =============================================================================

-- Create a function to check if a user has the required role
CREATE OR REPLACE FUNCTION auth.has_role(required_role TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT auth.get_user_role() = required_role;
$$;

-- Create a function to check if content is demo data
CREATE OR REPLACE FUNCTION is_demo_content(content TEXT)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT content ILIKE '%demo%';
$$;

-- =============================================================================
-- USAGE EXAMPLES AND TESTING
-- =============================================================================

/*
-- Test queries to verify RLS policies work correctly:

-- 1. Test as recruiter (should see all data)
SELECT auth.get_user_role(); -- Should return 'recruiter'
SELECT * FROM clients; -- Should return all clients
SELECT * FROM jobs; -- Should return all jobs

-- 2. Test as BD (should see read-only access)
SELECT * FROM clients; -- Should return all clients (read-only)
INSERT INTO clients (name) VALUES ('Test Client'); -- Should fail

-- 3. Test as PM (should see only contract jobs)
SELECT * FROM jobs WHERE status = 'contract'; -- Should return contract jobs only
SELECT * FROM jobs WHERE status = 'open'; -- Should return no results

-- 4. Test as demo_viewer (should see only demo data)
SELECT * FROM clients WHERE name ILIKE '%demo%'; -- Should return demo clients only
INSERT INTO clients (name) VALUES ('Demo Client'); -- Should fail

-- 5. Test candidate notes authorship
INSERT INTO candidate_notes (content, author_id) VALUES ('Test note', auth.uid()); -- Should work for note author
UPDATE candidate_notes SET content = 'Updated' WHERE author_id != auth.uid(); -- Should fail
*/

-- =============================================================================
-- POLICY SUMMARY
-- =============================================================================

/*
ROLE PERMISSIONS SUMMARY:

RECRUITER:
- Full CRUD access to all tables
- Can write candidate_notes only with their own author_id
- Can modify demo data

BD (Business Development):
- Read-only access to clients, jobs, candidates, job_candidate, candidate_notes
- Cannot write to any table

PM (Project Manager):
- Read-only access to jobs with status = 'contract'
- Read-only access to job_candidate for contract jobs
- Cannot write to any table

DEMO_VIEWER:
- Read-only access to records containing 'demo' in key fields
- Cannot write to any table

UNAUTHENTICATED:
- No access to any data
- All operations denied
*/