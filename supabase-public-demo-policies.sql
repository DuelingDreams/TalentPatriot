-- =====================================================
-- Supabase Public Demo Access RLS Policies
-- =====================================================
-- These policies allow public (unauthenticated) read-only access
-- to demo data only (status = 'demo' records)
-- This enables public demo functionality without authentication

-- =====================================================
-- PUBLIC DEMO POLICIES FOR CLIENTS TABLE
-- =====================================================

-- Policy: Public demo clients access
CREATE POLICY "clients_public_demo_select" ON clients
    FOR SELECT
    USING (status = 'demo');

-- =====================================================
-- PUBLIC DEMO POLICIES FOR JOBS TABLE
-- =====================================================

-- Policy: Public demo jobs access
CREATE POLICY "jobs_public_demo_select" ON jobs
    FOR SELECT
    USING (record_status = 'demo');

-- =====================================================
-- PUBLIC DEMO POLICIES FOR CANDIDATES TABLE
-- =====================================================

-- Policy: Public demo candidates access
CREATE POLICY "candidates_public_demo_select" ON candidates
    FOR SELECT
    USING (status = 'demo');

-- =====================================================
-- PUBLIC DEMO POLICIES FOR JOB_CANDIDATE TABLE
-- =====================================================

-- Policy: Public demo job_candidate access
CREATE POLICY "job_candidate_public_demo_select" ON job_candidate
    FOR SELECT
    USING (status = 'demo');

-- =====================================================
-- PUBLIC DEMO POLICIES FOR CANDIDATE_NOTES TABLE
-- =====================================================

-- Policy: Public demo candidate_notes access
CREATE POLICY "candidate_notes_public_demo_select" ON candidate_notes
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM job_candidate 
            WHERE job_candidate.id = candidate_notes.job_candidate_id 
            AND job_candidate.status = 'demo'
        )
    );

-- =====================================================
-- ENABLE ANONYMOUS ACCESS
-- =====================================================
-- Note: These statements would need to be run by a Supabase admin
-- to enable anonymous access to the demo tables

-- Enable anonymous access for demo data
-- This allows unauthenticated users to read demo records
-- ALTER TABLE clients FORCE ROW LEVEL SECURITY;
-- ALTER TABLE jobs FORCE ROW LEVEL SECURITY;
-- ALTER TABLE candidates FORCE ROW LEVEL SECURITY;
-- ALTER TABLE job_candidate FORCE ROW LEVEL SECURITY;
-- ALTER TABLE candidate_notes FORCE ROW LEVEL SECURITY;

-- Grant anonymous select access to demo data
-- GRANT SELECT ON clients TO anon;
-- GRANT SELECT ON jobs TO anon;
-- GRANT SELECT ON candidates TO anon;
-- GRANT SELECT ON job_candidate TO anon;
-- GRANT SELECT ON candidate_notes TO anon;

-- =====================================================
-- ALTERNATIVE APPROACH: DEMO VIEWER ROLE
-- =====================================================
-- If you prefer to keep authentication required but allow
-- easy demo access, you can update the existing policies
-- to be more permissive for demo_viewer role

-- Update existing policies to allow demo_viewer without strict auth checks
-- This would replace the need for public access

-- Example update for clients (apply similar pattern to other tables):
/*
DROP POLICY IF EXISTS "clients_select" ON clients;
CREATE POLICY "clients_select" ON clients
    FOR SELECT
    USING (
        -- Public demo access (no auth required)
        (status = 'demo')
        OR
        -- Authenticated access with role-based filtering
        (
            auth.uid() IS NOT NULL
            AND (
                -- demo_viewer: only demo records (redundant but explicit)
                (auth.jwt() ->> 'role' = 'demo_viewer' AND status = 'demo')
                OR
                -- bd: read access to non-demo records
                (auth.jwt() ->> 'role' = 'bd' AND (status IS DISTINCT FROM 'demo' OR status IS NULL))
                OR
                -- recruiter: read access to non-demo records
                (auth.jwt() ->> 'role' = 'recruiter' AND (status IS DISTINCT FROM 'demo' OR status IS NULL))
                OR
                -- pm: read access to non-demo records
                (auth.jwt() ->> 'role' = 'pm' AND (status IS DISTINCT FROM 'demo' OR status IS NULL))
                OR
                -- admin: full access to all records
                (auth.jwt() ->> 'role' = 'admin')
            )
        )
    );
*/

-- =====================================================
-- RECOMMENDED IMPLEMENTATION APPROACH
-- =====================================================
-- 
-- Option 1: Public Demo Access (Recommended)
-- - Use the public demo policies above
-- - Allows completely unauthenticated access to demo data
-- - Simplest user experience for demos
-- - No login required for demo viewing
-- 
-- Option 2: Demo Viewer Role with Easy Access
-- - Keep authentication but make demo_viewer role easily accessible
-- - Create a public demo account that auto-logs users in
-- - Maintains audit trail and user context
-- 
-- Option 3: Hybrid Approach
-- - Public read access to demo data
-- - Authenticated access for all other functionality
-- - Best of both worlds
-- 
-- For this ATS application, Option 1 (Public Demo Access) is recommended
-- because it provides the smoothest demo experience without requiring
-- users to create accounts or remember demo credentials.
-- 
-- =====================================================

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Test these queries without authentication to verify public demo access

-- Should work without authentication:
-- SELECT * FROM clients WHERE status = 'demo';
-- SELECT * FROM jobs WHERE record_status = 'demo';
-- SELECT * FROM candidates WHERE status = 'demo';
-- SELECT * FROM job_candidate WHERE status = 'demo';

-- Should return empty or fail without authentication:
-- SELECT * FROM clients WHERE status != 'demo' OR status IS NULL;
-- SELECT * FROM jobs WHERE record_status != 'demo' OR record_status IS NULL;