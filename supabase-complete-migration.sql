-- Complete TalentPatriot ATS Database Migration
-- Creates all tables needed for multi-tenant organization structure

-- Create ENUMs first
CREATE TYPE job_status AS ENUM ('open', 'closed', 'on_hold', 'filled');
CREATE TYPE candidate_stage AS ENUM ('applied', 'screening', 'interview', 'technical', 'final', 'offer', 'hired', 'rejected');
CREATE TYPE record_status AS ENUM ('active', 'demo', 'archived');
CREATE TYPE user_role AS ENUM ('recruiter', 'bd', 'pm', 'demo_viewer', 'admin');
CREATE TYPE org_role AS ENUM ('owner', 'admin', 'recruiter', 'viewer');
CREATE TYPE interview_type AS ENUM ('phone', 'video', 'onsite', 'technical', 'cultural');
CREATE TYPE interview_status AS ENUM ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show');
CREATE TYPE message_type AS ENUM ('internal', 'client', 'candidate', 'system');
CREATE TYPE message_priority AS ENUM ('low', 'normal', 'high', 'urgent');

-- Organizations table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  owner_id UUID NOT NULL, -- references auth.users(id)
  slug TEXT
);

-- Create unique index on slug
CREATE UNIQUE INDEX unique_org_slug ON organizations (slug);

-- User Organizations junction table
CREATE TABLE user_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL, -- references auth.users(id)
  org_id UUID NOT NULL REFERENCES organizations(id),
  role org_role NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create unique index on user_id, org_id combination
CREATE UNIQUE INDEX unique_user_org ON user_organizations (user_id, org_id);

-- Clients table
CREATE TABLE clients (
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
CREATE TABLE jobs (
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
CREATE TABLE candidates (
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
CREATE TABLE job_candidate (
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

-- Create unique index on job_id, candidate_id combination
CREATE UNIQUE INDEX unique_job_candidate ON job_candidate (job_id, candidate_id);

-- Candidate Notes table
CREATE TABLE candidate_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  job_candidate_id UUID NOT NULL REFERENCES job_candidate(id),
  author_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_private VARCHAR(10) DEFAULT 'false' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Interviews table
CREATE TABLE interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  job_candidate_id UUID NOT NULL REFERENCES job_candidate(id),
  title TEXT NOT NULL,
  type interview_type NOT NULL,
  status interview_status DEFAULT 'scheduled' NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration TEXT DEFAULT '60', -- Duration in minutes
  location TEXT, -- Meeting room, video link, etc.
  interviewer_id UUID, -- References auth.users
  notes TEXT,
  feedback TEXT, -- Post-interview feedback
  rating TEXT, -- 1-10 rating scale
  record_status record_status DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  type message_type NOT NULL,
  priority message_priority DEFAULT 'normal' NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  sender_id UUID NOT NULL, -- References auth.users
  recipient_id UUID, -- References auth.users (null for broadcasts)
  
  -- Context references
  client_id UUID REFERENCES clients(id),
  job_id UUID REFERENCES jobs(id),
  candidate_id UUID REFERENCES candidates(id),
  job_candidate_id UUID REFERENCES job_candidate(id),
  
  is_read BOOLEAN DEFAULT false NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE,
  is_archived BOOLEAN DEFAULT false NOT NULL,
  
  -- Thread support
  thread_id UUID, -- References parent message
  reply_to_id UUID, -- References message being replied to
  
  -- Metadata
  attachments TEXT[], -- Array of file URLs
  tags TEXT[], -- Array of tags for categorization
  
  record_status record_status DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Message Recipients table
CREATE TABLE message_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  message_id UUID NOT NULL REFERENCES messages(id),
  recipient_id UUID NOT NULL, -- References auth.users
  is_read BOOLEAN DEFAULT false NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_clients_org_id ON clients(org_id);
CREATE INDEX idx_jobs_org_id ON jobs(org_id);
CREATE INDEX idx_jobs_client_id ON jobs(client_id);
CREATE INDEX idx_candidates_org_id ON candidates(org_id);
CREATE INDEX idx_job_candidate_org_id ON job_candidate(org_id);
CREATE INDEX idx_job_candidate_job_id ON job_candidate(job_id);
CREATE INDEX idx_job_candidate_candidate_id ON job_candidate(candidate_id);
CREATE INDEX idx_candidate_notes_org_id ON candidate_notes(org_id);
CREATE INDEX idx_interviews_org_id ON interviews(org_id);
CREATE INDEX idx_messages_org_id ON messages(org_id);
CREATE INDEX idx_message_recipients_org_id ON message_recipients(org_id);

-- Create trigger to automatically add organization owner to user_organizations
CREATE OR REPLACE FUNCTION add_owner_to_user_organizations()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_organizations (user_id, org_id, role)
  VALUES (NEW.owner_id, NEW.id, 'owner');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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
) ON CONFLICT (id) DO NOTHING;

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_candidate ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_recipients ENABLE ROW LEVEL SECURITY;