-- Verify org_id mismatch for mhildebrand@mentalcastle.com
-- Run this first to confirm the issue

-- 1. Find the user's org_id
SELECT 
  'User Organization' as check_type,
  u.email,
  uo.org_id,
  o.name as org_name
FROM auth.users u
JOIN user_organizations uo ON u.id = uo.user_id
JOIN organizations o ON uo.org_id = o.id
WHERE u.email = 'mhildebrand@mentalcastle.com';

-- 2. Check org_ids in application_metadata
SELECT 
  'Application Metadata Org IDs' as check_type,
  am.org_id,
  o.name as org_name,
  COUNT(*) as record_count
FROM application_metadata am
LEFT JOIN organizations o ON am.org_id = o.id
GROUP BY am.org_id, o.name
ORDER BY record_count DESC;

-- 3. Check org_ids in jobs table
SELECT 
  'Jobs Org IDs' as check_type,
  j.org_id,
  o.name as org_name,
  COUNT(*) as job_count
FROM jobs j
LEFT JOIN organizations o ON j.org_id = o.id
GROUP BY j.org_id, o.name
ORDER BY job_count DESC;

-- 4. Check org_ids in candidates table
SELECT 
  'Candidates Org IDs' as check_type,
  c.org_id,
  o.name as org_name,
  COUNT(*) as candidate_count
FROM candidates c
LEFT JOIN organizations o ON c.org_id = o.id
GROUP BY c.org_id, o.name
ORDER BY candidate_count DESC;
