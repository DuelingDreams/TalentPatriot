-- Migration to add status columns for demo filtering
-- This adds the record_status enum and columns to support demo data filtering

-- Create the record_status enum
DO $$ BEGIN
    CREATE TYPE record_status AS ENUM ('active', 'demo', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add status column to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS status record_status DEFAULT 'active' NOT NULL;

-- Add record_status column to jobs table (rename existing status to job_status)
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS record_status record_status DEFAULT 'active' NOT NULL;

-- Add status column to candidates table  
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS status record_status DEFAULT 'active' NOT NULL;

-- Add status column to job_candidate table
ALTER TABLE job_candidate ADD COLUMN IF NOT EXISTS status record_status DEFAULT 'active' NOT NULL;

-- Update indexes for performance
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_jobs_record_status ON jobs(record_status);
CREATE INDEX IF NOT EXISTS idx_candidates_status ON candidates(status);
CREATE INDEX IF NOT EXISTS idx_job_candidate_status ON job_candidate(status);

-- Update RLS policies to use the new status columns
-- Drop existing demo policies
DROP POLICY IF EXISTS "demo_viewer_read_clients" ON clients;
DROP POLICY IF EXISTS "demo_viewer_read_jobs" ON jobs;
DROP POLICY IF EXISTS "demo_viewer_read_candidates" ON candidates;
DROP POLICY IF EXISTS "demo_viewer_read_job_candidates" ON job_candidate;

-- Create new demo policies using status columns
CREATE POLICY "demo_viewer_read_clients"
ON clients
FOR SELECT
TO authenticated
USING (
  auth.get_user_role() = 'demo_viewer' 
  AND status = 'demo'
);

CREATE POLICY "demo_viewer_read_jobs"
ON jobs
FOR SELECT
TO authenticated
USING (
  auth.get_user_role() = 'demo_viewer' 
  AND record_status = 'demo'
);

CREATE POLICY "demo_viewer_read_candidates"
ON candidates
FOR SELECT
TO authenticated
USING (
  auth.get_user_role() = 'demo_viewer' 
  AND status = 'demo'
);

CREATE POLICY "demo_viewer_read_job_candidates"
ON job_candidate
FOR SELECT
TO authenticated
USING (
  auth.get_user_role() = 'demo_viewer' 
  AND status = 'demo'
);

-- Insert some demo data for testing
INSERT INTO clients (name, industry, location, contact_name, contact_email, status) VALUES
  ('Demo Tech Corp', 'Technology', 'San Francisco, CA', 'John Demo', 'john@demo.com', 'demo'),
  ('Demo StartupXYZ', 'Software', 'Austin, TX', 'Sarah Demo', 'sarah@demo.com', 'demo'),
  ('Demo InnovateCo', 'Innovation', 'New York, NY', 'Mike Demo', 'mike@demo.com', 'demo')
ON CONFLICT DO NOTHING;

-- Get the demo client IDs for job insertion
INSERT INTO jobs (title, description, client_id, record_status) 
SELECT 
  'Demo Software Engineer',
  'This is a demo job posting for testing purposes',
  c.id,
  'demo'
FROM clients c 
WHERE c.name = 'Demo Tech Corp' AND c.status = 'demo'
ON CONFLICT DO NOTHING;

INSERT INTO candidates (name, email, phone, status) VALUES
  ('Alex Demo Rodriguez', 'alex.demo@example.com', '+1 (555) 123-4567', 'demo'),
  ('Sarah Demo Chen', 'sarah.demo@example.com', '+1 (555) 234-5678', 'demo'),
  ('Michael Demo Park', 'michael.demo@example.com', '+1 (555) 345-6789', 'demo')
ON CONFLICT DO NOTHING;

-- Create job-candidate relationships
INSERT INTO job_candidate (job_id, candidate_id, stage, notes, status)
SELECT 
  j.id,
  c.id,
  'applied',
  'Demo candidate application for testing',
  'demo'
FROM jobs j, candidates c
WHERE j.title = 'Demo Software Engineer' 
  AND j.record_status = 'demo'
  AND c.name = 'Alex Demo Rodriguez'
  AND c.status = 'demo'
ON CONFLICT DO NOTHING;