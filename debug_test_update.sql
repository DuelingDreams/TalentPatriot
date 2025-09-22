-- Test Update Operation Script
-- Run this in Supabase SQL editor to test the exact update that's failing

-- 1. First, let's see the current state of the record
SELECT 
  id,
  org_id,
  job_id,
  candidate_id,
  pipeline_column_id,
  stage,
  pg_typeof(stage) as stage_type,
  notes,
  assigned_to,
  status,
  created_at,
  updated_at
FROM job_candidate 
WHERE id = '897de55d-b067-4dd7-b502-e28cf796fccc';

-- 2. Test the exact update that's failing - just pipeline_column_id
UPDATE job_candidate 
SET pipeline_column_id = '42ae32e1-0893-4a53-8455-cc64ee5d58a6'
WHERE id = '897de55d-b067-4dd7-b502-e28cf796fccc';

-- 3. If that works, test updating stage only
UPDATE job_candidate 
SET stage = 'hired'::candidate_stage
WHERE id = '897de55d-b067-4dd7-b502-e28cf796fccc';

-- 4. Test updating both fields together
UPDATE job_candidate 
SET 
  pipeline_column_id = '42ae32e1-0893-4a53-8455-cc64ee5d58a6',
  stage = 'hired'::candidate_stage
WHERE id = '897de55d-b067-4dd7-b502-e28cf796fccc';

-- 5. Check the target pipeline column exists
SELECT 
  id,
  org_id,
  job_id,
  title,
  position
FROM pipeline_columns 
WHERE id = '42ae32e1-0893-4a53-8455-cc64ee5d58a6';

-- 6. Test enum comparison that might be causing the error
SELECT 
  stage,
  stage = 'hired'::candidate_stage as direct_enum_comparison,
  stage::text = 'hired' as text_comparison,
  'hired'::candidate_stage = stage as reverse_comparison
FROM job_candidate 
WHERE id = '897de55d-b067-4dd7-b502-e28cf796fccc';

-- 7. Test if there are any implicit WHERE conditions being added
-- Check what happens with a simple select
SELECT * FROM job_candidate WHERE id = '897de55d-b067-4dd7-b502-e28cf796fccc';

-- 8. Test update with explicit casting
UPDATE job_candidate 
SET 
  pipeline_column_id = '42ae32e1-0893-4a53-8455-cc64ee5d58a6'::uuid,
  stage = 'hired'::candidate_stage,
  updated_at = NOW()
WHERE id = '897de55d-b067-4dd7-b502-e28cf796fccc'::uuid;