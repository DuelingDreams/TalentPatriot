-- ============================================================================
-- DROP UNUSED user_google_integrations TABLE
-- ============================================================================
-- Purpose: Remove the unused user_google_integrations table
-- The application uses the connected_accounts table instead
--
-- SAFETY: This script is wrapped in a transaction with rollback capability
-- 
-- To execute in Supabase SQL Editor:
-- 1. Copy this entire script
-- 2. Paste into Supabase SQL Editor
-- 3. Review the output
-- 4. If everything looks correct, manually execute: COMMIT;
-- 5. If there's an issue, execute: ROLLBACK;
-- ============================================================================

BEGIN;

-- Step 1: Check if table exists and show row count
DO $$
DECLARE
    table_exists boolean;
    row_count integer;
BEGIN
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_google_integrations'
    ) INTO table_exists;
    
    IF table_exists THEN
        EXECUTE 'SELECT COUNT(*) FROM public.user_google_integrations' INTO row_count;
        RAISE NOTICE 'Table user_google_integrations exists with % rows', row_count;
        
        IF row_count > 0 THEN
            RAISE NOTICE 'WARNING: Table contains % rows of data', row_count;
        END IF;
    ELSE
        RAISE NOTICE 'Table user_google_integrations does not exist';
    END IF;
END $$;

-- Step 2: Drop the table if it exists
DROP TABLE IF EXISTS public.user_google_integrations;

-- Step 3: Confirm completion
DO $$
BEGIN
    RAISE NOTICE '✅ Drop command executed successfully';
    RAISE NOTICE '⚠️  TRANSACTION IS OPEN - You must manually execute COMMIT or ROLLBACK';
    RAISE NOTICE '';
    RAISE NOTICE 'Execute: COMMIT;   (to save changes)';
    RAISE NOTICE 'Execute: ROLLBACK; (to undo changes)';
END $$;

-- DO NOT AUTO-COMMIT
-- You must manually execute COMMIT; or ROLLBACK; after reviewing the output
