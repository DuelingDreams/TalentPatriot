-- Minimal SQL Script to Fix Candidate Notes Authentication Issue
-- Targets only candidate_notes RLS policies - Safe to run

-- Enable RLS on candidate_notes table
ALTER TABLE candidate_notes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view notes in their org" ON candidate_notes;
DROP POLICY IF EXISTS "Users can create notes in their org" ON candidate_notes;
DROP POLICY IF EXISTS "Users can update their own notes" ON candidate_notes;

-- Allow authenticated users to view notes in their organization
CREATE POLICY "Users can view notes in their org" ON candidate_notes
    FOR SELECT
    USING (
        auth.uid() IS NOT NULL 
        AND org_id IN (
            SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
        )
    );

-- Allow authenticated users to create notes in their organization
CREATE POLICY "Users can create notes in their org" ON candidate_notes
    FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL 
        AND author_id = auth.uid()
        AND org_id IN (
            SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
        )
    );

-- Allow users to update their own notes
CREATE POLICY "Users can update their own notes" ON candidate_notes
    FOR UPDATE
    USING (
        auth.uid() IS NOT NULL 
        AND author_id = auth.uid()
        AND org_id IN (
            SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
        )
    );