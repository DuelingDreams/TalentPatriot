-- ===============================================
-- TalentPatriot ATS - Safe Database Setup Script
-- Complete schema for messaging, interviews, and candidate notes
-- Handles existing objects gracefully
-- ===============================================

-- Create enums first (if they don't already exist)
DO $$ BEGIN
    CREATE TYPE job_status AS ENUM ('draft', 'open', 'closed', 'on_hold', 'filled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE job_type AS ENUM ('full-time', 'part-time', 'contract', 'internship');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE application_status AS ENUM ('applied', 'in_review', 'interview', 'offer', 'hired', 'rejected');
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
    CREATE TYPE user_role AS ENUM ('hiring_manager', 'recruiter', 'admin', 'interviewer', 'demo_viewer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE org_role AS ENUM ('owner', 'admin', 'hiring_manager', 'recruiter', 'interviewer', 'viewer');
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

DO $$ BEGIN
    CREATE TYPE experience_level AS ENUM ('entry', 'mid', 'senior', 'executive');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE remote_option AS ENUM ('onsite', 'remote', 'hybrid');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Candidate notes table (new table)
CREATE TABLE IF NOT EXISTS candidate_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) NOT NULL,
    job_candidate_id UUID REFERENCES job_candidate(id) NOT NULL,
    author_id UUID NOT NULL,
    content TEXT NOT NULL,
    is_private VARCHAR(10) DEFAULT 'false' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Interviews table (new table)
CREATE TABLE IF NOT EXISTS interviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) NOT NULL,
    job_candidate_id UUID REFERENCES job_candidate(id) NOT NULL,
    title TEXT NOT NULL,
    type interview_type NOT NULL,
    status interview_status DEFAULT 'scheduled' NOT NULL,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration TEXT DEFAULT '60',
    location TEXT,
    interviewer_id UUID,
    notes TEXT,
    feedback TEXT,
    rating TEXT,
    record_status record_status DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Messages table (new table)
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) NOT NULL,
    type message_type NOT NULL,
    priority message_priority DEFAULT 'normal' NOT NULL,
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    sender_id UUID NOT NULL,
    recipient_id UUID,
    client_id UUID REFERENCES clients(id),
    job_id UUID REFERENCES jobs(id),
    candidate_id UUID REFERENCES candidates(id),
    job_candidate_id UUID REFERENCES job_candidate(id),
    is_read BOOLEAN DEFAULT false NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE,
    is_archived BOOLEAN DEFAULT false NOT NULL,
    thread_id UUID,
    reply_to_id UUID,
    attachments TEXT[],
    tags TEXT[],
    record_status record_status DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Message recipients table (new table)
CREATE TABLE IF NOT EXISTS message_recipients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) NOT NULL,
    message_id UUID REFERENCES messages(id) NOT NULL,
    recipient_id UUID NOT NULL,
    is_read BOOLEAN DEFAULT false NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for better performance (only if they don't exist)
DO $$ BEGIN
    CREATE INDEX idx_candidate_notes_job_candidate ON candidate_notes(job_candidate_id);
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX idx_interviews_job_candidate ON interviews(job_candidate_id);
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX idx_interviews_org ON interviews(org_id);
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX idx_messages_org ON messages(org_id);
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX idx_messages_sender ON messages(sender_id);
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX idx_messages_recipient ON messages(recipient_id);
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX idx_message_recipients_message ON message_recipients(message_id);
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

-- Enable Row Level Security on new tables
ALTER TABLE candidate_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_recipients ENABLE ROW LEVEL SECURITY;

-- RLS policies for new tables

-- Messages policies
DO $$ BEGIN
    CREATE POLICY "Users can view messages in their organization" ON messages FOR SELECT USING (
        org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid()) OR
        sender_id = auth.uid() OR
        recipient_id = auth.uid()
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can create messages in their organization" ON messages FOR INSERT WITH CHECK (
        org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid()) AND
        sender_id = auth.uid()
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can update their own messages" ON messages FOR UPDATE USING (
        sender_id = auth.uid() AND
        org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Interviews policies
DO $$ BEGIN
    CREATE POLICY "Users can view interviews in their organization" ON interviews FOR SELECT USING (
        org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can create interviews in their organization" ON interviews FOR INSERT WITH CHECK (
        org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can update interviews in their organization" ON interviews FOR UPDATE USING (
        org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can delete interviews in their organization" ON interviews FOR DELETE USING (
        org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Candidate notes policies
DO $$ BEGIN
    CREATE POLICY "Users can view candidate notes in their organization" ON candidate_notes FOR SELECT USING (
        org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can create candidate notes in their organization" ON candidate_notes FOR INSERT WITH CHECK (
        org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid()) AND
        author_id = auth.uid()
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can update their own candidate notes" ON candidate_notes FOR UPDATE USING (
        author_id = auth.uid() AND
        org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Message recipients policies
DO $$ BEGIN
    CREATE POLICY "Users can view message recipients in their organization" ON message_recipients FOR SELECT USING (
        org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid()) OR
        recipient_id = auth.uid()
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can create message recipients in their organization" ON message_recipients FOR INSERT WITH CHECK (
        org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Recipients can update their read status" ON message_recipients FOR UPDATE USING (
        recipient_id = auth.uid()
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Update function for timestamps (only create if it doesn't exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at columns (with safe creation)
DO $$ BEGIN
    CREATE TRIGGER update_candidate_notes_updated_at 
    BEFORE UPDATE ON candidate_notes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_interviews_updated_at 
    BEFORE UPDATE ON interviews 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_messages_updated_at 
    BEFORE UPDATE ON messages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'TalentPatriot ATS - New features database setup completed successfully!';
    RAISE NOTICE 'Added tables: candidate_notes, interviews, messages, message_recipients';
    RAISE NOTICE 'All indexes, RLS policies, and triggers have been safely created.';
    RAISE NOTICE 'The system is now ready for messaging, interviews, and candidate notes functionality.';
END $$;