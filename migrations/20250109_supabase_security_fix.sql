-- CRITICAL SECURITY FIX for TalentPatriot ATS
-- Addresses RLS security vulnerabilities and performance issues

-- Step 1: Create secure user profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'recruiter',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Step 2: Enable RLS on missing tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Check if notes table exists and enable RLS
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notes') THEN
        ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Step 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_organizations_user_id ON user_organizations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_organizations_org_id ON user_organizations(org_id);
CREATE INDEX IF NOT EXISTS idx_user_organizations_role ON user_organizations(role);

-- Step 4: Create function to get user role securely
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT role FROM user_profiles WHERE id = user_id),
    'recruiter'
  );
$$;

-- Step 5: Create function to check if user is demo viewer
CREATE OR REPLACE FUNCTION is_demo_viewer(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT get_user_role(user_id) = 'demo_viewer';
$$;

-- Step 6: Drop existing insecure policies
DROP POLICY IF EXISTS "organizations_access_policy" ON organizations;
DROP POLICY IF EXISTS "user_organizations_access_policy" ON user_organizations;
DROP POLICY IF EXISTS "clients_access_policy" ON clients;
DROP POLICY IF EXISTS "jobs_access_policy" ON jobs;
DROP POLICY IF EXISTS "candidates_access_policy" ON candidates;
DROP POLICY IF EXISTS "job_candidate_access_policy" ON job_candidate;
DROP POLICY IF EXISTS "candidate_notes_access_policy" ON candidate_notes;
DROP POLICY IF EXISTS "clients_write_policy" ON clients;
DROP POLICY IF EXISTS "jobs_write_policy" ON jobs;
DROP POLICY IF EXISTS "candidates_write_policy" ON candidates;

-- Step 7: Create secure RLS policies using functions

-- USER_PROFILES policies
CREATE POLICY "user_profiles_own_access" ON user_profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "user_profiles_own_update" ON user_profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ORGANIZATIONS policies
CREATE POLICY "organizations_secure_access" ON organizations
  FOR SELECT TO authenticated
  USING (
    -- Demo viewers can only see demo organization
    (is_demo_viewer(auth.uid()) AND id = '550e8400-e29b-41d4-a716-446655440000'::UUID)
    OR
    -- Real users can see organizations they belong to (excluding demo org)
    (NOT is_demo_viewer(auth.uid()) 
     AND id != '550e8400-e29b-41d4-a716-446655440000'::UUID
     AND id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid()))
  );

-- USER_ORGANIZATIONS policies  
CREATE POLICY "user_organizations_secure_access" ON user_organizations
  FOR SELECT TO authenticated
  USING (NOT is_demo_viewer(auth.uid()) AND user_id = auth.uid());

-- CLIENTS policies
CREATE POLICY "clients_secure_access" ON clients
  FOR SELECT TO authenticated
  USING (
    -- Demo viewers see only demo data from demo org
    (is_demo_viewer(auth.uid()) AND org_id = '550e8400-e29b-41d4-a716-446655440000'::UUID)
    OR
    -- Real users see non-demo data from their organizations
    (NOT is_demo_viewer(auth.uid()) 
     AND org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid()))
  );

CREATE POLICY "clients_secure_write" ON clients
  FOR ALL TO authenticated
  USING (
    NOT is_demo_viewer(auth.uid())
    AND org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  )
  WITH CHECK (
    NOT is_demo_viewer(auth.uid())
    AND org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );

-- JOBS policies
CREATE POLICY "jobs_secure_access" ON jobs
  FOR SELECT TO authenticated
  USING (
    -- Demo viewers see only demo data from demo org
    (is_demo_viewer(auth.uid()) AND org_id = '550e8400-e29b-41d4-a716-446655440000'::UUID)
    OR
    -- Real users see non-demo data from their organizations
    (NOT is_demo_viewer(auth.uid()) 
     AND org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid()))
  );

CREATE POLICY "jobs_secure_write" ON jobs
  FOR ALL TO authenticated
  USING (
    NOT is_demo_viewer(auth.uid())
    AND org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  )
  WITH CHECK (
    NOT is_demo_viewer(auth.uid())
    AND org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );

-- CANDIDATES policies
CREATE POLICY "candidates_secure_access" ON candidates
  FOR SELECT TO authenticated
  USING (
    -- Demo viewers see only demo data from demo org
    (is_demo_viewer(auth.uid()) AND org_id = '550e8400-e29b-41d4-a716-446655440000'::UUID)
    OR
    -- Real users see non-demo data from their organizations
    (NOT is_demo_viewer(auth.uid()) 
     AND org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid()))
  );

CREATE POLICY "candidates_secure_write" ON candidates
  FOR ALL TO authenticated
  USING (
    NOT is_demo_viewer(auth.uid())
    AND org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  )
  WITH CHECK (
    NOT is_demo_viewer(auth.uid())
    AND org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );

-- JOB_CANDIDATE policies
CREATE POLICY "job_candidate_secure_access" ON job_candidate
  FOR SELECT TO authenticated
  USING (
    -- Demo viewers see only demo data from demo org
    (is_demo_viewer(auth.uid()) AND org_id = '550e8400-e29b-41d4-a716-446655440000'::UUID)
    OR
    -- Real users see non-demo data from their organizations
    (NOT is_demo_viewer(auth.uid()) 
     AND org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid()))
  );

CREATE POLICY "job_candidate_secure_write" ON job_candidate
  FOR ALL TO authenticated
  USING (
    NOT is_demo_viewer(auth.uid())
    AND org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  )
  WITH CHECK (
    NOT is_demo_viewer(auth.uid())
    AND org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );

-- CANDIDATE_NOTES policies
CREATE POLICY "candidate_notes_secure_access" ON candidate_notes
  FOR SELECT TO authenticated
  USING (
    -- Demo viewers see only notes from demo org
    (is_demo_viewer(auth.uid()) AND org_id = '550e8400-e29b-41d4-a716-446655440000'::UUID)
    OR
    -- Real users see notes from their organizations
    (NOT is_demo_viewer(auth.uid()) 
     AND org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid()))
  );

CREATE POLICY "candidate_notes_secure_write" ON candidate_notes
  FOR ALL TO authenticated
  USING (
    NOT is_demo_viewer(auth.uid())
    AND org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  )
  WITH CHECK (
    NOT is_demo_viewer(auth.uid())
    AND org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );

-- Step 8: Create trigger to auto-create user profile
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, role)
  VALUES (NEW.id, 'recruiter');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- Step 9: Insert demo user profile
INSERT INTO user_profiles (id, role)
VALUES ('550e8400-e29b-41d4-a716-446655440001'::UUID, 'demo_viewer')
ON CONFLICT (id) DO UPDATE SET role = 'demo_viewer';

-- Step 10: Performance optimizations
-- Create composite indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_clients_org_status ON clients(org_id, status) WHERE status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_org_status ON jobs(org_id, record_status) WHERE record_status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_candidates_org_status ON candidates(org_id, status) WHERE status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_job_candidate_org_status ON job_candidate(org_id, status) WHERE status IS NOT NULL;

-- Create partial indexes for demo data
CREATE INDEX IF NOT EXISTS idx_clients_demo ON clients(org_id) WHERE org_id = '550e8400-e29b-41d4-a716-446655440000'::UUID;
CREATE INDEX IF NOT EXISTS idx_jobs_demo ON jobs(org_id) WHERE org_id = '550e8400-e29b-41d4-a716-446655440000'::UUID;
CREATE INDEX IF NOT EXISTS idx_candidates_demo ON candidates(org_id) WHERE org_id = '550e8400-e29b-41d4-a716-446655440000'::UUID;