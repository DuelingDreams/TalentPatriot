-- Comprehensive Application Form Database Update Script
-- Generated on August 21, 2025
-- Purpose: Add fields to support the enhanced professional application form template

BEGIN;

-- Add comprehensive application data to candidates table
ALTER TABLE candidates 
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS portfolio_url TEXT,
ADD COLUMN IF NOT EXISTS work_authorization VARCHAR(10) CHECK (work_authorization IN ('yes', 'no')),
ADD COLUMN IF NOT EXISTS visa_sponsorship VARCHAR(10) CHECK (visa_sponsorship IN ('yes', 'no')),
ADD COLUMN IF NOT EXISTS age_confirmation VARCHAR(20) CHECK (age_confirmation IN ('18-or-older', 'under-18')),
ADD COLUMN IF NOT EXISTS previous_employee VARCHAR(10) CHECK (previous_employee IN ('yes', 'no')),
ADD COLUMN IF NOT EXISTS referral_source VARCHAR(20) CHECK (referral_source IN ('career-page', 'linkedin', 'indeed', 'referral', 'other')),
ADD COLUMN IF NOT EXISTS employment_history TEXT, -- JSON string for employment data
ADD COLUMN IF NOT EXISTS comprehensive_education TEXT, -- JSON string for detailed education (different from resume 'education')
ADD COLUMN IF NOT EXISTS data_privacy_ack BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS ai_acknowledgment BOOLEAN DEFAULT FALSE;

-- Add diversity fields (optional for EEO reporting)
ALTER TABLE candidates
ADD COLUMN IF NOT EXISTS gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'non-binary', 'other', '')),
ADD COLUMN IF NOT EXISTS race_ethnicity VARCHAR(30) CHECK (race_ethnicity IN ('asian', 'black', 'hispanic', 'white', 'two-or-more', 'other', '')),
ADD COLUMN IF NOT EXISTS veteran_status VARCHAR(30) CHECK (veteran_status IN ('veteran', 'disabled-veteran', 'recently-separated', '')),
ADD COLUMN IF NOT EXISTS disability_status VARCHAR(10) CHECK (disability_status IN ('yes', 'no', ''));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_candidates_linkedin ON candidates(linkedin_url);
CREATE INDEX IF NOT EXISTS idx_candidates_referral_source ON candidates(referral_source);
CREATE INDEX IF NOT EXISTS idx_candidates_work_auth ON candidates(work_authorization);

-- Create application_metadata table to store additional form data
CREATE TABLE IF NOT EXISTS application_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) NOT NULL,
    candidate_id UUID REFERENCES candidates(id) NOT NULL,
    job_id UUID REFERENCES jobs(id) NOT NULL,
    
    -- Form section data as JSON
    education_details TEXT, -- Structured education data from form
    employment_details TEXT, -- Structured employment data from form
    
    -- Application specific data
    application_source VARCHAR(50),
    submission_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    form_version VARCHAR(10) DEFAULT 'v1.0',
    
    -- Tracking
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(candidate_id, job_id) -- One metadata record per application
);

-- Create indexes for application_metadata
CREATE INDEX IF NOT EXISTS idx_app_metadata_candidate ON application_metadata(candidate_id);
CREATE INDEX IF NOT EXISTS idx_app_metadata_job ON application_metadata(job_id);
CREATE INDEX IF NOT EXISTS idx_app_metadata_org ON application_metadata(org_id);

-- Add resume parsing improvements to existing schema
-- Enhance existing resume parsing fields with better data types
ALTER TABLE candidates 
ALTER COLUMN skills TYPE TEXT[], -- Ensure array type for skills
ALTER COLUMN education TYPE TEXT; -- JSON string for education data

-- Add computed search content update trigger
CREATE OR REPLACE FUNCTION update_candidate_search_content()
RETURNS TRIGGER AS $$
BEGIN
    -- Update searchable content whenever relevant fields change
    NEW.searchable_content := LOWER(
        COALESCE(NEW.name, '') || ' ' ||
        COALESCE(NEW.email, '') || ' ' ||
        COALESCE(NEW.summary, '') || ' ' ||
        COALESCE(array_to_string(NEW.skills, ' '), '') || ' ' ||
        COALESCE(NEW.employment_history, '') || ' ' ||
        COALESCE(NEW.comprehensive_education, '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create or replace trigger
DROP TRIGGER IF EXISTS candidate_search_content_trigger ON candidates;
CREATE TRIGGER candidate_search_content_trigger
    BEFORE INSERT OR UPDATE ON candidates
    FOR EACH ROW
    EXECUTE FUNCTION update_candidate_search_content();

-- Add GIN index for full-text search
CREATE INDEX IF NOT EXISTS idx_candidates_searchable_gin 
ON candidates USING GIN (to_tsvector('english', searchable_content));

-- Create view for comprehensive candidate data
CREATE OR REPLACE VIEW candidate_full_profile AS
SELECT 
    c.*,
    am.education_details,
    am.employment_details,
    am.application_source,
    am.form_version,
    COUNT(jc.id) as total_applications
FROM candidates c
LEFT JOIN application_metadata am ON c.id = am.candidate_id
LEFT JOIN job_candidate jc ON c.id = jc.candidate_id
GROUP BY c.id, am.id;

-- Update existing candidates with default values
UPDATE candidates 
SET searchable_content = LOWER(
    COALESCE(name, '') || ' ' ||
    COALESCE(email, '') || ' ' ||
    COALESCE(summary, '') || ' ' ||
    COALESCE(array_to_string(skills, ' '), '')
)
WHERE searchable_content IS NULL;

COMMIT;

-- Success message
SELECT 'Comprehensive application form database update completed successfully!' as result;

-- Show affected table schemas
\d+ candidates;
\d+ application_metadata;