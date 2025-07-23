-- Corrected RLS Policies for TalentPatriot ATS
-- Fixes JSON operator errors

-- Drop any existing policies first
DROP POLICY IF EXISTS "organizations_access_policy" ON organizations;
DROP POLICY IF EXISTS "user_organizations_access_policy" ON user_organizations;
DROP POLICY IF EXISTS "clients_access_policy" ON clients;
DROP POLICY IF EXISTS "jobs_access_policy" ON jobs;
DROP POLICY IF EXISTS "candidates_access_policy" ON candidates;
DROP POLICY IF EXISTS "job_candidate_access_policy" ON job_candidate;
DROP POLICY IF EXISTS "candidate_notes_access_policy" ON candidate_notes;

-- Block all anonymous access
CREATE POLICY "block_anonymous_access" ON organizations FOR ALL TO anon USING (false);
CREATE POLICY "block_anonymous_access" ON user_organizations FOR ALL TO anon USING (false);
CREATE POLICY "block_anonymous_access" ON clients FOR ALL TO anon USING (false);
CREATE POLICY "block_anonymous_access" ON jobs FOR ALL TO anon USING (false);
CREATE POLICY "block_anonymous_access" ON candidates FOR ALL TO anon USING (false);
CREATE POLICY "block_anonymous_access" ON job_candidate FOR ALL TO anon USING (false);
CREATE POLICY "block_anonymous_access" ON candidate_notes FOR ALL TO anon USING (false);

-- ORGANIZATIONS TABLE
CREATE POLICY "organizations_access_policy" ON organizations
  FOR SELECT TO authenticated
  USING (
    -- Demo viewers can only see demo organization
    ((auth.jwt() -> 'user_metadata' ->> 'role') = 'demo_viewer' AND id = '550e8400-e29b-41d4-a716-446655440000'::UUID)
    OR
    -- Real users can see organizations they belong to (excluding demo org)
    ((auth.jwt() -> 'user_metadata' ->> 'role') != 'demo_viewer' 
     AND id != '550e8400-e29b-41d4-a716-446655440000'::UUID
     AND id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid()))
  );

-- USER_ORGANIZATIONS TABLE  
CREATE POLICY "user_organizations_access_policy" ON user_organizations
  FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') != 'demo_viewer' AND user_id = auth.uid());

-- CLIENTS TABLE
CREATE POLICY "clients_access_policy" ON clients
  FOR SELECT TO authenticated
  USING (
    -- Demo viewers see only demo data from demo org
    ((auth.jwt() -> 'user_metadata' ->> 'role') = 'demo_viewer' 
     AND org_id = '550e8400-e29b-41d4-a716-446655440000'::UUID)
    OR
    -- Real users see non-demo data from their organizations
    ((auth.jwt() -> 'user_metadata' ->> 'role') != 'demo_viewer' 
     AND org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid()))
  );

-- JOBS TABLE
CREATE POLICY "jobs_access_policy" ON jobs
  FOR SELECT TO authenticated
  USING (
    -- Demo viewers see only demo data from demo org
    ((auth.jwt() -> 'user_metadata' ->> 'role') = 'demo_viewer' 
     AND org_id = '550e8400-e29b-41d4-a716-446655440000'::UUID)
    OR
    -- Real users see non-demo data from their organizations
    ((auth.jwt() -> 'user_metadata' ->> 'role') != 'demo_viewer' 
     AND org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid()))
  );

-- CANDIDATES TABLE
CREATE POLICY "candidates_access_policy" ON candidates
  FOR SELECT TO authenticated
  USING (
    -- Demo viewers see only demo data from demo org
    ((auth.jwt() -> 'user_metadata' ->> 'role') = 'demo_viewer' 
     AND org_id = '550e8400-e29b-41d4-a716-446655440000'::UUID)
    OR
    -- Real users see non-demo data from their organizations
    ((auth.jwt() -> 'user_metadata' ->> 'role') != 'demo_viewer' 
     AND org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid()))
  );

-- JOB_CANDIDATE TABLE
CREATE POLICY "job_candidate_access_policy" ON job_candidate
  FOR SELECT TO authenticated
  USING (
    -- Demo viewers see only demo data from demo org
    ((auth.jwt() -> 'user_metadata' ->> 'role') = 'demo_viewer' 
     AND org_id = '550e8400-e29b-41d4-a716-446655440000'::UUID)
    OR
    -- Real users see non-demo data from their organizations
    ((auth.jwt() -> 'user_metadata' ->> 'role') != 'demo_viewer' 
     AND org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid()))
  );

-- CANDIDATE_NOTES TABLE
CREATE POLICY "candidate_notes_access_policy" ON candidate_notes
  FOR SELECT TO authenticated
  USING (
    -- Demo viewers see only notes from demo org
    ((auth.jwt() -> 'user_metadata' ->> 'role') = 'demo_viewer' 
     AND org_id = '550e8400-e29b-41d4-a716-446655440000'::UUID)
    OR
    -- Real users see notes from their organizations
    ((auth.jwt() -> 'user_metadata' ->> 'role') != 'demo_viewer' 
     AND org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid()))
  );

-- INSERT/UPDATE/DELETE policies for real users only

-- ORGANIZATIONS write policies
CREATE POLICY "organizations_insert_policy" ON organizations
  FOR INSERT TO authenticated
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') != 'demo_viewer'
    AND owner_id = auth.uid()
  );

CREATE POLICY "organizations_update_policy" ON organizations
  FOR UPDATE TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') != 'demo_viewer'
    AND id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
  );

-- CLIENTS write policies
CREATE POLICY "clients_write_policy" ON clients
  FOR ALL TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') != 'demo_viewer'
    AND org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  )
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') != 'demo_viewer'
    AND org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );

-- JOBS write policies
CREATE POLICY "jobs_write_policy" ON jobs
  FOR ALL TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') != 'demo_viewer'
    AND org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  )
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') != 'demo_viewer'
    AND org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );

-- CANDIDATES write policies  
CREATE POLICY "candidates_write_policy" ON candidates
  FOR ALL TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') != 'demo_viewer'
    AND org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  )
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') != 'demo_viewer'
    AND org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );

-- JOB_CANDIDATE write policies
CREATE POLICY "job_candidate_write_policy" ON job_candidate
  FOR ALL TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') != 'demo_viewer'
    AND org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  )
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') != 'demo_viewer'
    AND org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );

-- CANDIDATE_NOTES write policies
CREATE POLICY "candidate_notes_write_policy" ON candidate_notes
  FOR ALL TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') != 'demo_viewer'
    AND org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  )
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') != 'demo_viewer'
    AND org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );