-- Fix Client Performance View RLS
-- Run this script in Supabase SQL Editor
-- This wraps the materialized view with a security-filtered view

-- Drop existing view if it exists
DROP VIEW IF EXISTS public.vw_client_performance;

-- Create a view that includes the security filter directly in the query
-- This ensures users can only see data for their own organization
CREATE VIEW public.vw_client_performance 
WITH (security_invoker = on)
AS
SELECT mv.*
FROM public.mv_client_performance mv
WHERE EXISTS (
    SELECT 1
    FROM public.user_organizations uo
    WHERE uo.user_id = auth.uid()
      AND uo.org_id = mv.org_id
);

-- Grant access to authenticated users
GRANT SELECT ON public.vw_client_performance TO authenticated;

-- Verification: Check that the view was created
SELECT 'View created successfully' AS status
WHERE EXISTS (
    SELECT 1 FROM information_schema.views 
    WHERE table_name = 'vw_client_performance' 
    AND table_schema = 'public'
);
