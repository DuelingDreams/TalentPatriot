# OAuth Authentication Troubleshooting Guide

## Issue: "localhost refused to connect" after Google/Microsoft OAuth

### Root Cause
When you click "Continue with Google" or "Continue with Microsoft", Supabase OAuth redirects to:
```
localhost:3000/#access_token=...&type=bearer&expires_in=3600
```

This hash-based redirect format causes issues because:
1. The redirect URL configuration in Supabase might not be set correctly
2. The app expects path-based routing (`/auth/callback`) but gets hash-based routing

### Solution Steps

#### 1. Configure Supabase Redirect URLs

In your Supabase Dashboard:

1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL**: 
   - For local development: `http://localhost:3000`
   - For production: `https://talentpatriot.com`
   - For Replit: `https://talentpatriot.com.YOUR-USERNAME.repl.co`

3. Add to **Redirect URLs** (add ALL of these):
   ```
   http://localhost:3000
   http://localhost:3000/auth/callback
   https://talentpatriot.com
   https://talentpatriot.com/auth/callback
   https://talentpatriot.com.YOUR-USERNAME.repl.co
   https://talentpatriot.com.YOUR-USERNAME.repl.co/auth/callback
   ```

#### 2. Clear Browser Cache and Cookies

1. Open Developer Tools (F12)
2. Go to Application/Storage tab
3. Clear all localStorage, sessionStorage, and cookies for your domain
4. Try OAuth login again

#### 3. Check OAuth Provider Configuration

**For Google:**
- In Google Cloud Console, ensure redirect URI includes your Supabase callback:
  `https://YOUR-PROJECT-ID.supabase.co/auth/v1/callback`

**For Microsoft:**
- In Azure Portal, ensure redirect URI includes your Supabase callback:
  `https://YOUR-PROJECT-ID.supabase.co/auth/v1/callback`

#### 4. Test OAuth Flow

1. Open an incognito/private browser window
2. Navigate to your app's login page
3. Click "Continue with Google/Microsoft"
4. After authentication, you should be redirected to your app

### Current Implementation

The app has been updated to handle both redirect types:

1. **Hash-based redirects**: App.tsx detects `#access_token` in URL and processes it
2. **Path-based redirects**: AuthCallback page handles `/auth/callback` route
3. **Automatic routing**: Based on user's onboarding status:
   - New users → Onboarding Step 2
   - Users without organization → Organization Setup
   - Existing users with organization → Dashboard

### If Still Not Working

1. Check browser console for errors
2. Verify Supabase environment variables are set correctly:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Ensure OAuth providers are enabled in Supabase Dashboard
4. Verify OAuth credentials (Client ID/Secret) are correctly configured

### Support

If issues persist:
1. Check Supabase logs in Dashboard → Logs → Auth
2. Review browser network tab for failed requests
3. Contact Supabase support with specific error messages