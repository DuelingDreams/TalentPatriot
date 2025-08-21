-- Resume Parsing Schema Update for TalentPatriot ATS
-- Add columns to candidates table for storing parsed resume data

-- Add resume parsing fields to candidates table
ALTER TABLE candidates 
ADD COLUMN IF NOT EXISTS resume_parsed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS skills TEXT[],
ADD COLUMN IF NOT EXISTS experience_level TEXT CHECK (experience_level IN ('entry', 'mid', 'senior', 'executive')),
ADD COLUMN IF NOT EXISTS total_years_experience INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS education TEXT, -- JSON string of education data
ADD COLUMN IF NOT EXISTS summary TEXT,
ADD COLUMN IF NOT EXISTS searchable_content TEXT; -- For full-text search

-- Create index for skills array search
CREATE INDEX IF NOT EXISTS idx_candidates_skills ON candidates USING GIN (skills);

-- Create index for searchable content full-text search
CREATE INDEX IF NOT EXISTS idx_candidates_searchable_content ON candidates USING GIN (to_tsvector('english', searchable_content));

-- Create index for experience level filtering
CREATE INDEX IF NOT EXISTS idx_candidates_experience_level ON candidates (experience_level) WHERE experience_level IS NOT NULL;

-- Create index for resume parsed status
CREATE INDEX IF NOT EXISTS idx_candidates_resume_parsed ON candidates (resume_parsed) WHERE resume_parsed = TRUE;

-- Add comment to document the new fields
COMMENT ON COLUMN candidates.resume_parsed IS 'Whether the resume has been processed by AI parsing';
COMMENT ON COLUMN candidates.skills IS 'Array of skills extracted from resume (technical, soft, certifications)';
COMMENT ON COLUMN candidates.experience_level IS 'Experience level determined by AI parsing (entry, mid, senior, executive)';
COMMENT ON COLUMN candidates.total_years_experience IS 'Total years of professional experience calculated by AI';
COMMENT ON COLUMN candidates.education IS 'JSON string containing education history from resume';
COMMENT ON COLUMN candidates.summary IS 'Professional summary extracted from resume';
COMMENT ON COLUMN candidates.searchable_content IS 'Full-text searchable content combining all resume data for advanced search';

-- Optional: Update existing candidates to have default values
UPDATE candidates 
SET resume_parsed = FALSE, 
    total_years_experience = 0 
WHERE resume_parsed IS NULL OR total_years_experience IS NULL;