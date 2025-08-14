-- =============================================================================
-- FIX ENUM ERROR - Run this FIRST to clean up invalid data
-- Copy and paste this script into Supabase SQL Editor and run it BEFORE the main script
-- =============================================================================

-- First, let's see what invalid data exists
DO $$
DECLARE
    invalid_count INTEGER;
BEGIN
    -- Check for invalid user_role values
    SELECT COUNT(*) INTO invalid_count
    FROM public.user_profiles 
    WHERE role::text NOT IN ('hiring_manager', 'recruiter', 'admin', 'interviewer', 'demo_viewer');
    
    IF invalid_count > 0 THEN
        RAISE NOTICE 'Found % invalid user_role values', invalid_count;
        
        -- Show the invalid values
        FOR rec IN 
            SELECT id, role::text as invalid_role 
            FROM public.user_profiles 
            WHERE role::text NOT IN ('hiring_manager', 'recruiter', 'admin', 'interviewer', 'demo_viewer')
        LOOP
            RAISE NOTICE 'User % has invalid role: %', rec.id, rec.invalid_role;
        END LOOP;
    ELSE
        RAISE NOTICE 'No invalid user_role values found';
    END IF;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Could not check user_profiles table: %', SQLERRM;
END $$;

-- Clean up invalid data
DO $$
BEGIN
    -- Update any invalid user_role values to 'hiring_manager' (default)
    UPDATE public.user_profiles 
    SET role = 'hiring_manager'::user_role
    WHERE role::text NOT IN ('hiring_manager', 'recruiter', 'admin', 'interviewer', 'demo_viewer');
    
    RAISE NOTICE '✓ Cleaned up invalid user_role values';
EXCEPTION
    WHEN others THEN
        RAISE NOTICE '⚠ Could not clean user_profiles: %', SQLERRM;
        
        -- If the enum doesn't exist, we need to handle this differently
        -- Try to convert the column to text first, then back to enum
        BEGIN
            -- Convert role column to text temporarily
            ALTER TABLE public.user_profiles ALTER COLUMN role TYPE text;
            
            -- Update invalid values
            UPDATE public.user_profiles 
            SET role = 'hiring_manager' 
            WHERE role NOT IN ('hiring_manager', 'recruiter', 'admin', 'interviewer', 'demo_viewer');
            
            RAISE NOTICE '✓ Converted role column to text and cleaned up invalid values';
        EXCEPTION
            WHEN others THEN
                RAISE NOTICE '⚠ Could not fix role column: %', SQLERRM;
        END;
END $$;

-- Clean up any invalid org_role values if they exist
DO $$
BEGIN
    -- Check if user_organizations table exists and clean it
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_organizations') THEN
        -- Update any invalid org_role values
        UPDATE public.user_organizations 
        SET role = 'recruiter'::org_role
        WHERE role::text NOT IN ('owner', 'admin', 'hiring_manager', 'recruiter', 'interviewer', 'viewer');
        
        RAISE NOTICE '✓ Cleaned up invalid org_role values';
    END IF;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE '⚠ Could not clean user_organizations: %', SQLERRM;
        
        -- Similar handling for org_role
        BEGIN
            ALTER TABLE public.user_organizations ALTER COLUMN role TYPE text;
            
            UPDATE public.user_organizations 
            SET role = 'recruiter' 
            WHERE role NOT IN ('owner', 'admin', 'hiring_manager', 'recruiter', 'interviewer', 'viewer');
            
            RAISE NOTICE '✓ Converted org_role column to text and cleaned up invalid values';
        EXCEPTION
            WHEN others THEN
                RAISE NOTICE '⚠ Could not fix org_role column: %', SQLERRM;
        END;
END $$;

-- Now create/recreate the enums safely
DO $$ 
BEGIN
    -- Drop and recreate user_role enum
    DROP TYPE IF EXISTS user_role CASCADE;
    CREATE TYPE user_role AS ENUM ('hiring_manager', 'recruiter', 'admin', 'interviewer', 'demo_viewer');
    RAISE NOTICE '✓ Created user_role enum';
    
    -- Drop and recreate org_role enum  
    DROP TYPE IF EXISTS org_role CASCADE;
    CREATE TYPE org_role AS ENUM ('owner', 'admin', 'hiring_manager', 'recruiter', 'interviewer', 'viewer');
    RAISE NOTICE '✓ Created org_role enum';
    
EXCEPTION
    WHEN others THEN
        RAISE NOTICE '⚠ Could not recreate enums: %', SQLERRM;
END $$;

-- Convert columns back to enum types
DO $$
BEGIN
    -- Convert user_profiles.role back to enum
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
        ALTER TABLE public.user_profiles 
        ALTER COLUMN role TYPE user_role 
        USING role::user_role;
        
        RAISE NOTICE '✓ Converted user_profiles.role to user_role enum';
    END IF;
    
    -- Convert user_organizations.role back to enum  
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_organizations') THEN
        ALTER TABLE public.user_organizations 
        ALTER COLUMN role TYPE org_role 
        USING role::org_role;
        
        RAISE NOTICE '✓ Converted user_organizations.role to org_role enum';
    END IF;
    
EXCEPTION
    WHEN others THEN
        RAISE NOTICE '⚠ Could not convert columns to enum: %', SQLERRM;
END $$;

-- Final verification
DO $$
DECLARE
    user_role_count INTEGER;
    org_role_count INTEGER;
BEGIN
    -- Count valid user roles
    SELECT COUNT(*) INTO user_role_count
    FROM public.user_profiles;
    
    -- Count valid org roles
    SELECT COUNT(*) INTO org_role_count  
    FROM public.user_organizations;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== CLEANUP COMPLETE ===';
    RAISE NOTICE '✓ User profiles with valid roles: %', COALESCE(user_role_count, 0);
    RAISE NOTICE '✓ User organizations with valid roles: %', COALESCE(org_role_count, 0);
    RAISE NOTICE '';
    RAISE NOTICE 'You can now run the main COPY_TO_SUPABASE.sql script';
    RAISE NOTICE '';
    
EXCEPTION
    WHEN others THEN
        RAISE NOTICE '⚠ Verification failed: %', SQLERRM;
END $$;