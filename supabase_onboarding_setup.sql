-- Supabase Onboarding and Organization Setup Script
-- Copy and paste this entire script into Supabase SQL Editor

-- =================================================================
-- 1. CREATE NECESSARY FUNCTIONS AND TRIGGERS
-- =================================================================

-- Function to automatically create user profile when auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into user_profiles table
  INSERT INTO public.user_profiles (id, role, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'hiring_manager')::user_role,
    NOW(),
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call handle_new_user function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to ensure organization membership after org creation
CREATE OR REPLACE FUNCTION public.ensure_organization_membership()
RETURNS TRIGGER AS $$
BEGIN
  -- Automatically add the owner to user_organizations table
  INSERT INTO public.user_organizations (user_id, org_id, role, joined_at)
  VALUES (
    NEW.owner_id,
    NEW.id,
    'owner',
    NOW()
  )
  ON CONFLICT (user_id, org_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for organization membership
DROP TRIGGER IF EXISTS on_organization_created ON public.organizations;
CREATE TRIGGER on_organization_created
  AFTER INSERT ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.ensure_organization_membership();

-- =================================================================
-- 2. ENSURE PROPER INDEXES FOR PERFORMANCE
-- =================================================================

-- Index for user organizations lookup
CREATE INDEX IF NOT EXISTS idx_user_organizations_user_id 
ON public.user_organizations(user_id);

CREATE INDEX IF NOT EXISTS idx_user_organizations_org_id 
ON public.user_organizations(org_id);

-- Index for organization owner lookup
CREATE INDEX IF NOT EXISTS idx_organizations_owner_id 
ON public.organizations(owner_id);

-- Index for jobs by organization
CREATE INDEX IF NOT EXISTS idx_jobs_org_id 
ON public.jobs(org_id);

-- =================================================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- =================================================================

-- Enable RLS on all tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_candidate ENABLE ROW LEVEL SECURITY;

-- User profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Organizations policies
DROP POLICY IF EXISTS "Users can view organizations they belong to" ON public.organizations;
CREATE POLICY "Users can view organizations they belong to" ON public.organizations
  FOR SELECT USING (
    auth.uid() = owner_id OR 
    auth.uid() IN (
      SELECT user_id FROM public.user_organizations 
      WHERE org_id = organizations.id
    )
  );

DROP POLICY IF EXISTS "Users can create organizations" ON public.organizations;
CREATE POLICY "Users can create organizations" ON public.organizations
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Organization owners can update" ON public.organizations;
CREATE POLICY "Organization owners can update" ON public.organizations
  FOR UPDATE USING (auth.uid() = owner_id);

-- User organizations policies
DROP POLICY IF EXISTS "Users can view their organization memberships" ON public.user_organizations;
CREATE POLICY "Users can view their organization memberships" ON public.user_organizations
  FOR SELECT USING (
    auth.uid() = user_id OR
    auth.uid() IN (
      SELECT owner_id FROM public.organizations 
      WHERE id = user_organizations.org_id
    )
  );

DROP POLICY IF EXISTS "Organization owners can manage memberships" ON public.user_organizations;
CREATE POLICY "Organization owners can manage memberships" ON public.user_organizations
  FOR ALL USING (
    auth.uid() IN (
      SELECT owner_id FROM public.organizations 
      WHERE id = user_organizations.org_id
    )
  );

DROP POLICY IF EXISTS "Users can create their own membership" ON public.user_organizations;
CREATE POLICY "Users can create their own membership" ON public.user_organizations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Jobs policies
DROP POLICY IF EXISTS "Organization members can view jobs" ON public.jobs;
CREATE POLICY "Organization members can view jobs" ON public.jobs
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.user_organizations 
      WHERE org_id = jobs.org_id
    )
  );

DROP POLICY IF EXISTS "Organization members can create jobs" ON public.jobs;
CREATE POLICY "Organization members can create jobs" ON public.jobs
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.user_organizations 
      WHERE org_id = jobs.org_id
    )
  );

-- =================================================================
-- 4. DEMO ORGANIZATION SETUP
-- =================================================================

-- Insert demo organization if it doesn't exist
INSERT INTO public.organizations (id, name, created_at, owner_id, slug)
VALUES (
  '3eaf74e7-eda2-415a-a6ca-2556a9425ae2',
  'TalentPatriot Demo Company',
  NOW(),
  '00000000-0000-0000-0000-000000000000', -- System user for demo
  'demo-company'
)
ON CONFLICT (id) DO NOTHING;

-- =================================================================
-- 5. HELPER FUNCTION FOR ONBOARDING
-- =================================================================

-- Function to complete user onboarding
CREATE OR REPLACE FUNCTION public.complete_user_onboarding(
  user_id UUID,
  org_name TEXT,
  org_slug TEXT DEFAULT NULL,
  user_role TEXT DEFAULT 'hiring_manager',
  company_size TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  new_org_id UUID;
  final_slug TEXT;
  result JSON;
BEGIN
  -- Generate slug if not provided
  IF org_slug IS NULL THEN
    final_slug := lower(regexp_replace(org_name, '[^a-zA-Z0-9\s]', '', 'g'));
    final_slug := regexp_replace(final_slug, '\s+', '-', 'g');
    final_slug := substring(final_slug from 1 for 50);
  ELSE
    final_slug := org_slug;
  END IF;
  
  -- Create organization
  INSERT INTO public.organizations (name, owner_id, slug, created_at)
  VALUES (org_name, user_id, final_slug, NOW())
  RETURNING id INTO new_org_id;
  
  -- Add user to organization (this should happen automatically via trigger)
  INSERT INTO public.user_organizations (user_id, org_id, role, joined_at)
  VALUES (user_id, new_org_id, 'owner', NOW())
  ON CONFLICT (user_id, org_id) DO NOTHING;
  
  -- Update user profile
  UPDATE public.user_profiles 
  SET role = user_role::user_role, updated_at = NOW()
  WHERE id = user_id;
  
  -- Return organization details
  SELECT json_build_object(
    'success', true,
    'organizationId', new_org_id,
    'organizationName', org_name,
    'organizationSlug', final_slug,
    'userRole', user_role
  ) INTO result;
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =================================================================
-- 6. FUNCTION TO GET USER'S CURRENT ORGANIZATION
-- =================================================================

CREATE OR REPLACE FUNCTION public.get_user_current_organization(user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'organizationId', o.id,
    'organizationName', o.name,
    'organizationSlug', o.slug,
    'userRole', uo.role,
    'isOwner', (o.owner_id = user_id),
    'joinedAt', uo.joined_at
  )
  INTO result
  FROM public.organizations o
  JOIN public.user_organizations uo ON o.id = uo.org_id
  WHERE uo.user_id = user_id
  ORDER BY uo.joined_at DESC
  LIMIT 1;
  
  RETURN COALESCE(result, json_build_object('error', 'No organization found'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =================================================================
-- 7. ENSURE EXISTING USERS HAVE PROFILES
-- =================================================================

-- Create user profiles for existing auth users who don't have them
INSERT INTO public.user_profiles (id, role, created_at, updated_at)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'role', 'hiring_manager')::user_role,
  NOW(),
  NOW()
FROM auth.users au
WHERE au.id NOT IN (SELECT id FROM public.user_profiles)
AND au.id != '00000000-0000-0000-0000-000000000000'; -- Skip system user

-- =================================================================
-- 8. GRANT NECESSARY PERMISSIONS
-- =================================================================

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_organization_membership() TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_user_onboarding(UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_current_organization(UUID) TO authenticated;

-- Grant table permissions
GRANT SELECT, INSERT, UPDATE ON public.user_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.organizations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_organizations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.jobs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.candidates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipeline_columns TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_candidate TO authenticated;

-- =================================================================
-- 9. VERIFICATION QUERIES (UNCOMMENT TO TEST)
-- =================================================================

-- Check if triggers are working
-- SELECT trigger_name, event_manipulation, action_statement 
-- FROM information_schema.triggers 
-- WHERE trigger_schema = 'public';

-- Check if functions exist
-- SELECT routine_name, routine_type 
-- FROM information_schema.routines 
-- WHERE routine_schema = 'public' AND routine_name LIKE '%user%';

-- Test the onboarding function (replace with actual user ID)
-- SELECT public.complete_user_onboarding(
--   'your-user-id-here'::UUID,
--   'Test Company',
--   'test-company',
--   'admin',
--   'small'
-- );