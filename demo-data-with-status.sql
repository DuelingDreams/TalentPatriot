-- Demo data setup with proper status field filtering for role-based access
-- This script creates demo data with status='demo' for the demo_viewer role

-- Demo Clients (status='demo')
INSERT INTO clients (id, name, industry, location, website, contact_name, contact_email, contact_phone, notes, status) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'TechCorp Solutions', 'Technology', 'San Francisco, CA', 'https://techcorp.com', 'Sarah Johnson', 'sarah@techcorp.com', '(555) 123-4567', 'Leading software development company with 200+ employees.', 'demo'),
('550e8400-e29b-41d4-a716-446655440002', 'Global Manufacturing Inc', 'Manufacturing', 'Detroit, MI', 'https://globalmfg.com', 'Mike Chen', 'mike@globalmfg.com', '(555) 234-5678', 'Fortune 500 manufacturing company specializing in automotive parts.', 'demo'),
('550e8400-e29b-41d4-a716-446655440003', 'Healthcare Partners', 'Healthcare', 'Boston, MA', 'https://healthpartners.com', 'Dr. Lisa Rodriguez', 'lisa@healthpartners.com', '(555) 345-6789', 'Regional healthcare provider with multiple locations.', 'demo')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  industry = EXCLUDED.industry,
  location = EXCLUDED.location,
  website = EXCLUDED.website,
  contact_name = EXCLUDED.contact_name,
  contact_email = EXCLUDED.contact_email,
  contact_phone = EXCLUDED.contact_phone,
  notes = EXCLUDED.notes,
  status = EXCLUDED.status;

-- Demo Jobs (record_status='demo')
INSERT INTO jobs (id, title, description, client_id, job_status, record_status) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'Senior Software Engineer', 'We are looking for an experienced software engineer to join our team. Must have 5+ years of experience with React, Node.js, and cloud platforms.', '550e8400-e29b-41d4-a716-446655440001', 'open', 'demo'),
('660e8400-e29b-41d4-a716-446655440002', 'Product Manager', 'Seeking a product manager to lead our mobile app development. Experience with agile methodologies and user research required.', '550e8400-e29b-41d4-a716-446655440001', 'open', 'demo'),
('660e8400-e29b-41d4-a716-446655440003', 'Manufacturing Engineer', 'Join our engineering team to optimize production processes. Lean manufacturing experience preferred.', '550e8400-e29b-41d4-a716-446655440002', 'open', 'demo'),
('660e8400-e29b-41d4-a716-446655440004', 'Healthcare Administrator', 'Manage daily operations of our Boston clinic. Healthcare administration background required.', '550e8400-e29b-41d4-a716-446655440003', 'open', 'demo')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  client_id = EXCLUDED.client_id,
  job_status = EXCLUDED.job_status,
  record_status = EXCLUDED.record_status;

-- Demo Candidates (status='demo')
INSERT INTO candidates (id, name, email, phone, resume_url, status) VALUES
('770e8400-e29b-41d4-a716-446655440001', 'Alex Rivera', 'alex.rivera@email.com', '(555) 111-2222', 'https://example.com/resume1.pdf', 'demo'),
('770e8400-e29b-41d4-a716-446655440002', 'Jordan Kim', 'jordan.kim@email.com', '(555) 222-3333', 'https://example.com/resume2.pdf', 'demo'),
('770e8400-e29b-41d4-a716-446655440003', 'Taylor Brown', 'taylor.brown@email.com', '(555) 333-4444', 'https://example.com/resume3.pdf', 'demo'),
('770e8400-e29b-41d4-a716-446655440004', 'Casey Wilson', 'casey.wilson@email.com', '(555) 444-5555', 'https://example.com/resume4.pdf', 'demo'),
('770e8400-e29b-41d4-a716-446655440005', 'Morgan Davis', 'morgan.davis@email.com', '(555) 555-6666', 'https://example.com/resume5.pdf', 'demo'),
('770e8400-e29b-41d4-a716-446655440006', 'Riley Johnson', 'riley.johnson@email.com', '(555) 666-7777', 'https://example.com/resume6.pdf', 'demo')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  resume_url = EXCLUDED.resume_url,
  status = EXCLUDED.status;

-- Demo Job-Candidate relationships (status='demo')
INSERT INTO job_candidate (id, job_id, candidate_id, stage, notes, assigned_to, status) VALUES
('880e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', 'interview', 'Strong technical background, scheduled for final round.', 'Sarah Johnson', 'demo'),
('880e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440002', 'technical', 'Completed coding challenge, awaiting technical interview.', 'Sarah Johnson', 'demo'),
('880e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440003', 'screening', 'Initial phone screen completed, moving to next round.', 'Sarah Johnson', 'demo'),
('880e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440004', 'final', 'Excellent product sense, references being checked.', 'Mike Chen', 'demo'),
('880e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440005', 'offer', 'Manufacturing experience verified, offer extended.', 'Dr. Lisa Rodriguez', 'demo'),
('880e8400-e29b-41d4-a716-446655440006', '660e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440006', 'applied', 'Healthcare admin background looks promising.', 'Dr. Lisa Rodriguez', 'demo')
ON CONFLICT (id) DO UPDATE SET
  job_id = EXCLUDED.job_id,
  candidate_id = EXCLUDED.candidate_id,
  stage = EXCLUDED.stage,
  notes = EXCLUDED.notes,
  assigned_to = EXCLUDED.assigned_to,
  status = EXCLUDED.status;

-- Demo Candidate Notes
INSERT INTO candidate_notes (id, job_candidate_id, author_id, content) VALUES
('990e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440001', 'cd99579b-1b80-4802-9651-e881fb707583', 'Very impressive technical skills. Strong problem-solving approach during the interview.'),
('990e8400-e29b-41d4-a716-446655440002', '880e8400-e29b-41d4-a716-446655440001', 'cd99579b-1b80-4802-9651-e881fb707583', 'Good cultural fit, shows enthusiasm for the role and company mission.'),
('990e8400-e29b-41d4-a716-446655440003', '880e8400-e29b-41d4-a716-446655440002', 'cd99579b-1b80-4802-9651-e881fb707583', 'Coding challenge results exceeded expectations. Clean, well-documented code.'),
('990e8400-e29b-41d4-a716-446655440004', '880e8400-e29b-41d4-a716-446655440004', 'cd99579b-1b80-4802-9651-e881fb707583', 'Product vision aligns well with company strategy. Great communication skills.'),
('990e8400-e29b-41d4-a716-446655440005', '880e8400-e29b-41d4-a716-446655440005', 'cd99579b-1b80-4802-9651-e881fb707583', 'Manufacturing expertise is exactly what we need. Professional references check out.'),
('990e8400-e29b-41d4-a716-446655440006', '880e8400-e29b-41d4-a716-446655440006', 'cd99579b-1b80-4802-9651-e881fb707583', 'Healthcare administration experience is comprehensive. Shows leadership potential.')
ON CONFLICT (id) DO UPDATE SET
  job_candidate_id = EXCLUDED.job_candidate_id,
  author_id = EXCLUDED.author_id,
  content = EXCLUDED.content;