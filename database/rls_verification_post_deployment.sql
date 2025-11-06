-- ============================================
-- Post-Deployment Verification Script
-- ============================================
-- Run this AFTER the consolidation to verify nothing broke
-- Compare output with pre-deployment results
-- ============================================

-- Verify data counts unchanged (service role sees all data regardless of RLS)
SELECT 
    'AFTER: Data Counts (should match BEFORE)' as checkpoint,
    (SELECT COUNT(*) FROM jobs) as total_jobs,
    (SELECT COUNT(*) FROM jobs WHERE status = 'open'::job_status AND published_at IS NOT NULL) as published_jobs,
    (SELECT COUNT(*) FROM organizations) as total_orgs,
    (SELECT COUNT(*) FROM user_organizations) as total_memberships,
    (SELECT COUNT(*) FROM messages) as total_messages,
    (SELECT COUNT(*) FROM job_candidate) as total_job_candidates,
    (SELECT COUNT(*) FROM pipeline_columns) as total_pipeline_columns;

-- EXPECTED: All counts identical to pre-deployment script

-- ============================================
-- Policy Summary - After Consolidation
-- ============================================
SELECT 
    'CONSOLIDATED POLICY COUNTS' as summary,
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

-- EXPECTED POLICY COUNTS:
-- jobs: 3 (was 6)
-- organizations: 3 (was 7)
-- user_organizations: 5 (was 10)
-- messages: 2 (was 4)
-- job_candidate: 3 (was 5)
-- pipeline_columns: 2 (was 2, unchanged - both needed)

-- ============================================
-- Duplicate Policy Check (should return 0 rows)
-- ============================================
SELECT 
    'REMAINING DUPLICATES (should be empty)' as check_name,
    tablename,
    UNNEST(roles) as role_name,
    cmd::text as operation,
    COUNT(*) as duplicate_count,
    string_agg(policyname, ', ') as policy_names
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('jobs', 'organizations', 'user_organizations', 'messages', 'job_candidate', 'pipeline_columns')
GROUP BY tablename, UNNEST(roles), cmd::text
HAVING COUNT(*) > 1;
-- EXPECTED: 0 rows (no duplicates)

-- ============================================
-- Success Criteria:
-- ============================================
-- ✅ All TEST results match pre-deployment counts
-- ✅ Policy counts reduced as expected
-- ✅ No duplicate policies remain
-- ✅ Supabase Performance Advisor shows 0 warnings
-- ============================================
