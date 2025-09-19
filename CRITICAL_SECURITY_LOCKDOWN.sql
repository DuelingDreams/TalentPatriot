-- CRITICAL SECURITY LOCKDOWN SCRIPT
-- Immediate action to secure database from public access to sensitive multi-tenant data
-- Date: September 19, 2025

-- ==========================================
-- STEP 1: DROP ALL INSECURE PUBLIC POLICIES
-- ==========================================

-- Drop any existing policies that might grant public/anon access to sensitive tables
DROP POLICY IF EXISTS "ai_insights_cache_public_access" ON ai_insights_cache;
DROP POLICY IF EXISTS "ai_insights_metrics_public_access" ON ai_insights_metrics;
DROP POLICY IF EXISTS "ai_recommendations_history_public_access" ON ai_recommendations_history;
DROP POLICY IF EXISTS "candidate_notes_public_access" ON candidate_notes;
DROP POLICY IF EXISTS "job_candidate_public_access" ON job_candidate;
DROP POLICY IF EXISTS "applications_public_access" ON job_candidate;

-- Drop any overly permissive policies that exist
DROP POLICY IF EXISTS "ai_insights_cache_all_access" ON ai_insights_cache;
DROP POLICY IF EXISTS "ai_insights_metrics_all_access" ON ai_insights_metrics;
DROP POLICY IF EXISTS "ai_recommendations_history_all_access" ON ai_recommendations_history;

-- ==========================================
-- STEP 2: ENABLE FORCE ROW LEVEL SECURITY
-- ==========================================

-- Force RLS on all sensitive tables - this blocks ALL access unless explicitly allowed
ALTER TABLE ai_insights_cache FORCE ROW LEVEL SECURITY;
ALTER TABLE ai_insights_metrics FORCE ROW LEVEL SECURITY;
ALTER TABLE ai_recommendations_history FORCE ROW LEVEL SECURITY;
ALTER TABLE candidate_notes FORCE ROW LEVEL SECURITY;
ALTER TABLE job_candidate FORCE ROW LEVEL SECURITY;

-- Also ensure other sensitive tables have FORCE RLS
ALTER TABLE candidates FORCE ROW LEVEL SECURITY;
ALTER TABLE jobs FORCE ROW LEVEL SECURITY;
ALTER TABLE clients FORCE ROW LEVEL SECURITY;
ALTER TABLE organizations FORCE ROW LEVEL SECURITY;
ALTER TABLE user_organizations FORCE ROW LEVEL SECURITY;

-- ==========================================
-- STEP 3: REVOKE UNNECESSARY PRIVILEGES FROM ANON ROLE
-- ==========================================

-- Revoke all privileges from anon role on sensitive tables
REVOKE ALL ON ai_insights_cache FROM anon;
REVOKE ALL ON ai_insights_metrics FROM anon;
REVOKE ALL ON ai_recommendations_history FROM anon;
REVOKE ALL ON candidate_notes FROM anon;
REVOKE ALL ON candidates FROM anon;
REVOKE ALL ON clients FROM anon;
REVOKE ALL ON organizations FROM anon;
REVOKE ALL ON user_organizations FROM anon;

-- For job_candidate (applications), revoke most privileges but we'll grant specific INSERT later
REVOKE ALL ON job_candidate FROM anon;

-- For jobs table, revoke most privileges but we'll grant specific SELECT later for public listings
REVOKE ALL ON jobs FROM anon;

-- ==========================================
-- STEP 4: BLOCK ALL ANONYMOUS ACCESS BY DEFAULT
-- ==========================================

-- Create explicit blocking policies for anon role on all sensitive tables
CREATE POLICY "block_anon_ai_insights_cache" ON ai_insights_cache
  FOR ALL TO anon
  USING (FALSE);

CREATE POLICY "block_anon_ai_insights_metrics" ON ai_insights_metrics
  FOR ALL TO anon
  USING (FALSE);

CREATE POLICY "block_anon_ai_recommendations_history" ON ai_recommendations_history
  FOR ALL TO anon
  USING (FALSE);

CREATE POLICY "block_anon_candidate_notes" ON candidate_notes
  FOR ALL TO anon
  USING (FALSE);

CREATE POLICY "block_anon_candidates" ON candidates
  FOR ALL TO anon
  USING (FALSE);

CREATE POLICY "block_anon_clients" ON clients
  FOR ALL TO anon
  USING (FALSE);

CREATE POLICY "block_anon_organizations" ON organizations
  FOR ALL TO anon
  USING (FALSE);

CREATE POLICY "block_anon_user_organizations" ON user_organizations
  FOR ALL TO anon
  USING (FALSE);

-- ==========================================
-- STEP 5: SECURE MULTI-TENANT POLICIES FOR AI INSIGHTS TABLES
-- ==========================================

-- Drop existing policies to recreate them securely
DROP POLICY IF EXISTS "Users can view their organization's AI insights cache" ON ai_insights_cache;
DROP POLICY IF EXISTS "Users can insert AI insights cache for their organization" ON ai_insights_cache;
DROP POLICY IF EXISTS "Users can update their organization's AI insights cache" ON ai_insights_cache;

-- Secure AI Insights Cache policies
CREATE POLICY "ai_insights_cache_secure_select" ON ai_insights_cache
  FOR SELECT TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "ai_insights_cache_secure_insert" ON ai_insights_cache
  FOR INSERT TO authenticated
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM user_organizations 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin', 'hiring_manager', 'recruiter')
    )
  );

CREATE POLICY "ai_insights_cache_secure_update" ON ai_insights_cache
  FOR UPDATE TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM user_organizations 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin', 'hiring_manager', 'recruiter')
    )
  );

CREATE POLICY "ai_insights_cache_secure_delete" ON ai_insights_cache
  FOR DELETE TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM user_organizations 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

-- ==========================================
-- STEP 6: SECURE AI INSIGHTS METRICS TABLE
-- ==========================================

DROP POLICY IF EXISTS "Users can view their organization's AI insights metrics" ON ai_insights_metrics;
DROP POLICY IF EXISTS "Users can insert AI insights metrics for their organization" ON ai_insights_metrics;
DROP POLICY IF EXISTS "Users can update their organization's AI insights metrics" ON ai_insights_metrics;

CREATE POLICY "ai_insights_metrics_secure_select" ON ai_insights_metrics
  FOR SELECT TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "ai_insights_metrics_secure_insert" ON ai_insights_metrics
  FOR INSERT TO authenticated
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM user_organizations 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin', 'hiring_manager', 'recruiter')
    )
  );

CREATE POLICY "ai_insights_metrics_secure_update" ON ai_insights_metrics
  FOR UPDATE TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM user_organizations 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin', 'hiring_manager', 'recruiter')
    )
  );

CREATE POLICY "ai_insights_metrics_secure_delete" ON ai_insights_metrics
  FOR DELETE TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM user_organizations 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

-- ==========================================
-- STEP 7: SECURE AI RECOMMENDATIONS HISTORY TABLE
-- ==========================================

DROP POLICY IF EXISTS "Users can view their organization's AI recommendations history" ON ai_recommendations_history;
DROP POLICY IF EXISTS "Users can insert AI recommendations history for their organization" ON ai_recommendations_history;
DROP POLICY IF EXISTS "Users can update their organization's AI recommendations history" ON ai_recommendations_history;

CREATE POLICY "ai_recommendations_history_secure_select" ON ai_recommendations_history
  FOR SELECT TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "ai_recommendations_history_secure_insert" ON ai_recommendations_history
  FOR INSERT TO authenticated
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM user_organizations 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin', 'hiring_manager', 'recruiter')
    )
  );

CREATE POLICY "ai_recommendations_history_secure_update" ON ai_recommendations_history
  FOR UPDATE TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM user_organizations 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin', 'hiring_manager', 'recruiter')
    )
  );

CREATE POLICY "ai_recommendations_history_secure_delete" ON ai_recommendations_history
  FOR DELETE TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM user_organizations 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

-- ==========================================
-- STEP 8: SECURE CANDIDATE NOTES TABLE
-- ==========================================

-- Drop existing policies to ensure clean state
DROP POLICY IF EXISTS "Users can view notes in their org" ON candidate_notes;
DROP POLICY IF EXISTS "Users can create notes in their org" ON candidate_notes;
DROP POLICY IF EXISTS "Users can update their own notes" ON candidate_notes;
DROP POLICY IF EXISTS "candidate_notes_secure_access" ON candidate_notes;
DROP POLICY IF EXISTS "candidate_notes_secure_write" ON candidate_notes;

CREATE POLICY "candidate_notes_secure_select" ON candidate_notes
  FOR SELECT TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "candidate_notes_secure_insert" ON candidate_notes
  FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid() 
    AND org_id IN (
      SELECT org_id FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "candidate_notes_secure_update" ON candidate_notes
  FOR UPDATE TO authenticated
  USING (
    author_id = auth.uid() 
    AND org_id IN (
      SELECT org_id FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "candidate_notes_secure_delete" ON candidate_notes
  FOR DELETE TO authenticated
  USING (
    (author_id = auth.uid() 
     OR org_id IN (
       SELECT org_id FROM user_organizations 
       WHERE user_id = auth.uid() 
       AND role IN ('owner', 'admin')
     )
    )
    AND org_id IN (
      SELECT org_id FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

-- ==========================================
-- STEP 9: SECURE JOB_CANDIDATE (APPLICATIONS) TABLE
-- ==========================================

-- Drop existing policies
DROP POLICY IF EXISTS "job_candidate_secure_access" ON job_candidate;
DROP POLICY IF EXISTS "job_candidate_secure_write" ON job_candidate;

-- Block all anonymous access first
CREATE POLICY "block_anon_job_candidate" ON job_candidate
  FOR ALL TO anon
  USING (FALSE);

-- Allow very limited anonymous INSERT for public job applications only
-- Only for published jobs (status = 'open')
CREATE POLICY "job_candidate_anon_insert_public_jobs" ON job_candidate
  FOR INSERT TO anon
  WITH CHECK (
    job_id IN (
      SELECT id FROM jobs 
      WHERE status = 'open' 
      AND public_slug IS NOT NULL 
      AND published_at IS NOT NULL
    )
  );

-- Grant minimal INSERT permission to anon for job applications
GRANT INSERT ON job_candidate TO anon;
GRANT INSERT ON candidates TO anon;

-- Secure authenticated access to job_candidate
CREATE POLICY "job_candidate_secure_select" ON job_candidate
  FOR SELECT TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "job_candidate_secure_insert" ON job_candidate
  FOR INSERT TO authenticated
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "job_candidate_secure_update" ON job_candidate
  FOR UPDATE TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "job_candidate_secure_delete" ON job_candidate
  FOR DELETE TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM user_organizations 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin', 'hiring_manager', 'recruiter')
    )
  );

-- ==========================================
-- STEP 10: SECURE JOBS TABLE FOR PUBLIC LISTINGS
-- ==========================================

-- Allow anonymous SELECT only for published public jobs
CREATE POLICY "jobs_anon_select_public_only" ON jobs
  FOR SELECT TO anon
  USING (
    status = 'open' 
    AND public_slug IS NOT NULL 
    AND published_at IS NOT NULL
  );

-- Grant minimal SELECT permission to anon for public job listings
GRANT SELECT ON jobs TO anon;

-- ==========================================
-- STEP 11: SECURE CANDIDATES TABLE FOR PUBLIC APPLICATIONS
-- ==========================================

-- Allow anonymous INSERT for job applications
CREATE POLICY "candidates_anon_insert_for_applications" ON candidates
  FOR INSERT TO anon
  WITH CHECK (TRUE);

-- No SELECT/UPDATE/DELETE for anonymous users
CREATE POLICY "block_anon_candidates_select" ON candidates
  FOR SELECT TO anon
  USING (FALSE);

CREATE POLICY "block_anon_candidates_update" ON candidates
  FOR UPDATE TO anon
  USING (FALSE);

CREATE POLICY "block_anon_candidates_delete" ON candidates
  FOR DELETE TO anon
  USING (FALSE);

-- ==========================================
-- FINAL SECURITY VERIFICATION
-- ==========================================

-- Verify that all critical tables have FORCE RLS enabled
DO $$
DECLARE
    table_name TEXT;
    rls_status BOOLEAN;
BEGIN
    FOR table_name IN VALUES 
        ('ai_insights_cache'),
        ('ai_insights_metrics'),
        ('ai_recommendations_history'),
        ('candidate_notes'),
        ('job_candidate'),
        ('candidates'),
        ('jobs'),
        ('clients'),
        ('organizations'),
        ('user_organizations')
    LOOP
        SELECT relforcerowsecurity INTO rls_status
        FROM pg_class 
        WHERE relname = table_name;
        
        IF NOT rls_status THEN
            RAISE EXCEPTION 'CRITICAL: Table % does not have FORCE RLS enabled!', table_name;
        END IF;
        
        RAISE NOTICE 'VERIFIED: Table % has FORCE RLS enabled', table_name;
    END LOOP;
END $$;

-- Success message
SELECT 'CRITICAL SECURITY LOCKDOWN COMPLETED SUCCESSFULLY!' as status,
       'All sensitive tables secured with proper multi-tenant RLS policies' as details,
       NOW() as completed_at;