-- =============================================================================
-- TALENTPATRIOT USER-ORGANIZATION ASSIGNMENT SETUP
-- Copy and paste this ENTIRE script into Supabase SQL Editor and run it
-- This sets up the database for automated user-organization assignments
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums if they don't exist
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

-- Remove problematic foreign key constraint if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'organizations_owner_id_fkey'
        AND table_name = 'organizations'
    ) THEN
        ALTER TABLE public.organizations DROP CONSTRAINT organizations_owner_id_fkey;
        RAISE NOTICE '✓ Removed foreign key constraint on organizations.owner_id';
    END IF;
END $$;

-- Create/update organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    owner_id UUID NOT NULL,
    slug TEXT UNIQUE,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create user profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY,
    role user_role DEFAULT 'hiring_manager' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create user organizations join table
CREATE TABLE IF NOT EXISTS public.user_organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    org_id UUID REFERENCES public.organizations(id) NOT NULL,
    role org_role NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, org_id)
);

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_organizations_owner_id ON public.organizations(owner_id);
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations(slug);
CREATE INDEX IF NOT EXISTS idx_user_organizations_user_id ON public.user_organizations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_organizations_org_id ON public.user_organizations(org_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_id ON public.user_profiles(id);

-- Function to automatically create user profile when auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
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
        RAISE WARNING 'Failed to create user profile for %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for automatic user profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to automatically add owner to user_organizations table
CREATE OR REPLACE FUNCTION public.handle_new_organization()
RETURNS TRIGGER AS $$
BEGIN
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

-- Trigger for automatic organization membership
DROP TRIGGER IF EXISTS on_organization_created ON public.organizations;
CREATE TRIGGER on_organization_created
    AFTER INSERT ON public.organizations
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_organization();

-- Complete onboarding function
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

-- Function to get user's current organization
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

-- Enable Row Level Security
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
    FOR INSERT WITH CHECK (true);

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

-- Create demo organization safely (only if users exist)
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
        
        RAISE NOTICE '✓ Demo organization created with user % as owner', first_user_id;
    ELSE
        RAISE NOTICE 'ℹ No users found - demo organization will be created when first user signs up';
    END IF;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE '⚠ Could not create demo organization: %', SQLERRM;
END $$;

-- Fix existing users without profiles
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

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Final verification
DO $$
DECLARE
    trigger_count INTEGER;
    function_count INTEGER;
    organization_count INTEGER;
    profile_count INTEGER;
BEGIN
    -- Count triggers
    SELECT count(*) INTO trigger_count
    FROM information_schema.triggers 
    WHERE trigger_schema = 'public' 
        AND trigger_name IN ('on_auth_user_created', 'on_organization_created');
    
    -- Count functions
    SELECT count(*) INTO function_count
    FROM information_schema.routines 
    WHERE routine_schema = 'public' 
        AND routine_name IN ('handle_new_user', 'handle_new_organization', 'complete_user_onboarding', 'get_user_current_organization');
    
    -- Count organizations
    SELECT count(*) INTO organization_count FROM public.organizations;
    
    -- Count user profiles
    SELECT count(*) INTO profile_count FROM public.user_profiles;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== SETUP COMPLETE ===';
    RAISE NOTICE '✓ Triggers installed: %', trigger_count;
    RAISE NOTICE '✓ Functions created: %', function_count;
    RAISE NOTICE '✓ Organizations: %', organization_count;
    RAISE NOTICE '✓ User profiles: %', profile_count;
    RAISE NOTICE '';
    RAISE NOTICE 'Ready for user-organization assignments!';
    RAISE NOTICE 'Users will automatically be assigned to organizations during signup.';
    RAISE NOTICE '';
END $$;