-- ================================================
-- Additional RLS Policies for TalentPatriot SMB Roles
-- ================================================
-- These are supplementary policies for enhanced security
-- Execute after the main migration script

-- ================================================
-- ENHANCED SECURITY POLICIES
-- ================================================

-- Ensure demo users can only access demo organization data
CREATE POLICY "demo_users_demo_org_only" ON clients
    FOR ALL USING (
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM user_profiles up 
                WHERE up.id = auth.uid() AND up.role = 'demo_viewer'
            )
            THEN org_id::text = '550e8400-e29b-41d4-a716-446655440000'
            ELSE true
        END
    );

-- Create similar demo isolation policies for other tables
CREATE POLICY "demo_jobs_isolation" ON jobs
    FOR ALL USING (
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM user_profiles up 
                WHERE up.id = auth.uid() AND up.role = 'demo_viewer'
            )
            THEN org_id::text = '550e8400-e29b-41d4-a716-446655440000'
            ELSE true
        END
    );

CREATE POLICY "demo_candidates_isolation" ON candidates
    FOR ALL USING (
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM user_profiles up 
                WHERE up.id = auth.uid() AND up.role = 'demo_viewer'
            )
            THEN org_id::text = '550e8400-e29b-41d4-a716-446655440000'
            ELSE true
        END
    );

-- ================================================
-- ROLE-BASED WRITE RESTRICTIONS
-- ================================================

-- Restrict hiring managers to only create/edit jobs they're assigned to
CREATE POLICY "hiring_manager_job_assignment" ON jobs
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_organizations uo 
            WHERE uo.org_id::uuid = jobs.org_id::uuid 
            AND uo.user_id::uuid = auth.uid()::uuid
            AND (
                uo.role IN ('owner', 'admin') 
                OR (uo.role = 'hiring_manager' AND jobs.assigned_to::uuid = auth.uid()::uuid)
            )
        )
    );

-- Restrict interviewers to read-only access for most operations
CREATE POLICY "interviewer_read_restrictions" ON jobs
    FOR INSERT WITH CHECK (
        NOT EXISTS (
            SELECT 1 FROM user_organizations uo 
            WHERE uo.org_id::uuid = jobs.org_id::uuid 
            AND uo.user_id::uuid = auth.uid()::uuid
            AND uo.role = 'interviewer'
        )
    );

-- ================================================
-- AUDIT AND COMPLIANCE POLICIES
-- ================================================

-- Ensure all user actions are logged (if audit table exists)
-- This would require an audit table to be created first
/*
CREATE POLICY "audit_user_actions" ON audit_log
    FOR INSERT WITH CHECK (
        user_id::uuid = auth.uid()::uuid
    );
*/

-- ================================================
-- PERFORMANCE OPTIMIZATION POLICIES
-- ================================================

-- Add policies that use indexes for better performance
CREATE POLICY "optimized_org_access" ON clients
    FOR ALL USING (
        org_id IN (
            SELECT DISTINCT uo.org_id 
            FROM user_organizations uo 
            WHERE uo.user_id::uuid = auth.uid()::uuid
            AND uo.role IN ('owner', 'admin', 'hiring_manager', 'recruiter')
        )
    );

-- Create function to check complex permissions efficiently
CREATE OR REPLACE FUNCTION user_can_access_org(org_uuid uuid) 
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_organizations uo
        WHERE uo.user_id::uuid = auth.uid()::uuid
        AND uo.org_id::uuid = org_uuid
        AND uo.role IN ('owner', 'admin', 'hiring_manager', 'recruiter', 'interviewer')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- VERIFICATION QUERIES
-- ================================================

-- Check that all tables have RLS enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('clients', 'jobs', 'candidates', 'job_candidate', 'candidate_notes', 'interviews', 'messages', 'message_recipients', 'user_profiles', 'organizations', 'user_organizations')
ORDER BY tablename;

-- Show all active policies
SELECT 
    schemaname as "Schema",
    tablename as "Table", 
    policyname as "Policy",
    permissive as "Permissive",
    roles as "Roles",
    cmd as "Command"
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Test policy coverage
SELECT 
    t.tablename,
    COUNT(p.policyname) as "Policy Count"
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
WHERE t.schemaname = 'public'
AND t.tablename IN ('clients', 'jobs', 'candidates', 'job_candidate', 'candidate_notes', 'interviews', 'messages', 'message_recipients', 'user_profiles', 'organizations', 'user_organizations')
GROUP BY t.tablename
ORDER BY t.tablename;