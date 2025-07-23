-- Corrected TalentPatriot ATS Database Migration
-- Handles existing database structure properly

-- Create ENUMs only if they don't exist
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

DO $$ BEGIN
    CREATE TYPE org_role AS ENUM ('owner', 'admin', 'recruiter', 'viewer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  owner_id UUID NOT NULL,
  slug TEXT
);

-- User Organizations junction table
CREATE TABLE IF NOT EXISTS user_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  org_id UUID NOT NULL REFERENCES organizations(id),
  role org_role NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Add org_id column to existing tables if it doesn't exist
DO $$ BEGIN
    ALTER TABLE clients ADD COLUMN org_id UUID REFERENCES organizations(id);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE jobs ADD COLUMN org_id UUID REFERENCES organizations(id);
EXCEPTION
    WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE candidates ADD COLUMN org_id UUID REFERENCES organizations(id);
EXCEPTION
    WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE job_candidate ADD COLUMN org_id UUID REFERENCES organizations(id);
EXCEPTION
    WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE candidate_notes ADD COLUMN org_id UUID REFERENCES organizations(id);
EXCEPTION
    WHEN duplicate_column THEN NULL;
END $$;

-- Add status columns to existing tables if they don't exist
DO $$ BEGIN
    ALTER TABLE clients ADD COLUMN status record_status DEFAULT 'active';
EXCEPTION
    WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE jobs ADD COLUMN record_status record_status DEFAULT 'active';
EXCEPTION
    WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE candidates ADD COLUMN status record_status DEFAULT 'active';
EXCEPTION
    WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE job_candidate ADD COLUMN status record_status DEFAULT 'active';
EXCEPTION
    WHEN duplicate_column THEN NULL;
END $$;

-- Create indexes safely
DO $$ BEGIN
    CREATE UNIQUE INDEX unique_user_org ON user_organizations (user_id, org_id);
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
    CREATE UNIQUE INDEX unique_org_slug ON organizations (slug);
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX idx_clients_org_id ON clients(org_id);
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX idx_jobs_org_id ON jobs(org_id);
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX idx_candidates_org_id ON candidates(org_id);
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX idx_job_candidate_org_id ON job_candidate(org_id);
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX idx_candidate_notes_org_id ON candidate_notes(org_id);
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

-- Create trigger function and trigger
CREATE OR REPLACE FUNCTION add_owner_to_user_organizations()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_organizations (user_id, org_id, role)
  VALUES (NEW.owner_id, NEW.id, 'owner')
  ON CONFLICT (user_id, org_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_add_owner_to_user_organizations ON organizations;
CREATE TRIGGER trigger_add_owner_to_user_organizations
  AFTER INSERT ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION add_owner_to_user_organizations();

-- Insert demo organization with proper UUID
INSERT INTO organizations (id, name, owner_id, slug, created_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000'::UUID,
  'TalentPatriot Demo',
  '550e8400-e29b-41d4-a716-446655440001'::UUID,
  'talentpatriot-demo',
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug;

-- Update existing data to set demo organization (only if status column exists)
DO $$ 
BEGIN
    -- Check if status column exists on clients before updating
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'status') THEN
        UPDATE clients SET org_id = '550e8400-e29b-41d4-a716-446655440000'::UUID WHERE status = 'demo';
    END IF;
    
    -- Check if record_status column exists on jobs before updating  
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'record_status') THEN
        UPDATE jobs SET org_id = '550e8400-e29b-41d4-a716-446655440000'::UUID WHERE record_status = 'demo';
    END IF;
    
    -- Check if status column exists on candidates before updating
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'status') THEN
        UPDATE candidates SET org_id = '550e8400-e29b-41d4-a716-446655440000'::UUID WHERE status = 'demo';
    END IF;
    
    -- Check if status column exists on job_candidate before updating
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_candidate' AND column_name = 'status') THEN
        UPDATE job_candidate SET org_id = '550e8400-e29b-41d4-a716-446655440000'::UUID WHERE status = 'demo';
    END IF;
    
    -- Always update candidate_notes since it doesn't have status field
    UPDATE candidate_notes SET org_id = '550e8400-e29b-41d4-a716-446655440000'::UUID WHERE org_id IS NULL;
END $$;

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_candidate ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_notes ENABLE ROW LEVEL SECURITY;