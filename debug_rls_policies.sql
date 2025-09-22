-- RLS Policies Investigation Script
-- Run this in Supabase SQL editor to check Row Level Security policies

-- 1. Check if RLS is enabled on job_candidate table
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  hasindex,
  hasrules,
  hastriggers
FROM pg_tables 
WHERE tablename = 'job_candidate';

-- 2. List all RLS policies on job_candidate table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'job_candidate'
ORDER BY policyname;

-- 3. Get detailed policy definitions including the actual SQL
SELECT 
  pol.polname as policy_name,
  pol.polcmd as command_type,
  pol.polpermissive as permissive,
  pol.polroles as roles,
  pg_get_expr(pol.polqual, pol.polrelid) as using_expression,
  pg_get_expr(pol.polwithcheck, pol.polrelid) as with_check_expression
FROM pg_policy pol
JOIN pg_class pc ON pol.polrelid = pc.oid
WHERE pc.relname = 'job_candidate';

-- 4. Check auth schema policies that might affect job_candidate
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'auth' OR tablename LIKE '%job%' OR tablename LIKE '%candidate%'
ORDER BY schemaname, tablename, policyname;