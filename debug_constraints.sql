-- Constraints Investigation Script
-- Run this in Supabase SQL editor to check constraints on job_candidate table

-- 1. List all constraints on job_candidate table
SELECT 
  tc.constraint_name,
  tc.constraint_type,
  tc.table_name,
  kcu.column_name,
  tc.is_deferrable,
  tc.initially_deferred
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
WHERE tc.table_name = 'job_candidate'
ORDER BY tc.constraint_type, tc.constraint_name;

-- 2. Check specific constraints on stage column
SELECT 
  tc.constraint_name,
  tc.constraint_type,
  cc.check_clause,
  kcu.column_name
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc 
  ON tc.constraint_name = cc.constraint_name
LEFT JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'job_candidate' 
  AND (kcu.column_name = 'stage' OR cc.check_clause ILIKE '%stage%')
ORDER BY tc.constraint_name;

-- 3. Foreign key constraints details
SELECT 
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.update_rule,
  rc.delete_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
LEFT JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'job_candidate'
ORDER BY tc.constraint_name;

-- 4. Check for any domain constraints or custom types
SELECT 
  column_name,
  data_type,
  udt_name,
  domain_name,
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns
WHERE table_name = 'job_candidate'
  AND (data_type = 'USER-DEFINED' OR domain_name IS NOT NULL)
ORDER BY ordinal_position;

-- 5. Look for any exclusion or unique constraints that might involve stage
SELECT 
  tc.constraint_name,
  tc.constraint_type,
  string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) as columns
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'job_candidate'
  AND tc.constraint_type IN ('UNIQUE', 'EXCLUDE')
GROUP BY tc.constraint_name, tc.constraint_type
ORDER BY tc.constraint_name;