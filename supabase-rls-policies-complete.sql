-- =====================================================
-- Supabase Row-Level Security (RLS) Policies for ATS
-- =====================================================
-- This file contains comprehensive RLS policies for the ATS application
-- supporting role-based access control for different user types.

-- Enable RLS on all tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_candidate ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_notes ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CLIENTS TABLE POLICIES
-- =====================================================

-- Policy: Clients SELECT access (includes public demo access)
CREATE POLICY "clients_select" ON clients
    FOR SELECT
    USING (
        -- Public demo access (no authentication required)
        (status = 'demo')
        OR
        -- Authenticated access with role-based filtering
        (
            auth.uid() IS NOT NULL
            AND (
                -- demo_viewer: only demo records
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

-- Policy: Clients INSERT access
CREATE POLICY "clients_insert" ON clients
    FOR INSERT
    WITH CHECK (
        -- Only recruiters and admins can create new clients
        -- Demo data cannot be created by users
        (
            (auth.jwt() ->> 'role' IN ('recruiter', 'admin'))
            AND
            (status IS DISTINCT FROM 'demo' OR status IS NULL)
        )
    );

-- Policy: Clients UPDATE access
CREATE POLICY "clients_update" ON clients
    FOR UPDATE
    USING (
        -- Only recruiters and admins can update
        -- Demo data cannot be updated
        (
            (auth.jwt() ->> 'role' IN ('recruiter', 'admin'))
            AND
            (status IS DISTINCT FROM 'demo' OR status IS NULL)
        )
    )
    WITH CHECK (
        -- Ensure demo status cannot be set by non-admins
        (
            (auth.jwt() ->> 'role' IN ('recruiter', 'admin'))
            AND
            (status IS DISTINCT FROM 'demo' OR status IS NULL OR auth.jwt() ->> 'role' = 'admin')
        )
    );

-- Policy: Clients DELETE access
CREATE POLICY "clients_delete" ON clients
    FOR DELETE
    USING (
        -- Only admins can delete clients
        -- Demo data cannot be deleted
        (
            (auth.jwt() ->> 'role' = 'admin')
            AND
            (status IS DISTINCT FROM 'demo' OR status IS NULL)
        )
    );

-- =====================================================
-- JOBS TABLE POLICIES
-- =====================================================

-- Policy: Jobs SELECT access (includes public demo access)
CREATE POLICY "jobs_select" ON jobs
    FOR SELECT
    USING (
        -- Public demo access (no authentication required)
        (record_status = 'demo')
        OR
        -- Authenticated access with role-based filtering
        (
            auth.uid() IS NOT NULL
            AND (
                -- demo_viewer: only demo records
                (auth.jwt() ->> 'role' = 'demo_viewer' AND record_status = 'demo')
                OR
                -- bd: read access to non-demo records
                (auth.jwt() ->> 'role' = 'bd' AND (record_status IS DISTINCT FROM 'demo' OR record_status IS NULL))
                OR
                -- pm: read access to contract jobs only (non-demo)
                (
                    auth.jwt() ->> 'role' = 'pm' 
                    AND job_status = 'contract'
                    AND (record_status IS DISTINCT FROM 'demo' OR record_status IS NULL)
                )
                OR
                -- recruiter: read access to non-demo records
                (auth.jwt() ->> 'role' = 'recruiter' AND (record_status IS DISTINCT FROM 'demo' OR record_status IS NULL))
                OR
                -- admin: full access to all records
                (auth.jwt() ->> 'role' = 'admin')
            )
        )
    );

-- Policy: Jobs INSERT access
CREATE POLICY "jobs_insert" ON jobs
    FOR INSERT
    WITH CHECK (
        -- Only recruiters and admins can create jobs
        -- Demo data cannot be created by users
        (
            (auth.jwt() ->> 'role' IN ('recruiter', 'admin'))
            AND
            (record_status IS DISTINCT FROM 'demo' OR record_status IS NULL)
        )
    );

-- Policy: Jobs UPDATE access
CREATE POLICY "jobs_update" ON jobs
    FOR UPDATE
    USING (
        -- Only recruiters and admins can update
        -- Demo data cannot be updated
        (
            (auth.jwt() ->> 'role' IN ('recruiter', 'admin'))
            AND
            (record_status IS DISTINCT FROM 'demo' OR record_status IS NULL)
        )
    )
    WITH CHECK (
        -- Ensure demo status cannot be set by non-admins
        (
            (auth.jwt() ->> 'role' IN ('recruiter', 'admin'))
            AND
            (record_status IS DISTINCT FROM 'demo' OR record_status IS NULL OR auth.jwt() ->> 'role' = 'admin')
        )
    );

-- Policy: Jobs DELETE access
CREATE POLICY "jobs_delete" ON jobs
    FOR DELETE
    USING (
        -- Only admins can delete jobs
        -- Demo data cannot be deleted
        (
            (auth.jwt() ->> 'role' = 'admin')
            AND
            (record_status IS DISTINCT FROM 'demo' OR record_status IS NULL)
        )
    );

-- =====================================================
-- CANDIDATES TABLE POLICIES
-- =====================================================

-- Policy: Candidates SELECT access (includes public demo access)
CREATE POLICY "candidates_select" ON candidates
    FOR SELECT
    USING (
        -- Public demo access (no authentication required)
        (status = 'demo')
        OR
        -- Authenticated access with role-based filtering
        (
            auth.uid() IS NOT NULL
            AND (
                -- demo_viewer: only demo records
                (auth.jwt() ->> 'role' = 'demo_viewer' AND status = 'demo')
                OR
                -- bd: read access to non-demo records
                (auth.jwt() ->> 'role' = 'bd' AND (status IS DISTINCT FROM 'demo' OR status IS NULL))
                OR
                -- pm: read access to non-demo records
                (auth.jwt() ->> 'role' = 'pm' AND (status IS DISTINCT FROM 'demo' OR status IS NULL))
                OR
                -- recruiter: read access to non-demo records
                (auth.jwt() ->> 'role' = 'recruiter' AND (status IS DISTINCT FROM 'demo' OR status IS NULL))
                OR
                -- admin: full access to all records
                (auth.jwt() ->> 'role' = 'admin')
            )
        )
    );

-- Policy: Candidates INSERT access
CREATE POLICY "candidates_insert" ON candidates
    FOR INSERT
    WITH CHECK (
        -- Only recruiters and admins can create candidates
        -- Demo data cannot be created by users
        (
            (auth.jwt() ->> 'role' IN ('recruiter', 'admin'))
            AND
            (status IS DISTINCT FROM 'demo' OR status IS NULL)
        )
    );

-- Policy: Candidates UPDATE access
CREATE POLICY "candidates_update" ON candidates
    FOR UPDATE
    USING (
        -- Only recruiters and admins can update
        -- Demo data cannot be updated
        (
            (auth.jwt() ->> 'role' IN ('recruiter', 'admin'))
            AND
            (status IS DISTINCT FROM 'demo' OR status IS NULL)
        )
    )
    WITH CHECK (
        -- Ensure demo status cannot be set by non-admins
        (
            (auth.jwt() ->> 'role' IN ('recruiter', 'admin'))
            AND
            (status IS DISTINCT FROM 'demo' OR status IS NULL OR auth.jwt() ->> 'role' = 'admin')
        )
    );

-- Policy: Candidates DELETE access
CREATE POLICY "candidates_delete" ON candidates
    FOR DELETE
    USING (
        -- Only admins can delete candidates
        -- Demo data cannot be deleted
        (
            (auth.jwt() ->> 'role' = 'admin')
            AND
            (status IS DISTINCT FROM 'demo' OR status IS NULL)
        )
    );

-- =====================================================
-- JOB_CANDIDATE TABLE POLICIES
-- =====================================================

-- Policy: Job_candidate SELECT access (includes public demo access)
CREATE POLICY "job_candidate_select" ON job_candidate
    FOR SELECT
    USING (
        -- Public demo access (no authentication required)
        (status = 'demo')
        OR
        -- Authenticated access with role-based filtering
        (
            auth.uid() IS NOT NULL
            AND (
                -- demo_viewer: only demo records
                (auth.jwt() ->> 'role' = 'demo_viewer' AND status = 'demo')
                OR
                -- bd: read access to non-demo records
                (auth.jwt() ->> 'role' = 'bd' AND (status IS DISTINCT FROM 'demo' OR status IS NULL))
                OR
                -- pm: read access to non-demo records (via job relationship)
                (
                    auth.jwt() ->> 'role' = 'pm' 
                    AND (status IS DISTINCT FROM 'demo' OR status IS NULL)
                    AND EXISTS (
                        SELECT 1 FROM jobs 
                        WHERE jobs.id = job_candidate.job_id 
                        AND jobs.job_status = 'contract'
                    )
                )
                OR
                -- recruiter: read access to assigned records or all non-demo
                (
                    auth.jwt() ->> 'role' = 'recruiter' 
                    AND (status IS DISTINCT FROM 'demo' OR status IS NULL)
                    AND (assigned_to = auth.uid()::text OR assigned_to IS NULL)
                )
                OR
                -- admin: full access to all records
                (auth.jwt() ->> 'role' = 'admin')
            )
        )
    );

-- Policy: Job_candidate INSERT access
CREATE POLICY "job_candidate_insert" ON job_candidate
    FOR INSERT
    WITH CHECK (
        -- Only recruiters and admins can create job-candidate relationships
        -- Demo data cannot be created by users
        -- Recruiters can only assign to themselves
        (
            (auth.jwt() ->> 'role' IN ('recruiter', 'admin'))
            AND
            (status IS DISTINCT FROM 'demo' OR status IS NULL)
            AND
            (
                auth.jwt() ->> 'role' = 'admin' 
                OR assigned_to = auth.uid()::text 
                OR assigned_to IS NULL
            )
        )
    );

-- Policy: Job_candidate UPDATE access
CREATE POLICY "job_candidate_update" ON job_candidate
    FOR UPDATE
    USING (
        -- Only recruiters and admins can update
        -- Demo data cannot be updated
        -- Recruiters can only update their assigned candidates
        (
            (auth.jwt() ->> 'role' IN ('recruiter', 'admin'))
            AND
            (status IS DISTINCT FROM 'demo' OR status IS NULL)
            AND
            (
                auth.jwt() ->> 'role' = 'admin' 
                OR assigned_to = auth.uid()::text
            )
        )
    )
    WITH CHECK (
        -- Ensure demo status cannot be set by non-admins
        -- Recruiters can only assign to themselves
        (
            (auth.jwt() ->> 'role' IN ('recruiter', 'admin'))
            AND
            (status IS DISTINCT FROM 'demo' OR status IS NULL OR auth.jwt() ->> 'role' = 'admin')
            AND
            (
                auth.jwt() ->> 'role' = 'admin' 
                OR assigned_to = auth.uid()::text 
                OR assigned_to IS NULL
            )
        )
    );

-- Policy: Job_candidate DELETE access
CREATE POLICY "job_candidate_delete" ON job_candidate
    FOR DELETE
    USING (
        -- Only admins can delete job-candidate relationships
        -- Demo data cannot be deleted
        (
            (auth.jwt() ->> 'role' = 'admin')
            AND
            (status IS DISTINCT FROM 'demo' OR status IS NULL)
        )
    );

-- =====================================================
-- CANDIDATE_NOTES TABLE POLICIES
-- =====================================================

-- Policy: Candidate_notes SELECT access (includes public demo access)
CREATE POLICY "candidate_notes_select" ON candidate_notes
    FOR SELECT
    USING (
        -- Public demo access (no authentication required)
        EXISTS (
            SELECT 1 FROM job_candidate 
            WHERE job_candidate.id = candidate_notes.job_candidate_id 
            AND job_candidate.status = 'demo'
        )
        OR
        -- Authenticated access with role-based filtering
        (
            auth.uid() IS NOT NULL
            AND (
                -- demo_viewer: only notes for demo job_candidates
                (
                    auth.jwt() ->> 'role' = 'demo_viewer' 
                    AND EXISTS (
                        SELECT 1 FROM job_candidate 
                        WHERE job_candidate.id = candidate_notes.job_candidate_id 
                        AND job_candidate.status = 'demo'
                    )
                )
                OR
                -- bd: read access to notes for non-demo job_candidates
                (
                    auth.jwt() ->> 'role' = 'bd' 
                    AND EXISTS (
                        SELECT 1 FROM job_candidate 
                        WHERE job_candidate.id = candidate_notes.job_candidate_id 
                        AND (job_candidate.status IS DISTINCT FROM 'demo' OR job_candidate.status IS NULL)
                    )
                )
                OR
                -- pm: read access to notes for contract job candidates
                (
                    auth.jwt() ->> 'role' = 'pm' 
                    AND EXISTS (
                        SELECT 1 FROM job_candidate 
                        JOIN jobs ON jobs.id = job_candidate.job_id
                        WHERE job_candidate.id = candidate_notes.job_candidate_id 
                        AND jobs.job_status = 'contract'
                        AND (job_candidate.status IS DISTINCT FROM 'demo' OR job_candidate.status IS NULL)
                    )
                )
                OR
                -- recruiter: read access to notes for assigned candidates
                (
                    auth.jwt() ->> 'role' = 'recruiter' 
                    AND EXISTS (
                        SELECT 1 FROM job_candidate 
                        WHERE job_candidate.id = candidate_notes.job_candidate_id 
                        AND (job_candidate.status IS DISTINCT FROM 'demo' OR job_candidate.status IS NULL)
                        AND (job_candidate.assigned_to = auth.uid()::text OR job_candidate.assigned_to IS NULL)
                    )
                )
                OR
                -- admin: full access to all notes
                (auth.jwt() ->> 'role' = 'admin')
            )
        )
    );

-- Policy: Candidate_notes INSERT access
CREATE POLICY "candidate_notes_insert" ON candidate_notes
    FOR INSERT
    WITH CHECK (
        -- Only recruiters and admins can create notes
        -- Notes can only be created for non-demo candidates
        -- Notes must be authored by the authenticated user
        (
            (auth.jwt() ->> 'role' IN ('recruiter', 'admin'))
            AND
            (author_id = auth.uid()::text)
            AND
            EXISTS (
                SELECT 1 FROM job_candidate 
                WHERE job_candidate.id = candidate_notes.job_candidate_id 
                AND (job_candidate.status IS DISTINCT FROM 'demo' OR job_candidate.status IS NULL)
                AND (
                    auth.jwt() ->> 'role' = 'admin' 
                    OR job_candidate.assigned_to = auth.uid()::text 
                    OR job_candidate.assigned_to IS NULL
                )
            )
        )
    );

-- Policy: Candidate_notes UPDATE access
CREATE POLICY "candidate_notes_update" ON candidate_notes
    FOR UPDATE
    USING (
        -- Only the author can update their own notes
        -- Demo notes cannot be updated
        (
            (author_id = auth.uid()::text)
            AND
            EXISTS (
                SELECT 1 FROM job_candidate 
                WHERE job_candidate.id = candidate_notes.job_candidate_id 
                AND (job_candidate.status IS DISTINCT FROM 'demo' OR job_candidate.status IS NULL)
            )
        )
    )
    WITH CHECK (
        -- Author cannot be changed
        -- Demo notes cannot be updated
        (
            (author_id = auth.uid()::text)
            AND
            EXISTS (
                SELECT 1 FROM job_candidate 
                WHERE job_candidate.id = candidate_notes.job_candidate_id 
                AND (job_candidate.status IS DISTINCT FROM 'demo' OR job_candidate.status IS NULL)
            )
        )
    );

-- Policy: Candidate_notes DELETE access
CREATE POLICY "candidate_notes_delete" ON candidate_notes
    FOR DELETE
    USING (
        -- Only the author or admin can delete notes
        -- Demo notes cannot be deleted
        (
            (author_id = auth.uid()::text OR auth.jwt() ->> 'role' = 'admin')
            AND
            EXISTS (
                SELECT 1 FROM job_candidate 
                WHERE job_candidate.id = candidate_notes.job_candidate_id 
                AND (job_candidate.status IS DISTINCT FROM 'demo' OR job_candidate.status IS NULL)
            )
        )
    );

-- =====================================================
-- POLICY SUMMARY
-- =====================================================
-- 
-- Role Access Summary:
-- 
-- ADMIN:
-- - Full read/write access to all tables and records
-- - Can manage demo data
-- - Can delete records
-- 
-- RECRUITER:
-- - Full read/write access to non-demo records
-- - Can only work with job_candidates assigned to them
-- - Can create/update clients, jobs, candidates
-- - Can create/update their own candidate notes
-- 
-- BD (Business Development):
-- - Read-only access to clients, jobs, candidates (non-demo)
-- - Cannot write to any records
-- 
-- PM (Project Manager):
-- - Read-only access to jobs with status = 'contract'
-- - Read access to related candidates and notes
-- - Cannot write to any records
-- 
-- DEMO_VIEWER:
-- - Read-only access to records with status = 'demo'
-- - Cannot write to any records
-- 
-- UNAUTHENTICATED:
-- - Read-only access to demo records only (status = 'demo')
-- - No access to production data
-- 
-- =====================================================