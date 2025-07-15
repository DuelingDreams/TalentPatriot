-- Add demo interview dates to existing job_candidate records
-- This will populate the calendar with sample interview events

-- Update some demo job candidates with interview dates
UPDATE job_candidate 
SET 
  interview_date = '2025-07-16 10:00:00',
  stage = 'interview',
  updated_at = NOW()
WHERE id IN (
  SELECT jc.id FROM job_candidate jc
  JOIN candidates c ON jc.candidate_id = c.id
  JOIN jobs j ON jc.job_id = j.id
  WHERE c.status = 'demo' 
  AND c.name = 'Sarah Johnson'
  LIMIT 1
);

UPDATE job_candidate 
SET 
  interview_date = '2025-07-17 14:30:00',
  stage = 'interview',
  updated_at = NOW()
WHERE id IN (
  SELECT jc.id FROM job_candidate jc
  JOIN candidates c ON jc.candidate_id = c.id
  JOIN jobs j ON jc.job_id = j.id
  WHERE c.status = 'demo' 
  AND c.name = 'Michael Chen'
  LIMIT 1
);

UPDATE job_candidate 
SET 
  interview_date = '2025-07-18 11:00:00',
  stage = 'interview',
  updated_at = NOW()
WHERE id IN (
  SELECT jc.id FROM job_candidate jc
  JOIN candidates c ON jc.candidate_id = c.id
  JOIN jobs j ON jc.job_id = j.id
  WHERE c.status = 'demo' 
  AND c.name = 'Emily Rodriguez'
  LIMIT 1
);

UPDATE job_candidate 
SET 
  interview_date = '2025-07-19 09:30:00',
  stage = 'interview',
  updated_at = NOW()
WHERE id IN (
  SELECT jc.id FROM job_candidate jc
  JOIN candidates c ON jc.candidate_id = c.id
  JOIN jobs j ON jc.job_id = j.id
  WHERE c.status = 'demo' 
  AND c.name = 'David Wilson'
  LIMIT 1
);

UPDATE job_candidate 
SET 
  interview_date = '2025-07-22 15:00:00',
  stage = 'interview',
  updated_at = NOW()
WHERE id IN (
  SELECT jc.id FROM job_candidate jc
  JOIN candidates c ON jc.candidate_id = c.id
  JOIN jobs j ON jc.job_id = j.id
  WHERE c.status = 'demo' 
  AND c.name = 'Lisa Park'
  LIMIT 1
);