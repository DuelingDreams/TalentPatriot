-- =====================================================
-- RLS Policy Testing Script
-- =====================================================
-- This script tests the RLS policies for different user roles
-- Run these queries with different auth contexts to verify policies work correctly

-- Test 1: Demo Viewer Access
-- Should only see demo records
SET session "app.current_user_role" = 'demo_viewer';
SELECT 'Demo Viewer - Clients' as test, count(*) as accessible_records FROM clients WHERE status = 'demo';
SELECT 'Demo Viewer - Jobs' as test, count(*) as accessible_records FROM jobs WHERE record_status = 'demo';
SELECT 'Demo Viewer - Candidates' as test, count(*) as accessible_records FROM candidates WHERE status = 'demo';

-- Test 2: BD (Business Development) Access
-- Should see non-demo records, read-only
SET session "app.current_user_role" = 'bd';
SELECT 'BD - Clients' as test, count(*) as accessible_records FROM clients WHERE (status IS DISTINCT FROM 'demo' OR status IS NULL);
SELECT 'BD - Jobs' as test, count(*) as accessible_records FROM jobs WHERE (record_status IS DISTINCT FROM 'demo' OR record_status IS NULL);
SELECT 'BD - Candidates' as test, count(*) as accessible_records FROM candidates WHERE (status IS DISTINCT FROM 'demo' OR status IS NULL);

-- Test 3: PM (Project Manager) Access
-- Should only see contract jobs and related data
SET session "app.current_user_role" = 'pm';
SELECT 'PM - Contract Jobs' as test, count(*) as accessible_records 
FROM jobs 
WHERE job_status = 'contract' AND (record_status IS DISTINCT FROM 'demo' OR record_status IS NULL);

-- Test 4: Recruiter Access
-- Should see non-demo records they're assigned to
SET session "app.current_user_role" = 'recruiter';
SET session "app.current_user_id" = 'test-recruiter-uuid';
SELECT 'Recruiter - Assigned Candidates' as test, count(*) as accessible_records 
FROM job_candidate 
WHERE (assigned_to = 'test-recruiter-uuid' OR assigned_to IS NULL) 
AND (status IS DISTINCT FROM 'demo' OR status IS NULL);

-- Test 5: Admin Access
-- Should see all records
SET session "app.current_user_role" = 'admin';
SELECT 'Admin - All Clients' as test, count(*) as total_records FROM clients;
SELECT 'Admin - All Jobs' as test, count(*) as total_records FROM jobs;
SELECT 'Admin - All Candidates' as test, count(*) as total_records FROM candidates;

-- Test 6: Unauthenticated Access
-- Should see no records
RESET "app.current_user_role";
RESET "app.current_user_id";
-- These queries should return 0 or fail due to RLS
SELECT 'Unauthenticated - Clients' as test, count(*) as should_be_zero FROM clients;
SELECT 'Unauthenticated - Jobs' as test, count(*) as should_be_zero FROM jobs;

-- =====================================================
-- Write Permission Tests
-- =====================================================

-- Test 7: Demo Data Write Protection
-- These should fail for all non-admin users
BEGIN;
-- Try to update demo client (should fail for non-admins)
UPDATE clients SET name = 'Modified Demo Client' WHERE status = 'demo' LIMIT 1;
ROLLBACK;

BEGIN;
-- Try to insert demo data (should fail for non-admins)
INSERT INTO clients (name, status) VALUES ('New Demo Client', 'demo');
ROLLBACK;

-- Test 8: Recruiter Assignment Restrictions
-- Recruiters should only be able to assign candidates to themselves
BEGIN;
SET session "app.current_user_role" = 'recruiter';
SET session "app.current_user_id" = 'test-recruiter-uuid';
-- This should succeed
UPDATE job_candidate 
SET assigned_to = 'test-recruiter-uuid' 
WHERE id = (SELECT id FROM job_candidate WHERE status IS DISTINCT FROM 'demo' LIMIT 1);
ROLLBACK;

BEGIN;
-- This should fail (trying to assign to someone else)
UPDATE job_candidate 
SET assigned_to = 'other-recruiter-uuid' 
WHERE id = (SELECT id FROM job_candidate WHERE status IS DISTINCT FROM 'demo' LIMIT 1);
ROLLBACK;

-- Test 9: Candidate Notes Author Restrictions
-- Only the author should be able to modify their notes
BEGIN;
SET session "app.current_user_role" = 'recruiter';
SET session "app.current_user_id" = 'author-uuid';
-- Insert a note (should succeed)
INSERT INTO candidate_notes (job_candidate_id, author_id, content) 
VALUES (
    (SELECT id FROM job_candidate WHERE status IS DISTINCT FROM 'demo' LIMIT 1), 
    'author-uuid', 
    'Test note'
);
-- Update own note (should succeed)
UPDATE candidate_notes SET content = 'Updated note' WHERE author_id = 'author-uuid';
ROLLBACK;

BEGIN;
SET session "app.current_user_id" = 'different-user-uuid';
-- Try to update someone else's note (should fail)
UPDATE candidate_notes SET content = 'Hacked note' WHERE author_id = 'author-uuid';
ROLLBACK;

-- =====================================================
-- Role Hierarchy Tests
-- =====================================================

-- Test 10: Admin Override
-- Admins should be able to do everything
BEGIN;
SET session "app.current_user_role" = 'admin';
-- Admin can modify demo data
UPDATE clients SET notes = 'Admin can modify demo data' WHERE status = 'demo' LIMIT 1;
-- Admin can assign candidates to anyone
UPDATE job_candidate SET assigned_to = 'any-user-uuid' WHERE status IS DISTINCT FROM 'demo' LIMIT 1;
-- Admin can modify anyone's notes
UPDATE candidate_notes SET content = 'Admin modified this' WHERE id = (SELECT id FROM candidate_notes LIMIT 1);
ROLLBACK;

-- Reset session variables
RESET "app.current_user_role";
RESET "app.current_user_id";

-- =====================================================
-- Expected Results Summary
-- =====================================================
-- 
-- All tests should demonstrate:
-- 1. Demo viewers see only demo data
-- 2. BD users see non-demo data but cannot write
-- 3. PM users see only contract jobs and related data
-- 4. Recruiters see non-demo data they're assigned to
-- 5. Admins see and can modify everything
-- 6. Unauthenticated users see nothing
-- 7. Demo data is protected from non-admin writes
-- 8. Assignment restrictions work for recruiters
-- 9. Note authorship is enforced
-- 10. Admin role overrides all restrictions
-- 
-- =====================================================