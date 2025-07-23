-- COMPLETE SECURITY & PERFORMANCE DEPLOYMENT FOR TALENTPATRIOT ATS
-- Run this script in Supabase SQL Editor to fix all 11 security errors and optimize performance

-- ==========================================
-- PART 1: CRITICAL SECURITY FIXES
-- ==========================================

-- 1. Create secure user profiles table (replaces insecure user_metadata)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY,
  role TEXT NOT NULL DEFAULT 'recruiter',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 2. Fix missing RLS on notes table (Error: rls_disabled_in_public)
-- First, check if notes table exists, if not create candidate_notes
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notes' AND table_schema = 'public') THEN
    -- Ensure candidate_notes has RLS enabled (this is the correct table)
    ALTER TABLE candidate_notes ENABLE ROW LEVEL SECURITY;
  ELSE
    -- Enable RLS on notes table if it exists
    ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
  END IF;
END
$$;

-- 3. Create secure functions to replace user_metadata references
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS TEXT
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT COALESCE(
    (SELECT role FROM user_profiles WHERE id = user_id),
    'recruiter'
  );
$$;

CREATE OR REPLACE FUNCTION is_demo_viewer(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT get_user_role(user_id) = 'demo_viewer';
$$;

-- 4. Drop ALL insecure policies that reference user_metadata
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

-- Also drop policies that might exist on notes table
DROP POLICY IF EXISTS "notes_access_policy" ON notes;
DROP POLICY IF EXISTS "notes_write_policy" ON notes;

-- ==========================================
-- PART 2: SECURE RLS POLICIES (NO user_metadata)
-- ==========================================

-- User Profiles - only users can read their own profile
CREATE POLICY "user_profiles_read_own" ON user_profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "user_profiles_update_own" ON user_profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid());

-- Organizations - secure access without user_metadata
CREATE POLICY "organizations_secure_access" ON organizations
  FOR SELECT TO authenticated
  USING (
    CASE 
      WHEN is_demo_viewer(auth.uid()) THEN 
        id = '550e8400-e29b-41d4-a716-446655440000'::UUID
      ELSE 
        id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
    END
  );

CREATE POLICY "organizations_secure_write" ON organizations
  FOR ALL TO authenticated
  USING (
    NOT is_demo_viewer(auth.uid()) 
    AND id IN (
      SELECT org_id FROM user_organizations 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- User Organizations - secure access
CREATE POLICY "user_organizations_secure_access" ON user_organizations
  FOR SELECT TO authenticated
  USING (
    CASE 
      WHEN is_demo_viewer(auth.uid()) THEN 
        org_id = '550e8400-e29b-41d4-a716-446655440000'::UUID
      ELSE 
        user_id = auth.uid() OR org_id IN (
          SELECT org_id FROM user_organizations 
          WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    END
  );

-- Clients - secure access without user_metadata
CREATE POLICY "clients_secure_access" ON clients
  FOR SELECT TO authenticated
  USING (
    CASE 
      WHEN is_demo_viewer(auth.uid()) THEN 
        org_id = '550e8400-e29b-41d4-a716-446655440000'::UUID
      ELSE 
        org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
    END
  );

CREATE POLICY "clients_secure_write" ON clients
  FOR ALL TO authenticated
  USING (
    NOT is_demo_viewer(auth.uid()) 
    AND org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );

-- Jobs - secure access without user_metadata
CREATE POLICY "jobs_secure_access" ON jobs
  FOR SELECT TO authenticated
  USING (
    CASE 
      WHEN is_demo_viewer(auth.uid()) THEN 
        org_id = '550e8400-e29b-41d4-a716-446655440000'::UUID
      ELSE 
        org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
    END
  );

CREATE POLICY "jobs_secure_write" ON jobs
  FOR ALL TO authenticated
  USING (
    NOT is_demo_viewer(auth.uid()) 
    AND org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );

-- Candidates - secure access without user_metadata
CREATE POLICY "candidates_secure_access" ON candidates
  FOR SELECT TO authenticated
  USING (
    CASE 
      WHEN is_demo_viewer(auth.uid()) THEN 
        org_id = '550e8400-e29b-41d4-a716-446655440000'::UUID
      ELSE 
        org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
    END
  );

CREATE POLICY "candidates_secure_write" ON candidates
  FOR ALL TO authenticated
  USING (
    NOT is_demo_viewer(auth.uid()) 
    AND org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );

-- Job Candidate - secure access without user_metadata
CREATE POLICY "job_candidate_secure_access" ON job_candidate
  FOR SELECT TO authenticated
  USING (
    CASE 
      WHEN is_demo_viewer(auth.uid()) THEN 
        org_id = '550e8400-e29b-41d4-a716-446655440000'::UUID
      ELSE 
        org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
    END
  );

CREATE POLICY "job_candidate_secure_write" ON job_candidate
  FOR ALL TO authenticated
  USING (
    NOT is_demo_viewer(auth.uid()) 
    AND org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );

-- Candidate Notes - secure access without user_metadata
CREATE POLICY "candidate_notes_secure_access" ON candidate_notes
  FOR SELECT TO authenticated
  USING (
    CASE 
      WHEN is_demo_viewer(auth.uid()) THEN 
        org_id = '550e8400-e29b-41d4-a716-446655440000'::UUID
      ELSE 
        org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
    END
  );

CREATE POLICY "candidate_notes_secure_write" ON candidate_notes
  FOR ALL TO authenticated
  USING (
    NOT is_demo_viewer(auth.uid()) 
    AND org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );

-- Handle notes table if it exists separately
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notes' AND table_schema = 'public') THEN
    EXECUTE 'CREATE POLICY "notes_secure_access" ON notes FOR SELECT TO authenticated USING (
      CASE 
        WHEN is_demo_viewer(auth.uid()) THEN 
          org_id = ''550e8400-e29b-41d4-a716-446655440000''::UUID
        ELSE 
          org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
      END
    )';
  END IF;
END
$$;

-- ==========================================
-- PART 3: PERFORMANCE OPTIMIZATIONS
-- ==========================================

-- Core application indexes for fast queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clients_org_status_active ON clients(org_id, status) WHERE status = 'active';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_org_status_open ON jobs(org_id, status) WHERE status = 'open';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_candidates_org_status_active ON candidates(org_id, status) WHERE status = 'active';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_candidate_org_stage ON job_candidate(org_id, stage);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_candidate_notes_org_created ON candidate_notes(org_id, created_at DESC);

-- User and organization performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_organizations_user_role ON user_organizations(user_id, role);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_organizations_org_role ON user_organizations(org_id, role);

-- Foreign key performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_client_id ON jobs(client_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_candidate_job_id ON job_candidate(job_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_candidate_candidate_id ON job_candidate(candidate_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_candidate_notes_job_candidate_id ON candidate_notes(job_candidate_id);

-- Time-based queries optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clients_created_at ON clients(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_candidates_created_at ON candidates(created_at DESC);

-- ==========================================
-- PART 4: AUTO-CREATE USER PROFILES
-- ==========================================

-- Trigger to auto-create user profile for new auth users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, role)
  VALUES (NEW.id, 'recruiter');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists, then create new one
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- ==========================================
-- PART 5: DEMO USER SETUP
-- ==========================================

-- Insert demo user profile (use your actual demo user ID from auth.users)
INSERT INTO user_profiles (id, role)
VALUES ('550e8400-e29b-41d4-a716-446655440001'::UUID, 'demo_viewer')
ON CONFLICT (id) DO UPDATE SET role = 'demo_viewer';

-- ==========================================
-- PART 6: BLOCK ANONYMOUS ACCESS
-- ==========================================

-- Ensure all tables block anonymous access
ALTER TABLE organizations FORCE ROW LEVEL SECURITY;
ALTER TABLE user_organizations FORCE ROW LEVEL SECURITY;
ALTER TABLE clients FORCE ROW LEVEL SECURITY;
ALTER TABLE jobs FORCE ROW LEVEL SECURITY;
ALTER TABLE candidates FORCE ROW LEVEL SECURITY;
ALTER TABLE job_candidate FORCE ROW LEVEL SECURITY;
ALTER TABLE candidate_notes FORCE ROW LEVEL SECURITY;
ALTER TABLE user_profiles FORCE ROW LEVEL SECURITY;

-- Block anonymous access explicitly
CREATE POLICY "block_anonymous_organizations" ON organizations
  FOR ALL TO anon
  USING (FALSE);

CREATE POLICY "block_anonymous_clients" ON clients
  FOR ALL TO anon
  USING (FALSE);

CREATE POLICY "block_anonymous_jobs" ON jobs
  FOR ALL TO anon
  USING (FALSE);

CREATE POLICY "block_anonymous_candidates" ON candidates
  FOR ALL TO anon
  USING (FALSE);

CREATE POLICY "block_anonymous_job_candidate" ON job_candidate
  FOR ALL TO anon
  USING (FALSE);

CREATE POLICY "block_anonymous_candidate_notes" ON candidate_notes
  FOR ALL TO anon
  USING (FALSE);

-- ==========================================
-- VERIFICATION QUERIES
-- ==========================================

-- Run these to verify the fixes worked:
-- SELECT COUNT(*) FROM user_profiles;
-- SELECT table_name, row_security FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
-- SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public';

-- ==========================================
-- EXPECTED RESULTS
-- ==========================================
-- After running this script:
-- ✅ All 11 security errors should be resolved
-- ✅ RLS enabled on all public tables
-- ✅ No policies reference user_metadata
-- ✅ Secure user_profiles system active
-- ✅ Performance indexes applied
-- ✅ Anonymous access blocked
-- ✅ Demo data properly isolated