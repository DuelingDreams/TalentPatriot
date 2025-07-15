-- Fix schema column naming issues and ensure demo data exists
-- Run this in Supabase SQL Editor

-- First, check if recordStatus column exists in jobs table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'jobs' AND column_name = 'recordStatus'
    ) THEN
        -- Add recordStatus column if it doesn't exist
        ALTER TABLE jobs ADD COLUMN "recordStatus" text DEFAULT 'active';
    END IF;
END $$;

-- Ensure we have demo data - insert if not exists
INSERT INTO clients (id, name, industry, location, website, "contactName", "contactEmail", "contactPhone", notes, status, "clientStatus", "assignedTo", "createdAt", "updatedAt")
VALUES 
  ('demo-client-1', 'TechFlow Solutions', 'Technology', 'San Francisco, CA', 'https://techflow.com', 'Sarah Chen', 'sarah@techflow.com', '+1 (555) 123-4567', 'Leading software consulting firm', 'demo', 'active', 'demo-recruiter', NOW(), NOW()),
  ('demo-client-2', 'InnovateCorp', 'Consulting', 'New York, NY', 'https://innovatecorp.com', 'Mike Rodriguez', 'mike@innovatecorp.com', '+1 (555) 234-5678', 'Management consulting', 'demo', 'active', 'demo-recruiter', NOW(), NOW()),
  ('demo-client-3', 'GreenTech Industries', 'Clean Energy', 'Austin, TX', 'https://greentech.com', 'Emma Wilson', 'emma@greentech.com', '+1 (555) 345-6789', 'Renewable energy solutions', 'demo', 'active', 'demo-recruiter', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO jobs (id, title, description, "clientId", status, "recordStatus", salary, location, "jobType", "experienceLevel", remote, requirements, benefits, "createdAt")
VALUES 
  ('demo-job-1', 'Senior Software Engineer', 'Lead development of scalable web applications using React and Node.js. Work with cross-functional teams to deliver high-quality software solutions.', 'demo-client-1', 'open', 'demo', '$120,000 - $160,000', 'San Francisco, CA', 'full-time', 'senior', 'hybrid', '5+ years React/Node.js experience, TypeScript, AWS', 'Health insurance, 401k, flexible PTO', NOW()),
  ('demo-job-2', 'Product Manager', 'Drive product strategy and roadmap for our flagship SaaS platform. Collaborate with engineering and design teams to deliver exceptional user experiences.', 'demo-client-2', 'open', 'demo', '$130,000 - $170,000', 'New York, NY', 'full-time', 'mid', 'office', 'Product management experience, Agile methodologies', 'Health insurance, stock options, remote work', NOW()),
  ('demo-job-3', 'UX Designer', 'Create intuitive and engaging user experiences for our clean energy platform. Lead design thinking workshops and user research initiatives.', 'demo-client-3', 'open', 'demo', '$90,000 - $120,000', 'Austin, TX', 'full-time', 'mid', 'remote', 'UX/UI design experience, Figma, user research', 'Health insurance, flexible hours, equipment stipend', NOW()),
  ('demo-job-4', 'Data Scientist', 'Develop machine learning models to optimize energy consumption patterns. Work with large datasets to drive business insights.', 'demo-client-3', 'open', 'demo', '$110,000 - $140,000', 'Austin, TX', 'full-time', 'senior', 'remote', 'Python, ML frameworks, statistics background', 'Health insurance, 401k, conference budget', NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO candidates (id, name, email, phone, "resumeUrl", status, "createdAt")
VALUES 
  ('demo-candidate-1', 'Alex Johnson', 'alex.johnson@email.com', '+1 (555) 111-2222', 'https://example.com/resume1.pdf', 'demo', NOW()),
  ('demo-candidate-2', 'Maria Garcia', 'maria.garcia@email.com', '+1 (555) 222-3333', 'https://example.com/resume2.pdf', 'demo', NOW()),
  ('demo-candidate-3', 'David Kim', 'david.kim@email.com', '+1 (555) 333-4444', 'https://example.com/resume3.pdf', 'demo', NOW()),
  ('demo-candidate-4', 'Lisa Brown', 'lisa.brown@email.com', '+1 (555) 444-5555', 'https://example.com/resume4.pdf', 'demo', NOW()),
  ('demo-candidate-5', 'James Wilson', 'james.wilson@email.com', '+1 (555) 555-6666', 'https://example.com/resume5.pdf', 'demo', NOW()),
  ('demo-candidate-6', 'Rachel Davis', 'rachel.davis@email.com', '+1 (555) 666-7777', 'https://example.com/resume6.pdf', 'demo', NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO job_candidate (id, "jobId", "candidateId", stage, notes, "assignedTo", "interviewDate", status, "updatedAt")
VALUES 
  ('demo-jc-1', 'demo-job-1', 'demo-candidate-1', 'interview', 'Strong technical skills, good culture fit', 'demo-recruiter', '2025-01-20 14:00:00', 'demo', NOW()),
  ('demo-jc-2', 'demo-job-1', 'demo-candidate-2', 'screening', 'Impressive background, moving to next round', 'demo-recruiter', NULL, 'demo', NOW()),
  ('demo-jc-3', 'demo-job-2', 'demo-candidate-3', 'final', 'Excellent product sense, recommended for hire', 'demo-recruiter', NULL, 'demo', NOW()),
  ('demo-jc-4', 'demo-job-2', 'demo-candidate-4', 'technical', 'Good technical skills, needs culture interview', 'demo-recruiter', '2025-01-18 10:00:00', 'demo', NOW()),
  ('demo-jc-5', 'demo-job-3', 'demo-candidate-5', 'offer', 'Outstanding design portfolio, making offer', 'demo-recruiter', NULL, 'demo', NOW()),
  ('demo-jc-6', 'demo-job-4', 'demo-candidate-6', 'applied', 'Strong ML background, scheduling screening', 'demo-recruiter', NULL, 'demo', NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO candidate_notes (id, "jobCandidateId", "authorId", content, "createdAt")
VALUES 
  ('demo-note-1', 'demo-jc-1', 'demo-recruiter', 'Technical interview went very well. Candidate demonstrated strong React and Node.js skills.', NOW()),
  ('demo-note-2', 'demo-jc-2', 'demo-recruiter', 'Phone screening completed. Candidate has relevant experience and good communication skills.', NOW()),
  ('demo-note-3', 'demo-jc-3', 'demo-recruiter', 'Final interview with CEO completed. Strong product vision and leadership potential.', NOW()),
  ('demo-note-4', 'demo-jc-5', 'demo-recruiter', 'Portfolio review completed. Exceptional UX design skills and user research experience.', NOW())
ON CONFLICT (id) DO NOTHING;