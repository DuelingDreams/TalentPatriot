-- ========================================
-- FIX: User Organizations Infinite Recursion
-- ========================================
-- This script fixes the infinite recursion error in user_organizations table
-- by simplifying the policy and ensuring functions bypass RLS when needed

BEGIN;

-- ========================================
-- STEP 1: Drop all existing policies on user_organizations
-- ========================================

-- Remove any existing policies that might be causing conflicts
DROP POLICY IF EXISTS "user_organizations_policy" ON user_organizations;
DROP POLICY IF EXISTS "user_organizations_access_policy" ON user_organizations;
DROP POLICY IF EXISTS "user_organizations_secure_access" ON user_organizations;
DROP POLICY IF EXISTS "user_organizations_secure_write" ON user_organizations;
DROP POLICY IF EXISTS "block_anonymous_access" ON user_organizations;

-- ========================================
-- STEP 2: Create or update the get_user_org_ids function
-- ========================================

-- Create a function that bypasses RLS to prevent recursion
-- This function uses SECURITY DEFINER to run with elevated privileges
CREATE OR REPLACE FUNCTION get_user_org_ids(user_id UUID)
RETURNS UUID[]
LANGUAGE sql
SECURITY DEFINER  -- This bypasses RLS
STABLE
AS $$
  SELECT ARRAY_AGG(org_id) 
  FROM user_organizations 
  WHERE user_id = $1;
$$;

-- ========================================
-- STEP 3: Create a simple, non-recursive policy for user_organizations
-- ========================================

-- Simple policy: users can only see their own organization memberships
-- This policy is intentionally simple to avoid any recursion
CREATE POLICY "user_organizations_simple_policy" ON user_organizations
    FOR ALL 
    TO authenticated
    USING (user_id = auth.uid());

-- ========================================
-- STEP 4: Block anonymous access
-- ========================================

-- Ensure anonymous users cannot access user_organizations
CREATE POLICY "user_organizations_block_anonymous" ON user_organizations
    FOR ALL 
    TO anon 
    USING (false);

-- ========================================
-- STEP 5: Update the get_user_role function to be more efficient
-- ========================================

-- Ensure this function also uses SECURITY DEFINER
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT role::text FROM user_profiles WHERE id = user_id),
    'hiring_manager'
  );
$$;

-- ========================================
-- STEP 6: Create helper function to check demo viewer status
-- ========================================

CREATE OR REPLACE FUNCTION is_demo_viewer(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT get_user_role(user_id) = 'demo_viewer';
$$;

-- ========================================
-- STEP 7: Test the fix
-- ========================================

-- Test query to verify the function works without recursion
-- This should return the current user's organization IDs
-- Comment this out after testing
-- SELECT get_user_org_ids(auth.uid());

COMMIT;

-- ========================================
-- NOTES:
-- ========================================
-- 1. The SECURITY DEFINER on get_user_org_ids() allows it to bypass RLS
--    when querying user_organizations, preventing infinite recursion
-- 2. The user_organizations policy is kept simple: user_id = auth.uid()
-- 3. Functions are marked as STABLE for performance
-- 4. This maintains security while eliminating the circular dependency