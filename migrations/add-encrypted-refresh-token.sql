-- Add encrypted_refresh_token, last_used_at, and connected_at columns to connected_accounts table
-- Run this in Supabase SQL Editor

DO $$
BEGIN
  -- Add encrypted_refresh_token column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'connected_accounts' AND column_name = 'encrypted_refresh_token'
  ) THEN
    ALTER TABLE connected_accounts ADD COLUMN encrypted_refresh_token TEXT;
  END IF;

  -- Add last_used_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'connected_accounts' AND column_name = 'last_used_at'
  ) THEN
    ALTER TABLE connected_accounts ADD COLUMN last_used_at TIMESTAMP WITH TIME ZONE;
  END IF;

  -- Add connected_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'connected_accounts' AND column_name = 'connected_at'
  ) THEN
    ALTER TABLE connected_accounts ADD COLUMN connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

COMMENT ON COLUMN connected_accounts.encrypted_refresh_token IS 'AES-256-GCM encrypted OAuth refresh token for long-term access';
COMMENT ON COLUMN connected_accounts.last_used_at IS 'Last time this account was used to make an API call';
COMMENT ON COLUMN connected_accounts.connected_at IS 'When the account was originally connected';
