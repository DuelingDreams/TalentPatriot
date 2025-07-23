-- COMPLETE MIGRATION SCRIPT FOR TALENTPATRIOT ATS
-- Adds all missing columns to make the application fully functional

-- ==========================================
-- PART 1: ADD MISSING COLUMNS TO CLIENTS TABLE
-- ==========================================

-- Add missing columns to clients table
DO $$ BEGIN
    ALTER TABLE clients ADD COLUMN location VARCHAR(255);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE clients ADD COLUMN notes TEXT;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE clients ADD COLUMN industry VARCHAR(100);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE clients ADD COLUMN website VARCHAR(255);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE clients ADD COLUMN contact_name VARCHAR(255);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE clients ADD COLUMN contact_email VARCHAR(255);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE clients ADD COLUMN contact_phone VARCHAR(50);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE clients ADD COLUMN status VARCHAR(20) DEFAULT 'active';
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE clients ADD COLUMN created_by UUID;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- ==========================================
-- PART 2: ADD MISSING COLUMNS TO JOBS TABLE  
-- ==========================================

DO $$ BEGIN
    ALTER TABLE jobs ADD COLUMN description TEXT;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE jobs ADD COLUMN status VARCHAR(20) DEFAULT 'open';
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE jobs ADD COLUMN record_status VARCHAR(20) DEFAULT 'active';
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE jobs ADD COLUMN created_by UUID;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE jobs ADD COLUMN assigned_to UUID;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- ==========================================
-- PART 3: ADD MISSING COLUMNS TO CANDIDATES TABLE
-- ==========================================

DO $$ BEGIN
    ALTER TABLE candidates ADD COLUMN phone VARCHAR(50);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE candidates ADD COLUMN resume_url TEXT;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE candidates ADD COLUMN status VARCHAR(20) DEFAULT 'active';
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE candidates ADD COLUMN created_by UUID;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- ==========================================
-- PART 4: CREATE MISSING TABLES IF THEY DON'T EXIST
-- ==========================================

-- Create job_candidate table if it doesn't exist
CREATE TABLE IF NOT EXISTS job_candidate (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  job_id UUID REFERENCES jobs(id) NOT NULL,
  candidate_id UUID REFERENCES candidates(id) NOT NULL,
  stage VARCHAR(20) DEFAULT 'applied' NOT NULL,
  notes TEXT,
  assigned_to UUID,
  status VARCHAR(20) DEFAULT 'active' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(job_id, candidate_id)
);

-- Create candidate_notes table if it doesn't exist
CREATE TABLE IF NOT EXISTS candidate_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  job_candidate_id UUID REFERENCES job_candidate(id) NOT NULL,
  author_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_private VARCHAR(10) DEFAULT 'false' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create user_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY,
  role VARCHAR(20) NOT NULL DEFAULT 'recruiter',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create interviews table if it doesn't exist
CREATE TABLE IF NOT EXISTS interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  job_candidate_id UUID REFERENCES job_candidate(id) NOT NULL,
  title TEXT NOT NULL,
  type VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'scheduled' NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration VARCHAR(10) DEFAULT '60',
  location TEXT,
  interviewer_id UUID,
  notes TEXT,
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  sender_id UUID NOT NULL,
  type VARCHAR(20) DEFAULT 'internal' NOT NULL,
  priority VARCHAR(10) DEFAULT 'normal' NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  context_type VARCHAR(50),
  context_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create message_recipients table if it doesn't exist
CREATE TABLE IF NOT EXISTS message_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  message_id UUID REFERENCES messages(id) NOT NULL,
  recipient_id UUID NOT NULL,
  is_read BOOLEAN DEFAULT false NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ==========================================
-- PART 5: CREATE ESSENTIAL INDEXES FOR PERFORMANCE
-- ==========================================

-- Indexes for clients
DO $$ BEGIN
    CREATE INDEX idx_clients_org_id ON clients(org_id);
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX idx_clients_name ON clients(name);
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

-- Indexes for jobs
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
    CREATE INDEX idx_jobs_status ON jobs(status);
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

-- Indexes for candidates
DO $$ BEGIN
    CREATE INDEX idx_candidates_org_id ON candidates(org_id);
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX idx_candidates_email ON candidates(email);
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

-- Indexes for job_candidate
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
    CREATE INDEX idx_job_candidate_stage ON job_candidate(stage);
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

-- Indexes for candidate_notes
DO $$ BEGIN
    CREATE INDEX idx_candidate_notes_job_candidate_id ON candidate_notes(job_candidate_id);
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX idx_candidate_notes_author_id ON candidate_notes(author_id);
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

-- ==========================================
-- PART 6: ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ==========================================

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_candidate ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- PART 7: INSERT DEMO ORGANIZATION IF IT DOESN'T EXIST
-- ==========================================

INSERT INTO organizations (id, name, owner_id, slug, created_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'TalentPatriot Demo',
  '00000000-0000-0000-0000-000000000000',
  'demo-org-fixed',
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- PART 8: SUCCESS MESSAGE
-- ==========================================

DO $$
BEGIN
    RAISE NOTICE 'TalentPatriot ATS migration completed successfully!';
    RAISE NOTICE 'All missing columns and tables have been added.';
    RAISE NOTICE 'Application should now have full functionality.';
END
$$;