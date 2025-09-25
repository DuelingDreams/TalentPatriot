-- =============================================================================
-- FIX MISSING USER_ORGANIZATIONS TABLE - CORRECTED VERSION
-- =============================================================================
-- This fixes the "relation 'user_organizations' does not exist" error
-- Execute this script in your Supabase SQL Editor

-- =============================================================================
-- STEP 1: CREATE OR UPDATE ORG_ROLE ENUM (Complete Version)
-- =============================================================================

-- Create the enum type with all required values if it doesn't exist
DO $$ BEGIN
    CREATE TYPE org_role AS ENUM ('owner', 'admin', 'hiring_manager', 'recruiter', 'interviewer', 'viewer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- If enum already exists but missing values, add them safely
DO $$ 
DECLARE
    enum_values text[];
BEGIN
    -- Get current enum values
    SELECT array_agg(enumlabel ORDER BY enumsortorder) 
    INTO enum_values
    FROM pg_enum 
    WHERE enumtypid = 'org_role'::regtype;
    
    -- Add missing enum values if they don't exist
    IF 'hiring_manager' != ALL(enum_values) THEN
        ALTER TYPE org_role ADD VALUE 'hiring_manager';
    END IF;
    
    IF 'interviewer' != ALL(enum_values) THEN
        ALTER TYPE org_role ADD VALUE 'interviewer';
    END IF;
    
    -- Log what we found/added
    RAISE NOTICE 'org_role enum updated. Current values: %', (
        SELECT array_agg(enumlabel ORDER BY enumsortorder) 
        FROM pg_enum 
        WHERE enumtypid = 'org_role'::regtype
    );
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not update org_role enum: %', SQLERRM;
END $$;

-- =============================================================================
-- STEP 2: CREATE USER_ORGANIZATIONS TABLE (Complete Schema)
-- =============================================================================

CREATE TABLE IF NOT EXISTS user_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL, -- references auth.users(id)
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role org_role NOT NULL,
  is_recruiter_seat BOOLEAN NOT NULL DEFAULT false, -- This drives pricing!
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create unique constraint to prevent duplicate user-org relationships (matches schema.ts)
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_org 
ON user_organizations(user_id, org_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_organizations_user_id ON user_organizations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_organizations_org_id ON user_organizations(org_id);
CREATE INDEX IF NOT EXISTS idx_user_organizations_role ON user_organizations(role);

-- =============================================================================
-- STEP 3: ENABLE ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- STEP 4: CREATE SAFE RLS POLICIES (Based on recursion fix)
-- =============================================================================

-- Drop any existing policies that might cause recursion
DROP POLICY IF EXISTS "user_organizations_policy" ON user_organizations;
DROP POLICY IF EXISTS "user_organizations_access_policy" ON user_organizations;
DROP POLICY IF EXISTS "user_organizations_secure_access" ON user_organizations;
DROP POLICY IF EXISTS "user_organizations_secure_write" ON user_organizations;
DROP POLICY IF EXISTS "users_can_read_their_orgs" ON user_organizations;
DROP POLICY IF EXISTS "org_admins_can_read_users" ON user_organizations;

-- Simple policy that only checks user_id = auth.uid() (prevents recursion)
CREATE POLICY "user_organizations_access_simple" ON user_organizations
    FOR ALL 
    TO authenticated
    USING (user_id = auth.uid());

-- Block anonymous access
CREATE POLICY "user_organizations_block_anon" ON user_organizations
    FOR ALL 
    TO anon 
    USING (false);

-- =============================================================================
-- STEP 5: CREATE SAFE HELPER FUNCTIONS
-- =============================================================================

-- Safe function to get user org IDs without recursion
CREATE OR REPLACE FUNCTION get_user_org_ids(user_id UUID)
RETURNS UUID[]
LANGUAGE sql
SECURITY DEFINER  -- This bypasses RLS to prevent recursion
STABLE
AS $$
  SELECT ARRAY_AGG(org_id) 
  FROM user_organizations 
  WHERE user_id = $1;
$$;

-- =============================================================================
-- STEP 6: POPULATE ORGANIZATION MEMBERSHIP DATA
-- =============================================================================

-- Add organization owners first (from organizations table)
INSERT INTO user_organizations (user_id, org_id, role, is_recruiter_seat)
SELECT DISTINCT 
  o.owner_id as user_id,
  o.id as org_id,
  'owner' as role,
  true as is_recruiter_seat -- Owner gets recruiter seat
FROM organizations o 
WHERE o.owner_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM user_organizations uo 
    WHERE uo.user_id = o.owner_id AND uo.org_id = o.id
  )
ON CONFLICT (user_id, org_id) DO NOTHING;

-- Add job creators as hiring managers
INSERT INTO user_organizations (user_id, org_id, role, is_recruiter_seat)
SELECT DISTINCT 
  j.created_by as user_id,
  j.org_id,
  'hiring_manager' as role,
  true as is_recruiter_seat -- Job creators get recruiter seats
FROM jobs j 
WHERE j.created_by IS NOT NULL 
  AND j.org_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM user_organizations uo 
    WHERE uo.user_id = j.created_by AND uo.org_id = j.org_id
  )
ON CONFLICT (user_id, org_id) DO NOTHING;

-- Add candidate creators as recruiters
INSERT INTO user_organizations (user_id, org_id, role, is_recruiter_seat)
SELECT DISTINCT 
  c.created_by as user_id,
  c.org_id,
  'recruiter' as role,
  true as is_recruiter_seat -- Candidate creators get recruiter seats
FROM candidates c 
WHERE c.created_by IS NOT NULL 
  AND c.org_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM user_organizations uo 
    WHERE uo.user_id = c.created_by AND uo.org_id = c.org_id
  )
ON CONFLICT (user_id, org_id) DO NOTHING;

-- =============================================================================
-- COMPLETION
-- =============================================================================

SELECT 
    'user_organizations table created successfully!' as status,
    COUNT(*) as total_memberships
FROM user_organizations;