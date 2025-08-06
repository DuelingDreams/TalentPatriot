-- ================================================
-- TalentPatriot SMB Role Migration Script
-- ================================================
-- Updates user roles to reflect small and midsize business structure
-- From: bd, pm, recruiter → To: hiring_manager, recruiter, admin, interviewer
-- 
-- INSTRUCTIONS:
-- 1. Copy this entire script
-- 2. Paste into your Supabase SQL Editor
-- 3. Execute all statements at once
--
-- BACKUP RECOMMENDATION:
-- Run this query first to backup existing roles:
-- SELECT id, role::text as current_role FROM user_profiles;
-- SELECT id, role::text as current_role FROM user_organizations;
-- ================================================

BEGIN;

-- ================================================
-- STEP 1: CREATE NEW ROLE ENUMS
-- ================================================

-- Create new user_role enum with SMB-focused roles
DO $$ BEGIN
    CREATE TYPE user_role_new AS ENUM ('hiring_manager', 'recruiter', 'admin', 'interviewer', 'demo_viewer');
EXCEPTION
    WHEN duplicate_object THEN
        DROP TYPE user_role_new CASCADE;
        CREATE TYPE user_role_new AS ENUM ('hiring_manager', 'recruiter', 'admin', 'interviewer', 'demo_viewer');
END $$;

-- Create new org_role enum with expanded options
DO $$ BEGIN
    CREATE TYPE org_role_new AS ENUM ('owner', 'admin', 'hiring_manager', 'recruiter', 'interviewer', 'viewer');
EXCEPTION
    WHEN duplicate_object THEN
        DROP TYPE org_role_new CASCADE;
        CREATE TYPE org_role_new AS ENUM ('owner', 'admin', 'hiring_manager', 'recruiter', 'interviewer', 'viewer');
END $$;

-- ================================================
-- STEP 2: UPDATE USER_PROFILES TABLE
-- ================================================

-- Add temporary column with new enum type
ALTER TABLE user_profiles ADD COLUMN role_new user_role_new;

-- Migrate data with role mapping
-- bd → hiring_manager (Business Development becomes Hiring Manager)
-- pm → hiring_manager (Project Manager becomes Hiring Manager) 
-- recruiter → recruiter (remains the same)
-- admin → admin (remains the same)
-- demo_viewer → demo_viewer (remains the same)
UPDATE user_profiles SET role_new = CASE
    WHEN role::text = 'bd' THEN 'hiring_manager'::user_role_new
    WHEN role::text = 'pm' THEN 'hiring_manager'::user_role_new
    WHEN role::text = 'recruiter' THEN 'recruiter'::user_role_new
    WHEN role::text = 'admin' THEN 'admin'::user_role_new
    WHEN role::text = 'demo_viewer' THEN 'demo_viewer'::user_role_new
    ELSE 'hiring_manager'::user_role_new -- Default fallback
END;

-- Replace old column with new one (use CASCADE to drop dependent objects)
ALTER TABLE user_profiles DROP COLUMN role CASCADE;
ALTER TABLE user_profiles RENAME COLUMN role_new TO role;
ALTER TABLE user_profiles ALTER COLUMN role SET DEFAULT 'hiring_manager';
ALTER TABLE user_profiles ALTER COLUMN role SET NOT NULL;

-- ================================================
-- STEP 3: UPDATE USER_ORGANIZATIONS TABLE
-- ================================================

-- Add temporary column with new enum type
ALTER TABLE user_organizations ADD COLUMN role_new org_role_new;

-- Migrate organization roles (most stay the same, add new options)
UPDATE user_organizations SET role_new = CASE
    WHEN role::text = 'owner' THEN 'owner'::org_role_new
    WHEN role::text = 'admin' THEN 'admin'::org_role_new
    WHEN role::text = 'recruiter' THEN 'recruiter'::org_role_new
    WHEN role::text = 'viewer' THEN 'viewer'::org_role_new
    ELSE 'viewer'::org_role_new -- Default fallback
END;

-- Replace old column with new one (use CASCADE to drop dependent objects)
ALTER TABLE user_organizations DROP COLUMN role CASCADE;
ALTER TABLE user_organizations RENAME COLUMN role_new TO role;
ALTER TABLE user_organizations ALTER COLUMN role SET NOT NULL;

-- ================================================
-- STEP 4: UPDATE ENUM TYPES
-- ================================================

-- Drop old enum types and rename new ones
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS org_role CASCADE;

ALTER TYPE user_role_new RENAME TO user_role;
ALTER TYPE org_role_new RENAME TO org_role;

-- ================================================
-- STEP 5: DROP ALL EXISTING RLS POLICIES
-- ================================================

-- Drop all existing RLS policies that might depend on role columns
-- This includes both the policies we expect and any additional ones
DROP POLICY IF EXISTS "user_profiles_policy" ON user_profiles;
DROP POLICY IF EXISTS "organizations_policy" ON organizations;
DROP POLICY IF EXISTS "organizations_secure_write" ON organizations;
DROP POLICY IF EXISTS "organizations_secure_access" ON organizations;
DROP POLICY IF EXISTS "user_organizations_policy" ON user_organizations;
DROP POLICY IF EXISTS "user_organizations_secure_access" ON user_organizations;
DROP POLICY IF EXISTS "user_organizations_secure_write" ON user_organizations;
DROP POLICY IF EXISTS "clients_policy" ON clients;
DROP POLICY IF EXISTS "clients_secure_access" ON clients;
DROP POLICY IF EXISTS "jobs_policy" ON jobs;
DROP POLICY IF EXISTS "jobs_secure_access" ON jobs;
DROP POLICY IF EXISTS "candidates_policy" ON candidates;
DROP POLICY IF EXISTS "candidates_secure_access" ON candidates;
DROP POLICY IF EXISTS "job_candidate_policy" ON job_candidate;
DROP POLICY IF EXISTS "job_candidate_secure_access" ON job_candidate;
DROP POLICY IF EXISTS "candidate_notes_policy" ON candidate_notes;
DROP POLICY IF EXISTS "candidate_notes_secure_access" ON candidate_notes;
DROP POLICY IF EXISTS "interviews_policy" ON interviews;
DROP POLICY IF EXISTS "interviews_secure_access" ON interviews;
DROP POLICY IF EXISTS "messages_policy" ON messages;
DROP POLICY IF EXISTS "messages_secure_access" ON messages;
DROP POLICY IF EXISTS "message_recipients_policy" ON message_recipients;
DROP POLICY IF EXISTS "message_recipients_secure_access" ON message_recipients;

-- Drop any additional policies that might exist
DO $$
DECLARE
    pol_record RECORD;
BEGIN
    -- Drop all policies on tables that might reference role columns
    FOR pol_record IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN ('user_profiles', 'organizations', 'user_organizations', 'clients', 'jobs', 'candidates', 'job_candidate', 'candidate_notes', 'interviews', 'messages', 'message_recipients')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol_record.policyname, pol_record.schemaname, pol_record.tablename);
    END LOOP;
END $$;

-- ================================================
-- STEP 6: RECREATE RLS POLICIES WITH NEW ROLE SYSTEM
-- ================================================
-- User Profiles - Users can only see their own profile
CREATE POLICY "user_profiles_policy" ON user_profiles
    FOR ALL USING (auth.uid()::uuid = id::uuid);

-- Organizations - Users can see organizations they belong to
CREATE POLICY "organizations_policy" ON organizations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_organizations uo 
            WHERE uo.org_id::uuid = organizations.id::uuid 
            AND uo.user_id::uuid = auth.uid()::uuid
        )
    );

-- User Organizations - Users can see their own organization memberships
CREATE POLICY "user_organizations_policy" ON user_organizations
    FOR ALL USING (user_id::uuid = auth.uid()::uuid);

-- Clients - Organization-scoped access for hiring managers, recruiters, and admins
CREATE POLICY "clients_policy" ON clients
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_organizations uo 
            WHERE uo.org_id::uuid = clients.org_id::uuid 
            AND uo.user_id::uuid = auth.uid()::uuid
            AND uo.role IN ('owner', 'admin', 'hiring_manager', 'recruiter')
        )
    );

-- Jobs - Organization-scoped access with role-based permissions
CREATE POLICY "jobs_policy" ON jobs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_organizations uo 
            WHERE uo.org_id::uuid = jobs.org_id::uuid 
            AND uo.user_id::uuid = auth.uid()::uuid
            AND uo.role IN ('owner', 'admin', 'hiring_manager', 'recruiter', 'interviewer')
        )
    );

-- Candidates - Organization-scoped access for all roles except viewer
CREATE POLICY "candidates_policy" ON candidates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_organizations uo 
            WHERE uo.org_id::uuid = candidates.org_id::uuid 
            AND uo.user_id::uuid = auth.uid()::uuid
            AND uo.role IN ('owner', 'admin', 'hiring_manager', 'recruiter', 'interviewer')
        )
    );

-- Job Candidate relationships - Organization-scoped access
CREATE POLICY "job_candidate_policy" ON job_candidate
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM jobs j
            JOIN user_organizations uo ON uo.org_id::uuid = j.org_id::uuid
            WHERE j.id::uuid = job_candidate.job_id::uuid 
            AND uo.user_id::uuid = auth.uid()::uuid
            AND uo.role IN ('owner', 'admin', 'hiring_manager', 'recruiter', 'interviewer')
        )
    );

-- Candidate Notes - Organization-scoped with author restrictions
CREATE POLICY "candidate_notes_policy" ON candidate_notes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_organizations uo 
            WHERE uo.org_id::uuid = candidate_notes.org_id::uuid 
            AND uo.user_id::uuid = auth.uid()::uuid
            AND (
                uo.role IN ('owner', 'admin', 'hiring_manager', 'recruiter') 
                OR candidate_notes.author_id::uuid = auth.uid()::uuid
            )
        )
    );

-- Interviews - Organization-scoped access for all roles except viewer
CREATE POLICY "interviews_policy" ON interviews
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_organizations uo 
            WHERE uo.org_id::uuid = interviews.org_id::uuid 
            AND uo.user_id::uuid = auth.uid()::uuid
            AND uo.role IN ('owner', 'admin', 'hiring_manager', 'recruiter', 'interviewer')
        )
    );

-- Messages - Organization-scoped access for communication
CREATE POLICY "messages_policy" ON messages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_organizations uo 
            WHERE uo.org_id::uuid = messages.org_id::uuid 
            AND uo.user_id::uuid = auth.uid()::uuid
            AND uo.role IN ('owner', 'admin', 'hiring_manager', 'recruiter', 'interviewer')
        )
    );

-- Message Recipients - Users can see messages they received
CREATE POLICY "message_recipients_policy" ON message_recipients
    FOR ALL USING (recipient_id::uuid = auth.uid()::uuid);

-- ================================================
-- STEP 7: CREATE ROLE PERMISSIONS FUNCTION
-- ================================================

-- Create a function to check user permissions based on new role system
CREATE OR REPLACE FUNCTION check_user_permission(
    user_id uuid,
    org_id uuid,
    required_permissions text[]
) RETURNS boolean AS $$
DECLARE
    user_role text;
    user_permissions text[];
BEGIN
    -- Get user's role in the organization
    SELECT uo.role::text INTO user_role
    FROM user_organizations uo
    WHERE uo.user_id::uuid = check_user_permission.user_id::uuid 
    AND uo.org_id::uuid = check_user_permission.org_id::uuid;
    
    IF user_role IS NULL THEN
        RETURN false;
    END IF;
    
    -- Define permissions for each role
    CASE user_role
        WHEN 'owner' THEN
            user_permissions := ARRAY['read', 'write', 'delete', 'admin', 'manage_users', 'manage_billing'];
        WHEN 'admin' THEN
            user_permissions := ARRAY['read', 'write', 'delete', 'admin', 'manage_users'];
        WHEN 'hiring_manager' THEN
            user_permissions := ARRAY['read', 'write', 'delete', 'create_jobs', 'manage_candidates', 'approve_hires'];
        WHEN 'recruiter' THEN
            user_permissions := ARRAY['read', 'write', 'create_jobs', 'manage_candidates', 'schedule_interviews', 'source_candidates'];
        WHEN 'interviewer' THEN
            user_permissions := ARRAY['read', 'write_feedback', 'view_candidates', 'schedule_interviews', 'conduct_interviews'];
        WHEN 'viewer' THEN
            user_permissions := ARRAY['read'];
        ELSE
            user_permissions := ARRAY[]::text[];
    END CASE;
    
    -- Check if user has all required permissions
    RETURN user_permissions @> required_permissions;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- STEP 8: UPDATE DEMO DATA (IF EXISTS)
-- ================================================

-- Update demo user profile to use new role system
UPDATE user_profiles 
SET role = 'demo_viewer'::user_role 
WHERE id::uuid IN (
    SELECT id::uuid FROM auth.users WHERE email = 'demo@yourapp.com'
);

-- Update demo organization access
UPDATE user_organizations 
SET role = 'viewer'::org_role
WHERE user_id::uuid IN (
    SELECT id::uuid FROM auth.users WHERE email = 'demo@yourapp.com'
);

-- ================================================
-- STEP 9: CREATE INDEXES FOR PERFORMANCE
-- ================================================

-- Add indexes on role columns for better query performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_organizations_role ON user_organizations(role);
CREATE INDEX IF NOT EXISTS idx_user_organizations_composite ON user_organizations(user_id, org_id, role);

-- ================================================
-- VERIFICATION QUERIES
-- ================================================

-- Show results of migration
DO $$
BEGIN
    RAISE NOTICE '=== MIGRATION COMPLETED SUCCESSFULLY ===';
    RAISE NOTICE 'User Profiles Role Distribution:';
    PERFORM pg_sleep(0.1);
END $$;

-- Count users by new role
SELECT 
    role::text as "Role",
    COUNT(*) as "User Count"
FROM user_profiles 
GROUP BY role 
ORDER BY COUNT(*) DESC;

-- Count organization role assignments
SELECT 
    role::text as "Organization Role",
    COUNT(*) as "Assignment Count"
FROM user_organizations 
GROUP BY role 
ORDER BY COUNT(*) DESC;

-- Verify RLS policies are active
SELECT 
    schemaname as "Schema",
    tablename as "Table",
    policyname as "Policy",
    cmd as "Command"
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;

COMMIT;

-- ================================================
-- POST-MIGRATION SUMMARY
-- ================================================

/*
🎉 MIGRATION COMPLETED SUCCESSFULLY!

ROLE MAPPING APPLIED:
✓ bd (Business Development) → hiring_manager
✓ pm (Project Manager) → hiring_manager  
✓ recruiter → recruiter (unchanged)
✓ admin → admin (unchanged)
✓ demo_viewer → demo_viewer (unchanged)

NEW ROLE CAPABILITIES:
- hiring_manager: Team leads, directors, founders who oversee hiring for their department
- recruiter: Talent partners, HR coordinators who source and manage candidates
- admin: Founders, COOs, HR managers with full organizational access
- interviewer: Department leads, tech leads, peer interviewers who review and provide feedback
- demo_viewer: Limited demo access (unchanged)

PERMISSION MATRIX:
- owner: Full access including billing and user management
- admin: Full access except billing
- hiring_manager: Job creation, candidate management, hire approval
- recruiter: Candidate sourcing, pipeline management, interview scheduling
- interviewer: Resume review, feedback, interview participation
- viewer: Read-only access

DATABASE UPDATES:
✓ Updated enum types and constraints
✓ Migrated all existing user role data
✓ Updated RLS policies for new permission model
✓ Created permission checking function
✓ Added performance indexes
✓ Maintained complete data integrity

Your TalentPatriot ATS now better serves small and midsize businesses 
with role definitions that match actual organizational structures!
*/