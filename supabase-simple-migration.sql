-- Simple Step-by-Step Migration for TalentPatriot ATS
-- Run each section one at a time if needed

-- Step 1: Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  owner_id UUID NOT NULL,
  slug TEXT
);

-- Step 2: Create user_organizations table
CREATE TABLE IF NOT EXISTS user_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  org_id UUID NOT NULL REFERENCES organizations(id),
  role TEXT NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Step 3: Add org_id columns (run each separately if needed)
-- Add org_id to clients
ALTER TABLE clients ADD COLUMN IF NOT EXISTS org_id UUID;

-- Add org_id to jobs  
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS org_id UUID;

-- Add org_id to candidates
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS org_id UUID;

-- Add org_id to job_candidate
ALTER TABLE job_candidate ADD COLUMN IF NOT EXISTS org_id UUID;

-- Add org_id to candidate_notes
ALTER TABLE candidate_notes ADD COLUMN IF NOT EXISTS org_id UUID;

-- Step 4: Add status columns (run each separately if needed)
-- Add status to clients
ALTER TABLE clients ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Add record_status to jobs
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS record_status TEXT DEFAULT 'active';

-- Add status to candidates
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Add status to job_candidate
ALTER TABLE job_candidate ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Step 5: Insert demo organization
INSERT INTO organizations (id, name, owner_id, slug, created_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000'::UUID,
  'TalentPatriot Demo',
  '550e8400-e29b-41d4-a716-446655440001'::UUID,
  'talentpatriot-demo',
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Step 6: Update existing records to link to demo organization
-- Only update records that don't have org_id set
UPDATE clients SET org_id = '550e8400-e29b-41d4-a716-446655440000'::UUID WHERE org_id IS NULL;
UPDATE jobs SET org_id = '550e8400-e29b-41d4-a716-446655440000'::UUID WHERE org_id IS NULL;
UPDATE candidates SET org_id = '550e8400-e29b-41d4-a716-446655440000'::UUID WHERE org_id IS NULL;
UPDATE job_candidate SET org_id = '550e8400-e29b-41d4-a716-446655440000'::UUID WHERE org_id IS NULL;
UPDATE candidate_notes SET org_id = '550e8400-e29b-41d4-a716-446655440000'::UUID WHERE org_id IS NULL;

-- Step 7: Add foreign key constraints
ALTER TABLE clients ADD CONSTRAINT IF NOT EXISTS fk_clients_org FOREIGN KEY (org_id) REFERENCES organizations(id);
ALTER TABLE jobs ADD CONSTRAINT IF NOT EXISTS fk_jobs_org FOREIGN KEY (org_id) REFERENCES organizations(id);
ALTER TABLE candidates ADD CONSTRAINT IF NOT EXISTS fk_candidates_org FOREIGN KEY (org_id) REFERENCES organizations(id);
ALTER TABLE job_candidate ADD CONSTRAINT IF NOT EXISTS fk_job_candidate_org FOREIGN KEY (org_id) REFERENCES organizations(id);
ALTER TABLE candidate_notes ADD CONSTRAINT IF NOT EXISTS fk_candidate_notes_org FOREIGN KEY (org_id) REFERENCES organizations(id);

-- Step 8: Create indexes
CREATE INDEX IF NOT EXISTS idx_clients_org_id ON clients(org_id);
CREATE INDEX IF NOT EXISTS idx_jobs_org_id ON jobs(org_id);
CREATE INDEX IF NOT EXISTS idx_candidates_org_id ON candidates(org_id);
CREATE INDEX IF NOT EXISTS idx_job_candidate_org_id ON job_candidate(org_id);
CREATE INDEX IF NOT EXISTS idx_candidate_notes_org_id ON candidate_notes(org_id);
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_org ON user_organizations (user_id, org_id);

-- Step 9: Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_candidate ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_notes ENABLE ROW LEVEL SECURITY;