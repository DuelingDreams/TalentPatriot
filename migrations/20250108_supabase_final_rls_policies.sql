-- Final RLS Policies for TalentPatriot ATS
-- Implements demo data isolation and organization-based access control

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
  FOR SELECT
  TO authenticated
  USING (
    -- Demo viewers can only see demo organization
    (auth.jwt() ->> 'user_metadata' ->> 'role' = 'demo_viewer' AND id = '550e8400-e29b-41d4-a716-446655440000'::UUID)
    OR
    -- Real users can see organizations they belong to (excluding demo org)
    (auth.jwt() ->> 'user_metadata' ->> 'role' != 'demo_viewer' 
     AND id != '550e8400-e29b-41d4-a716-446655440000'::UUID
     AND id IN (
       SELECT org_id FROM user_organizations 
       WHERE user_id = auth.uid()
     ))
  );

-- USER_ORGANIZATIONS TABLE
CREATE POLICY "user_organizations_access_policy" ON user_organizations
  FOR SELECT
  TO authenticated
  USING (
    -- Demo viewers cannot see any user_organizations records
    (auth.jwt() ->> 'user_metadata' ->> 'role' != 'demo_viewer' AND user_id = auth.uid())
  );

-- CLIENTS TABLE
CREATE POLICY "clients_access_policy" ON clients
  FOR SELECT
  TO authenticated
  USING (
    -- Demo viewers see only demo data from demo org
    (auth.jwt() ->> 'user_metadata' ->> 'role' = 'demo_viewer' 
     AND status::TEXT = 'demo' 
     AND org_id = '550e8400-e29b-41d4-a716-446655440000'::UUID)
    OR
    -- Real users see non-demo data from their organizations
    (auth.jwt() ->> 'user_metadata' ->> 'role' != 'demo_viewer' 
     AND status::TEXT != 'demo'
     AND org_id IN (
       SELECT org_id FROM user_organizations 
       WHERE user_id = auth.uid()
     ))
  );

-- JOBS TABLE
CREATE POLICY "jobs_access_policy" ON jobs
  FOR SELECT
  TO authenticated
  USING (
    -- Demo viewers see only demo data from demo org
    (auth.jwt() ->> 'user_metadata' ->> 'role' = 'demo_viewer' 
     AND record_status::TEXT = 'demo' 
     AND org_id = '550e8400-e29b-41d4-a716-446655440000'::UUID)
    OR
    -- Real users see non-demo data from their organizations
    (auth.jwt() ->> 'user_metadata' ->> 'role' != 'demo_viewer' 
     AND record_status::TEXT != 'demo'
     AND org_id IN (
       SELECT org_id FROM user_organizations 
       WHERE user_id = auth.uid()
     ))
  );

-- CANDIDATES TABLE
CREATE POLICY "candidates_access_policy" ON candidates
  FOR SELECT
  TO authenticated
  USING (
    -- Demo viewers see only demo data from demo org
    (auth.jwt() ->> 'user_metadata' ->> 'role' = 'demo_viewer' 
     AND status::TEXT = 'demo' 
     AND org_id = '550e8400-e29b-41d4-a716-446655440000'::UUID)
    OR
    -- Real users see non-demo data from their organizations
    (auth.jwt() ->> 'user_metadata' ->> 'role' != 'demo_viewer' 
     AND status::TEXT != 'demo'
     AND org_id IN (
       SELECT org_id FROM user_organizations 
       WHERE user_id = auth.uid()
     ))
  );

-- JOB_CANDIDATE TABLE
CREATE POLICY "job_candidate_access_policy" ON job_candidate
  FOR SELECT
  TO authenticated
  USING (
    -- Demo viewers see only demo data from demo org
    (auth.jwt() ->> 'user_metadata' ->> 'role' = 'demo_viewer' 
     AND status::TEXT = 'demo' 
     AND org_id = '550e8400-e29b-41d4-a716-446655440000'::UUID)
    OR
    -- Real users see non-demo data from their organizations
    (auth.jwt() ->> 'user_metadata' ->> 'role' != 'demo_viewer' 
     AND status::TEXT != 'demo'
     AND org_id IN (
       SELECT org_id FROM user_organizations 
       WHERE user_id = auth.uid()
     ))
  );

-- CANDIDATE_NOTES TABLE
CREATE POLICY "candidate_notes_access_policy" ON candidate_notes
  FOR SELECT
  TO authenticated
  USING (
    -- Demo viewers see only notes from demo org
    (auth.jwt() ->> 'user_metadata' ->> 'role' = 'demo_viewer' 
     AND org_id = '550e8400-e29b-41d4-a716-446655440000'::UUID)
    OR
    -- Real users see notes from their organizations
    (auth.jwt() ->> 'user_metadata' ->> 'role' != 'demo_viewer' 
     AND org_id IN (
       SELECT org_id FROM user_organizations 
       WHERE user_id = auth.uid()
     ))
  );

-- INSERT/UPDATE/DELETE policies for authenticated users
-- ORGANIZATIONS
CREATE POLICY "organizations_insert_policy" ON organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.jwt() ->> 'user_metadata' ->> 'role' != 'demo_viewer'
    AND owner_id = auth.uid()
  );

CREATE POLICY "organizations_update_policy" ON organizations
  FOR UPDATE
  TO authenticated
  USING (
    auth.jwt() ->> 'user_metadata' ->> 'role' != 'demo_viewer'
    AND id IN (
      SELECT org_id FROM user_organizations 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

-- CLIENTS
CREATE POLICY "clients_insert_policy" ON clients
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.jwt() ->> 'user_metadata' ->> 'role' != 'demo_viewer'
    AND org_id IN (
      SELECT org_id FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "clients_update_policy" ON clients
  FOR UPDATE
  TO authenticated
  USING (
    auth.jwt() ->> 'user_metadata' ->> 'role' != 'demo_viewer'
    AND org_id IN (
      SELECT org_id FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

-- JOBS
CREATE POLICY "jobs_insert_policy" ON jobs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.jwt() ->> 'user_metadata' ->> 'role' != 'demo_viewer'
    AND org_id IN (
      SELECT org_id FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "jobs_update_policy" ON jobs
  FOR UPDATE
  TO authenticated
  USING (
    auth.jwt() ->> 'user_metadata' ->> 'role' != 'demo_viewer'
    AND org_id IN (
      SELECT org_id FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

-- CANDIDATES
CREATE POLICY "candidates_insert_policy" ON candidates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.jwt() ->> 'user_metadata' ->> 'role' != 'demo_viewer'
    AND org_id IN (
      SELECT org_id FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "candidates_update_policy" ON candidates
  FOR UPDATE
  TO authenticated
  USING (
    auth.jwt() ->> 'user_metadata' ->> 'role' != 'demo_viewer'
    AND org_id IN (
      SELECT org_id FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

-- JOB_CANDIDATE policies
CREATE POLICY "job_candidate_insert_policy" ON job_candidate
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.jwt() ->> 'user_metadata' ->> 'role' != 'demo_viewer'
    AND org_id IN (
      SELECT org_id FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "job_candidate_update_policy" ON job_candidate
  FOR UPDATE
  TO authenticated
  USING (
    auth.jwt() ->> 'user_metadata' ->> 'role' != 'demo_viewer'
    AND org_id IN (
      SELECT org_id FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

-- CANDIDATE_NOTES policies
CREATE POLICY "candidate_notes_insert_policy" ON candidate_notes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.jwt() ->> 'user_metadata' ->> 'role' != 'demo_viewer'
    AND org_id IN (
      SELECT org_id FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "candidate_notes_update_policy" ON candidate_notes
  FOR UPDATE
  TO authenticated
  USING (
    auth.jwt() ->> 'user_metadata' ->> 'role' != 'demo_viewer'
    AND org_id IN (
      SELECT org_id FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

-- Comments for documentation
COMMENT ON POLICY "organizations_access_policy" ON organizations IS 'Demo viewers see only demo org, real users see their organizations';
COMMENT ON POLICY "clients_access_policy" ON clients IS 'Demo viewers see demo data only, real users see non-demo data from their orgs';
COMMENT ON POLICY "jobs_access_policy" ON jobs IS 'Demo viewers see demo data only, real users see non-demo data from their orgs';
COMMENT ON POLICY "candidates_access_policy" ON candidates IS 'Demo viewers see demo data only, real users see non-demo data from their orgs';