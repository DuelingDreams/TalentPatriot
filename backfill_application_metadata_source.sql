-- Backfill application_metadata.application_source from candidates.source
-- This is the table that mv_candidate_sources actually queries from!

BEGIN;

-- Update application_metadata with source data from candidates
UPDATE application_metadata am
SET application_source = c.source
FROM candidates c
WHERE am.candidate_id = c.id
  AND c.source IS NOT NULL
  AND (am.application_source IS NULL OR am.application_source = 'direct');

-- Verify the update
SELECT 
  'application_metadata records updated' as status,
  COUNT(*) as total_with_source
FROM application_metadata
WHERE application_source IS NOT NULL AND application_source != 'direct';

-- Show source distribution in application_metadata
SELECT 
  application_source as source,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM application_metadata WHERE application_source IS NOT NULL), 0), 1) as percentage
FROM application_metadata
WHERE application_source IS NOT NULL
GROUP BY application_source
ORDER BY count DESC;

COMMIT;

-- After running this, refresh the analytics:
-- curl -X POST https://talentpatriot.com/api/analytics/refresh-cache
