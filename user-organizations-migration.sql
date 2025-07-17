-- =============================================================================
-- USER ORGANIZATIONS JOIN TABLE MIGRATION & RLS POLICIES
-- =============================================================================
-- Execute this script in your Supabase SQL Editor

-- =============================================================================
-- STEP 1: CREATE ORG_ROLE ENUM
-- =============================================================================

-- Create the enum type first if it doesn't exist
DO $$ BEGIN
    CREATE TYPE org_role AS ENUM ('owner', 'admin', 'recruiter', 'viewer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =============================================================================
-- STEP 2: CREATE USER_ORGANIZATIONS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS user_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL, -- references auth.users(id)
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role org_role NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create unique constraint to prevent duplicate user-org relationships
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_organizations_unique 
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
-- STEP 4: CREATE RLS POLICIES FOR USER_ORGANIZATIONS
-- =============================================================================

-- Clear any existing policies
DROP POLICY IF EXISTS "users_can_read_their_orgs" ON user_organizations;
DROP POLICY IF EXISTS "org_admins_can_read_users" ON user_organizations;
DROP POLICY IF EXISTS "org_owners_admins_can_invite_users" ON user_organizations;
DROP POLICY IF EXISTS "org_owners_admins_can_update_roles" ON user_organizations;
DROP POLICY IF EXISTS "users_can_leave_orgs" ON user_organizations;
DROP POLICY IF EXISTS "org_owners_admins_can_remove_users" ON user_organizations;
DROP POLICY IF EXISTS "deny_unauthenticated_user_orgs" ON user_organizations;

-- Users can read their own organization memberships
CREATE POLICY "users_can_read_their_orgs"
ON user_organizations FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Organization admins and owners can read all users in their organizations
CREATE POLICY "org_admins_can_read_users"
ON user_organizations FOR SELECT TO authenticated
USING (
  org_id IN (
    SELECT org_id FROM user_organizations uo2
    WHERE uo2.user_id = auth.uid()
    AND uo2.role IN ('owner', 'admin')
  )
);

-- Organization owners and admins can invite users
CREATE POLICY "org_owners_admins_can_invite_users"
ON user_organizations FOR INSERT TO authenticated
WITH CHECK (
  org_id IN (
    SELECT org_id FROM user_organizations uo2
    WHERE uo2.user_id = auth.uid()
    AND uo2.role IN ('owner', 'admin')
  )
);

-- Organization owners and admins can update user roles (but not demote themselves if they're the only owner)
CREATE POLICY "org_owners_admins_can_update_roles"
ON user_organizations FOR UPDATE TO authenticated
USING (
  org_id IN (
    SELECT org_id FROM user_organizations uo2
    WHERE uo2.user_id = auth.uid()
    AND uo2.role IN ('owner', 'admin')
  )
)
WITH CHECK (
  org_id IN (
    SELECT org_id FROM user_organizations uo2
    WHERE uo2.user_id = auth.uid()
    AND uo2.role IN ('owner', 'admin')
  )
);

-- Users can leave organizations (delete their own membership)
CREATE POLICY "users_can_leave_orgs"
ON user_organizations FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Organization owners and admins can remove users
CREATE POLICY "org_owners_admins_can_remove_users"
ON user_organizations FOR DELETE TO authenticated
USING (
  org_id IN (
    SELECT org_id FROM user_organizations uo2
    WHERE uo2.user_id = auth.uid()
    AND uo2.role IN ('owner', 'admin')
  )
);

-- Block unauthenticated access
CREATE POLICY "deny_unauthenticated_user_orgs"
ON user_organizations FOR ALL TO anon
USING (false);

-- =============================================================================
-- STEP 5: UPDATE ORGANIZATIONS RLS POLICIES TO USE JOIN TABLE
-- =============================================================================

-- Drop existing organization policies
DROP POLICY IF EXISTS "org_owners_read" ON organizations;
DROP POLICY IF EXISTS "org_owners_write" ON organizations;
DROP POLICY IF EXISTS "org_owners_update" ON organizations;
DROP POLICY IF EXISTS "org_owners_delete" ON organizations;

-- Users can read organizations they belong to
CREATE POLICY "org_members_read"
ON organizations FOR SELECT TO authenticated
USING (
  id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid()
  )
);

-- Users can create organizations (they will automatically become owners via trigger or application logic)
CREATE POLICY "authenticated_users_create_orgs"
ON organizations FOR INSERT TO authenticated
WITH CHECK (auth.uid() = owner_id);

-- Organization owners and admins can update organization details
CREATE POLICY "org_owners_admins_update"
ON organizations FOR UPDATE TO authenticated
USING (
  id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin')
  )
)
WITH CHECK (
  id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin')
  )
);

-- Only organization owners can delete organizations
CREATE POLICY "org_owners_delete"
ON organizations FOR DELETE TO authenticated
USING (
  id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid()
    AND role = 'owner'
  )
);

-- =============================================================================
-- STEP 6: GRANT NECESSARY PERMISSIONS
-- =============================================================================

-- Grant usage on the user_organizations table to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON user_organizations TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =============================================================================
-- STEP 7: OPTIONAL - CREATE FUNCTION TO AUTO-ADD OWNER TO USER_ORGANIZATIONS
-- =============================================================================

-- Function to automatically add organization creator as owner
CREATE OR REPLACE FUNCTION add_owner_to_user_organizations()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_organizations (user_id, org_id, role)
  VALUES (NEW.owner_id, NEW.id, 'owner');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-add owner when organization is created
DROP TRIGGER IF EXISTS trigger_add_owner_to_user_organizations ON organizations;
CREATE TRIGGER trigger_add_owner_to_user_organizations
  AFTER INSERT ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION add_owner_to_user_organizations();

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
-- The user_organizations table is now ready with proper RLS policies
-- Users can only access organizations they belong to based on their role
-- Organization owners and admins have additional permissions
-- Unauthenticated users have no access