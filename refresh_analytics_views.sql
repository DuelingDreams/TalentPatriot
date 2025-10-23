-- Refresh Analytics Materialized Views
-- Run this after updating candidate source data to see changes in Reports

-- Refresh all analytics materialized views
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_candidate_sources;
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_pipeline_metrics;
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_time_to_hire;
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_skills_analytics;
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_recruiter_performance;
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_client_performance;

-- Verify the refresh worked - check candidate sources
SELECT 
  source,
  total_applications,
  hired_count,
  ROUND(hire_rate * 100, 1) as hire_rate_percent
FROM mv_candidate_sources
WHERE org_id = '64eea1fa-1993-4966-bbd8-3d5109957c20'  -- Hildebrand Construction (your org)
ORDER BY total_applications DESC;

-- Expected output should show:
-- LinkedIn: 5 applications
-- Indeed: 5 applications  
-- Company Website: 4 applications
-- Referral: 2 applications
-- Social Media: 2 applications
-- Job Board: 1 application
