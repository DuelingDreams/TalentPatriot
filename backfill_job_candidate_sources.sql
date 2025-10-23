-- Backfill job_candidate.source from candidates.source
-- This populates the source field that analytics actually queries from

BEGIN;

-- Copy source data from candidates to job_candidate table
UPDATE job_candidate jc
SET source = c.source
FROM candidates c
WHERE jc.candidate_id = c.id
  AND c.source IS NOT NULL
  AND jc.source IS NULL;

-- Verify the update
SELECT 
  'job_candidate records updated' as status,
  COUNT(*) as total_updated
FROM job_candidate
WHERE source IS NOT NULL;

-- Show source distribution in job_candidate
SELECT 
  source,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM job_candidate WHERE source IS NOT NULL), 1) as percentage
FROM job_candidate
WHERE source IS NOT NULL
GROUP BY source
ORDER BY count DESC;

COMMIT;

-- After running this, execute the refresh command:
-- curl -X POST https://talentpatriot.com/api/analytics/refresh-cache
