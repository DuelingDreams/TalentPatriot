-- SQL Script to create Messages and Message Recipients tables
-- Copy and paste this into your Supabase SQL Editor

-- Create enums if they don't exist
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

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  type message_type NOT NULL,
  priority message_priority NOT NULL DEFAULT 'normal',
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  sender_id UUID NOT NULL, -- References auth.users
  recipient_id UUID, -- References auth.users (null for broadcasts)
  
  -- Context references
  client_id UUID REFERENCES clients(id),
  job_id UUID REFERENCES jobs(id),
  candidate_id UUID REFERENCES candidates(id),
  job_candidate_id UUID REFERENCES job_candidate(id),
  
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  
  -- Thread support
  thread_id UUID, -- References parent message
  reply_to_id UUID, -- References message being replied to
  
  -- Metadata
  attachments TEXT[], -- Array of file URLs
  tags TEXT[], -- Array of tags for categorization
  
  record_status record_status DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create message_recipients table
CREATE TABLE IF NOT EXISTS message_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  message_id UUID NOT NULL REFERENCES messages(id),
  recipient_id UUID NOT NULL, -- References auth.users
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_org_id ON messages(org_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);
CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON messages(thread_id);

CREATE INDEX IF NOT EXISTS idx_message_recipients_org_id ON message_recipients(org_id);
CREATE INDEX IF NOT EXISTS idx_message_recipients_message_id ON message_recipients(message_id);
CREATE INDEX IF NOT EXISTS idx_message_recipients_recipient_id ON message_recipients(recipient_id);
CREATE INDEX IF NOT EXISTS idx_message_recipients_is_read ON message_recipients(is_read);

-- Enable Row Level Security (RLS)
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_recipients ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for messages
CREATE POLICY "Users can view messages in their organization" 
ON messages FOR SELECT 
USING (
  org_id IN (
    SELECT org_id FROM user_organizations 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create messages in their organization" 
ON messages FOR INSERT 
WITH CHECK (
  org_id IN (
    SELECT org_id FROM user_organizations 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own messages" 
ON messages FOR UPDATE 
USING (
  sender_id = auth.uid() AND
  org_id IN (
    SELECT org_id FROM user_organizations 
    WHERE user_id = auth.uid()
  )
);

-- Create RLS policies for message_recipients
CREATE POLICY "Users can view message recipients in their organization" 
ON message_recipients FOR SELECT 
USING (
  org_id IN (
    SELECT org_id FROM user_organizations 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create message recipients in their organization" 
ON message_recipients FOR INSERT 
WITH CHECK (
  org_id IN (
    SELECT org_id FROM user_organizations 
    WHERE user_id = auth.uid()
  )
);

-- Create trigger to update the updated_at column
CREATE OR REPLACE FUNCTION update_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_messages_updated_at_trigger
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_messages_updated_at();

-- Grant permissions
GRANT ALL ON messages TO authenticated;
GRANT ALL ON message_recipients TO authenticated;
GRANT ALL ON messages TO service_role;
GRANT ALL ON message_recipients TO service_role;

-- Insert test message (optional - you can remove this)
-- INSERT INTO messages (org_id, type, priority, subject, content, sender_id, recipient_id)
-- SELECT 
--   (SELECT id FROM organizations LIMIT 1),
--   'internal',
--   'normal',
--   'Welcome to TalentPatriot Messages!',
--   'This is your first message. The messaging system is now ready to use.',
--   (SELECT id FROM user_profiles LIMIT 1),
--   (SELECT id FROM user_profiles LIMIT 1)
-- WHERE EXISTS (SELECT 1 FROM organizations) AND EXISTS (SELECT 1 FROM user_profiles);