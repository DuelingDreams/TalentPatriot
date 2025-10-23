-- Fix org_id mismatch - Update to Hildebrand org_id
-- IMPORTANT: Only run this AFTER verifying the org_id from verify_org_id_mismatch.sql

BEGIN;

-- Hildebrand Consulting Services org_id (from verification query)
DO $$
DECLARE
  correct_org_id UUID := '64eea1fa-1993-4966-bbd8-3d5109957c20'; -- Hildebrand Consulting Services
BEGIN
  -- Update application_metadata to use correct org_id
  UPDATE application_metadata
  SET org_id = correct_org_id
  WHERE org_id != correct_org_id;
  
  RAISE NOTICE 'Updated % application_metadata records', (SELECT COUNT(*) FROM application_metadata WHERE org_id = correct_org_id);
END $$;

-- Refresh the materialized view with new org_id
REFRESH MATERIALIZED VIEW mv_candidate_sources;

-- Verify the fix
SELECT 
  'Updated Application Metadata' as status,
  am.org_id,
  o.name as org_name,
  COUNT(*) as record_count
FROM application_metadata am
LEFT JOIN organizations o ON am.org_id = o.id
GROUP BY am.org_id, o.name;

-- Check materialized view now has data
SELECT 
  'Materialized View Data' as status,
  source,
  total_applications,
  hire_rate
FROM mv_candidate_sources
WHERE org_id = '64eea1fa-1993-4966-bbd8-3d5109957c20'
ORDER BY total_applications DESC;

COMMIT;

-- After running this, refresh analytics:
-- curl -X POST https://talentpatriot.com/api/analytics/refresh-cache
