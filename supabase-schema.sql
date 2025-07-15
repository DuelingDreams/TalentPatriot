-- ATS (Applicant Tracking System) Database Schema for Supabase
-- Generated for use with Drizzle ORM

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM types
DO $$ BEGIN
    CREATE TYPE job_status AS ENUM ('open', 'closed', 'on_hold', 'filled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE candidate_stage AS ENUM ('applied', 'screening', 'interview', 'technical', 'final', 'offer', 'hired', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    industry VARCHAR(100),
    contact_name VARCHAR(255),
    contact_email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Jobs table
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    client_id UUID NOT NULL REFERENCES clients(id),
    status job_status DEFAULT 'open' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Candidates table
CREATE TABLE IF NOT EXISTS candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    resume_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Job-Candidate relationship table (many-to-many with additional fields)
CREATE TABLE IF NOT EXISTS job_candidate (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES jobs(id),
    candidate_id UUID NOT NULL REFERENCES candidates(id),
    stage candidate_stage DEFAULT 'applied' NOT NULL,
    notes TEXT,
    assigned_to VARCHAR(255),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_job_candidate UNIQUE (job_id, candidate_id)
);

-- Candidate notes table
CREATE TABLE IF NOT EXISTS candidate_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_candidate_id UUID NOT NULL REFERENCES job_candidate(id),
    author_id VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_jobs_client_id ON jobs(client_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_job_candidate_job_id ON job_candidate(job_id);
CREATE INDEX IF NOT EXISTS idx_job_candidate_candidate_id ON job_candidate(candidate_id);
CREATE INDEX IF NOT EXISTS idx_job_candidate_stage ON job_candidate(stage);
CREATE INDEX IF NOT EXISTS idx_candidate_notes_job_candidate_id ON candidate_notes(job_candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidates_email ON candidates(email);

-- Insert sample data for testing
INSERT INTO clients (name, industry, contact_name, contact_email) VALUES
('TechCorp Inc', 'Technology', 'John Smith', 'john.smith@techcorp.com'),
('FinanceMax', 'Finance', 'Sarah Johnson', 'sarah.j@financemax.com'),
('HealthPlus', 'Healthcare', 'Mike Wilson', 'mike.wilson@healthplus.com')
ON CONFLICT DO NOTHING;

INSERT INTO jobs (title, description, client_id, status) VALUES
('Senior Software Engineer', 'We are looking for a senior software engineer with 5+ years of experience in React and Node.js', 
 (SELECT id FROM clients WHERE name = 'TechCorp Inc' LIMIT 1), 'open'),
('Financial Analyst', 'Experienced financial analyst needed for market research and data analysis',
 (SELECT id FROM clients WHERE name = 'FinanceMax' LIMIT 1), 'open'),
('Registered Nurse', 'Full-time RN position in our cardiology department',
 (SELECT id FROM clients WHERE name = 'HealthPlus' LIMIT 1), 'open')
ON CONFLICT DO NOTHING;

INSERT INTO candidates (name, email, phone, resume_url) VALUES
('Alice Cooper', 'alice.cooper@email.com', '+1-555-0101', 'https://example.com/resume/alice.pdf'),
('Bob Martinez', 'bob.martinez@email.com', '+1-555-0102', 'https://example.com/resume/bob.pdf'),
('Carol Davis', 'carol.davis@email.com', '+1-555-0103', 'https://example.com/resume/carol.pdf'),
('David Brown', 'david.brown@email.com', '+1-555-0104', 'https://example.com/resume/david.pdf')
ON CONFLICT DO NOTHING;

-- Link some candidates to jobs
INSERT INTO job_candidate (job_id, candidate_id, stage, notes, assigned_to) VALUES
((SELECT id FROM jobs WHERE title = 'Senior Software Engineer' LIMIT 1), 
 (SELECT id FROM candidates WHERE name = 'Alice Cooper' LIMIT 1), 
 'interview', 'Great technical background, proceeding to final round', 'HR Team'),
((SELECT id FROM jobs WHERE title = 'Financial Analyst' LIMIT 1), 
 (SELECT id FROM candidates WHERE name = 'Bob Martinez' LIMIT 1), 
 'screening', 'Initial phone screening completed', 'Sarah Johnson'),
((SELECT id FROM jobs WHERE title = 'Registered Nurse' LIMIT 1), 
 (SELECT id FROM candidates WHERE name = 'Carol Davis' LIMIT 1), 
 'applied', 'New application received', 'Mike Wilson')
ON CONFLICT DO NOTHING;

-- Add some candidate notes
INSERT INTO candidate_notes (job_candidate_id, author_id, content) VALUES
((SELECT jc.id FROM job_candidate jc 
  JOIN jobs j ON jc.job_id = j.id 
  JOIN candidates c ON jc.candidate_id = c.id 
  WHERE j.title = 'Senior Software Engineer' AND c.name = 'Alice Cooper' LIMIT 1),
 'recruiter@techcorp.com', 'Candidate showed excellent problem-solving skills during technical interview.'),
((SELECT jc.id FROM job_candidate jc 
  JOIN jobs j ON jc.job_id = j.id 
  JOIN candidates c ON jc.candidate_id = c.id 
  WHERE j.title = 'Financial Analyst' AND c.name = 'Bob Martinez' LIMIT 1),
 'sarah.j@financemax.com', 'Strong background in financial modeling and Excel proficiency.')
ON CONFLICT DO NOTHING;