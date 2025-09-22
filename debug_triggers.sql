-- Triggers Investigation Script
-- Run this in Supabase SQL editor to check triggers on job_candidate table

-- 1. List all triggers on job_candidate table
SELECT 
  trigger_name,
  event_manipulation,
  event_object_schema,
  event_object_table,
  action_statement,
  action_orientation,
  action_timing,
  action_condition
FROM information_schema.triggers 
WHERE event_object_table = 'job_candidate'
ORDER BY trigger_name;

-- 2. Get detailed trigger definitions
SELECT 
  t.tgname as trigger_name,
  t.tgenabled as enabled,
  t.tgtype as trigger_type,
  pg_get_triggerdef(t.oid) as trigger_definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'job_candidate'
  AND NOT t.tgisinternal;

-- 3. Check for any functions that might be called by triggers
SELECT 
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_name LIKE '%job_candidate%' 
   OR routine_name LIKE '%move%'
   OR routine_name LIKE '%stage%'
   OR routine_definition ILIKE '%job_candidate%'
ORDER BY routine_name;

-- 4. Look for any Supabase realtime triggers
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE action_statement LIKE '%realtime%'
   OR trigger_name LIKE '%realtime%'
ORDER BY trigger_name;

-- 5. Check for enum-related triggers or functions
SELECT 
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_definition ILIKE '%candidate_stage%'
   OR routine_definition ILIKE '%enum%'
ORDER BY routine_name;