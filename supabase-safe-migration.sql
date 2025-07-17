-- Safe TalentPatriot ATS Database Migration
-- Handles existing objects gracefully

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

DO $$ BEGIN
    CREATE TYPE interview_type AS ENUM ('phone', 'video', 'onsite', 'technical', 'cultural');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE interview_status AS ENUM ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE message_type AS ENUM ('internal', 'client', 'candidate', 'system');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE message_priority AS ENUM ('low', 'normal', 'high', 'urgent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  owner_id UUID NOT NULL, -- references auth.users(id)
  slug TEXT
);

-- Create unique index if it doesn't exist
DO $$ BEGIN
    CREATE UNIQUE INDEX unique_org_slug ON organizations (slug);
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

-- User Organizations junction table
CREATE TABLE IF NOT EXISTS user_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL, -- references auth.users(id)
  org_id UUID NOT NULL REFERENCES organizations(id),
  role org_role NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create unique index if it doesn't exist
DO $$ BEGIN
    CREATE UNIQUE INDEX unique_user_org ON user_organizations (user_id, org_id);
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
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
  created_by UUID
);

-- Jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  client_id UUID NOT NULL REFERENCES clients(id),
  status job_status DEFAULT 'open' NOT NULL,
  record_status record_status DEFAULT 'active' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_by UUID,
  assigned_to UUID
);

-- Candidates table
CREATE TABLE IF NOT EXISTS candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  resume_url TEXT,
  status record_status DEFAULT 'active' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_by UUID
);

-- Job Candidate junction table
CREATE TABLE IF NOT EXISTS job_candidate (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  job_id UUID NOT NULL REFERENCES jobs(id),
  candidate_id UUID NOT NULL REFERENCES candidates(id),
  stage candidate_stage DEFAULT 'applied' NOT NULL,
  notes TEXT,
  assigned_to UUID,
  status record_status DEFAULT 'active' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create unique index if it doesn't exist
DO $$ BEGIN
    CREATE UNIQUE INDEX unique_job_candidate ON job_candidate (job_id, candidate_id);
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

-- Candidate Notes table
CREATE TABLE IF NOT EXISTS candidate_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  job_candidate_id UUID NOT NULL REFERENCES job_candidate(id),
  author_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_private VARCHAR(10) DEFAULT 'false' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for performance (only if they don't exist)
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
    CREATE INDEX idx_jobs_client_id ON jobs(client_id);
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
    CREATE INDEX idx_job_candidate_job_id ON job_candidate(job_id);
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX idx_job_candidate_candidate_id ON job_candidate(candidate_id);
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

-- Insert demo organization
INSERT INTO organizations (id, name, owner_id, slug, created_at)
VALUES (
  'demo-org-fixed',
  'TalentPatriot Demo',
  'demo-user',
  'talentpatriot-demo',
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug;

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_candidate ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_notes ENABLE ROW LEVEL SECURITY;