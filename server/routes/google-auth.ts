import { Router, Response } from 'express';
import { getAuthUrl, exchangeCodeForTokens, generateState, verifyState, getRedirectUri } from '../integrations/google/oauth';
import { storeOAuthTokens } from '../integrations/google/token-manager';
import { extractAuthUser, requireAuth, requireOrgContext, type AuthenticatedRequest } from '../middleware/auth';
import type { IStorage } from '../storage';

export function createGoogleAuthRoutes(storage: IStorage) {
  const router = Router();

  // Apply authentication middleware to all routes
  router.use(extractAuthUser);

  /**
   * POST /auth/google/init
   * Initialize Google OAuth flow by setting session cookie and returning redirect URL
   * This endpoint is called by the frontend with Bearer token
   */
  router.post('/init', requireAuth, requireOrgContext, async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Get userId and orgId from authenticated session (Bearer token from frontend)
      const userId = req.user!.id;
      const orgId = req.user!.orgId!;
      
      // Get optional returnTo URL from request body (defaults to /settings/integrations)
      const returnTo = req.body?.returnTo || '/settings/integrations';

      console.log('🔐 [OAuth Init] Starting Google OAuth for user:', userId, 'org:', orgId, 'returnTo:', returnTo);

      // Set a SIGNED temporary session cookie (expires in 10 minutes)
      // signed: true uses cookie-parser's signature to prevent forgery
      // This allows the subsequent browser redirect to maintain authentication
      res.cookie('oauth_session', JSON.stringify({
        userId,
        orgId,
        returnTo,
        timestamp: Date.now()
      }), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 10 * 60 * 1000, // 10 minutes
        path: '/auth/google',
        signed: true // Critical: sign cookie with APP_JWT_SECRET to prevent forgery
      });

      // Return the redirect URL instead of doing the redirect
      res.json({ redirectUrl: '/auth/google/login' });
    } catch (error: any) {
      console.error('Error initializing Google OAuth:', error);
      res.status(500).json({ error: 'Failed to initialize Google authentication' });
    }
  });

  /**
   * GET /auth/google/login
   * Redirects user to Google OAuth consent screen
   * Uses session cookie set by /init endpoint
   */
  router.get('/login', async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Check for SIGNED oauth_session cookie set by /init
      // req.signedCookies verifies the signature automatically
      const sessionCookie = req.signedCookies?.oauth_session;
      
      if (!sessionCookie) {
        console.warn('OAuth session cookie missing or signature invalid');
        return res.redirect('/settings/integrations?error=session_expired');
      }

      const session = JSON.parse(sessionCookie);
      const { userId, orgId, returnTo, timestamp } = session;

      // Verify session is not expired (10 minutes)
      if (Date.now() - timestamp > 10 * 60 * 1000) {
        // Clear expired cookie
        res.clearCookie('oauth_session', { path: '/auth/google' });
        return res.redirect((returnTo || '/settings/integrations') + '?error=session_expired');
      }

      // Get centralized redirect URI (always talentpatriot.com)
      const redirectUri = getRedirectUri(req.headers.host);

      // Generate secure state parameter with return URL
      const state = generateState(userId, orgId, returnTo);

      // Get Google OAuth URL with centralized redirect
      const authUrl = getAuthUrl(state, redirectUri);

      // Clear the session cookie now that we have the state (single-use)
      res.clearCookie('oauth_session', { path: '/auth/google' });

      // Redirect to Google
      res.redirect(authUrl);
    } catch (error: any) {
      console.error('Error initiating Google OAuth:', error);
      res.clearCookie('oauth_session', { path: '/auth/google' });
      res.redirect('/settings/integrations?error=oauth_init_failed');
    }
  });

  /**
   * GET /auth/google/callback
   * OAuth callback endpoint - exchanges code for tokens and stores them securely
   */
  router.get('/callback', async (req: AuthenticatedRequest, res: Response) => {
    console.log('🔔 Google OAuth callback triggered');
    
    try {
      const { code, state, error } = req.query;

      // Handle OAuth errors from Google
      if (error) {
        console.error('❌ Google OAuth error:', error);
        console.error('   Error description:', req.query.error_description);
        return res.redirect(`/settings/integrations?error=oauth_${error}`);
      }

      if (!code || !state) {
        console.error('❌ Missing OAuth parameters - code:', !!code, 'state:', !!state);
        return res.redirect('/settings/integrations?error=missing_params');
      }

      console.log('✅ OAuth parameters received (code and state present)');

      // Verify and parse state
      const stateData = verifyState(state as string);
      if (!stateData) {
        console.error('❌ State verification failed - invalid or expired state parameter');
        return res.redirect('/settings/integrations?error=invalid_state');
      }

      const { userId, orgId, returnTo } = stateData;
      console.log(`✅ [OAuth Callback] State verified - userId: ${userId}, orgId: ${orgId}, returnTo: ${returnTo}`);

      // Check if this user already has a Google connection in a DIFFERENT org
      const existingConnections = await storage.communications.getConnectedAccounts(userId, orgId);
      const googleConnection = existingConnections.find(acc => acc.provider === 'google');
      if (googleConnection) {
        console.log(`ℹ️  [OAuth Callback] User already has Google connection for this org:`, {
          id: googleConnection.id,
          email: googleConnection.providerEmail,
          orgId: googleConnection.orgId
        });
      }

      // Get centralized redirect URI (must match what was used in /login)
      const redirectUri = getRedirectUri(req.headers.host);
      console.log(`🔗 [OAuth Callback] Using redirect URI: ${redirectUri}`);

      // Exchange authorization code for tokens using same redirect URI
      console.log('🔄 [OAuth Callback] Exchanging authorization code for tokens...');
      const tokens = await exchangeCodeForTokens(code as string, redirectUri);
      console.log('✅ Tokens received from Google:', {
        hasAccessToken: !!tokens.access_token,
        hasRefreshToken: !!tokens.refresh_token,
        email: tokens.email,
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : 'unknown'
      });

      // Store tokens securely with encryption
      console.log('💾 [OAuth Callback] Storing tokens in database for org:', orgId);
      const account = await storeOAuthTokens(storage, userId, orgId, tokens);
      console.log('✅ [OAuth Callback] Connected account stored successfully:', {
        accountId: account.id,
        provider: account.provider,
        email: account.providerEmail,
        orgId: account.orgId,
        userId: account.userId,
        isActive: account.isActive
      });

      // Clear any remaining oauth_session cookie
      res.clearCookie('oauth_session', { path: '/auth/google' });

      // Redirect back to the original page (returnTo from state)
      console.log('🎉 Google OAuth connection completed successfully!');
      res.redirect(`${returnTo}?google=connected`);
    } catch (error: any) {
      console.error('❌ Error in Google OAuth callback:');
      console.error('   Message:', error.message);
      console.error('   Stack:', error.stack);
      console.error('   Full error:', error);
      res.redirect('/settings/integrations?error=callback_failed');
    }
  });

  /**
   * DELETE /auth/google/disconnect
   * Disconnect Google account
   */
  router.delete('/disconnect', requireAuth, requireOrgContext, async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Get userId and orgId from authenticated session ONLY (no fallbacks)
      const userId = req.user!.id;
      const orgId = req.user!.orgId!;

      console.log('🔌 [Disconnect] Attempting to disconnect Google for user:', userId, 'org:', orgId);

      // User already verified via requireOrgContext middleware
      // Get connected account (must belong to this user in this org)
      const account = await storage.communications.getConnectedAccount(userId, orgId, 'google');
      
      console.log('🔍 [Disconnect] Query result:', account ? {
        id: account.id,
        userId: account.userId,
        orgId: account.orgId,
        email: account.providerEmail,
        isActive: account.isActive
      } : 'No account found');

      if (!account) {
        // Check if user has Google connected to a DIFFERENT org
        const allUserConnections = await storage.communications.getConnectedAccounts(userId, orgId);
        console.log('🔍 [Disconnect] Checking other orgs for this user...');
        
        return res.status(404).json({ 
          error: 'No Google account connected to this organization',
          details: 'Your Google account may be connected to a different organization'
        });
      }

      // Verify ownership - account must belong to the authenticated user
      if (account.userId !== userId) {
        return res.status(403).json({ 
          error: 'Cannot disconnect another user\'s Google account',
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }

      // Delete connected account
      console.log('🗑️  [Disconnect] Deleting account:', account.id);
      await storage.communications.deleteConnectedAccount(account.id);
      console.log('✅ [Disconnect] Successfully disconnected Google account');

      res.json({ success: true, message: 'Google account disconnected' });
    } catch (error: any) {
      console.error('❌ [Disconnect] Error disconnecting Google account:', error);
      res.status(500).json({ error: 'Failed to disconnect Google account' });
    }
  });

  return router;
}
