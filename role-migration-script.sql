-- TalentPatriot Role Migration Script
-- Updates user roles to reflect small and midsize business structure
-- From: bd, pm, recruiter → To: hiring_manager, recruiter, admin, interviewer

-- ================================================
-- STEP 1: CREATE NEW ROLE ENUMS
-- ================================================

-- Create new user_role enum with SMB-focused roles
DO $$ BEGIN
    -- Drop the existing enum and recreate it (this approach handles dependencies)
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
-- STEP 2: DATA MIGRATION LOGIC
-- ================================================

-- Migrate existing user_profiles roles
-- bd → hiring_manager (Business Development becomes Hiring Manager)
-- pm → hiring_manager (Project Manager becomes Hiring Manager) 
-- recruiter → recruiter (remains the same)
-- admin → admin (remains the same)
-- demo_viewer → demo_viewer (remains the same)

-- Add temporary column with new enum type
ALTER TABLE user_profiles ADD COLUMN role_new user_role_new;

-- Migrate data with role mapping
UPDATE user_profiles SET role_new = CASE
    WHEN role::text = 'bd' THEN 'hiring_manager'::user_role_new
    WHEN role::text = 'pm' THEN 'hiring_manager'::user_role_new
    WHEN role::text = 'recruiter' THEN 'recruiter'::user_role_new
    WHEN role::text = 'admin' THEN 'admin'::user_role_new
    WHEN role::text = 'demo_viewer' THEN 'demo_viewer'::user_role_new
    ELSE 'hiring_manager'::user_role_new -- Default fallback
END;

-- Migrate user_organizations roles
-- Similar mapping for org roles
ALTER TABLE user_organizations ADD COLUMN role_new org_role_new;

UPDATE user_organizations SET role_new = CASE
    WHEN role::text = 'owner' THEN 'owner'::org_role_new
    WHEN role::text = 'admin' THEN 'admin'::org_role_new
    WHEN role::text = 'recruiter' THEN 'recruiter'::org_role_new
    WHEN role::text = 'viewer' THEN 'viewer'::org_role_new
    ELSE 'viewer'::org_role_new -- Default fallback
END;

-- ================================================
-- STEP 3: REPLACE OLD COLUMNS WITH NEW ONES
-- ================================================

-- Drop old columns and rename new ones for user_profiles
ALTER TABLE user_profiles DROP COLUMN role;
ALTER TABLE user_profiles RENAME COLUMN role_new TO role;

-- Set default for new role column
ALTER TABLE user_profiles ALTER COLUMN role SET DEFAULT 'hiring_manager'::user_role_new;
ALTER TABLE user_profiles ALTER COLUMN role SET NOT NULL;

-- Drop old columns and rename new ones for user_organizations  
ALTER TABLE user_organizations DROP COLUMN role;
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
-- STEP 5: UPDATE RLS POLICIES
-- ================================================

-- Drop existing RLS policies that reference old roles
DROP POLICY IF EXISTS "user_profiles_policy" ON user_profiles;
DROP POLICY IF EXISTS "organizations_policy" ON organizations;
DROP POLICY IF EXISTS "user_organizations_policy" ON user_organizations;
DROP POLICY IF EXISTS "clients_policy" ON clients;
DROP POLICY IF EXISTS "jobs_policy" ON jobs;
DROP POLICY IF EXISTS "candidates_policy" ON candidates;
DROP POLICY IF EXISTS "job_candidate_policy" ON job_candidate;
DROP POLICY IF EXISTS "candidate_notes_policy" ON candidate_notes;
DROP POLICY IF EXISTS "interviews_policy" ON interviews;
DROP POLICY IF EXISTS "messages_policy" ON messages;
DROP POLICY IF EXISTS "message_recipients_policy" ON message_recipients;

-- Recreate RLS policies with new role system
-- User Profiles - Users can only see their own profile
CREATE POLICY "user_profiles_policy" ON user_profiles
    FOR ALL USING (auth.uid() = id);

-- Organizations - Users can see organizations they belong to
CREATE POLICY "organizations_policy" ON organizations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_organizations uo 
            WHERE uo.org_id = organizations.id 
            AND uo.user_id = auth.uid()
        )
    );

-- User Organizations - Users can see their own organization memberships
CREATE POLICY "user_organizations_policy" ON user_organizations
    FOR ALL USING (user_id = auth.uid());

-- Clients - Organization-scoped access
CREATE POLICY "clients_policy" ON clients
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_organizations uo 
            WHERE uo.org_id = clients.org_id 
            AND uo.user_id = auth.uid()
            AND uo.role IN ('owner', 'admin', 'hiring_manager', 'recruiter')
        )
    );

-- Jobs - Organization-scoped access with role-based permissions
CREATE POLICY "jobs_policy" ON jobs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_organizations uo 
            WHERE uo.org_id = jobs.org_id 
            AND uo.user_id = auth.uid()
            AND uo.role IN ('owner', 'admin', 'hiring_manager', 'recruiter', 'interviewer')
        )
    );

-- Candidates - Organization-scoped access
CREATE POLICY "candidates_policy" ON candidates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_organizations uo 
            WHERE uo.org_id = candidates.org_id 
            AND uo.user_id = auth.uid()
            AND uo.role IN ('owner', 'admin', 'hiring_manager', 'recruiter', 'interviewer')
        )
    );

-- Job Candidate relationships - Organization-scoped access
CREATE POLICY "job_candidate_policy" ON job_candidate
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM jobs j
            JOIN user_organizations uo ON uo.org_id = j.org_id
            WHERE j.id = job_candidate.job_id 
            AND uo.user_id = auth.uid()
            AND uo.role IN ('owner', 'admin', 'hiring_manager', 'recruiter', 'interviewer')
        )
    );

-- Candidate Notes - Organization-scoped with author restrictions
CREATE POLICY "candidate_notes_policy" ON candidate_notes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_organizations uo 
            WHERE uo.org_id = candidate_notes.org_id 
            AND uo.user_id = auth.uid()
            AND (
                uo.role IN ('owner', 'admin', 'hiring_manager', 'recruiter') 
                OR candidate_notes.author_id = auth.uid()
            )
        )
    );

-- Interviews - Organization-scoped access
CREATE POLICY "interviews_policy" ON interviews
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_organizations uo 
            WHERE uo.org_id = interviews.org_id 
            AND uo.user_id = auth.uid()
            AND uo.role IN ('owner', 'admin', 'hiring_manager', 'recruiter', 'interviewer')
        )
    );

-- Messages - Organization-scoped access
CREATE POLICY "messages_policy" ON messages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_organizations uo 
            WHERE uo.org_id = messages.org_id 
            AND uo.user_id = auth.uid()
            AND uo.role IN ('owner', 'admin', 'hiring_manager', 'recruiter', 'interviewer')
        )
    );

-- Message Recipients - Users can see messages they received
CREATE POLICY "message_recipients_policy" ON message_recipients
    FOR ALL USING (user_id = auth.uid());

-- ================================================
-- STEP 6: CREATE ROLE PERMISSIONS FUNCTION
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
    WHERE uo.user_id = user_id AND uo.org_id = org_id;
    
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
            user_permissions := ARRAY['read', 'write', 'delete', 'create_jobs', 'manage_candidates'];
        WHEN 'recruiter' THEN
            user_permissions := ARRAY['read', 'write', 'create_jobs', 'manage_candidates', 'schedule_interviews'];
        WHEN 'interviewer' THEN
            user_permissions := ARRAY['read', 'write_feedback', 'view_candidates', 'schedule_interviews'];
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
-- STEP 7: UPDATE DEMO DATA (IF EXISTS)
-- ================================================

-- Update any existing demo user to use new role system
UPDATE user_profiles 
SET role = 'demo_viewer'::user_role 
WHERE id IN (
    SELECT id FROM auth.users WHERE email = 'demo@yourapp.com'
);

-- Update demo organization access
UPDATE user_organizations 
SET role = 'viewer'::org_role
WHERE user_id IN (
    SELECT id FROM auth.users WHERE email = 'demo@yourapp.com'
);

-- ================================================
-- VERIFICATION QUERIES
-- ================================================

-- Count users by new role
SELECT 
    role,
    COUNT(*) as user_count
FROM user_profiles 
GROUP BY role 
ORDER BY user_count DESC;

-- Count organization roles
SELECT 
    role,
    COUNT(*) as assignment_count
FROM user_organizations 
GROUP BY role 
ORDER BY assignment_count DESC;

-- Verify RLS policies are active
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;

-- ================================================
-- ROLLBACK SCRIPT (SAVE FOR EMERGENCY)
-- ================================================

/*
-- Emergency rollback script (DO NOT RUN unless rollback needed)
-- This would need to be customized based on your specific data

-- Create old enum types
CREATE TYPE user_role_old AS ENUM ('recruiter', 'bd', 'pm', 'demo_viewer', 'admin');
CREATE TYPE org_role_old AS ENUM ('owner', 'admin', 'recruiter', 'viewer');

-- Add rollback columns
ALTER TABLE user_profiles ADD COLUMN role_rollback user_role_old;
ALTER TABLE user_organizations ADD COLUMN role_rollback org_role_old;

-- Reverse migration (would need data-specific logic)
UPDATE user_profiles SET role_rollback = 'recruiter'::user_role_old WHERE role = 'hiring_manager';
-- ... additional rollback logic

-- Drop new columns and restore old ones
-- ALTER TABLE user_profiles DROP COLUMN role;
-- ALTER TABLE user_profiles RENAME COLUMN role_rollback TO role;
-- etc...
*/

COMMIT;

-- ================================================
-- POST-MIGRATION NOTES
-- ================================================

/*
SUMMARY OF CHANGES:

1. ROLE MAPPING:
   - bd (Business Development) → hiring_manager
   - pm (Project Manager) → hiring_manager  
   - recruiter → recruiter (unchanged)
   - admin → admin (unchanged)
   - demo_viewer → demo_viewer (unchanged)

2. NEW ROLE CAPABILITIES:
   - hiring_manager: Can create jobs, manage candidates, oversee department hiring
   - recruiter: Can source candidates, manage pipeline, schedule interviews
   - admin: Full organizational access, user management
   - interviewer: Can review resumes, provide feedback, participate in interviews
   - demo_viewer: Limited demo access (unchanged)

3. PERMISSION MATRIX:
   - owner: Full access to everything including billing
   - admin: Full access except billing
   - hiring_manager: Job creation, candidate management, team hiring oversight
   - recruiter: Candidate sourcing, pipeline management, interview scheduling
   - interviewer: Resume review, feedback, interview participation
   - viewer: Read-only access

4. DATABASE IMPACT:
   - Updated all enum types and constraints
   - Migrated existing user role data
   - Updated RLS policies for new permission model
   - Created permission checking function
   - Maintained data integrity throughout migration

5. FRONTEND IMPACT:
   - Update role selection dropdowns
   - Update navigation role filtering
   - Update role badge colors and descriptions
   - Update onboarding flow role options

This migration enables TalentPatriot to better serve small and midsize businesses
with role definitions that match their actual organizational structures.
*/