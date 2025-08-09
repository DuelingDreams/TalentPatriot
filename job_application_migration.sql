-- Job Application System Database Migration
-- Creates indexes and constraints to optimize job application flow

-- Create indexes for applications performance
CREATE INDEX IF NOT EXISTS idx_job_candidate_job_applied ON job_candidate(job_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_candidate_org_status ON job_candidate(org_id, status);
CREATE INDEX IF NOT EXISTS idx_job_candidate_pipeline ON job_candidate(pipeline_column_id, created_at DESC);

-- Create unique index for candidate email per organization (deduplication)
CREATE UNIQUE INDEX IF NOT EXISTS idx_candidates_org_email ON candidates(org_id, email) WHERE status = 'active';

-- Create index for job lookup by status and published_at
CREATE INDEX IF NOT EXISTS idx_jobs_open_published ON jobs(status, published_at DESC) WHERE status = 'open';
CREATE INDEX IF NOT EXISTS idx_jobs_org_status ON jobs(org_id, status);

-- Ensure foreign key constraints are properly set
-- Note: These should already exist from Drizzle schema, but adding for completeness

-- Add constraint comments for documentation
COMMENT ON INDEX idx_job_candidate_job_applied IS 'Optimizes job application lookup and sorting by application date';
COMMENT ON INDEX idx_candidates_org_email IS 'Ensures unique candidate email per organization for deduplication';
COMMENT ON INDEX idx_jobs_open_published IS 'Optimizes public job listing queries';

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to relevant tables
DROP TRIGGER IF EXISTS update_candidates_updated_at ON candidates;
CREATE TRIGGER update_candidates_updated_at
    BEFORE UPDATE ON candidates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_job_candidate_updated_at ON job_candidate;
CREATE TRIGGER update_job_candidate_updated_at
    BEFORE UPDATE ON job_candidate
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Migration completed
SELECT 'Job application system migration completed successfully' as result;