-- ============================================================================
-- Resume Parsing Upgrade Migration
-- Safe to run multiple times (uses IF NOT EXISTS checks)
-- 
-- INSTRUCTIONS:
-- 1. Copy this entire script
-- 2. Go to Supabase SQL Editor
-- 3. Paste and run
-- 4. Verify success message at bottom
-- ============================================================================

-- Create parsing status enum if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'parsing_status') THEN
    CREATE TYPE parsing_status AS ENUM ('pending', 'processing', 'completed', 'failed');
  END IF;
END $$;

-- Add new columns to candidates table
-- Using ALTER TABLE ADD COLUMN IF NOT EXISTS for safety

-- Work experience as JSONB array
-- Structure: [{ title, company, duration, location, description, achievements[] }]
ALTER TABLE candidates 
ADD COLUMN IF NOT EXISTS work_experience JSONB DEFAULT '[]'::jsonb;

-- Projects as JSONB array
-- Structure: [{ name, description, technologies[] }]
ALTER TABLE candidates 
ADD COLUMN IF NOT EXISTS projects JSONB DEFAULT '[]'::jsonb;

-- Languages as text array
ALTER TABLE candidates 
ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Certifications as text array (separate from general skills)
ALTER TABLE candidates 
ADD COLUMN IF NOT EXISTS certifications TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Parsing status tracking
ALTER TABLE candidates 
ADD COLUMN IF NOT EXISTS parsing_status parsing_status DEFAULT 'pending';

-- Timestamp when parsing completed
ALTER TABLE candidates 
ADD COLUMN IF NOT EXISTS resume_parsed_at TIMESTAMP;

-- Error message if parsing failed
ALTER TABLE candidates 
ADD COLUMN IF NOT EXISTS parsing_error TEXT;

-- Update searchable_content to ensure it exists (it should already exist from schema)
-- This is a safety check
ALTER TABLE candidates 
ADD COLUMN IF NOT EXISTS searchable_content TEXT;

-- Create index on parsing_status for performance
CREATE INDEX IF NOT EXISTS idx_candidates_parsing_status 
ON candidates(parsing_status);

-- Create index on searchable_content for full-text search performance
CREATE INDEX IF NOT EXISTS idx_candidates_searchable_content 
ON candidates USING gin(to_tsvector('english', COALESCE(searchable_content, '')));

-- Add comment documentation
COMMENT ON COLUMN candidates.work_experience IS 'Parsed work experience history from resume as JSONB array';
COMMENT ON COLUMN candidates.projects IS 'Parsed projects from resume as JSONB array';
COMMENT ON COLUMN candidates.languages IS 'Languages spoken (parsed from resume)';
COMMENT ON COLUMN candidates.certifications IS 'Professional certifications (parsed from resume)';
COMMENT ON COLUMN candidates.parsing_status IS 'Resume parsing status: pending, processing, completed, failed';
COMMENT ON COLUMN candidates.resume_parsed_at IS 'Timestamp when resume parsing completed successfully';
COMMENT ON COLUMN candidates.parsing_error IS 'Error message if resume parsing failed';

-- Verification query
SELECT 
  'Migration completed successfully!' as status,
  COUNT(*) as total_candidates,
  COUNT(resume_url) as candidates_with_resume,
  COUNT(CASE WHEN parsing_status = 'completed' THEN 1 END) as parsed_resumes
FROM candidates;
