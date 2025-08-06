-- Supabase Performance Optimization Part 2 - Concurrent Index Creation
-- Run these commands one by one, NOT in a transaction

-- ========================================
-- CRITICAL FIX 2: Add ALL Missing Indexes (from your warnings)
-- Run each CREATE INDEX statement separately
-- ========================================

-- Applications table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_applications_candidate_id ON applications(candidate_id);

-- Candidate Notes indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_candidate_notes_author_id ON candidate_notes(author_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_candidate_notes_job_candidate_id ON candidate_notes(job_candidate_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_candidate_notes_org_id ON candidate_notes(org_id);

-- Candidates indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_candidates_created_by ON candidates(created_by);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_candidates_org_id ON candidates(org_id);

-- Clients indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clients_created_by ON clients(created_by);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clients_org_id ON clients(org_id);

-- Interviews indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_interviews_interviewer_id ON interviews(interviewer_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_interviews_job_candidate_id ON interviews(job_candidate_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_interviews_org_id ON interviews(org_id);

-- Job Candidate indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_candidate_application_id ON job_candidate(application_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_candidate_assigned_to ON job_candidate(assigned_to);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_candidate_candidate_id ON job_candidate(candidate_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_candidate_org_id ON job_candidate(org_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_candidate_job_id ON job_candidate(job_id);

-- Jobs indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_assigned_to ON jobs(assigned_to);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_created_by ON jobs(created_by);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_org_id ON jobs(org_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_client_id ON jobs(client_id);

-- Message Recipients indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_recipients_message_id ON message_recipients(message_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_recipients_recipient_id ON message_recipients(recipient_id);

-- Messages indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_candidate_id ON messages(candidate_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_client_id ON messages(client_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_job_id ON messages(job_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_org_id ON messages(org_id);

-- Notes indexes (if table exists)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notes_created_by ON notes(created_by);

-- User Organizations indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_orgs_user_id ON user_organizations(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_orgs_org_id ON user_organizations(org_id);

-- ========================================
-- Add status indexes for common queries
-- ========================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_status ON jobs(status) WHERE status = 'open';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_record_status ON jobs(record_status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_candidates_status ON candidates(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_candidate_stage ON job_candidate(stage);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_applications_job_id ON applications(job_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_interviews_status ON interviews(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_interviews_scheduled_at ON interviews(scheduled_at);

-- ========================================
-- Add composite indexes for common query patterns
-- ========================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_org_status ON jobs(org_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_candidate_job_stage ON job_candidate(job_id, stage);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_org_created ON messages(org_id, created_at DESC);

-- ========================================
-- Composite indexes for dashboard queries
-- ========================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_org_status_created ON jobs(org_id, status, created_at DESC) 
    WHERE record_status = 'active';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_candidates_org_created ON candidates(org_id, created_at DESC) 
    WHERE status = 'active';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_candidate_job_stage_created ON job_candidate(job_id, stage, created_at DESC) 
    WHERE status = 'active';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_interviews_org_scheduled ON interviews(org_id, scheduled_at DESC) 
    WHERE record_status = 'active';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_org_priority_created ON messages(org_id, priority, created_at DESC);

-- ========================================
-- Demo data optimization indexes
-- ========================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_demo_data ON jobs(record_status) 
    WHERE record_status = 'demo';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_demo_candidates ON candidates(status) 
    WHERE status = 'demo';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_demo_job_candidate ON job_candidate(status) 
    WHERE status = 'demo';

-- ========================================
-- Partial indexes for common filters
-- ========================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_open_active ON jobs(org_id, created_at DESC) 
    WHERE status = 'open' AND record_status = 'active';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_candidate_active ON job_candidate(job_id, stage, created_at DESC) 
    WHERE status = 'active';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_candidates_active ON candidates(org_id, created_at DESC) 
    WHERE status = 'active';

-- ========================================
-- Update table statistics after index creation
-- ========================================

ANALYZE applications;
ANALYZE candidate_notes;
ANALYZE candidates;
ANALYZE clients;
ANALYZE interviews;
ANALYZE job_candidate;
ANALYZE jobs;
ANALYZE message_recipients;
ANALYZE messages;
ANALYZE organizations;
ANALYZE user_organizations;
ANALYZE user_profiles;