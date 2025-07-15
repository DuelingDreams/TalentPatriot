-- Direct SQL seeding script for demo data
-- This script assumes tables already exist based on the shared schema

-- Insert demo clients
INSERT INTO clients (name, industry, location, website, contact_name, contact_email, contact_phone, notes, status)
VALUES 
  ('TechCorp Solutions', 'Technology', 'San Francisco, CA', 'https://techcorp.demo', 'Sarah Johnson', 'sarah@techcorp.demo', '+1 (555) 123-4567', 'Leading tech company specializing in AI solutions', 'demo'),
  ('InnovateCo', 'Software Development', 'Austin, TX', 'https://innovate.demo', 'Michael Chen', 'michael@innovate.demo', '+1 (555) 234-5678', 'Fast-growing startup focused on mobile applications', 'demo'),
  ('DataDyne Corp', 'Data Analytics', 'New York, NY', 'https://datadyne.demo', 'Emily Rodriguez', 'emily@datadyne.demo', '+1 (555) 345-6789', 'Enterprise data analytics and visualization company', 'demo')
ON CONFLICT DO NOTHING;

-- Insert demo candidates
INSERT INTO candidates (name, email, phone, resume_url, status)
VALUES 
  ('Alex Rodriguez', 'alex.demo@example.com', '+1 (555) 111-2222', 'https://example.com/resume/alex.pdf', 'demo'),
  ('Sarah Chen', 'sarah.demo@example.com', '+1 (555) 222-3333', 'https://example.com/resume/sarah.pdf', 'demo'),
  ('Michael Park', 'michael.demo@example.com', '+1 (555) 333-4444', 'https://example.com/resume/michael.pdf', 'demo'),
  ('Emma Wilson', 'emma.demo@example.com', '+1 (555) 444-5555', 'https://example.com/resume/emma.pdf', 'demo'),
  ('David Kim', 'david.demo@example.com', '+1 (555) 555-6666', 'https://example.com/resume/david.pdf', 'demo')
ON CONFLICT DO NOTHING;

-- Insert demo jobs (using client IDs from above)
INSERT INTO jobs (title, description, client_id, job_status, record_status)
SELECT 
  'Senior React Developer',
  'We are looking for an experienced React developer to join our frontend team. Must have 5+ years of experience with React, TypeScript, and modern development practices.',
  c.id,
  'open',
  'demo'
FROM clients c WHERE c.name = 'TechCorp Solutions' AND c.status = 'demo'
UNION ALL
SELECT 
  'DevOps Engineer',
  'Seeking a skilled DevOps engineer to manage our cloud infrastructure. Experience with AWS, Docker, and Kubernetes required.',
  c.id,
  'open',
  'demo'
FROM clients c WHERE c.name = 'InnovateCo' AND c.status = 'demo'
UNION ALL
SELECT 
  'Data Scientist',
  'Join our data science team to build machine learning models and analyze large datasets. PhD in Data Science or related field preferred.',
  c.id,
  'open',
  'demo'
FROM clients c WHERE c.name = 'DataDyne Corp' AND c.status = 'demo'
UNION ALL
SELECT 
  'Product Manager',
  'Lead product development for our mobile app. Experience in agile methodologies and user research required.',
  c.id,
  'filled',
  'demo'
FROM clients c WHERE c.name = 'InnovateCo' AND c.status = 'demo'
ON CONFLICT DO NOTHING;

-- Insert job-candidate relationships
INSERT INTO job_candidate (job_id, candidate_id, stage, notes, assigned_to, status)
SELECT 
  j.id,
  c.id,
  'applied',
  'Strong React portfolio, good communication skills',
  'cd99579b-1b80-4802-9651-e881fb707583',
  'demo'
FROM jobs j, candidates c 
WHERE j.title = 'Senior React Developer' AND j.record_status = 'demo'
  AND c.name = 'Alex Rodriguez' AND c.status = 'demo'
UNION ALL
SELECT 
  j.id,
  c.id,
  'interview',
  'Impressive technical background, scheduled for final interview',
  'cd99579b-1b80-4802-9651-e881fb707583',
  'demo'
FROM jobs j, candidates c 
WHERE j.title = 'Senior React Developer' AND j.record_status = 'demo'
  AND c.name = 'Sarah Chen' AND c.status = 'demo'
UNION ALL
SELECT 
  j.id,
  c.id,
  'technical',
  'Excellent AWS knowledge, completing technical assessment',
  'cd99579b-1b80-4802-9651-e881fb707583',
  'demo'
FROM jobs j, candidates c 
WHERE j.title = 'DevOps Engineer' AND j.record_status = 'demo'
  AND c.name = 'Michael Park' AND c.status = 'demo'
UNION ALL
SELECT 
  j.id,
  c.id,
  'offer',
  'Strong candidate, offer extended',
  'cd99579b-1b80-4802-9651-e881fb707583',
  'demo'
FROM jobs j, candidates c 
WHERE j.title = 'DevOps Engineer' AND j.record_status = 'demo'
  AND c.name = 'Emma Wilson' AND c.status = 'demo'
UNION ALL
SELECT 
  j.id,
  c.id,
  'screening',
  'PhD in ML, reviewing research publications',
  'cd99579b-1b80-4802-9651-e881fb707583',
  'demo'
FROM jobs j, candidates c 
WHERE j.title = 'Data Scientist' AND j.record_status = 'demo'
  AND c.name = 'David Kim' AND c.status = 'demo'
UNION ALL
SELECT 
  j.id,
  c.id,
  'hired',
  'Excellent product sense, started last week',
  'cd99579b-1b80-4802-9651-e881fb707583',
  'demo'
FROM jobs j, candidates c 
WHERE j.title = 'Product Manager' AND j.record_status = 'demo'
  AND c.name = 'Alex Rodriguez' AND c.status = 'demo'
ON CONFLICT DO NOTHING;

-- Insert candidate notes
INSERT INTO candidate_notes (job_candidate_id, author_id, content, status)
SELECT 
  jc.id,
  'cd99579b-1b80-4802-9651-e881fb707583',
  'Initial screening call went well. Candidate has strong React experience and good problem-solving skills.',
  'demo'
FROM job_candidate jc 
JOIN jobs j ON jc.job_id = j.id
JOIN candidates c ON jc.candidate_id = c.id
WHERE j.title = 'Senior React Developer' AND c.name = 'Alex Rodriguez' AND jc.status = 'demo'
UNION ALL
SELECT 
  jc.id,
  'cd99579b-1b80-4802-9651-e881fb707583',
  'Technical interview completed successfully. Moving to final round with team lead.',
  'demo'
FROM job_candidate jc 
JOIN jobs j ON jc.job_id = j.id
JOIN candidates c ON jc.candidate_id = c.id
WHERE j.title = 'Senior React Developer' AND c.name = 'Sarah Chen' AND jc.status = 'demo'
UNION ALL
SELECT 
  jc.id,
  'cd99579b-1b80-4802-9651-e881fb707583',
  'Candidate demonstrated excellent knowledge of containerization and CI/CD pipelines.',
  'demo'
FROM job_candidate jc 
JOIN jobs j ON jc.job_id = j.id
JOIN candidates c ON jc.candidate_id = c.id
WHERE j.title = 'DevOps Engineer' AND c.name = 'Michael Park' AND jc.status = 'demo'
UNION ALL
SELECT 
  jc.id,
  'cd99579b-1b80-4802-9651-e881fb707583',
  'Reference checks completed successfully. Extending offer with competitive package.',
  'demo'
FROM job_candidate jc 
JOIN jobs j ON jc.job_id = j.id
JOIN candidates c ON jc.candidate_id = c.id
WHERE j.title = 'DevOps Engineer' AND c.name = 'Emma Wilson' AND jc.status = 'demo'
ON CONFLICT DO NOTHING;

-- Verify the data
SELECT 'Clients' as table_name, COUNT(*) as count FROM clients WHERE status = 'demo'
UNION ALL
SELECT 'Jobs' as table_name, COUNT(*) as count FROM jobs WHERE record_status = 'demo'
UNION ALL
SELECT 'Candidates' as table_name, COUNT(*) as count FROM candidates WHERE status = 'demo'
UNION ALL
SELECT 'Job-Candidates' as table_name, COUNT(*) as count FROM job_candidate WHERE status = 'demo'
UNION ALL
SELECT 'Candidate Notes' as table_name, COUNT(*) as count FROM candidate_notes WHERE status = 'demo';