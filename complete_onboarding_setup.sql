-- COMPLETE ONBOARDING SETUP SQL SCRIPT
-- Copy and paste this entire script into Supabase SQL Editor
-- This ensures proper user signup → onboarding → organization creation → currentOrgId workflow

-- =================================================================
-- 1. ENABLE REQUIRED EXTENSIONS
-- =================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =================================================================
-- 2. CREATE ENUMS (if they don't exist)
-- =================================================================
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('hiring_manager', 'recruiter', 'admin', 'interviewer', 'demo_viewer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE org_role AS ENUM ('owner', 'admin', 'hiring_manager', 'recruiter', 'interviewer', 'viewer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =================================================================
-- 3. ORGANIZATIONS TABLE
-- =================================================================
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    owner_id UUID NOT NULL, -- references auth.users(id)
    slug TEXT UNIQUE,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- =================================================================
-- 4. USER PROFILES TABLE
-- =================================================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY, -- references auth.users(id)
    role user_role DEFAULT 'hiring_manager' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- =================================================================
-- 5. USER ORGANIZATIONS TABLE (JOIN TABLE)
-- =================================================================
CREATE TABLE IF NOT EXISTS public.user_organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL, -- references auth.users(id)
    org_id UUID REFERENCES public.organizations(id) NOT NULL,
    role org_role NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, org_id)
);

-- =================================================================
-- 6. INDEXES FOR PERFORMANCE
-- =================================================================
CREATE INDEX IF NOT EXISTS idx_organizations_owner_id ON public.organizations(owner_id);
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations(slug);
CREATE INDEX IF NOT EXISTS idx_user_organizations_user_id ON public.user_organizations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_organizations_org_id ON public.user_organizations(org_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_id ON public.user_profiles(id);

-- =================================================================
-- 7. AUTOMATIC USER PROFILE CREATION
-- =================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create user profile automatically when auth user is created
    INSERT INTO public.user_profiles (id, role, created_at, updated_at)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'role', 'hiring_manager')::user_role,
        NOW(),
        NOW()
    );
    RETURN NEW;
EXCEPTION
    WHEN others THEN
        -- Log error but don't fail the user creation
        RAISE WARNING 'Failed to create user profile for %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =================================================================
-- 8. AUTOMATIC ORGANIZATION MEMBERSHIP
-- =================================================================
CREATE OR REPLACE FUNCTION public.handle_new_organization()
RETURNS TRIGGER AS $$
BEGIN
    -- Automatically add owner to user_organizations table
    INSERT INTO public.user_organizations (user_id, org_id, role, joined_at)
    VALUES (NEW.owner_id, NEW.id, 'owner', NOW())
    ON CONFLICT (user_id, org_id) DO NOTHING;
    
    RETURN NEW;
EXCEPTION
    WHEN others THEN
        RAISE WARNING 'Failed to create organization membership for %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new organization
DROP TRIGGER IF EXISTS on_organization_created ON public.organizations;
CREATE TRIGGER on_organization_created
    AFTER INSERT ON public.organizations
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_organization();

-- =================================================================
-- 9. COMPLETE ONBOARDING FUNCTION
-- =================================================================
CREATE OR REPLACE FUNCTION public.complete_user_onboarding(
    user_id UUID,
    org_name TEXT,
    org_slug TEXT DEFAULT NULL,
    user_role TEXT DEFAULT 'hiring_manager',
    company_size TEXT DEFAULT NULL,
    owner_role TEXT DEFAULT 'admin'
)
RETURNS JSON AS $$
DECLARE
    new_org_id UUID;
    final_slug TEXT;
    result JSON;
BEGIN
    -- Generate slug if not provided
    IF org_slug IS NULL OR org_slug = '' THEN
        final_slug := lower(trim(org_name));
        final_slug := regexp_replace(final_slug, '[^a-zA-Z0-9\s-]', '', 'g');
        final_slug := regexp_replace(final_slug, '\s+', '-', 'g');
        final_slug := regexp_replace(final_slug, '-+', '-', 'g');
        final_slug := trim(final_slug, '-');
        final_slug := substring(final_slug from 1 for 50);
        
        -- Ensure slug is unique
        WHILE EXISTS (SELECT 1 FROM public.organizations WHERE slug = final_slug) LOOP
            final_slug := final_slug || '-' || extract(epoch from now())::integer::text;
        END LOOP;
    ELSE
        final_slug := org_slug;
    END IF;
    
    -- Create organization
    INSERT INTO public.organizations (name, owner_id, slug, created_at, metadata)
    VALUES (
        org_name, 
        user_id, 
        final_slug, 
        NOW(),
        json_build_object(
            'companySize', company_size,
            'ownerRole', owner_role,
            'onboardingCompleted', true
        )::jsonb
    )
    RETURNING id INTO new_org_id;
    
    -- Update user profile with role
    UPDATE public.user_profiles 
    SET 
        role = user_role::user_role, 
        updated_at = NOW(),
        metadata = metadata || json_build_object(
            'currentOrgId', new_org_id,
            'companyName', org_name,
            'companySize', company_size,
            'onboardingCompleted', true
        )::jsonb
    WHERE id = user_id;
    
    -- The user_organizations entry is created automatically by trigger
    
    -- Return success with organization details
    SELECT json_build_object(
        'success', true,
        'organizationId', new_org_id,
        'organizationName', org_name,
        'organizationSlug', final_slug,
        'userRole', user_role,
        'ownerRole', owner_role
    ) INTO result;
    
    RETURN result;
    
EXCEPTION
    WHEN unique_violation THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Organization slug already exists'
        );
    WHEN others THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =================================================================
-- 10. GET USER'S CURRENT ORGANIZATION
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
        'joinedAt', uo.joined_at,
        'metadata', o.metadata
    )
    INTO result
    FROM public.organizations o
    JOIN public.user_organizations uo ON o.id = uo.org_id
    WHERE uo.user_id = user_id
    ORDER BY 
        CASE WHEN o.owner_id = user_id THEN 0 ELSE 1 END,
        uo.joined_at DESC
    LIMIT 1;
    
    RETURN COALESCE(result, json_build_object('error', 'No organization found'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =================================================================
-- 11. ROW LEVEL SECURITY (RLS)
-- =================================================================
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_organizations ENABLE ROW LEVEL SECURITY;

-- Organizations policies
DROP POLICY IF EXISTS "Users can view their organizations" ON public.organizations;
CREATE POLICY "Users can view their organizations" ON public.organizations
    FOR SELECT USING (
        auth.uid() = owner_id OR 
        auth.uid() IN (
            SELECT user_id FROM public.user_organizations 
            WHERE org_id = organizations.id
        )
    );

DROP POLICY IF EXISTS "Users can create organizations they own" ON public.organizations;
CREATE POLICY "Users can create organizations they own" ON public.organizations
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Organization owners can update" ON public.organizations;
CREATE POLICY "Organization owners can update" ON public.organizations
    FOR UPDATE USING (auth.uid() = owner_id);

-- User profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "System can create user profiles" ON public.user_profiles;
CREATE POLICY "System can create user profiles" ON public.user_profiles
    FOR INSERT WITH CHECK (true); -- Allow system to create profiles

-- User organizations policies
DROP POLICY IF EXISTS "Users can view their memberships" ON public.user_organizations;
CREATE POLICY "Users can view their memberships" ON public.user_organizations
    FOR SELECT USING (
        auth.uid() = user_id OR
        auth.uid() IN (
            SELECT owner_id FROM public.organizations 
            WHERE id = user_organizations.org_id
        )
    );

DROP POLICY IF EXISTS "Users can create their membership" ON public.user_organizations;
CREATE POLICY "Users can create their membership" ON public.user_organizations
    FOR INSERT WITH CHECK (
        auth.uid() = user_id OR
        auth.uid() IN (
            SELECT owner_id FROM public.organizations 
            WHERE id = user_organizations.org_id
        )
    );

-- =================================================================
-- 12. DEMO ORGANIZATION SETUP
-- =================================================================
INSERT INTO public.organizations (id, name, created_at, owner_id, slug, metadata)
VALUES (
    '3eaf74e7-eda2-415a-a6ca-2556a9425ae2',
    'TalentPatriot Demo Company',
    NOW(),
    '00000000-0000-0000-0000-000000000000', -- System user for demo
    'demo-company',
    '{"demo": true, "companySize": "medium", "onboardingCompleted": true}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    metadata = EXCLUDED.metadata;

-- =================================================================
-- 13. FIX EXISTING USERS WITHOUT PROFILES
-- =================================================================
INSERT INTO public.user_profiles (id, role, created_at, updated_at)
SELECT 
    au.id,
    COALESCE(au.raw_user_meta_data->>'role', 'hiring_manager')::user_role,
    COALESCE(au.created_at, NOW()),
    NOW()
FROM auth.users au
WHERE au.id NOT IN (SELECT id FROM public.user_profiles)
    AND au.id != '00000000-0000-0000-0000-000000000000'
    AND au.email IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- =================================================================
-- 14. GRANT PERMISSIONS
-- =================================================================
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Specific function grants
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_organization() TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_user_onboarding(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_current_organization(UUID) TO authenticated;

-- =================================================================
-- 15. VERIFICATION AND TESTING
-- =================================================================

-- Test if triggers are working
SELECT 
    trigger_name, 
    event_manipulation, 
    event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
    AND trigger_name IN ('on_auth_user_created', 'on_organization_created');

-- Test if functions exist
SELECT 
    routine_name, 
    routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
    AND routine_name IN ('handle_new_user', 'handle_new_organization', 'complete_user_onboarding', 'get_user_current_organization');

-- Verify demo organization exists
SELECT id, name, slug FROM public.organizations WHERE id = '3eaf74e7-eda2-415a-a6ca-2556a9425ae2';

-- =================================================================
-- 16. SUCCESS MESSAGE
-- =================================================================
DO $$
BEGIN
    RAISE NOTICE '✅ ONBOARDING SETUP COMPLETE!';
    RAISE NOTICE '   - User profiles will be created automatically on signup';
    RAISE NOTICE '   - Organization membership will be handled automatically';
    RAISE NOTICE '   - Demo organization is ready';
    RAISE NOTICE '   - RLS policies are in place';
    RAISE NOTICE '   - Helper functions are available';
END $$;