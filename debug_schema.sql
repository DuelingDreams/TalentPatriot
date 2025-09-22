-- Debug SQL Script for Supabase Schema Analysis
-- Run this in your Supabase SQL editor to diagnose the type mismatch issue

-- 1. Check the exact structure of the job_candidate table
SELECT 
  column_name,
  data_type,
  udt_name,
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'job_candidate' 
ORDER BY ordinal_position;

-- 2. Check if candidate_stage enum type exists and its values
SELECT 
  t.typname as enum_name,
  e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'candidate_stage'
ORDER BY e.enumsortorder;

-- 3. Check for any constraints on the stage column
SELECT 
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.check_constraints cc 
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'job_candidate' 
  AND (kcu.column_name = 'stage' OR tc.constraint_type = 'CHECK');

-- 4. Sample data from job_candidate table to see actual values
SELECT 
  id,
  stage,
  pipeline_column_id,
  pg_typeof(stage) as stage_type
FROM job_candidate 
LIMIT 5;

-- 5. Check pipeline_columns table structure
SELECT 
  id,
  title,
  job_id,
  org_id
FROM pipeline_columns 
WHERE id = '42ae32e1-0893-4a53-8455-cc64ee5d58a6';

-- 6. Check if there are any triggers on job_candidate table
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'job_candidate';

-- 7. Test the exact update that's failing
-- First, let's see what record we're trying to update
SELECT 
  id,
  stage,
  pipeline_column_id,
  pg_typeof(stage) as current_stage_type
FROM job_candidate 
WHERE id = '897de55d-b067-4dd7-b502-e28cf796fccc';