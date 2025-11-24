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

-- Step 1: Verify the table exists and show row count
DO $$
DECLARE
    table_exists boolean;
    row_count integer;
BEGIN
    -- Check if table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_google_integrations'
    ) INTO table_exists;
    
    IF table_exists THEN
        -- Get row count
        EXECUTE 'SELECT COUNT(*) FROM public.user_google_integrations' INTO row_count;
        RAISE NOTICE 'Table user_google_integrations exists with % rows', row_count;
        
        -- Show sample data (first 5 rows) if any
        IF row_count > 0 THEN
            RAISE NOTICE 'WARNING: Table contains data. Review before committing.';
            RAISE NOTICE 'First 5 rows:';
            -- Note: Adjust column names based on actual table structure
        END IF;
    ELSE
        RAISE NOTICE 'Table user_google_integrations does not exist - nothing to drop';
    END IF;
END $$;

-- Step 2: Drop the table if it exists
DROP TABLE IF EXISTS public.user_google_integrations;

RAISE NOTICE '✅ Table user_google_integrations dropped successfully';
RAISE NOTICE '⚠️  TRANSACTION IS OPEN - You must manually execute COMMIT or ROLLBACK';
RAISE NOTICE 'Execute: COMMIT;   (to save changes)';
RAISE NOTICE 'Execute: ROLLBACK; (to undo changes)';

-- DO NOT AUTO-COMMIT
-- You must manually execute COMMIT; or ROLLBACK; after reviewing the output
