-- Safe SQL Script for Adding Source Tracking Fields
-- Run this in Supabase SQL Editor
-- This script is idempotent - safe to run multiple times

-- ============================================
-- Add 'source' column to candidates table
-- ============================================
DO $$ 
BEGIN
    -- Check if column exists before adding
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'candidates' 
        AND column_name = 'source'
    ) THEN
        ALTER TABLE candidates 
        ADD COLUMN source varchar(100);
        
        RAISE NOTICE 'Added source column to candidates table';
    ELSE
        RAISE NOTICE 'Source column already exists in candidates table';
    END IF;
END $$;

-- ============================================
-- Add 'source' column to job_candidate table
-- ============================================
DO $$ 
BEGIN
    -- Check if column exists before adding
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'job_candidate' 
        AND column_name = 'source'
    ) THEN
        ALTER TABLE job_candidate 
        ADD COLUMN source varchar(100);
        
        RAISE NOTICE 'Added source column to job_candidate table';
    ELSE
        RAISE NOTICE 'Source column already exists in job_candidate table';
    END IF;
END $$;

-- ============================================
-- Create index on source for analytics queries
-- ============================================
DO $$ 
BEGIN
    -- Check if index exists before creating
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE tablename = 'candidates' 
        AND indexname = 'idx_candidates_source'
    ) THEN
        CREATE INDEX idx_candidates_source ON candidates(source);
        RAISE NOTICE 'Created index on candidates.source';
    ELSE
        RAISE NOTICE 'Index idx_candidates_source already exists';
    END IF;
END $$;

DO $$ 
BEGIN
    -- Check if index exists before creating
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE tablename = 'job_candidate' 
        AND indexname = 'idx_job_candidate_source'
    ) THEN
        CREATE INDEX idx_job_candidate_source ON job_candidate(source);
        RAISE NOTICE 'Created index on job_candidate.source';
    ELSE
        RAISE NOTICE 'Index idx_job_candidate_source already exists';
    END IF;
END $$;

-- ============================================
-- Verification Queries
-- ============================================

-- Check that columns were added successfully
SELECT 
    table_name, 
    column_name, 
    data_type, 
    character_maximum_length
FROM information_schema.columns
WHERE table_name IN ('candidates', 'job_candidate')
AND column_name = 'source'
ORDER BY table_name;

-- Show sample of existing data
SELECT 
    'candidates' as table_name,
    COUNT(*) as total_rows,
    COUNT(source) as rows_with_source,
    COUNT(*) - COUNT(source) as rows_without_source
FROM candidates
UNION ALL
SELECT 
    'job_candidate' as table_name,
    COUNT(*) as total_rows,
    COUNT(source) as rows_with_source,
    COUNT(*) - COUNT(source) as rows_without_source
FROM job_candidate;

-- ============================================
-- DONE!
-- ============================================
-- The source field has been added and is ready to track:
-- - LinkedIn
-- - Indeed
-- - Company Website
-- - Referral
-- - Social Media
-- - Recruiter Contact
-- - Other
-- ============================================
