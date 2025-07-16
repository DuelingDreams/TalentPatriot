-- ATS (Applicant Tracking System) Optimized Database Schema for Supabase
-- Updated schema with enhanced security, performance, and demo support

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create optimized ENUM types
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

DO $$ BEGIN
    CREATE TYPE record_status AS ENUM ('active', 'demo', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('recruiter', 'bd', 'pm', 'demo_viewer', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Drop existing tables if they exist (for migration)
DROP TABLE IF EXISTS candidate_notes CASCADE;
DROP TABLE IF EXISTS job_candidate CASCADE;
DROP TABLE IF EXISTS candidates CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS clients CASCADE;

-- Clients table with enhanced fields and security
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    industry VARCHAR(100),
    location VARCHAR(255),
    website VARCHAR(255),
    contact_name VARCHAR(255),
    contact_email VARCHAR(255),
    notes TEXT,
    status record_status DEFAULT 'active' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    
    -- Constraints
    CONSTRAINT valid_email CHECK (contact_email IS NULL OR contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT valid_website CHECK (website IS NULL OR website ~* '^https?://.*')
);

-- Jobs table with enhanced tracking
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    status job_status DEFAULT 'open' NOT NULL,
    record_status record_status DEFAULT 'active' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    assigned_to UUID REFERENCES auth.users(id),
    
    -- Full-text search
    search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('english', title), 'A') ||
        setweight(to_tsvector('english', COALESCE(description, '')), 'B')
    ) STORED
);

-- Candidates table with enhanced validation
CREATE TABLE candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    resume_url TEXT,
    status record_status DEFAULT 'active' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    
    -- Constraints
    CONSTRAINT valid_candidate_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT valid_phone CHECK (phone IS NULL OR phone ~* '^\+?[\d\s\-\(\)]{10,}$')
);

-- Job-Candidate relationship table with enhanced tracking
CREATE TABLE job_candidate (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    stage candidate_stage DEFAULT 'applied' NOT NULL,
    notes TEXT,
    assigned_to UUID REFERENCES auth.users(id),
    status record_status DEFAULT 'active' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CONSTRAINT unique_job_candidate UNIQUE (job_id, candidate_id)
);

-- Candidate notes table with authorship tracking
CREATE TABLE candidate_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_candidate_id UUID NOT NULL REFERENCES job_candidate(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id),
    content TEXT NOT NULL,
    is_private BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CONSTRAINT content_not_empty CHECK (LENGTH(TRIM(content)) > 0)
);

-- Create comprehensive indexes for performance
CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_clients_industry ON clients(industry);
CREATE INDEX idx_clients_created_at ON clients(created_at DESC);
CREATE INDEX idx_clients_name_text ON clients USING gin(to_tsvector('english', name));

CREATE INDEX idx_jobs_client_id ON jobs(client_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_record_status ON jobs(record_status);
CREATE INDEX idx_jobs_created_at ON jobs(created_at DESC);
CREATE INDEX idx_jobs_assigned_to ON jobs(assigned_to);
CREATE INDEX idx_jobs_search ON jobs USING gin(search_vector);

CREATE INDEX idx_candidates_status ON candidates(status);
CREATE INDEX idx_candidates_email ON candidates(email);
CREATE INDEX idx_candidates_created_at ON candidates(created_at DESC);
CREATE INDEX idx_candidates_name_text ON candidates USING gin(to_tsvector('english', name));

CREATE INDEX idx_job_candidate_job_id ON job_candidate(job_id);
CREATE INDEX idx_job_candidate_candidate_id ON job_candidate(candidate_id);
CREATE INDEX idx_job_candidate_stage ON job_candidate(stage);
CREATE INDEX idx_job_candidate_status ON job_candidate(status);
CREATE INDEX idx_job_candidate_assigned_to ON job_candidate(assigned_to);
CREATE INDEX idx_job_candidate_updated_at ON job_candidate(updated_at DESC);

CREATE INDEX idx_candidate_notes_job_candidate_id ON candidate_notes(job_candidate_id);
CREATE INDEX idx_candidate_notes_author_id ON candidate_notes(author_id);
CREATE INDEX idx_candidate_notes_created_at ON candidate_notes(created_at DESC);
CREATE INDEX idx_candidate_notes_is_private ON candidate_notes(is_private);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_candidates_updated_at BEFORE UPDATE ON candidates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_candidate_updated_at BEFORE UPDATE ON job_candidate
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_candidate_notes_updated_at BEFORE UPDATE ON candidate_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert optimized demo data with proper status markers
INSERT INTO clients (name, industry, contact_name, contact_email, status) VALUES
('Demo Tech Solutions', 'Technology', 'Demo User', 'demo@demotech.com', 'demo'),
('Demo Healthcare Group', 'Healthcare', 'Demo Manager', 'manager@demohealthcare.com', 'demo'),
('Demo Finance Corp', 'Finance', 'Demo Director', 'director@demofinance.com', 'demo'),
('TechCorp Inc', 'Technology', 'John Smith', 'john.smith@techcorp.com', 'active'),
('FinanceMax', 'Finance', 'Sarah Johnson', 'sarah.j@financemax.com', 'active'),
('HealthPlus', 'Healthcare', 'Mike Wilson', 'mike.wilson@healthplus.com', 'active')
ON CONFLICT DO NOTHING;

INSERT INTO jobs (title, description, client_id, status, record_status) VALUES
('Demo Senior Developer', 'Demo position for senior software developer role', 
 (SELECT id FROM clients WHERE name = 'Demo Tech Solutions' LIMIT 1), 'open', 'demo'),
('Demo Data Analyst', 'Demo position for data analysis and reporting',
 (SELECT id FROM clients WHERE name = 'Demo Finance Corp' LIMIT 1), 'open', 'demo'),
('Demo Nurse Practitioner', 'Demo healthcare position for experienced NP',
 (SELECT id FROM clients WHERE name = 'Demo Healthcare Group' LIMIT 1), 'open', 'demo'),
('Senior Software Engineer', 'We are looking for a senior software engineer with 5+ years of experience in React and Node.js', 
 (SELECT id FROM clients WHERE name = 'TechCorp Inc' LIMIT 1), 'open', 'active'),
('Financial Analyst', 'Experienced financial analyst needed for market research and data analysis',
 (SELECT id FROM clients WHERE name = 'FinanceMax' LIMIT 1), 'open', 'active'),
('Registered Nurse', 'Full-time RN position in our cardiology department',
 (SELECT id FROM clients WHERE name = 'HealthPlus' LIMIT 1), 'open', 'active')
ON CONFLICT DO NOTHING;

INSERT INTO candidates (name, email, phone, resume_url, status) VALUES
('Demo Alice Johnson', 'demo.alice@email.com', '+1-555-0001', 'https://demo.com/resume/alice.pdf', 'demo'),
('Demo Bob Smith', 'demo.bob@email.com', '+1-555-0002', 'https://demo.com/resume/bob.pdf', 'demo'),
('Demo Carol Williams', 'demo.carol@email.com', '+1-555-0003', 'https://demo.com/resume/carol.pdf', 'demo'),
('Alice Cooper', 'alice.cooper@email.com', '+1-555-0101', 'https://example.com/resume/alice.pdf', 'active'),
('Bob Martinez', 'bob.martinez@email.com', '+1-555-0102', 'https://example.com/resume/bob.pdf', 'active'),
('Carol Davis', 'carol.davis@email.com', '+1-555-0103', 'https://example.com/resume/carol.pdf', 'active'),
('David Brown', 'david.brown@email.com', '+1-555-0104', 'https://example.com/resume/david.pdf', 'active')
ON CONFLICT DO NOTHING;

-- Link candidates to jobs with proper status
INSERT INTO job_candidate (job_id, candidate_id, stage, notes, status) VALUES
-- Demo data
((SELECT id FROM jobs WHERE title = 'Demo Senior Developer' LIMIT 1), 
 (SELECT id FROM candidates WHERE name = 'Demo Alice Johnson' LIMIT 1), 
 'interview', 'Demo: Excellent technical skills in React and Node.js', 'demo'),
((SELECT id FROM jobs WHERE title = 'Demo Data Analyst' LIMIT 1), 
 (SELECT id FROM candidates WHERE name = 'Demo Bob Smith' LIMIT 1), 
 'screening', 'Demo: Strong analytical background and SQL expertise', 'demo'),
((SELECT id FROM jobs WHERE title = 'Demo Nurse Practitioner' LIMIT 1), 
 (SELECT id FROM candidates WHERE name = 'Demo Carol Williams' LIMIT 1), 
 'applied', 'Demo: New application with 5+ years experience', 'demo'),
-- Active data
((SELECT id FROM jobs WHERE title = 'Senior Software Engineer' LIMIT 1), 
 (SELECT id FROM candidates WHERE name = 'Alice Cooper' LIMIT 1), 
 'interview', 'Great technical background, proceeding to final round', 'active'),
((SELECT id FROM jobs WHERE title = 'Financial Analyst' LIMIT 1), 
 (SELECT id FROM candidates WHERE name = 'Bob Martinez' LIMIT 1), 
 'screening', 'Initial phone screening completed', 'active'),
((SELECT id FROM jobs WHERE title = 'Registered Nurse' LIMIT 1), 
 (SELECT id FROM candidates WHERE name = 'Carol Davis' LIMIT 1), 
 'applied', 'New application received', 'active')
ON CONFLICT DO NOTHING;

-- Create view for demo pipeline data
CREATE OR REPLACE VIEW demo_pipeline_view AS
SELECT 
    jc.stage,
    json_agg(
        json_build_object(
            'id', jc.id,
            'candidate', json_build_object(
                'id', c.id,
                'name', c.name,
                'email', c.email,
                'phone', c.phone,
                'resumeUrl', c.resume_url
            ),
            'job', json_build_object(
                'id', j.id,
                'title', j.title,
                'description', j.description
            ),
            'notes', jc.notes,
            'updatedAt', jc.updated_at
        )
    ) as candidates
FROM job_candidate jc
JOIN candidates c ON jc.candidate_id = c.id
JOIN jobs j ON jc.job_id = j.id
WHERE jc.status = 'demo'
GROUP BY jc.stage
ORDER BY 
    CASE jc.stage
        WHEN 'applied' THEN 1
        WHEN 'screening' THEN 2
        WHEN 'interview' THEN 3
        WHEN 'technical' THEN 4
        WHEN 'final' THEN 5
        WHEN 'offer' THEN 6
        WHEN 'hired' THEN 7
        WHEN 'rejected' THEN 8
    END;

-- Performance optimization function
CREATE OR REPLACE FUNCTION optimize_tables()
RETURNS void AS $$
BEGIN
    ANALYZE clients;
    ANALYZE jobs;
    ANALYZE candidates;
    ANALYZE job_candidate;
    ANALYZE candidate_notes;
END;
$$ LANGUAGE plpgsql;

-- Run initial optimization
SELECT optimize_tables();

-- Create maintenance function for regular cleanup
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
    -- Archive old demo data (older than 30 days)
    UPDATE clients SET status = 'archived' 
    WHERE status = 'demo' AND created_at < NOW() - INTERVAL '30 days';
    
    UPDATE jobs SET record_status = 'archived'
    WHERE record_status = 'demo' AND created_at < NOW() - INTERVAL '30 days';
    
    UPDATE candidates SET status = 'archived'
    WHERE status = 'demo' AND created_at < NOW() - INTERVAL '30 days';
    
    UPDATE job_candidate SET status = 'archived'
    WHERE status = 'demo' AND created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE clients IS 'Client organizations and companies';
COMMENT ON TABLE jobs IS 'Job postings and positions';
COMMENT ON TABLE candidates IS 'Candidate profiles and information';
COMMENT ON TABLE job_candidate IS 'Many-to-many relationship between jobs and candidates with application tracking';
COMMENT ON TABLE candidate_notes IS 'Notes and comments about candidate applications';

COMMENT ON COLUMN clients.status IS 'Record status: active (live data), demo (demo/test data), archived (historical data)';
COMMENT ON COLUMN jobs.record_status IS 'Record status for data lifecycle management';
COMMENT ON COLUMN candidates.status IS 'Record status for data lifecycle management';
COMMENT ON COLUMN job_candidate.status IS 'Record status for data lifecycle management';