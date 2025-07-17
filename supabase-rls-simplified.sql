-- =============================================================================
-- SIMPLIFIED SUPABASE RLS POLICIES - NO AUTH SCHEMA PERMISSIONS NEEDED
-- =============================================================================
-- Execute this entire script in Supabase SQL Editor

-- =============================================================================
-- STEP 1: ENABLE ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_candidate ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_notes ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- STEP 2: ORGANIZATIONS TABLE POLICIES
-- =============================================================================

-- Clear existing policies
DROP POLICY IF EXISTS "org_owners_read" ON organizations;
DROP POLICY IF EXISTS "org_owners_write" ON organizations;
DROP POLICY IF EXISTS "org_owners_update" ON organizations;
DROP POLICY IF EXISTS "org_owners_delete" ON organizations;
DROP POLICY IF EXISTS "deny_unauthenticated_organizations" ON organizations;

-- Organization owners can read their organizations
CREATE POLICY "org_owners_read"
ON organizations FOR SELECT TO authenticated
USING (auth.uid() = owner_id);

-- Organization owners can create organizations
CREATE POLICY "org_owners_write"
ON organizations FOR INSERT TO authenticated
WITH CHECK (auth.uid() = owner_id);

-- Organization owners can update their organizations
CREATE POLICY "org_owners_update"
ON organizations FOR UPDATE TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- Organization owners can delete their organizations
CREATE POLICY "org_owners_delete"
ON organizations FOR DELETE TO authenticated
USING (auth.uid() = owner_id);

-- Block unauthenticated access
CREATE POLICY "deny_unauthenticated_organizations"
ON organizations FOR ALL TO anon
USING (false);

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
USING (true);

-- Authenticated users: Insert access
CREATE POLICY "authenticated_insert_clients"
ON clients FOR INSERT TO authenticated
WITH CHECK (true);

-- Authenticated users: Update access
CREATE POLICY "authenticated_update_clients"
ON clients FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);

-- Authenticated users: Delete access
CREATE POLICY "authenticated_delete_clients"
ON clients FOR DELETE TO authenticated
USING (true);

-- Block unauthenticated
CREATE POLICY "deny_unauthenticated_clients"
ON clients FOR ALL TO anon
USING (false);

-- =============================================================================
-- STEP 3: JOBS TABLE POLICIES
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
USING (true);

-- Authenticated users: Insert access
CREATE POLICY "authenticated_insert_jobs"
ON jobs FOR INSERT TO authenticated
WITH CHECK (true);

-- Authenticated users: Update access
CREATE POLICY "authenticated_update_jobs"
ON jobs FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);

-- Authenticated users: Delete access
CREATE POLICY "authenticated_delete_jobs"
ON jobs FOR DELETE TO authenticated
USING (true);

-- Block unauthenticated
CREATE POLICY "deny_unauthenticated_jobs"
ON jobs FOR ALL TO anon
USING (false);

-- =============================================================================
-- STEP 4: CANDIDATES TABLE POLICIES
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
USING (true);

-- Authenticated users: Insert access
CREATE POLICY "authenticated_insert_candidates"
ON candidates FOR INSERT TO authenticated
WITH CHECK (true);

-- Authenticated users: Update access
CREATE POLICY "authenticated_update_candidates"
ON candidates FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);

-- Authenticated users: Delete access
CREATE POLICY "authenticated_delete_candidates"
ON candidates FOR DELETE TO authenticated
USING (true);

-- Block unauthenticated
CREATE POLICY "deny_unauthenticated_candidates"
ON candidates FOR ALL TO anon
USING (false);

-- =============================================================================
-- STEP 5: JOB_CANDIDATE TABLE POLICIES
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
USING (true);

-- Authenticated users: Insert access
CREATE POLICY "authenticated_insert_job_candidates"
ON job_candidate FOR INSERT TO authenticated
WITH CHECK (true);

-- Authenticated users: Update access
CREATE POLICY "authenticated_update_job_candidates"
ON job_candidate FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);

-- Authenticated users: Delete access
CREATE POLICY "authenticated_delete_job_candidates"
ON job_candidate FOR DELETE TO authenticated
USING (true);

-- Block unauthenticated
CREATE POLICY "deny_unauthenticated_job_candidates"
ON job_candidate FOR ALL TO anon
USING (false);

-- =============================================================================
-- STEP 6: CANDIDATE_NOTES TABLE POLICIES
-- =============================================================================

-- Clear existing policies
DROP POLICY IF EXISTS "authenticated_read_candidate_notes" ON candidate_notes;
DROP POLICY IF EXISTS "authenticated_insert_candidate_notes" ON candidate_notes;
DROP POLICY IF EXISTS "authenticated_update_candidate_notes" ON candidate_notes;
DROP POLICY IF EXISTS "authenticated_delete_candidate_notes" ON candidate_notes;
DROP POLICY IF EXISTS "deny_unauthenticated_candidate_notes" ON candidate_notes;

-- Authenticated users: Read access
CREATE POLICY "authenticated_read_candidate_notes"
ON candidate_notes FOR SELECT TO authenticated
USING (true);

-- Authenticated users: Insert access
CREATE POLICY "authenticated_insert_candidate_notes"
ON candidate_notes FOR INSERT TO authenticated
WITH CHECK (true);

-- Authenticated users: Update access
CREATE POLICY "authenticated_update_candidate_notes"
ON candidate_notes FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);

-- Authenticated users: Delete access
CREATE POLICY "authenticated_delete_candidate_notes"
ON candidate_notes FOR DELETE TO authenticated
USING (true);

-- Block unauthenticated
CREATE POLICY "deny_unauthenticated_candidate_notes"
ON candidate_notes FOR ALL TO anon
USING (false);

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
SELECT 'Basic RLS Policies successfully configured for TalentPatriot ATS!' AS status;