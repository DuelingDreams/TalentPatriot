-- =====================================================
-- TalentPatriot Candidate Notes Database Setup
-- =====================================================
-- This script sets up the candidate_notes table and related functionality
-- Execute this in your Supabase SQL Editor

-- 1. Create the candidate_notes table (if not exists)
CREATE TABLE IF NOT EXISTS candidate_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    job_candidate_id UUID NOT NULL REFERENCES job_candidate(id) ON DELETE CASCADE,
    author_id UUID NOT NULL, -- References auth.users(id)
    content TEXT NOT NULL,
    is_private VARCHAR(10) DEFAULT 'false' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 2. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_candidate_notes_job_candidate ON candidate_notes(job_candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_notes_org ON candidate_notes(org_id);
CREATE INDEX IF NOT EXISTS idx_candidate_notes_author ON candidate_notes(author_id);
CREATE INDEX IF NOT EXISTS idx_candidate_notes_created_at ON candidate_notes(created_at);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE candidate_notes ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for candidate_notes
-- Policy for viewing notes - users can view notes for their organization
CREATE POLICY candidate_notes_select_policy ON candidate_notes
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 
            FROM user_organizations uo 
            WHERE uo.user_id = auth.uid() 
            AND uo.org_id = candidate_notes.org_id
        )
    );

-- Policy for creating notes - users can create notes for their organization
CREATE POLICY candidate_notes_insert_policy ON candidate_notes
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 
            FROM user_organizations uo 
            WHERE uo.user_id = auth.uid() 
            AND uo.org_id = candidate_notes.org_id
        )
        AND author_id = auth.uid()
    );

-- Policy for updating notes - users can only update their own notes
CREATE POLICY candidate_notes_update_policy ON candidate_notes
    FOR UPDATE
    USING (
        author_id = auth.uid()
        AND EXISTS (
            SELECT 1 
            FROM user_organizations uo 
            WHERE uo.user_id = auth.uid() 
            AND uo.org_id = candidate_notes.org_id
        )
    );

-- Policy for deleting notes - users can only delete their own notes
CREATE POLICY candidate_notes_delete_policy ON candidate_notes
    FOR DELETE
    USING (
        author_id = auth.uid()
        AND EXISTS (
            SELECT 1 
            FROM user_organizations uo 
            WHERE uo.user_id = auth.uid() 
            AND uo.org_id = candidate_notes.org_id
        )
    );

-- 5. Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_candidate_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Create trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS candidate_notes_updated_at_trigger ON candidate_notes;
CREATE TRIGGER candidate_notes_updated_at_trigger
    BEFORE UPDATE ON candidate_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_candidate_notes_updated_at();

-- 7. Insert some demo data (optional - for testing)
-- This will only work if you have existing organizations, job_candidate records, and users
/*
INSERT INTO candidate_notes (org_id, job_candidate_id, author_id, content, is_private) 
VALUES (
    (SELECT id FROM organizations LIMIT 1), 
    (SELECT id FROM job_candidate LIMIT 1), 
    (SELECT auth.uid()),
    'Initial phone screen completed. Candidate shows strong technical skills.',
    'false'
) ON CONFLICT DO NOTHING;
*/

-- 8. Verify table creation
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'candidate_notes' 
ORDER BY ordinal_position;

-- =====================================================
-- Summary of what this script creates:
-- =====================================================
-- 1. candidate_notes table with proper relationships
-- 2. Performance indexes on key columns
-- 3. Row Level Security policies for multi-tenant access
-- 4. Auto-updating timestamp trigger
-- 5. Proper foreign key relationships to ensure data integrity
--
-- The table structure matches the Drizzle schema defined in shared/schema.ts
-- All notes are organization-scoped and user-scoped for security
-- Private notes are supported via the is_private column