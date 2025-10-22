# Google Integration Setup Guide

## Overview

This guide explains how to enable and configure Google Workspace integration in TalentPatriot. The integration allows you to:

- **Create Google Meet links** directly from the Messages page
- **Check calendar availability** using Google Calendar FreeBusy API
- **Propose meeting times** based on your availability
- **Send emails through Gmail** (coming soon)

## Prerequisites

Before enabling the Google integration, you'll need:

1. **Google Cloud Project** with OAuth 2.0 credentials
2. **Access to Supabase SQL Editor** for running the database migration
3. **Admin access** to your TalentPatriot organization

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Google Calendar API
   - Google Meet API (included with Calendar API)
   - Gmail API (optional, for future email integration)

## Step 2: Configure OAuth 2.0 Credentials

1. In Google Cloud Console, go to **APIs & Services > Credentials**
2. Click **Create Credentials > OAuth client ID**
3. Select **Web application**
4. Add authorized redirect URIs:
   ```
   https://your-app.replit.app/auth/google/callback
   http://localhost:5000/auth/google/callback (for development)
   ```
5. Copy the **Client ID** and **Client Secret**

### Required OAuth Scopes

The integration requires these scopes:
- `https://www.googleapis.com/auth/calendar` - Create and manage calendar events
- `https://www.googleapis.com/auth/calendar.events` - Calendar events access
- `https://www.googleapis.com/auth/userinfo.email` - User email address
- `https://www.googleapis.com/auth/userinfo.profile` - Basic profile information

## Step 3: Run Database Migration

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the migration file: `migrations/google-integration.sql`
4. Copy the entire contents and paste into the SQL Editor
5. Click **Run** to execute the migration

### What the Migration Does

The migration creates three new tables:

- **`connected_accounts`** - Stores OAuth connections (without raw tokens)
- **`calendar_events`** - Tracks Google Calendar/Meet events
- **`message_threads`** - Groups related messages into conversations

It also adds new columns to the `messages` table:
- `thread_id` - Links messages to conversation threads
- `channel_type` - Identifies message channel (email, internal, client_portal)
- `external_message_id` - Stores external system message IDs

### RLS Policies

The migration includes Row-Level Security policies to ensure:
- Users can only see their own connected accounts
- Users can only see calendar events in their organization
- Users can only see message threads in their organization

## Step 4: Set Environment Variables

Add these variables to your Replit Secrets or `.env` file:

```bash
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=https://your-app.replit.app/auth/google/callback

# App JWT Secret (for signing OAuth state parameters)
APP_JWT_SECRET=your_random_secure_string_here

# Enable Google Integration Feature Flag
VITE_ENABLE_GOOGLE_INTEGRATION=true
```

### Generate a Secure APP_JWT_SECRET

Use this command to generate a random secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Step 5: Enable Feature Flag

The Google integration uses a feature flag to ensure backward compatibility.

### Frontend Feature Flag

In your `.env` file, set:
```bash
VITE_ENABLE_GOOGLE_INTEGRATION=true
```

This changes the Messages page tabs from:
- **Before**: All / Unread / Team / Clients / Candidates
- **After**: Internal / Email / Client Portal

### Testing with Feature Flag OFF

To verify existing functionality still works:
1. Set `VITE_ENABLE_GOOGLE_INTEGRATION=false` (or remove the variable)
2. Restart the application
3. Verify Messages page shows original tabs
4. Test existing message functionality

### Testing with Feature Flag ON

To test Google integration:
1. Set `VITE_ENABLE_GOOGLE_INTEGRATION=true`
2. Restart the application
3. Navigate to **Settings > Integrations**
4. Click **Connect Google Account**
5. Complete OAuth authorization
6. Go to **Messages > Email** tab
7. Test creating a Google Meet link

## Step 6: Connect Your Google Account

### For Individual Users

1. Navigate to **Settings > Integrations**
2. Find the **Google Workspace** card
3. Click **Connect Google Account**
4. Sign in with your Google account
5. Grant the requested permissions
6. You'll be redirected back to the Integrations page
7. Verify the connection shows your email address

### For Organization Admins

Each user must connect their own Google account. The OAuth tokens are stored per-user, not per-organization, to ensure proper access control.

## Step 7: Use Google Integration

### Create a Google Meet Link

1. Go to **Messages > Email** tab
2. Click **Add Video Call** dropdown
3. Select **Google Meet**
4. A 30-minute meeting starting now will be created
5. The Meet link will be displayed in the response

### Check Calendar Availability

1. Go to **Messages > Email** tab
2. Click **Propose Times**
3. The sidebar will show your availability for the next 7 days
4. Available time slots are shown in green
5. Click a slot to propose that time

### Send an Email (Coming Soon)

1. Go to **Messages > Email** tab
2. Click **Compose Email**
3. Fill in the recipient, subject, and message
4. Click **Send Email**

## Troubleshooting

### "Google Calendar not connected" Error

**Problem**: When trying to create a Google Meet, you get this error.

**Solution**:
1. Go to **Settings > Integrations**
2. Verify your Google account is connected
3. If not, click **Connect Google Account**
4. If already connected, try **Disconnect** and **Connect** again

### OAuth Redirect URI Mismatch

**Problem**: After OAuth redirect, you see "redirect_uri_mismatch" error.

**Solution**:
1. In Google Cloud Console, go to **Credentials**
2. Edit your OAuth 2.0 Client ID
3. Verify the redirect URI exactly matches: `https://your-app.replit.app/auth/google/callback`
4. Make sure there are no trailing slashes or extra spaces

### Access Token Expired

**Problem**: Calendar operations fail with "token expired" error.

**Solution**:
- The system automatically refreshes tokens
- If refresh fails, disconnect and reconnect your Google account
- Check that `refresh_token` is being stored (requires `access_type: 'offline'` in OAuth flow)

### Database Migration Fails

**Problem**: SQL migration script fails with "relation already exists" errors.

**Solution**:
- The migration uses `IF NOT EXISTS` checks
- Safe to run multiple times
- If specific statements fail, run them individually in the SQL Editor

### RLS Policy Errors

**Problem**: "permission denied" when accessing connected accounts or calendar events.

**Solution**:
1. Verify RLS policies were created during migration
2. Check that `auth.uid()` returns your user ID in Supabase
3. Verify you're a member of the organization in the `user_organizations` table

## Security Best Practices

### Token Storage

⚠️ **IMPORTANT**: The current implementation stores OAuth metadata but NOT raw tokens in the database. 

**For production**, implement these additional security measures:

1. **Encrypt refresh tokens** before storing in database
2. **Use Supabase Vault** or AWS KMS for token encryption
3. **Rotate tokens** regularly using Google's token refresh mechanism
4. **Audit access logs** to track who accessed OAuth tokens

### Example: Encrypted Token Storage

```typescript
// Encrypt before storing
const encryptedRefreshToken = encryptToken(tokens.refresh_token, ENCRYPTION_KEY);

await storage.communications.createConnectedAccount({
  userId,
  orgId,
  provider: 'google',
  encryptedRefreshToken, // Encrypted, not plain text
  // ... other fields
});

// Decrypt before using
const decryptedToken = decryptToken(account.encryptedRefreshToken, ENCRYPTION_KEY);
const accessToken = await refreshAccessToken(decryptedToken);
```

### Scope Management

Only request the minimum necessary scopes:
- ✅ `calendar` - For creating events
- ✅ `calendar.events` - For reading events
- ❌ Don't request `gmail.send` unless email feature is enabled
- ❌ Don't request `drive` unless file access is needed

## Backfilling Existing Data

### Migrate Existing Messages to Threads

If you have existing messages, you may want to group them into threads:

```sql
-- Create threads for existing client messages
INSERT INTO message_threads (org_id, channel_type, subject, participants)
SELECT DISTINCT 
  m.org_id,
  'client_portal' as channel_type,
  m.subject,
  jsonb_build_array(m.sender_id, m.recipient_id) as participants
FROM messages m
WHERE m.type = 'client'
  AND m.thread_id IS NULL
GROUP BY m.org_id, m.subject;

-- Link messages to their threads
UPDATE messages m
SET thread_id = t.id,
    channel_type = 'client_portal'
FROM message_threads t
WHERE m.subject = t.subject
  AND m.type = 'client'
  AND m.thread_id IS NULL;
```

### Set Channel Type for Existing Messages

```sql
-- Set channel_type for internal messages
UPDATE messages 
SET channel_type = 'internal' 
WHERE type = 'internal' AND channel_type IS NULL;

-- Set channel_type for client messages
UPDATE messages 
SET channel_type = 'client_portal' 
WHERE type = 'client' AND channel_type IS NULL;

-- Set channel_type for candidate messages  
UPDATE messages 
SET channel_type = 'client_portal' 
WHERE type = 'candidate' AND channel_type IS NULL;
```

## Rollback Procedure

If you need to disable Google integration:

### 1. Disable Feature Flag

```bash
VITE_ENABLE_GOOGLE_INTEGRATION=false
```

### 2. Remove Environment Variables

```bash
# Comment out or remove Google OAuth variables
# GOOGLE_CLIENT_ID=...
# GOOGLE_CLIENT_SECRET=...
# GOOGLE_REDIRECT_URI=...
```

### 3. (Optional) Remove Database Tables

⚠️ **Warning**: This deletes all Google integration data

```sql
-- Drop new tables (cascades to calendar_events and message_threads)
DROP TABLE IF EXISTS calendar_events CASCADE;
DROP TABLE IF EXISTS message_threads CASCADE;
DROP TABLE IF EXISTS connected_accounts CASCADE;

-- Remove new columns from messages table
ALTER TABLE messages DROP COLUMN IF EXISTS thread_id;
ALTER TABLE messages DROP COLUMN IF EXISTS channel_type;
ALTER TABLE messages DROP COLUMN IF EXISTS external_message_id;
```

## Support

For help with Google integration:

1. **Documentation**: Visit [/docs](/docs) for detailed guides
2. **Support Center**: Contact support at [/help](/help)
3. **Community**: Join our Slack channel (coming soon)
4. **GitHub**: Report bugs or feature requests (if open source)

## Changelog

### Version 1.0.0 - Initial Release

- ✅ Google Calendar OAuth integration
- ✅ Google Meet link creation
- ✅ FreeBusy availability checking
- ✅ Message threading system
- ✅ Thread-based timeline view
- ✅ Feature flag for backward compatibility
- 🔜 Gmail email sending (coming soon)
- 🔜 Email thread management (coming soon)
- 🔜 Calendar invite sending (coming soon)
