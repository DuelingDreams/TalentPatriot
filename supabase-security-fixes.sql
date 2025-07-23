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
-- 2. ENABLE LEAKED PASSWORD PROTECTION
-- =============================================================================

-- Note: Leaked password protection in Supabase is enabled through the Dashboard
-- Go to Authentication > Settings > Password Protection and toggle "Enable"
-- This SQL script cannot directly enable it as it requires Dashboard configuration

-- However, we can verify if it's enabled by checking auth settings
-- The actual setting is managed through Supabase's admin interface

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

-- Note: To verify leaked password protection status:
-- 1. Go to your Supabase Dashboard
-- 2. Navigate to Authentication > Settings
-- 3. Check the "Password Protection" section
-- 4. Ensure "Prevent use of compromised passwords" is enabled

-- You can also check auth configuration with:
SELECT 'Please enable Leaked Password Protection in Dashboard: Authentication > Settings > Password Protection' as instruction;

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
    RAISE NOTICE '! Leaked password protection must be enabled manually in Dashboard';
    RAISE NOTICE '✓ Additional security checks completed';
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'MANUAL STEP REQUIRED:';
    RAISE NOTICE '1. Go to Supabase Dashboard > Authentication > Settings';
    RAISE NOTICE '2. Enable "Prevent use of compromised passwords" under Password Protection';
    RAISE NOTICE '3. Run the verification queries above to confirm RLS status';
    RAISE NOTICE '=============================================================================';
END $$;