# OAuth Authentication Setup Guide

This guide explains how to configure Google and Microsoft OAuth authentication for TalentPatriot ATS.

## Frontend Implementation Status ✅

The OAuth functionality is now fully implemented in the application:

- **Login Page**: Users can sign in with Google or Microsoft
- **Signup Page**: Users can create accounts with Google or Microsoft  
- **Auth Context**: Complete OAuth flow handling with proper redirects
- **Error Handling**: Comprehensive error management for OAuth failures

## Supabase Dashboard Configuration Required

To enable OAuth authentication, you need to configure the providers in your Supabase dashboard:

### 1. Access Supabase Auth Settings

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your TalentPatriot project
3. Navigate to **Authentication** → **Providers** in the left sidebar

### 2. Configure Google OAuth

1. **Enable Google Provider**:
   - Toggle ON the Google provider
   - You'll need a Google OAuth2 client

2. **Create Google OAuth Credentials**:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project or select existing
   - Enable Google+ API
   - Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client IDs**
   - Application type: **Web application**
   - Authorized redirect URIs: `https://[your-supabase-project].supabase.co/auth/v1/callback`

3. **Configure in Supabase**:
   - Client ID: Your Google OAuth Client ID
   - Client Secret: Your Google OAuth Client Secret

### 3. Configure Microsoft OAuth

1. **Enable Azure Provider**:
   - Toggle ON the Azure provider (this handles Microsoft accounts)

2. **Create Microsoft App Registration**:
   - Go to [Azure Portal](https://portal.azure.com)
   - Navigate to **App registrations** → **New registration**
   - Name: TalentPatriot ATS
   - Redirect URI: `https://[your-supabase-project].supabase.co/auth/v1/callback`

3. **Configure in Supabase**:
   - Client ID: Your Azure Application (client) ID
   - Client Secret: Create a new client secret in Azure

### 4. User Flow After Configuration

Once configured, users will experience:

1. **Signup Flow**: 
   - Click "Continue with Google/Microsoft" 
   - Authenticate with provider
   - Redirect to `/onboarding/step2` for company setup

2. **Login Flow**:
   - Click "Continue with Google/Microsoft"
   - Authenticate with provider  
   - Redirect to `/dashboard`

### 5. Redirect URLs to Configure

Make sure these redirect URLs are configured in both Google and Microsoft:

- **Development**: `https://[your-supabase-project].supabase.co/auth/v1/callback`
- **Production**: `https://[your-domain].com/auth/v1/callback` (when you deploy)

## Testing

After configuration:

1. Visit `/signup` or `/login`
2. Click "Continue with Google" or "Continue with Microsoft"
3. Complete OAuth flow
4. Verify user is created in Supabase Auth

## Troubleshooting

**Common Issues**:
- **"Invalid redirect URI"**: Check redirect URLs in provider settings
- **"Provider not enabled"**: Ensure provider is toggled ON in Supabase
- **"Client not found"**: Verify Client ID/Secret are correct

**Debug Steps**:
1. Check Supabase Auth logs
2. Verify provider configuration
3. Test redirect URLs
4. Check browser console for errors

The OAuth implementation is complete and ready to use once you configure the providers in your Supabase dashboard!