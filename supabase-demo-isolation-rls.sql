-- Demo Data Isolation RLS Policies
-- Ensures demo viewers can only see demo data and real users can't see demo data

-- Drop existing policies to recreate them with demo isolation
DROP POLICY IF EXISTS "demo_viewer_clients_select" ON clients;
DROP POLICY IF EXISTS "demo_viewer_jobs_select" ON jobs;
DROP POLICY IF EXISTS "demo_viewer_candidates_select" ON candidates;
DROP POLICY IF EXISTS "demo_viewer_job_candidate_select" ON job_candidate;
DROP POLICY IF EXISTS "demo_viewer_candidate_notes_select" ON candidate_notes;
DROP POLICY IF EXISTS "demo_viewer_interviews_select" ON interviews;
DROP POLICY IF EXISTS "demo_viewer_messages_select" ON messages;
DROP POLICY IF EXISTS "demo_viewer_message_recipients_select" ON message_recipients;

-- Update existing organization-scoped policies to exclude demo data for real users
DROP POLICY IF EXISTS "users_can_view_org_clients" ON clients;
DROP POLICY IF EXISTS "users_can_view_org_jobs" ON jobs;
DROP POLICY IF EXISTS "users_can_view_org_candidates" ON candidates;

-- Create enhanced policies with demo isolation

-- CLIENTS TABLE
-- Real users can only see non-demo data from their organizations
CREATE POLICY "users_can_view_org_clients_no_demo" ON clients
  FOR SELECT
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM user_organizations 
      WHERE user_id = auth.uid()
    )
    AND record_status::TEXT != 'demo'
  );

-- Demo viewers can only see demo data
CREATE POLICY "demo_viewer_clients_select" ON clients
  FOR SELECT
  TO authenticated
  USING (
    auth.jwt() ->> 'user_metadata' ->> 'role' = 'demo_viewer'
    AND record_status::TEXT = 'demo'
    AND org_id = 'demo-org-fixed'
  );

-- JOBS TABLE
-- Real users can only see non-demo data from their organizations
CREATE POLICY "users_can_view_org_jobs_no_demo" ON jobs
  FOR SELECT
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM user_organizations 
      WHERE user_id = auth.uid()
    )
    AND record_status::TEXT != 'demo'
  );

-- Demo viewers can only see demo data
CREATE POLICY "demo_viewer_jobs_select" ON jobs
  FOR SELECT
  TO authenticated
  USING (
    auth.jwt() ->> 'user_metadata' ->> 'role' = 'demo_viewer'
    AND record_status::TEXT = 'demo'
    AND org_id = 'demo-org-fixed'
  );

-- CANDIDATES TABLE
-- Real users can only see non-demo data from their organizations
CREATE POLICY "users_can_view_org_candidates_no_demo" ON candidates
  FOR SELECT
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM user_organizations 
      WHERE user_id = auth.uid()
    )
    AND record_status::TEXT != 'demo'
  );

-- Demo viewers can only see demo data
CREATE POLICY "demo_viewer_candidates_select" ON candidates
  FOR SELECT
  TO authenticated
  USING (
    auth.jwt() ->> 'user_metadata' ->> 'role' = 'demo_viewer'
    AND record_status::TEXT = 'demo'
    AND org_id = 'demo-org-fixed'
  );

-- JOB_CANDIDATE TABLE
-- Real users can only see non-demo data from their organizations
CREATE POLICY "users_can_view_org_job_candidates_no_demo" ON job_candidate
  FOR SELECT
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM user_organizations 
      WHERE user_id = auth.uid()
    )
    AND record_status::TEXT != 'demo'
  );

-- Demo viewers can only see demo data
CREATE POLICY "demo_viewer_job_candidate_select" ON job_candidate
  FOR SELECT
  TO authenticated
  USING (
    auth.jwt() ->> 'user_metadata' ->> 'role' = 'demo_viewer'
    AND record_status::TEXT = 'demo'
    AND org_id = 'demo-org-fixed'
  );

-- CANDIDATE_NOTES TABLE
-- Real users can only see non-demo data from their organizations
CREATE POLICY "users_can_view_org_candidate_notes_no_demo" ON candidate_notes
  FOR SELECT
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM user_organizations 
      WHERE user_id = auth.uid()
    )
    AND record_status::TEXT != 'demo'
  );

-- Demo viewers can only see demo data
CREATE POLICY "demo_viewer_candidate_notes_select" ON candidate_notes
  FOR SELECT
  TO authenticated
  USING (
    auth.jwt() ->> 'user_metadata' ->> 'role' = 'demo_viewer'
    AND record_status::TEXT = 'demo'
    AND org_id = 'demo-org-fixed'
  );

-- INTERVIEWS TABLE
-- Real users can only see non-demo data from their organizations
CREATE POLICY "users_can_view_org_interviews_no_demo" ON interviews
  FOR SELECT
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM user_organizations 
      WHERE user_id = auth.uid()
    )
    AND record_status::TEXT != 'demo'
  );

-- Demo viewers can only see demo data
CREATE POLICY "demo_viewer_interviews_select" ON interviews
  FOR SELECT
  TO authenticated
  USING (
    auth.jwt() ->> 'user_metadata' ->> 'role' = 'demo_viewer'
    AND record_status::TEXT = 'demo'
    AND org_id = 'demo-org-fixed'
  );

-- MESSAGES TABLE
-- Real users can only see non-demo data from their organizations
CREATE POLICY "users_can_view_org_messages_no_demo" ON messages
  FOR SELECT
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM user_organizations 
      WHERE user_id = auth.uid()
    )
    AND record_status::TEXT != 'demo'
  );

-- Demo viewers can only see demo data
CREATE POLICY "demo_viewer_messages_select" ON messages
  FOR SELECT
  TO authenticated
  USING (
    auth.jwt() ->> 'user_metadata' ->> 'role' = 'demo_viewer'
    AND record_status::TEXT = 'demo'
    AND org_id = 'demo-org-fixed'
  );

-- MESSAGE_RECIPIENTS TABLE
-- Real users can only see non-demo data from their organizations
CREATE POLICY "users_can_view_org_message_recipients_no_demo" ON message_recipients
  FOR SELECT
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM user_organizations 
      WHERE user_id = auth.uid()
    )
    AND record_status::TEXT != 'demo'
  );

-- Demo viewers can only see demo data
CREATE POLICY "demo_viewer_message_recipients_select" ON message_recipients
  FOR SELECT
  TO authenticated
  USING (
    auth.jwt() ->> 'user_metadata' ->> 'role' = 'demo_viewer'
    AND record_status::TEXT = 'demo'
    AND org_id = 'demo-org-fixed'
  );

-- ORGANIZATIONS TABLE
-- Demo viewers can only see demo organization
CREATE POLICY "demo_viewer_organizations_select" ON organizations
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() ->> 'user_metadata' ->> 'role' = 'demo_viewer' AND id = 'demo-org-fixed')
    OR (auth.jwt() ->> 'user_metadata' ->> 'role' != 'demo_viewer' AND id != 'demo-org-fixed')
  );

-- Ensure demo organization exists
INSERT INTO organizations (id, name, owner_id, slug, created_at)
VALUES (
  'demo-org-fixed',
  'TalentPatriot Demo',
  'demo-user',
  'talentpatriot-demo',
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug;

COMMENT ON POLICY "users_can_view_org_clients_no_demo" ON clients IS 'Users can view clients from their organizations, excluding demo data';
COMMENT ON POLICY "demo_viewer_clients_select" ON clients IS 'Demo viewers can only view demo clients data';
COMMENT ON POLICY "users_can_view_org_jobs_no_demo" ON jobs IS 'Users can view jobs from their organizations, excluding demo data';
COMMENT ON POLICY "demo_viewer_jobs_select" ON jobs IS 'Demo viewers can only view demo jobs data';
COMMENT ON POLICY "users_can_view_org_candidates_no_demo" ON candidates IS 'Users can view candidates from their organizations, excluding demo data';
COMMENT ON POLICY "demo_viewer_candidates_select" ON candidates IS 'Demo viewers can only view demo candidates data';