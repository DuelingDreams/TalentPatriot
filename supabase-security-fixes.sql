-- =============================================================================
-- SUPABASE SECURITY FIXES
-- Run this script in the Supabase SQL Editor to resolve security issues
-- =============================================================================

-- =============================================================================
-- 1. ENABLE ROW LEVEL SECURITY ON TIMEZONE_CACHE TABLE
-- =============================================================================

-- Enable RLS on timezone_cache table
ALTER TABLE public.timezone_cache ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for timezone_cache table
-- Allow all authenticated users to read timezone data (it's reference data)
CREATE POLICY "Allow authenticated users to read timezone_cache" 
  ON public.timezone_cache 
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Allow service role to manage timezone cache data
CREATE POLICY "Allow service role to manage timezone_cache" 
  ON public.timezone_cache 
  FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

-- =============================================================================
-- 2. ENABLE LEAKED PASSWORD PROTECTION (PRO PLAN REQUIRED)
-- =============================================================================

-- IMPORTANT: Leaked password protection requires Supabase Pro Plan or above
-- This feature is NOT available on the Free tier

-- If you have Pro Plan, navigate to:
-- Dashboard → Settings → Authentication → Password Security
-- Enable "Prevent use of compromised passwords" (HaveIBeenPwned integration)

-- If you're on Free tier, this security warning can be ignored as the feature
-- is not available in your plan. Consider upgrading to Pro for enhanced security.

-- =============================================================================
-- 3. VERIFY AND SECURE OTHER POTENTIALLY EXPOSED TABLES
-- =============================================================================

-- Check if there are any other tables without RLS enabled
-- This query will show tables that should have RLS but don't
DO $$
DECLARE
    table_record RECORD;
    table_count INTEGER := 0;
BEGIN
    -- Loop through all tables in public schema that don't have RLS enabled
    FOR table_record IN 
        SELECT schemaname, tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename NOT LIKE 'pg_%' 
        AND tablename NOT LIKE 'sql_%'
        AND tablename NOT IN (
            SELECT tablename 
            FROM pg_tables t
            JOIN pg_class c ON c.relname = t.tablename
            WHERE c.relrowsecurity = true
        )
    LOOP
        table_count := table_count + 1;
        RAISE NOTICE 'WARNING: Table %.% does not have RLS enabled', table_record.schemaname, table_record.tablename;
    END LOOP;
    
    IF table_count = 0 THEN
        RAISE NOTICE 'SUCCESS: All public tables have RLS enabled';
    ELSE
        RAISE NOTICE 'SECURITY ALERT: % table(s) found without RLS protection', table_count;
    END IF;
END $$;

-- =============================================================================
-- 4. ADDITIONAL SECURITY MEASURES
-- =============================================================================

-- Ensure all core ATS tables have proper RLS policies if they exist
-- This is a safety check for the main application tables

-- Enable RLS on core tables if they exist and don't have it
DO $$
DECLARE
    tables TEXT[] := ARRAY[
        'user_profiles',
        'organizations', 
        'user_organizations',
        'clients',
        'jobs',
        'candidates',
        'job_candidate',
        'candidate_notes',
        'interviews',
        'messages',
        'message_recipients'
    ];
    table_name TEXT;
BEGIN
    FOREACH table_name IN ARRAY tables
    LOOP
        -- Check if table exists and enable RLS if not already enabled
        IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = table_name) THEN
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', table_name);
            RAISE NOTICE 'RLS enabled on table: %', table_name;
        END IF;
    END LOOP;
END $$;

-- =============================================================================
-- 5. VERIFICATION QUERIES
-- =============================================================================

-- Verify RLS status on all tables
SELECT 
    schemaname,
    tablename,
    CASE 
        WHEN c.relrowsecurity THEN 'RLS ENABLED ✓'
        ELSE 'RLS DISABLED ✗'
    END as rls_status
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE schemaname = 'public'
ORDER BY tablename;

-- Note: To verify leaked password protection status (Pro Plan only):
-- 1. Go to your Supabase Dashboard
-- 2. Navigate to Settings > Authentication > Password Security
-- 3. Look for "Prevent use of compromised passwords" toggle
-- 4. If you don't see this option, you're likely on the Free tier

-- Check your plan status:
SELECT 'For leaked password protection, upgrade to Pro Plan: Dashboard > Settings > Billing' as plan_upgrade_info;

-- =============================================================================
-- COMPLETION MESSAGE
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'SECURITY FIXES APPLIED SUCCESSFULLY';
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE '✓ RLS enabled on timezone_cache table';
    RAISE NOTICE '✓ RLS policies created for timezone_cache';
    RAISE NOTICE '! Leaked password protection requires Pro Plan (not available on Free tier)';
    RAISE NOTICE '✓ Additional security checks completed';
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'MANUAL STEP FOR PRO USERS:';
    RAISE NOTICE '1. Go to Dashboard > Settings > Authentication > Password Security';
    RAISE NOTICE '2. Enable "Prevent use of compromised passwords" (Pro Plan required)';
    RAISE NOTICE '3. If option not visible, you are on Free tier - upgrade to Pro';
    RAISE NOTICE '4. Run verification queries above to confirm RLS status';
    RAISE NOTICE '=============================================================================';
END $$;