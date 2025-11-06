-- ============================================
-- Pre-Deployment Verification Script
-- ============================================
-- Run this BEFORE the consolidation to document current state
-- NOTE: This script verifies data counts and policy configuration
-- RLS behavior must be tested manually via the application
-- ============================================

-- Verify total record counts (should remain unchanged after consolidation)
SELECT 
    'BEFORE: Data Counts' as checkpoint,
    (SELECT COUNT(*) FROM jobs) as total_jobs,
    (SELECT COUNT(*) FROM jobs WHERE status = 'open'::job_status AND published_at IS NOT NULL) as published_jobs,
    (SELECT COUNT(*) FROM organizations) as total_orgs,
    (SELECT COUNT(*) FROM user_organizations) as total_memberships,
    (SELECT COUNT(*) FROM messages) as total_messages,
    (SELECT COUNT(*) FROM job_candidate) as total_job_candidates,
    (SELECT COUNT(*) FROM pipeline_columns) as total_pipeline_columns;

-- ============================================
-- Policy Summary
-- ============================================
SELECT 
    'CURRENT POLICY COUNTS' as summary,
    tablename,
    COUNT(*) as total_policies,
    COUNT(*) FILTER (WHERE cmd = 'SELECT') as select_policies,
    COUNT(*) FILTER (WHERE cmd = 'INSERT') as insert_policies,
    COUNT(*) FILTER (WHERE cmd = 'UPDATE') as update_policies,
    COUNT(*) FILTER (WHERE cmd = 'DELETE') as delete_policies,
    COUNT(*) FILTER (WHERE cmd = 'ALL') as all_policies
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('jobs', 'organizations', 'user_organizations', 'messages', 'job_candidate', 'pipeline_columns')
GROUP BY tablename
ORDER BY tablename;

-- ============================================
-- Save this output before running consolidation
-- ============================================
