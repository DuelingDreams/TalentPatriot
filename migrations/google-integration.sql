-- ==========================================
-- TalentPatriot Google Integration Migration
-- ==========================================
-- Run this script in your Supabase SQL Editor to add Google Calendar/Meet support
-- This adds: connected_accounts, calendar_events, message_threads tables
-- Plus: thread_id, channel_type, external_message_id columns to messages table

-- ========== MESSAGE THREADS TABLE ==========
-- Tracks email and internal conversation threads
CREATE TABLE IF NOT EXISTS message_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  channel_type VARCHAR(50) NOT NULL, -- 'email', 'internal', 'client_portal'
  subject VARCHAR(500),
  participants JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of user IDs or emails
  last_message_at TIMESTAMP WITH TIME ZONE,
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_archived BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for message threads
CREATE INDEX IF NOT EXISTS idx_message_threads_org_id ON message_threads(org_id);
CREATE INDEX IF NOT EXISTS idx_message_threads_channel_type ON message_threads(channel_type);
CREATE INDEX IF NOT EXISTS idx_message_threads_last_activity ON message_threads(last_activity_at DESC);

COMMENT ON TABLE message_threads IS 'Conversation threads for grouping related messages';
COMMENT ON COLUMN message_threads.channel_type IS 'Type of communication channel: email, internal, client_portal';
COMMENT ON COLUMN message_threads.participants IS 'Array of participant user IDs or email addresses';

-- ========== CONNECTED ACCOUNTS TABLE ==========
-- Stores OAuth connections (Google, Microsoft, etc.) WITHOUT raw tokens
-- Tokens should be encrypted and stored in a separate secure vault
CREATE TABLE IF NOT EXISTS connected_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL, -- 'google', 'microsoft', etc.
  provider_email VARCHAR(255),
  scopes TEXT[] NOT NULL DEFAULT '{}', -- OAuth scopes granted
  connector_account_id VARCHAR(255) UNIQUE, -- ID from Replit connector or custom implementation
  access_token_expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, org_id, provider)
);

-- Indexes for connected accounts
CREATE INDEX IF NOT EXISTS idx_connected_accounts_user_org ON connected_accounts(user_id, org_id);
CREATE INDEX IF NOT EXISTS idx_connected_accounts_provider ON connected_accounts(provider);
CREATE INDEX IF NOT EXISTS idx_connected_accounts_is_active ON connected_accounts(is_active);

COMMENT ON TABLE connected_accounts IS 'OAuth connected accounts (WITHOUT raw tokens - use separate encrypted storage)';
COMMENT ON COLUMN connected_accounts.connector_account_id IS 'Reference ID for Replit connector or custom OAuth implementation';
COMMENT ON COLUMN connected_accounts.scopes IS 'Array of granted OAuth scopes';

-- ========== CALENDAR EVENTS TABLE ==========
-- Tracks Google Calendar/Meet events created from the app
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL, -- 'google', 'microsoft', etc.
  provider_event_id VARCHAR(255), -- External calendar event ID
  thread_id UUID REFERENCES message_threads(id) ON DELETE SET NULL, -- Optional link to message thread
  summary VARCHAR(500) NOT NULL,
  description TEXT,
  start_at TIMESTAMP WITH TIME ZONE NOT NULL,
  end_at TIMESTAMP WITH TIME ZONE NOT NULL,
  timezone VARCHAR(100) DEFAULT 'UTC',
  conference_url TEXT, -- Google Meet link, Zoom link, etc.
  attendees JSONB DEFAULT '[]'::jsonb, -- Array of attendee objects
  status VARCHAR(50) DEFAULT 'confirmed', -- 'confirmed', 'cancelled', 'tentative'
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for calendar events
CREATE INDEX IF NOT EXISTS idx_calendar_events_org_id ON calendar_events(org_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_provider ON calendar_events(provider);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_at ON calendar_events(start_at);
CREATE INDEX IF NOT EXISTS idx_calendar_events_thread_id ON calendar_events(thread_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_status ON calendar_events(status);

COMMENT ON TABLE calendar_events IS 'Calendar events from external providers (Google Calendar, Microsoft, etc.)';
COMMENT ON COLUMN calendar_events.conference_url IS 'Video conference link (Google Meet, Zoom, Teams)';
COMMENT ON COLUMN calendar_events.attendees IS 'Array of attendee objects with email and status';

-- ========== UPDATE MESSAGES TABLE ==========
-- Add new columns for thread-based messaging and external integrations

-- Add thread_id column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'thread_id'
  ) THEN
    ALTER TABLE messages ADD COLUMN thread_id UUID REFERENCES message_threads(id) ON DELETE SET NULL;
    CREATE INDEX idx_messages_thread_id ON messages(thread_id);
  END IF;
END $$;

-- Add channel_type column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'channel_type'
  ) THEN
    ALTER TABLE messages ADD COLUMN channel_type VARCHAR(50);
    CREATE INDEX idx_messages_channel_type ON messages(channel_type);
  END IF;
END $$;

-- Add external_message_id column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'external_message_id'
  ) THEN
    ALTER TABLE messages ADD COLUMN external_message_id VARCHAR(255);
    CREATE INDEX idx_messages_external_id ON messages(external_message_id);
  END IF;
END $$;

COMMENT ON COLUMN messages.thread_id IS 'Optional: Links message to a conversation thread';
COMMENT ON COLUMN messages.channel_type IS 'Channel type: email, internal, client_portal';
COMMENT ON COLUMN messages.external_message_id IS 'ID from external system (Gmail message ID, etc.)';

-- ========== RLS POLICIES ==========
-- Note: Review and customize these policies based on your security requirements
-- These are starter policies - you may need to adjust based on your multi-tenancy model

-- Connected Accounts RLS
ALTER TABLE connected_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own connected accounts" ON connected_accounts;
CREATE POLICY "Users can view their own connected accounts"
  ON connected_accounts FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own connected accounts" ON connected_accounts;
CREATE POLICY "Users can insert their own connected accounts"
  ON connected_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own connected accounts" ON connected_accounts;
CREATE POLICY "Users can update their own connected accounts"
  ON connected_accounts FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own connected accounts" ON connected_accounts;
CREATE POLICY "Users can delete their own connected accounts"
  ON connected_accounts FOR DELETE
  USING (auth.uid() = user_id);

-- Calendar Events RLS
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view calendar events in their org" ON calendar_events;
CREATE POLICY "Users can view calendar events in their org"
  ON calendar_events FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create calendar events in their org" ON calendar_events;
CREATE POLICY "Users can create calendar events in their org"
  ON calendar_events FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update calendar events they created" ON calendar_events;
CREATE POLICY "Users can update calendar events they created"
  ON calendar_events FOR UPDATE
  USING (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can delete calendar events they created" ON calendar_events;
CREATE POLICY "Users can delete calendar events they created"
  ON calendar_events FOR DELETE
  USING (created_by = auth.uid());

-- Message Threads RLS
ALTER TABLE message_threads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view message threads in their org" ON message_threads;
CREATE POLICY "Users can view message threads in their org"
  ON message_threads FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create message threads in their org" ON message_threads;
CREATE POLICY "Users can create message threads in their org"
  ON message_threads FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update message threads in their org" ON message_threads;
CREATE POLICY "Users can update message threads in their org"
  ON message_threads FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );

-- ========== MIGRATION COMPLETE ==========
-- Migration complete! Next steps:
-- 1. Set these environment variables in your Replit project:
--    - GOOGLE_CLIENT_ID
--    - GOOGLE_CLIENT_SECRET
--    - GOOGLE_REDIRECT_URI
--    - APP_JWT_SECRET (for signing OAuth state parameters)
--
-- 2. Enable the Google integration feature flag:
--    - Set ENABLE_GOOGLE_INTEGRATION=true in your environment
--
-- 3. Test the integration:
--    - Navigate to /settings/integrations
--    - Connect your Google account
--    - Try creating a Google Meet from the Messages page

SELECT 'Google integration migration completed successfully!' AS status;
