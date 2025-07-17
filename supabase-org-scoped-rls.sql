-- =============================================================================
-- ORGANIZATION-SCOPED RLS POLICIES FOR TALENTPATRIOT ATS
-- =============================================================================
-- Execute this script AFTER running organizations-migration.sql and user-organizations-migration.sql
-- This replaces all table policies with organization-scoped access control

-- =============================================================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- =============================================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_candidate ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_recipients ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- ORGANIZATIONS TABLE POLICIES
-- =============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "org_owners_read" ON organizations;
DROP POLICY IF EXISTS "org_owners_write" ON organizations;
DROP POLICY IF EXISTS "org_owners_update" ON organizations;
DROP POLICY IF EXISTS "org_owners_delete" ON organizations;
DROP POLICY IF EXISTS "deny_unauthenticated_organizations" ON organizations;

-- Users can read organizations they belong to
CREATE POLICY "users_read_their_orgs"
ON organizations FOR SELECT TO authenticated
USING (
  id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid()
  )
);

-- Organization owners can create organizations
CREATE POLICY "org_owners_create"
ON organizations FOR INSERT TO authenticated
WITH CHECK (auth.uid() = owner_id);

-- Organization owners can update their organizations
CREATE POLICY "org_owners_update"
ON organizations FOR UPDATE TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- Organization owners can delete their organizations
CREATE POLICY "org_owners_delete"
ON organizations FOR DELETE TO authenticated
USING (auth.uid() = owner_id);

-- Block unauthenticated access
CREATE POLICY "deny_unauthenticated_organizations"
ON organizations FOR ALL TO anon
USING (false);

-- =============================================================================
-- USER_ORGANIZATIONS TABLE POLICIES (UNCHANGED)
-- =============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "users_can_read_their_orgs" ON user_organizations;
DROP POLICY IF EXISTS "org_admins_can_read_users" ON user_organizations;
DROP POLICY IF EXISTS "org_owners_admins_can_invite_users" ON user_organizations;
DROP POLICY IF EXISTS "org_owners_admins_can_update_roles" ON user_organizations;
DROP POLICY IF EXISTS "users_can_leave_orgs" ON user_organizations;
DROP POLICY IF EXISTS "org_owners_admins_can_remove_users" ON user_organizations;
DROP POLICY IF EXISTS "deny_unauthenticated_user_orgs" ON user_organizations;

-- Users can read their own organization memberships
CREATE POLICY "users_can_read_their_orgs"
ON user_organizations FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Organization admins and owners can read all users in their organizations
CREATE POLICY "org_admins_can_read_users"
ON user_organizations FOR SELECT TO authenticated
USING (
  org_id IN (
    SELECT org_id FROM user_organizations uo2
    WHERE uo2.user_id = auth.uid()
    AND uo2.role IN ('owner', 'admin')
  )
);

-- Organization owners and admins can invite users
CREATE POLICY "org_owners_admins_can_invite_users"
ON user_organizations FOR INSERT TO authenticated
WITH CHECK (
  org_id IN (
    SELECT org_id FROM user_organizations uo2
    WHERE uo2.user_id = auth.uid()
    AND uo2.role IN ('owner', 'admin')
  )
);

-- Organization owners and admins can update user roles
CREATE POLICY "org_owners_admins_can_update_roles"
ON user_organizations FOR UPDATE TO authenticated
USING (
  org_id IN (
    SELECT org_id FROM user_organizations uo2
    WHERE uo2.user_id = auth.uid()
    AND uo2.role IN ('owner', 'admin')
  )
)
WITH CHECK (
  org_id IN (
    SELECT org_id FROM user_organizations uo2
    WHERE uo2.user_id = auth.uid()
    AND uo2.role IN ('owner', 'admin')
  )
);

-- Users can leave organizations
CREATE POLICY "users_can_leave_orgs"
ON user_organizations FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Organization owners and admins can remove users
CREATE POLICY "org_owners_admins_can_remove_users"
ON user_organizations FOR DELETE TO authenticated
USING (
  org_id IN (
    SELECT org_id FROM user_organizations uo2
    WHERE uo2.user_id = auth.uid()
    AND uo2.role IN ('owner', 'admin')
  )
);

-- Block unauthenticated access
CREATE POLICY "deny_unauthenticated_user_orgs"
ON user_organizations FOR ALL TO anon
USING (false);

-- =============================================================================
-- CLIENTS TABLE POLICIES - ORGANIZATION SCOPED
-- =============================================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "authenticated_read_clients" ON clients;
DROP POLICY IF EXISTS "authenticated_insert_clients" ON clients;
DROP POLICY IF EXISTS "authenticated_update_clients" ON clients;
DROP POLICY IF EXISTS "authenticated_delete_clients" ON clients;
DROP POLICY IF EXISTS "clients_org_members_read" ON clients;
DROP POLICY IF EXISTS "clients_org_members_create" ON clients;
DROP POLICY IF EXISTS "clients_org_members_update" ON clients;
DROP POLICY IF EXISTS "clients_org_admins_delete" ON clients;
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
-- JOBS TABLE POLICIES - ORGANIZATION SCOPED
-- =============================================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "authenticated_read_jobs" ON jobs;
DROP POLICY IF EXISTS "authenticated_insert_jobs" ON jobs;
DROP POLICY IF EXISTS "authenticated_update_jobs" ON jobs;
DROP POLICY IF EXISTS "authenticated_delete_jobs" ON jobs;
DROP POLICY IF EXISTS "jobs_org_members_read" ON jobs;
DROP POLICY IF EXISTS "jobs_org_members_create" ON jobs;
DROP POLICY IF EXISTS "jobs_org_members_update" ON jobs;
DROP POLICY IF EXISTS "jobs_org_admins_delete" ON jobs;
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
-- CANDIDATES TABLE POLICIES - ORGANIZATION SCOPED
-- =============================================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "authenticated_read_candidates" ON candidates;
DROP POLICY IF EXISTS "authenticated_insert_candidates" ON candidates;
DROP POLICY IF EXISTS "authenticated_update_candidates" ON candidates;
DROP POLICY IF EXISTS "authenticated_delete_candidates" ON candidates;
DROP POLICY IF EXISTS "candidates_org_members_read" ON candidates;
DROP POLICY IF EXISTS "candidates_org_members_create" ON candidates;
DROP POLICY IF EXISTS "candidates_org_members_update" ON candidates;
DROP POLICY IF EXISTS "candidates_org_admins_delete" ON candidates;
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
-- JOB_CANDIDATE TABLE POLICIES - ORGANIZATION SCOPED
-- =============================================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "authenticated_read_job_candidates" ON job_candidate;
DROP POLICY IF EXISTS "authenticated_insert_job_candidates" ON job_candidate;
DROP POLICY IF EXISTS "authenticated_update_job_candidates" ON job_candidate;
DROP POLICY IF EXISTS "authenticated_delete_job_candidates" ON job_candidate;
DROP POLICY IF EXISTS "job_candidate_org_members_read" ON job_candidate;
DROP POLICY IF EXISTS "job_candidate_org_members_create" ON job_candidate;
DROP POLICY IF EXISTS "job_candidate_org_members_update" ON job_candidate;
DROP POLICY IF EXISTS "job_candidate_org_admins_delete" ON job_candidate;
DROP POLICY IF EXISTS "deny_unauthenticated_job_candidates" ON job_candidate;

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
CREATE POLICY "deny_unauthenticated_job_candidates"
ON job_candidate FOR ALL TO anon
USING (false);

-- =============================================================================
-- CANDIDATE_NOTES TABLE POLICIES - ORGANIZATION SCOPED
-- =============================================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "authenticated_read_candidate_notes" ON candidate_notes;
DROP POLICY IF EXISTS "authenticated_insert_candidate_notes" ON candidate_notes;
DROP POLICY IF EXISTS "authenticated_update_candidate_notes" ON candidate_notes;
DROP POLICY IF EXISTS "authenticated_delete_candidate_notes" ON candidate_notes;
DROP POLICY IF EXISTS "candidate_notes_org_members_read" ON candidate_notes;
DROP POLICY IF EXISTS "candidate_notes_org_members_create" ON candidate_notes;
DROP POLICY IF EXISTS "candidate_notes_author_update" ON candidate_notes;
DROP POLICY IF EXISTS "candidate_notes_author_delete" ON candidate_notes;
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
-- INTERVIEWS TABLE POLICIES - ORGANIZATION SCOPED
-- =============================================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "interviews_org_members_read" ON interviews;
DROP POLICY IF EXISTS "interviews_org_members_create" ON interviews;
DROP POLICY IF EXISTS "interviews_org_members_update" ON interviews;
DROP POLICY IF EXISTS "interviews_org_admins_delete" ON interviews;
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
-- MESSAGES TABLE POLICIES - ORGANIZATION SCOPED
-- =============================================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "messages_org_members_read" ON messages;
DROP POLICY IF EXISTS "messages_org_members_create" ON messages;
DROP POLICY IF EXISTS "messages_sender_update" ON messages;
DROP POLICY IF EXISTS "messages_sender_delete" ON messages;
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
-- MESSAGE_RECIPIENTS TABLE POLICIES - ORGANIZATION SCOPED
-- =============================================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "message_recipients_org_members_read" ON message_recipients;
DROP POLICY IF EXISTS "message_recipients_org_members_create" ON message_recipients;
DROP POLICY IF EXISTS "message_recipients_recipient_update" ON message_recipients;
DROP POLICY IF EXISTS "message_recipients_recipient_delete" ON message_recipients;
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
-- GRANT NECESSARY PERMISSIONS
-- =============================================================================

-- Grant usage on all tables to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON organizations TO authenticated;
GRANT ALL ON user_organizations TO authenticated;
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
-- ORGANIZATION-SCOPED RLS DEPLOYMENT COMPLETE
-- =============================================================================
-- All tables now have organization-scoped RLS policies
-- Users can only access data from organizations they belong to
-- Complete multi-tenant data isolation is now enforced