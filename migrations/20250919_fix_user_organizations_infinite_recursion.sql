-- ========================================
-- CRITICAL FIX: User Organizations Infinite Recursion
-- ========================================
-- Date: 2025-09-19
-- Issue: "infinite recursion detected in policy for relation \"user_organizations\""
-- 
-- This migration fixes the infinite recursion error by simplifying the 
-- user_organizations RLS policy and ensuring functions use SECURITY DEFINER

-- ========================================
-- STEP 1: Drop conflicting policies
-- ========================================

DROP POLICY IF EXISTS "user_organizations_policy" ON user_organizations;
DROP POLICY IF EXISTS "user_organizations_access_policy" ON user_organizations;
DROP POLICY IF EXISTS "user_organizations_secure_access" ON user_organizations;
DROP POLICY IF EXISTS "user_organizations_secure_write" ON user_organizations;

-- ========================================
-- STEP 2: Fix get_user_org_ids function to prevent recursion
-- ========================================

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

-- ========================================
-- STEP 3: Create simple non-recursive policy
-- ========================================

-- Simple policy that only checks user_id = auth.uid()
-- No function calls that could cause recursion
CREATE POLICY "user_organizations_access_simple" ON user_organizations
    FOR ALL 
    TO authenticated
    USING (user_id = auth.uid());

-- ========================================
-- STEP 4: Ensure get_user_role function is also safe
-- ========================================

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
-- STEP 5: Block anonymous access
-- ========================================

CREATE POLICY "user_organizations_block_anon" ON user_organizations
    FOR ALL 
    TO anon 
    USING (false);

-- ========================================
-- VERIFICATION QUERY
-- ========================================
-- After applying this migration, test with:
-- SELECT get_user_org_ids(auth.uid());
-- This should work without infinite recursion