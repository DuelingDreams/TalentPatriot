-- =============================================================================
-- ORGANIZATIONS TABLE MIGRATION & RLS POLICIES
-- =============================================================================
-- Execute this script in your Supabase SQL Editor

-- =============================================================================
-- STEP 1: CREATE ORGANIZATIONS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  owner_id UUID NOT NULL, -- references auth.users(id)
  slug TEXT UNIQUE
);

-- Create unique index on slug (for better performance)
CREATE UNIQUE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug) WHERE slug IS NOT NULL;

-- Create index on owner_id for faster queries
CREATE INDEX IF NOT EXISTS idx_organizations_owner_id ON organizations(owner_id);

-- =============================================================================
-- STEP 2: ENABLE ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- STEP 3: CREATE RLS POLICIES
-- =============================================================================

-- Clear any existing policies
DROP POLICY IF EXISTS "org_owners_read" ON organizations;
DROP POLICY IF EXISTS "org_owners_write" ON organizations;
DROP POLICY IF EXISTS "org_owners_update" ON organizations;
DROP POLICY IF EXISTS "org_owners_delete" ON organizations;
DROP POLICY IF EXISTS "deny_unauthenticated_organizations" ON organizations;

-- Organization owners can read their organizations
CREATE POLICY "org_owners_read"
ON organizations FOR SELECT TO authenticated
USING (auth.uid() = owner_id);

-- Organization owners can create organizations (they will be the owner)
CREATE POLICY "org_owners_write"
ON organizations FOR INSERT TO authenticated
WITH CHECK (auth.uid() = owner_id);

-- Organization owners can update their organizations
CREATE POLICY "org_owners_update"
ON organizations FOR UPDATE TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- Organization owners can delete their organizations
CREATE POLICY "org_owners_delete"
ON organizations FOR DELETE TO authenticated
USING (auth.uid() = owner_id);

-- Block unauthenticated access
CREATE POLICY "deny_unauthenticated_organizations"
ON organizations FOR ALL TO anon
USING (false);

-- =============================================================================
-- STEP 4: VERIFY POLICIES (Optional - for testing)
-- =============================================================================

-- Test queries (run these as different authenticated users to verify access)
-- SELECT * FROM organizations; -- Should only show organizations owned by current user
-- INSERT INTO organizations (name, owner_id) VALUES ('Test Org', auth.uid()); -- Should work
-- UPDATE organizations SET name = 'Updated Name' WHERE id = 'some-id'; -- Should only work for owned orgs
-- DELETE FROM organizations WHERE id = 'some-id'; -- Should only work for owned orgs

-- =============================================================================
-- STEP 5: GRANT NECESSARY PERMISSIONS (if needed)
-- =============================================================================

-- Grant usage on the organizations table to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON organizations TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
-- The organizations table is now ready with proper RLS policies
-- Only organization owners can read/write their own organizations
-- Unauthenticated users have no access