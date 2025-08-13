-- SAFE ONBOARDING SETUP SQL SCRIPT
-- Copy and paste this entire script into Supabase SQL Editor
-- This avoids foreign key constraint issues and focuses on core onboarding functionality

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
-- 3. REMOVE FOREIGN KEY CONSTRAINT FROM ORGANIZATIONS IF IT EXISTS
-- =================================================================
DO $$
BEGIN
    -- Check if foreign key constraint exists and drop it
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'organizations_owner_id_fkey'
        AND table_name = 'organizations'
    ) THEN
        ALTER TABLE public.organizations DROP CONSTRAINT organizations_owner_id_fkey;
        RAISE NOTICE 'Removed foreign key constraint on organizations.owner_id';
    END IF;
END $$;

-- =================================================================
-- 4. CREATE/UPDATE ORGANIZATIONS TABLE
-- =================================================================
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    owner_id UUID NOT NULL, -- references auth.users(id) but no FK constraint
    slug TEXT UNIQUE,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- =================================================================
-- 5. USER PROFILES TABLE
-- =================================================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY, -- references auth.users(id)
    role user_role DEFAULT 'hiring_manager' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- =================================================================
-- 6. USER ORGANIZATIONS TABLE (JOIN TABLE)
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
-- 7. INDEXES FOR PERFORMANCE
-- =================================================================
CREATE INDEX IF NOT EXISTS idx_organizations_owner_id ON public.organizations(owner_id);
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations(slug);
CREATE INDEX IF NOT EXISTS idx_user_organizations_user_id ON public.user_organizations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_organizations_org_id ON public.user_organizations(org_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_id ON public.user_profiles(id);

-- =================================================================
-- 8. AUTOMATIC USER PROFILE CREATION
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
-- 9. AUTOMATIC ORGANIZATION MEMBERSHIP
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
-- 10. COMPLETE ONBOARDING FUNCTION
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
-- 11. GET USER'S CURRENT ORGANIZATION
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
-- 12. ROW LEVEL SECURITY (RLS)
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
-- 13. CREATE DEMO ORGANIZATION SAFELY
-- =================================================================
-- Only create demo organization if you have a real user to assign as owner
-- Replace 'YOUR_USER_ID_HERE' with an actual user ID from auth.users

-- First, let's see if there are any existing users
DO $$
DECLARE
    first_user_id UUID;
    demo_org_id UUID := '3eaf74e7-eda2-415a-a6ca-2556a9425ae2';
BEGIN
    -- Try to find the first real user
    SELECT id INTO first_user_id 
    FROM auth.users 
    WHERE email IS NOT NULL 
    AND id != '00000000-0000-0000-0000-000000000000'
    LIMIT 1;
    
    IF first_user_id IS NOT NULL THEN
        -- Create demo organization with real user as owner
        INSERT INTO public.organizations (id, name, created_at, owner_id, slug, metadata)
        VALUES (
            demo_org_id,
            'TalentPatriot Demo Company',
            NOW(),
            first_user_id,
            'demo-company',
            '{"demo": true, "companySize": "medium", "onboardingCompleted": true}'::jsonb
        )
        ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            metadata = EXCLUDED.metadata;
        
        RAISE NOTICE 'Demo organization created with user % as owner', first_user_id;
    ELSE
        RAISE NOTICE 'No users found - demo organization will be created when first user signs up';
    END IF;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Could not create demo organization: %', SQLERRM;
END $$;

-- =================================================================
-- 14. FIX EXISTING USERS WITHOUT PROFILES
-- =================================================================
INSERT INTO public.user_profiles (id, role, created_at, updated_at)
SELECT 
    au.id,
    COALESCE(au.raw_user_meta_data->>'role', 'hiring_manager')::user_role,
    COALESCE(au.created_at, NOW()),
    NOW()
FROM auth.users au
WHERE au.id NOT IN (SELECT id FROM public.user_profiles)
    AND au.email IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- =================================================================
-- 15. GRANT PERMISSIONS
-- =================================================================
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- =================================================================
-- 16. VERIFICATION
-- =================================================================
SELECT 
    'Triggers' as component,
    count(*) as count
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
    AND trigger_name IN ('on_auth_user_created', 'on_organization_created')

UNION ALL

SELECT 
    'Functions' as component,
    count(*) as count
FROM information_schema.routines 
WHERE routine_schema = 'public' 
    AND routine_name IN ('handle_new_user', 'handle_new_organization', 'complete_user_onboarding', 'get_user_current_organization')

UNION ALL

SELECT 
    'Organizations' as component,
    count(*) as count
FROM public.organizations

UNION ALL

SELECT 
    'User Profiles' as component,
    count(*) as count
FROM public.user_profiles;

-- =================================================================
-- 17. SUCCESS MESSAGE
-- =================================================================
DO $$
BEGIN
    RAISE NOTICE '✅ SAFE ONBOARDING SETUP COMPLETE!';
    RAISE NOTICE '   - Removed problematic foreign key constraints';
    RAISE NOTICE '   - User profiles will be created automatically on signup';
    RAISE NOTICE '   - Organization membership will be handled automatically';
    RAISE NOTICE '   - Demo organization created with existing user (if any)';
    RAISE NOTICE '   - RLS policies are in place';
    RAISE NOTICE '   - Helper functions are available';
    RAISE NOTICE '   - Ready for user onboarding workflow';
END $$;