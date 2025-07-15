-- =====================================================
-- Enable Public Demo Access in Supabase
-- =====================================================
-- Run these commands as a Supabase admin to enable
-- public access to demo data

-- Enable anonymous access to tables (must be run by admin)
GRANT SELECT ON clients TO anon;
GRANT SELECT ON jobs TO anon;
GRANT SELECT ON candidates TO anon;
GRANT SELECT ON job_candidate TO anon;
GRANT SELECT ON candidate_notes TO anon;

-- Grant authenticated users access (if not already done)
GRANT SELECT ON clients TO authenticated;
GRANT SELECT ON jobs TO authenticated;
GRANT SELECT ON candidates TO authenticated;
GRANT SELECT ON job_candidate TO authenticated;
GRANT SELECT ON candidate_notes TO authenticated;

-- Grant INSERT, UPDATE, DELETE to authenticated users for non-demo data
-- (Controlled by RLS policies)
GRANT INSERT, UPDATE, DELETE ON clients TO authenticated;
GRANT INSERT, UPDATE, DELETE ON jobs TO authenticated;
GRANT INSERT, UPDATE, DELETE ON candidates TO authenticated;
GRANT INSERT, UPDATE, DELETE ON job_candidate TO authenticated;
GRANT INSERT, UPDATE, DELETE ON candidate_notes TO authenticated;

-- Verify public access works
-- Test these queries without authentication:
/*
SELECT COUNT(*) FROM clients WHERE status = 'demo';
SELECT COUNT(*) FROM jobs WHERE record_status = 'demo';
SELECT COUNT(*) FROM candidates WHERE status = 'demo';
SELECT COUNT(*) FROM job_candidate WHERE status = 'demo';
SELECT COUNT(*) FROM candidate_notes WHERE EXISTS (
    SELECT 1 FROM job_candidate 
    WHERE job_candidate.id = candidate_notes.job_candidate_id 
    AND job_candidate.status = 'demo'
);
*/

-- These should fail or return 0 without authentication:
/*
SELECT COUNT(*) FROM clients WHERE status != 'demo' OR status IS NULL;
SELECT COUNT(*) FROM jobs WHERE record_status != 'demo' OR record_status IS NULL;
*/