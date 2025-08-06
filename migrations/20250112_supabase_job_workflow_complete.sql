-- Complete Supabase Schema and RLS Policies for TalentPatriot Job Workflow
-- Execute this script in your Supabase SQL Editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM types if they don't exist
DO $$ BEGIN
    CREATE TYPE job_status AS ENUM ('draft', 'open', 'closed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE job_type AS ENUM ('full-time', 'part-time', 'contract', 'internship');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE candidate_stage AS ENUM ('applied', 'phone_screen', 'interview', 'technical', 'final', 'offer', 'hired', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE record_status AS ENUM ('active', 'inactive', 'demo');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('hiring_manager', 'recruiter', 'admin', 'interviewer', 'demo_viewer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE organization_role AS ENUM ('owner', 'admin', 'recruiter', 'viewer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- User Profiles table (secure user role storage)
CREATE TABLE IF NOT EXISTS user_profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'hiring_manager',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    slug text UNIQUE,
    owner_id uuid REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- User Organizations join table
CREATE TABLE IF NOT EXISTS user_organizations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    org_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
    role organization_role NOT NULL DEFAULT 'recruiter',
    joined_at timestamptz DEFAULT now(),
    UNIQUE(user_id, org_id)
);

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
    name text NOT NULL,
    industry text,
    location text,
    website text,
    contact_name text,
    contact_email text,
    notes text,
    status record_status DEFAULT 'active',
    created_by uuid REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Jobs table with complete workflow support
CREATE TABLE IF NOT EXISTS jobs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
    client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
    title text NOT NULL,
    description text,
    location text,
    job_type job_type DEFAULT 'full-time',
    department text,
    status job_status DEFAULT 'draft',
    record_status record_status DEFAULT 'active',
    assigned_to uuid REFERENCES auth.users(id),
    created_by uuid REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Candidates table
CREATE TABLE IF NOT EXISTS candidates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
    name text NOT NULL,
    email text NOT NULL,
    phone text,
    resume_url text,
    status record_status DEFAULT 'active',
    created_by uuid REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Applications table
CREATE TABLE IF NOT EXISTS applications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id uuid REFERENCES jobs(id) ON DELETE CASCADE,
    candidate_id uuid REFERENCES candidates(id) ON DELETE CASCADE,
    status record_status DEFAULT 'active',
    applied_at timestamptz DEFAULT now(),
    UNIQUE(job_id, candidate_id)
);

-- Job Candidate Pipeline table (for Kanban board)
CREATE TABLE IF NOT EXISTS job_candidate (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
    job_id uuid REFERENCES jobs(id) ON DELETE CASCADE,
    candidate_id uuid REFERENCES candidates(id) ON DELETE CASCADE,
    application_id uuid REFERENCES applications(id) ON DELETE CASCADE,
    stage candidate_stage DEFAULT 'applied',
    notes text,
    assigned_to uuid REFERENCES auth.users(id),
    status record_status DEFAULT 'active',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(job_id, candidate_id)
);

-- Candidate Notes table
CREATE TABLE IF NOT EXISTS candidate_notes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
    job_candidate_id uuid REFERENCES job_candidate(id) ON DELETE CASCADE,
    author_id uuid REFERENCES auth.users(id),
    content text NOT NULL,
    is_private text DEFAULT 'false',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Interviews table
CREATE TABLE IF NOT EXISTS interviews (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
    job_candidate_id uuid REFERENCES job_candidate(id) ON DELETE CASCADE,
    title text NOT NULL,
    type interview_type NOT NULL,
    status interview_status DEFAULT 'scheduled',
    scheduled_at timestamptz NOT NULL,
    duration text DEFAULT '60',
    location text,
    interviewer_id uuid REFERENCES auth.users(id),
    notes text,
    feedback text,
    rating text,
    record_status record_status DEFAULT 'active',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
    type message_type NOT NULL,
    priority message_priority DEFAULT 'normal',
    subject text NOT NULL,
    content text NOT NULL,
    sender_id uuid REFERENCES auth.users(id),
    recipient_id uuid REFERENCES auth.users(id),
    client_id uuid REFERENCES clients(id),
    job_id uuid REFERENCES jobs(id),
    candidate_id uuid REFERENCES candidates(id),
    job_candidate_id uuid REFERENCES job_candidate(id),
    is_read boolean DEFAULT false,
    read_at timestamptz,
    is_archived boolean DEFAULT false,
    thread_id uuid,
    reply_to_id uuid,
    attachments text[],
    tags text[],
    record_status record_status DEFAULT 'active',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Message Recipients table
CREATE TABLE IF NOT EXISTS message_recipients (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
    message_id uuid REFERENCES messages(id) ON DELETE CASCADE,
    recipient_id uuid REFERENCES auth.users(id),
    is_read boolean DEFAULT false,
    read_at timestamptz,
    created_at timestamptz DEFAULT now()
);

-- Sessions table (required for authentication)
CREATE TABLE IF NOT EXISTS sessions (
    sid text PRIMARY KEY,
    sess jsonb NOT NULL,
    expire timestamptz NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_jobs_org_id ON jobs(org_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_client_id ON jobs(client_id);
CREATE INDEX IF NOT EXISTS idx_candidates_org_id ON candidates(org_id);
CREATE INDEX IF NOT EXISTS idx_candidates_email ON candidates(email);
CREATE INDEX IF NOT EXISTS idx_job_candidate_job_id ON job_candidate(job_id);
CREATE INDEX IF NOT EXISTS idx_job_candidate_stage ON job_candidate(stage);
CREATE INDEX IF NOT EXISTS idx_applications_job_candidate ON applications(job_id, candidate_id);
CREATE INDEX IF NOT EXISTS idx_user_organizations_user ON user_organizations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_organizations_org ON user_organizations(org_id);
CREATE INDEX IF NOT EXISTS idx_messages_org_id ON messages(org_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expire ON sessions(expire);

-- Enable Row Level Security on all tables
-- Note: user_profiles table doesn't exist in this script, skipping
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_candidate ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_recipients ENABLE ROW LEVEL SECURITY;

-- Drop existing functions if they exist to handle conflicts
DROP FUNCTION IF EXISTS get_user_org_ids(uuid);

-- Helper function to get user's organization IDs
CREATE OR REPLACE FUNCTION get_user_org_ids(user_uuid uuid)
RETURNS uuid[] AS $$
BEGIN
    RETURN ARRAY(
        SELECT org_id 
        FROM user_organizations 
        WHERE user_id = user_uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing function if it exists to handle return type conflicts
DROP FUNCTION IF EXISTS get_user_role(uuid);

-- Helper function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_uuid uuid)
RETURNS TEXT AS $$
DECLARE
    user_email TEXT;
    user_role TEXT;
BEGIN
    -- Get user email and check for demo user
    SELECT email INTO user_email FROM auth.users WHERE id = user_uuid;
    
    -- Special case for demo user
    IF user_email = 'demo@yourapp.com' THEN
        RETURN 'demo_viewer';
    END IF;
    
    -- Get role from raw_user_meta_data
    SELECT COALESCE(
        (raw_user_meta_data->>'role')::TEXT, 
        'hiring_manager'
    ) INTO user_role 
    FROM auth.users 
    WHERE id = user_uuid;
    
    RETURN COALESCE(user_role, 'hiring_manager');
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'hiring_manager';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies

-- Auth Users policies - Note: user_profiles table doesn't exist in this script
-- Skipping user_profiles policies since the table is not created here

-- Organizations policies
DROP POLICY IF EXISTS "Users can view organizations they belong to" ON organizations;
CREATE POLICY "Users can view organizations they belong to" ON organizations
    FOR SELECT USING (
        id = ANY(get_user_org_ids(auth.uid()))
    );

DROP POLICY IF EXISTS "Organization owners can update" ON organizations;
CREATE POLICY "Organization owners can update" ON organizations
    FOR UPDATE USING (owner_id = auth.uid()::uuid);

-- User Organizations policies
DROP POLICY IF EXISTS "Users can view their organization memberships" ON user_organizations;
CREATE POLICY "Users can view their organization memberships" ON user_organizations
    FOR SELECT USING (
        user_id = auth.uid()::uuid OR 
        org_id = ANY(get_user_org_ids(auth.uid()))
    );

-- Clients policies
DROP POLICY IF EXISTS "Users can view clients in their organizations" ON clients;
CREATE POLICY "Users can view clients in their organizations" ON clients
    FOR SELECT USING (
        org_id = ANY(get_user_org_ids(auth.uid())) OR
        (get_user_role(auth.uid())::TEXT = 'demo_viewer' AND status::TEXT = 'demo')
    );

DROP POLICY IF EXISTS "Users can manage clients in their organizations" ON clients;
CREATE POLICY "Users can manage clients in their organizations" ON clients
    FOR ALL USING (
        org_id = ANY(get_user_org_ids(auth.uid())) AND
        get_user_role(auth.uid())::TEXT != 'demo_viewer'
    );

-- Jobs policies
DROP POLICY IF EXISTS "Users can view jobs in their organizations" ON jobs;
CREATE POLICY "Users can view jobs in their organizations" ON jobs
    FOR SELECT USING (
        org_id = ANY(get_user_org_ids(auth.uid())) OR
        (get_user_role(auth.uid())::TEXT = 'demo_viewer' AND record_status::TEXT = 'demo')
    );

DROP POLICY IF EXISTS "Users can manage jobs in their organizations" ON jobs;
CREATE POLICY "Users can manage jobs in their organizations" ON jobs
    FOR ALL USING (
        org_id = ANY(get_user_org_ids(auth.uid())) AND
        get_user_role(auth.uid())::TEXT != 'demo_viewer'
    );

DROP POLICY IF EXISTS "Public can view open jobs" ON jobs;
CREATE POLICY "Public can view open jobs" ON jobs
    FOR SELECT USING (status::TEXT = 'open' AND record_status::TEXT = 'active');

-- Candidates policies
DROP POLICY IF EXISTS "Users can view candidates in their organizations" ON candidates;
CREATE POLICY "Users can view candidates in their organizations" ON candidates
    FOR SELECT USING (
        org_id = ANY(get_user_org_ids(auth.uid())) OR
        (get_user_role(auth.uid())::TEXT = 'demo_viewer' AND status::TEXT = 'demo')
    );

DROP POLICY IF EXISTS "Users can manage candidates in their organizations" ON candidates;
CREATE POLICY "Users can manage candidates in their organizations" ON candidates
    FOR ALL USING (
        org_id = ANY(get_user_org_ids(auth.uid())) AND
        get_user_role(auth.uid())::TEXT != 'demo_viewer'
    );

-- Applications policies
DROP POLICY IF EXISTS "Public can create applications" ON applications;
CREATE POLICY "Public can create applications" ON applications
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view applications for their jobs" ON applications;
CREATE POLICY "Users can view applications for their jobs" ON applications
    FOR SELECT USING (
        job_id IN (
            SELECT id FROM jobs 
            WHERE org_id = ANY(get_user_org_ids(auth.uid()))
        )
    );

-- Job Candidate policies (Pipeline)
DROP POLICY IF EXISTS "Users can view pipeline in their organizations" ON job_candidate;
CREATE POLICY "Users can view pipeline in their organizations" ON job_candidate
    FOR SELECT USING (
        org_id = ANY(get_user_org_ids(auth.uid())) OR
        (get_user_role(auth.uid())::TEXT = 'demo_viewer' AND 
         status::TEXT = 'demo')
    );

DROP POLICY IF EXISTS "Users can manage pipeline in their organizations" ON job_candidate;
CREATE POLICY "Users can manage pipeline in their organizations" ON job_candidate
    FOR ALL USING (
        org_id = ANY(get_user_org_ids(auth.uid())) AND
        get_user_role(auth.uid())::TEXT != 'demo_viewer'
    );

-- Candidate Notes policies
DROP POLICY IF EXISTS "Users can view notes in their organizations" ON candidate_notes;
CREATE POLICY "Users can view notes in their organizations" ON candidate_notes
    FOR SELECT USING (
        org_id = ANY(get_user_org_ids(auth.uid())) OR
        (get_user_role(auth.uid())::TEXT = 'demo_viewer' AND
         job_candidate_id IN (
             SELECT id FROM job_candidate jc
             WHERE jc.status::TEXT = 'demo'
         ))
    );

DROP POLICY IF EXISTS "Users can create notes in their organizations" ON candidate_notes;
CREATE POLICY "Users can create notes in their organizations" ON candidate_notes
    FOR INSERT WITH CHECK (
        org_id = ANY(get_user_org_ids(auth.uid())) AND
        get_user_role(auth.uid())::TEXT != 'demo_viewer' AND
        author_id = auth.uid()::uuid
    );

-- Interviews policies
DROP POLICY IF EXISTS "Users can view interviews in their organizations" ON interviews;
CREATE POLICY "Users can view interviews in their organizations" ON interviews
    FOR SELECT USING (
        org_id = ANY(get_user_org_ids(auth.uid())) OR
        (get_user_role(auth.uid())::TEXT = 'demo_viewer' AND
         record_status::TEXT = 'demo')
    );

DROP POLICY IF EXISTS "Users can manage interviews in their organizations" ON interviews;
CREATE POLICY "Users can manage interviews in their organizations" ON interviews
    FOR ALL USING (
        org_id = ANY(get_user_org_ids(auth.uid())) AND
        get_user_role(auth.uid())::TEXT != 'demo_viewer'
    );

-- Messages policies
DROP POLICY IF EXISTS "Users can view messages in their organizations" ON messages;
CREATE POLICY "Users can view messages in their organizations" ON messages
    FOR SELECT USING (
        org_id = ANY(get_user_org_ids(auth.uid())) OR
        (get_user_role(auth.uid())::TEXT = 'demo_viewer' AND org_id = '00000000-0000-0000-0000-000000000000'::uuid)
    );

DROP POLICY IF EXISTS "Users can create messages in their organizations" ON messages;
CREATE POLICY "Users can create messages in their organizations" ON messages
    FOR INSERT WITH CHECK (
        org_id = ANY(get_user_org_ids(auth.uid())) AND
        get_user_role(auth.uid())::TEXT != 'demo_viewer' AND
        sender_id = auth.uid()::uuid
    );

-- Message Recipients policies
DROP POLICY IF EXISTS "Users can view their message receipts" ON message_recipients;
CREATE POLICY "Users can view their message receipts" ON message_recipients
    FOR SELECT USING (recipient_id = auth.uid()::uuid);

DROP POLICY IF EXISTS "Users can update their message receipts" ON message_recipients;
CREATE POLICY "Users can update their message receipts" ON message_recipients
    FOR UPDATE USING (recipient_id = auth.uid()::uuid);

-- Create demo organization and data if not exists
INSERT INTO organizations (id, name, slug, owner_id) 
VALUES (
    '00000000-0000-0000-0000-000000000000'::uuid,
    'TalentPatriot Demo', 
    'demo-org-fixed',
    null
) ON CONFLICT (slug) DO NOTHING;

-- Drop existing trigger function if it exists
DROP FUNCTION IF EXISTS auto_add_owner_to_user_organizations() CASCADE;

-- Auto-owner trigger for organizations
CREATE OR REPLACE FUNCTION auto_add_owner_to_user_organizations()
RETURNS TRIGGER AS $$
BEGIN
    -- Add the organization owner as an owner in user_organizations
    IF NEW.owner_id IS NOT NULL THEN
        INSERT INTO user_organizations (user_id, org_id, role)
        VALUES (NEW.owner_id::uuid, NEW.id::uuid, 'owner'::organization_role)
        ON CONFLICT (user_id, org_id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_add_owner_trigger ON organizations;
CREATE TRIGGER auto_add_owner_trigger
    AFTER INSERT ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION auto_add_owner_to_user_organizations();

-- Drop existing trigger function if it exists
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Updated timestamp triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to all tables
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_jobs_updated_at ON jobs;
CREATE TRIGGER update_jobs_updated_at
    BEFORE UPDATE ON jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_candidates_updated_at ON candidates;
CREATE TRIGGER update_candidates_updated_at
    BEFORE UPDATE ON candidates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_job_candidate_updated_at ON job_candidate;
CREATE TRIGGER update_job_candidate_updated_at
    BEFORE UPDATE ON job_candidate
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_candidate_notes_updated_at ON candidate_notes;
CREATE TRIGGER update_candidate_notes_updated_at
    BEFORE UPDATE ON candidate_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_interviews_updated_at ON interviews;
CREATE TRIGGER update_interviews_updated_at
    BEFORE UPDATE ON interviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_messages_updated_at ON messages;
CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Complete setup
SELECT 'TalentPatriot schema setup complete!' as status;