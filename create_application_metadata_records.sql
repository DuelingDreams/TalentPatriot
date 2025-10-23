-- Create application_metadata records for all existing job applications
-- This populates the table that mv_candidate_sources queries

BEGIN;

-- Insert application_metadata records from job_candidate + candidates data
INSERT INTO application_metadata (
  org_id,
  candidate_id,
  job_id,
  application_source,
  submission_timestamp,
  created_at,
  updated_at
)
SELECT 
  j.org_id,  -- Get org_id from jobs table instead of job_candidate
  jc.candidate_id,
  jc.job_id,
  COALESCE(c.source, 'direct') as application_source,  -- Use candidate source or default to 'direct'
  jc.created_at as submission_timestamp,
  jc.created_at,
  NOW()
FROM job_candidate jc
INNER JOIN candidates c ON jc.candidate_id = c.id
INNER JOIN jobs j ON jc.job_id = j.id  -- Join jobs table to get org_id
WHERE NOT EXISTS (
  -- Don't create duplicates if record already exists
  SELECT 1 FROM application_metadata am
  WHERE am.candidate_id = jc.candidate_id 
    AND am.job_id = jc.job_id
);

-- Verify the insert
SELECT 
  'application_metadata records created' as status,
  COUNT(*) as total_records
FROM application_metadata;

-- Show source distribution
SELECT 
  application_source,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM application_metadata), 0), 1) as percentage
FROM application_metadata
GROUP BY application_source
ORDER BY count DESC;

COMMIT;

-- After running this, refresh the analytics:
-- curl -X POST https://talentpatriot.com/api/analytics/refresh-cache
