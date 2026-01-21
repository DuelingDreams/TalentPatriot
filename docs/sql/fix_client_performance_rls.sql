-- Fix Client Performance View RLS
-- Run this script in Supabase SQL Editor
-- This wraps the materialized view with a regular view that supports RLS

-- Step 1: Create a regular view that wraps the materialized view
-- This allows RLS policies to be applied while keeping MV performance benefits
CREATE OR REPLACE VIEW public.vw_client_performance AS
SELECT *
FROM public.mv_client_performance;

-- Step 2: Enable Row Level Security on the view
ALTER VIEW public.vw_client_performance SET (security_invoker = on);

-- Step 3: Create RLS policy for organization members
-- This ensures users can only see data for their own organization
DO $$
BEGIN
    -- Drop existing policy if it exists
    DROP POLICY IF EXISTS org_members_can_read_client_performance ON public.vw_client_performance;
EXCEPTION
    WHEN undefined_object THEN
        NULL;
END $$;

CREATE POLICY org_members_can_read_client_performance
ON public.vw_client_performance
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.user_organizations uo
        WHERE uo.user_id = auth.uid()
          AND uo.org_id = vw_client_performance.org_id
    )
);

-- Verification: Check that the view and policy were created
SELECT 'View created successfully' AS status
WHERE EXISTS (
    SELECT 1 FROM information_schema.views 
    WHERE table_name = 'vw_client_performance' 
    AND table_schema = 'public'
);
