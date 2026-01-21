-- Create/Refresh mv_client_performance Materialized View
-- Run this script in Supabase SQL Editor
-- This creates the materialized view that powers client performance reports

-- Drop existing views (in correct order - wrapper view first)
DROP VIEW IF EXISTS public.vw_client_performance;
DROP MATERIALIZED VIEW IF EXISTS public.mv_client_performance;

-- Create the materialized view with client performance metrics
CREATE MATERIALIZED VIEW public.mv_client_performance AS
SELECT
  c.org_id,
  c.id AS client_id,
  c.name AS client_name,
  c.industry,
  -- Total jobs count
  COUNT(DISTINCT j.id) AS total_jobs,
  -- Active jobs (open status)
  COUNT(DISTINCT CASE WHEN j.status = 'open' THEN j.id END) AS active_jobs,
  -- Filled jobs count
  COUNT(DISTINCT CASE WHEN j.status = 'filled' THEN j.id END) AS filled_jobs,
  -- Fill rate (filled / total)
  CASE 
    WHEN COUNT(DISTINCT j.id) > 0 
    THEN ROUND(COUNT(DISTINCT CASE WHEN j.status = 'filled' THEN j.id END)::NUMERIC / COUNT(DISTINCT j.id), 2)
    ELSE 0 
  END AS fill_rate,
  -- Average time to fill (days from posted to filled)
  COALESCE(
    AVG(
      CASE 
        WHEN j.status = 'filled' AND j.created_at IS NOT NULL
        THEN EXTRACT(DAY FROM (COALESCE(j.updated_at, NOW()) - j.created_at))
      END
    ),
    0
  )::INTEGER AS avg_time_to_fill,
  -- Aging jobs (open for more than 30 days)
  COUNT(DISTINCT CASE 
    WHEN j.status = 'open' AND j.created_at < NOW() - INTERVAL '30 days' 
    THEN j.id 
  END) AS aging_jobs_30_days,
  -- Total candidates across all jobs for this client
  COUNT(DISTINCT jc.candidate_id) AS total_candidates,
  -- Hired candidates
  COUNT(DISTINCT CASE WHEN jc.stage = 'hired' THEN jc.candidate_id END) AS candidates_hired
FROM clients c
LEFT JOIN jobs j ON j.client_id = c.id
LEFT JOIN job_candidates jc ON jc.job_id = j.id
WHERE c.org_id IS NOT NULL
GROUP BY c.org_id, c.id, c.name, c.industry;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_mv_client_performance_org_id 
ON mv_client_performance(org_id);

-- Create the wrapper view with security filter (for RLS)
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

-- Grant permissions
GRANT SELECT ON public.mv_client_performance TO authenticated;
GRANT SELECT ON public.vw_client_performance TO authenticated;

-- Verification
SELECT 'Materialized view created with ' || COUNT(*) || ' rows' AS status 
FROM mv_client_performance;
