-- =============================================================================
-- ADD ORGANIZATION CONTEXT TO ALL TABLES MIGRATION
-- =============================================================================
-- Execute this script in your Supabase SQL Editor after organizations and user_organizations tables exist

-- =============================================================================
-- STEP 1: ADD ORG_ID COLUMNS TO ALL CORE TABLES
-- =============================================================================

-- Add org_id to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);
CREATE INDEX IF NOT EXISTS idx_clients_org_id ON clients(org_id);

-- Add org_id to jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);
CREATE INDEX IF NOT EXISTS idx_jobs_org_id ON jobs(org_id);

-- Add org_id to candidates table
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);
CREATE INDEX IF NOT EXISTS idx_candidates_org_id ON candidates(org_id);

-- Add org_id to job_candidate table
ALTER TABLE job_candidate ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);
CREATE INDEX IF NOT EXISTS idx_job_candidate_org_id ON job_candidate(org_id);

-- Add org_id to candidate_notes table
ALTER TABLE candidate_notes ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);
CREATE INDEX IF NOT EXISTS idx_candidate_notes_org_id ON candidate_notes(org_id);

-- Add org_id to interviews table
ALTER TABLE interviews ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);
CREATE INDEX IF NOT EXISTS idx_interviews_org_id ON interviews(org_id);

-- Add org_id to messages table
ALTER TABLE messages ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);
CREATE INDEX IF NOT EXISTS idx_messages_org_id ON messages(org_id);

-- Add org_id to message_recipients table
ALTER TABLE message_recipients ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);
CREATE INDEX IF NOT EXISTS idx_message_recipients_org_id ON message_recipients(org_id);

-- =============================================================================
-- STEP 2: UPDATE RLS POLICIES FOR ORGANIZATION-SCOPED ACCESS
-- =============================================================================

-- =============================================================================
-- CLIENTS TABLE RLS POLICIES
-- =============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "clients_authenticated_read" ON clients;
DROP POLICY IF EXISTS "clients_authenticated_write" ON clients;
DROP POLICY IF EXISTS "clients_authenticated_update" ON clients;
DROP POLICY IF EXISTS "clients_authenticated_delete" ON clients;
DROP POLICY IF EXISTS "deny_unauthenticated_clients" ON clients;

-- Users can read clients from organizations they belong to
CREATE POLICY "clients_org_members_read"
ON clients FOR SELECT TO authenticated
USING (
  org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid()
  )
);

-- Users can create clients in organizations they belong to (recruiter+ roles)
CREATE POLICY "clients_org_members_create"
ON clients FOR INSERT TO authenticated
WITH CHECK (
  org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin', 'recruiter')
  )
);

-- Users can update clients in organizations they belong to (recruiter+ roles)
CREATE POLICY "clients_org_members_update"
ON clients FOR UPDATE TO authenticated
USING (
  org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin', 'recruiter')
  )
)
WITH CHECK (
  org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin', 'recruiter')
  )
);

-- Users can delete clients in organizations they belong to (admin+ roles)
CREATE POLICY "clients_org_admins_delete"
ON clients FOR DELETE TO authenticated
USING (
  org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin')
  )
);

-- Block unauthenticated access
CREATE POLICY "deny_unauthenticated_clients"
ON clients FOR ALL TO anon
USING (false);

-- =============================================================================
-- JOBS TABLE RLS POLICIES
-- =============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "jobs_authenticated_read" ON jobs;
DROP POLICY IF EXISTS "jobs_authenticated_write" ON jobs;
DROP POLICY IF EXISTS "jobs_authenticated_update" ON jobs;
DROP POLICY IF EXISTS "jobs_authenticated_delete" ON jobs;
DROP POLICY IF EXISTS "deny_unauthenticated_jobs" ON jobs;

-- Users can read jobs from organizations they belong to
CREATE POLICY "jobs_org_members_read"
ON jobs FOR SELECT TO authenticated
USING (
  org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid()
  )
);

-- Users can create jobs in organizations they belong to (recruiter+ roles)
CREATE POLICY "jobs_org_members_create"
ON jobs FOR INSERT TO authenticated
WITH CHECK (
  org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin', 'recruiter')
  )
);

-- Users can update jobs in organizations they belong to (recruiter+ roles)
CREATE POLICY "jobs_org_members_update"
ON jobs FOR UPDATE TO authenticated
USING (
  org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin', 'recruiter')
  )
)
WITH CHECK (
  org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin', 'recruiter')
  )
);

-- Users can delete jobs in organizations they belong to (admin+ roles)
CREATE POLICY "jobs_org_admins_delete"
ON jobs FOR DELETE TO authenticated
USING (
  org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin')
  )
);

-- Block unauthenticated access
CREATE POLICY "deny_unauthenticated_jobs"
ON jobs FOR ALL TO anon
USING (false);

-- =============================================================================
-- CANDIDATES TABLE RLS POLICIES
-- =============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "candidates_authenticated_read" ON candidates;
DROP POLICY IF EXISTS "candidates_authenticated_write" ON candidates;
DROP POLICY IF EXISTS "candidates_authenticated_update" ON candidates;
DROP POLICY IF EXISTS "candidates_authenticated_delete" ON candidates;
DROP POLICY IF EXISTS "deny_unauthenticated_candidates" ON candidates;

-- Users can read candidates from organizations they belong to
CREATE POLICY "candidates_org_members_read"
ON candidates FOR SELECT TO authenticated
USING (
  org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid()
  )
);

-- Users can create candidates in organizations they belong to (recruiter+ roles)
CREATE POLICY "candidates_org_members_create"
ON candidates FOR INSERT TO authenticated
WITH CHECK (
  org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin', 'recruiter')
  )
);

-- Users can update candidates in organizations they belong to (recruiter+ roles)
CREATE POLICY "candidates_org_members_update"
ON candidates FOR UPDATE TO authenticated
USING (
  org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin', 'recruiter')
  )
)
WITH CHECK (
  org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin', 'recruiter')
  )
);

-- Users can delete candidates in organizations they belong to (admin+ roles)
CREATE POLICY "candidates_org_admins_delete"
ON candidates FOR DELETE TO authenticated
USING (
  org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin')
  )
);

-- Block unauthenticated access
CREATE POLICY "deny_unauthenticated_candidates"
ON candidates FOR ALL TO anon
USING (false);

-- =============================================================================
-- JOB_CANDIDATE TABLE RLS POLICIES
-- =============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "job_candidate_authenticated_read" ON job_candidate;
DROP POLICY IF EXISTS "job_candidate_authenticated_write" ON job_candidate;
DROP POLICY IF EXISTS "job_candidate_authenticated_update" ON job_candidate;
DROP POLICY IF EXISTS "job_candidate_authenticated_delete" ON job_candidate;
DROP POLICY IF EXISTS "deny_unauthenticated_job_candidate" ON job_candidate;

-- Users can read job_candidate records from organizations they belong to
CREATE POLICY "job_candidate_org_members_read"
ON job_candidate FOR SELECT TO authenticated
USING (
  org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid()
  )
);

-- Users can create job_candidate records in organizations they belong to (recruiter+ roles)
CREATE POLICY "job_candidate_org_members_create"
ON job_candidate FOR INSERT TO authenticated
WITH CHECK (
  org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin', 'recruiter')
  )
);

-- Users can update job_candidate records in organizations they belong to (recruiter+ roles)
CREATE POLICY "job_candidate_org_members_update"
ON job_candidate FOR UPDATE TO authenticated
USING (
  org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin', 'recruiter')
  )
)
WITH CHECK (
  org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin', 'recruiter')
  )
);

-- Users can delete job_candidate records in organizations they belong to (admin+ roles)
CREATE POLICY "job_candidate_org_admins_delete"
ON job_candidate FOR DELETE TO authenticated
USING (
  org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin')
  )
);

-- Block unauthenticated access
CREATE POLICY "deny_unauthenticated_job_candidate"
ON job_candidate FOR ALL TO anon
USING (false);

-- =============================================================================
-- CANDIDATE_NOTES TABLE RLS POLICIES
-- =============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "candidate_notes_authenticated_read" ON candidate_notes;
DROP POLICY IF EXISTS "candidate_notes_authenticated_write" ON candidate_notes;
DROP POLICY IF EXISTS "candidate_notes_authenticated_update" ON candidate_notes;
DROP POLICY IF EXISTS "candidate_notes_authenticated_delete" ON candidate_notes;
DROP POLICY IF EXISTS "deny_unauthenticated_candidate_notes" ON candidate_notes;

-- Users can read candidate_notes from organizations they belong to
CREATE POLICY "candidate_notes_org_members_read"
ON candidate_notes FOR SELECT TO authenticated
USING (
  org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid()
  )
);

-- Users can create candidate_notes in organizations they belong to (all roles)
CREATE POLICY "candidate_notes_org_members_create"
ON candidate_notes FOR INSERT TO authenticated
WITH CHECK (
  org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid()
  )
);

-- Users can update their own candidate_notes in organizations they belong to
CREATE POLICY "candidate_notes_author_update"
ON candidate_notes FOR UPDATE TO authenticated
USING (
  author_id = auth.uid() AND
  org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  author_id = auth.uid() AND
  org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid()
  )
);

-- Users can delete their own candidate_notes in organizations they belong to
CREATE POLICY "candidate_notes_author_delete"
ON candidate_notes FOR DELETE TO authenticated
USING (
  author_id = auth.uid() AND
  org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid()
  )
);

-- Block unauthenticated access
CREATE POLICY "deny_unauthenticated_candidate_notes"
ON candidate_notes FOR ALL TO anon
USING (false);

-- =============================================================================
-- INTERVIEWS TABLE RLS POLICIES
-- =============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "interviews_authenticated_read" ON interviews;
DROP POLICY IF EXISTS "interviews_authenticated_write" ON interviews;
DROP POLICY IF EXISTS "interviews_authenticated_update" ON interviews;
DROP POLICY IF EXISTS "interviews_authenticated_delete" ON interviews;
DROP POLICY IF EXISTS "deny_unauthenticated_interviews" ON interviews;

-- Users can read interviews from organizations they belong to
CREATE POLICY "interviews_org_members_read"
ON interviews FOR SELECT TO authenticated
USING (
  org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid()
  )
);

-- Users can create interviews in organizations they belong to (recruiter+ roles)
CREATE POLICY "interviews_org_members_create"
ON interviews FOR INSERT TO authenticated
WITH CHECK (
  org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin', 'recruiter')
  )
);

-- Users can update interviews in organizations they belong to (recruiter+ roles)
CREATE POLICY "interviews_org_members_update"
ON interviews FOR UPDATE TO authenticated
USING (
  org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin', 'recruiter')
  )
)
WITH CHECK (
  org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin', 'recruiter')
  )
);

-- Users can delete interviews in organizations they belong to (admin+ roles)
CREATE POLICY "interviews_org_admins_delete"
ON interviews FOR DELETE TO authenticated
USING (
  org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin')
  )
);

-- Block unauthenticated access
CREATE POLICY "deny_unauthenticated_interviews"
ON interviews FOR ALL TO anon
USING (false);

-- =============================================================================
-- MESSAGES TABLE RLS POLICIES
-- =============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "messages_authenticated_read" ON messages;
DROP POLICY IF EXISTS "messages_authenticated_write" ON messages;
DROP POLICY IF EXISTS "messages_authenticated_update" ON messages;
DROP POLICY IF EXISTS "messages_authenticated_delete" ON messages;
DROP POLICY IF EXISTS "deny_unauthenticated_messages" ON messages;

-- Users can read messages from organizations they belong to
CREATE POLICY "messages_org_members_read"
ON messages FOR SELECT TO authenticated
USING (
  org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid()
  )
);

-- Users can create messages in organizations they belong to (all roles)
CREATE POLICY "messages_org_members_create"
ON messages FOR INSERT TO authenticated
WITH CHECK (
  org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid()
  )
);

-- Users can update their own messages in organizations they belong to
CREATE POLICY "messages_sender_update"
ON messages FOR UPDATE TO authenticated
USING (
  sender_id = auth.uid() AND
  org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  sender_id = auth.uid() AND
  org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid()
  )
);

-- Users can delete their own messages in organizations they belong to
CREATE POLICY "messages_sender_delete"
ON messages FOR DELETE TO authenticated
USING (
  sender_id = auth.uid() AND
  org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid()
  )
);

-- Block unauthenticated access
CREATE POLICY "deny_unauthenticated_messages"
ON messages FOR ALL TO anon
USING (false);

-- =============================================================================
-- MESSAGE_RECIPIENTS TABLE RLS POLICIES
-- =============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "message_recipients_authenticated_read" ON message_recipients;
DROP POLICY IF EXISTS "message_recipients_authenticated_write" ON message_recipients;
DROP POLICY IF EXISTS "message_recipients_authenticated_update" ON message_recipients;
DROP POLICY IF EXISTS "message_recipients_authenticated_delete" ON message_recipients;
DROP POLICY IF EXISTS "deny_unauthenticated_message_recipients" ON message_recipients;

-- Users can read message_recipients from organizations they belong to
CREATE POLICY "message_recipients_org_members_read"
ON message_recipients FOR SELECT TO authenticated
USING (
  org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid()
  )
);

-- Users can create message_recipients in organizations they belong to (all roles)
CREATE POLICY "message_recipients_org_members_create"
ON message_recipients FOR INSERT TO authenticated
WITH CHECK (
  org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid()
  )
);

-- Users can update their own message_recipients records
CREATE POLICY "message_recipients_recipient_update"
ON message_recipients FOR UPDATE TO authenticated
USING (
  recipient_id = auth.uid() AND
  org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  recipient_id = auth.uid() AND
  org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid()
  )
);

-- Users can delete their own message_recipients records
CREATE POLICY "message_recipients_recipient_delete"
ON message_recipients FOR DELETE TO authenticated
USING (
  recipient_id = auth.uid() AND
  org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid()
  )
);

-- Block unauthenticated access
CREATE POLICY "deny_unauthenticated_message_recipients"
ON message_recipients FOR ALL TO anon
USING (false);

-- =============================================================================
-- STEP 3: GRANT NECESSARY PERMISSIONS
-- =============================================================================

-- Grant usage on all tables to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON clients TO authenticated;
GRANT ALL ON jobs TO authenticated;
GRANT ALL ON candidates TO authenticated;
GRANT ALL ON job_candidate TO authenticated;
GRANT ALL ON candidate_notes TO authenticated;
GRANT ALL ON interviews TO authenticated;
GRANT ALL ON messages TO authenticated;
GRANT ALL ON message_recipients TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
-- All tables now have org_id columns with proper foreign key constraints
-- All RLS policies are scoped to organization membership via user_organizations
-- Complete data isolation between organizations is now enforced