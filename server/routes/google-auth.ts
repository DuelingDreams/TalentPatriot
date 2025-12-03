import { Router, Response } from 'express';
import { getAuthUrl, exchangeCodeForTokens, generateState, verifyState, getRedirectUri } from '../integrations/google/oauth';
import { storeOAuthTokens } from '../integrations/google/token-manager';
import { extractAuthUser, requireAuth, requireOrgContext, type AuthenticatedRequest } from '../middleware/auth';
import type { IStorage } from '../storage';
import crypto from 'crypto';

// In-memory session store for OAuth flow (expires after 10 minutes)
// This is more reliable than cookies which can fail in cross-origin scenarios
const oauthSessions = new Map<string, { userId: string; orgId: string; returnTo: string; expiresAt: number }>();

// Clean up expired sessions every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [token, session] of oauthSessions.entries()) {
    if (session.expiresAt < now) {
      oauthSessions.delete(token);
    }
  }
}, 5 * 60 * 1000);

export function createGoogleAuthRoutes(storage: IStorage) {
  const router = Router();

  // Apply authentication middleware to all routes
  router.use(extractAuthUser);

  /**
   * POST /auth/google/init
   * Initialize Google OAuth flow by creating a session token and returning redirect URL
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

      // Generate a random session token
      const sessionToken = crypto.randomBytes(32).toString('hex');
      
      // Store session in memory (expires in 10 minutes)
      oauthSessions.set(sessionToken, {
        userId,
        orgId,
        returnTo,
        expiresAt: Date.now() + 10 * 60 * 1000
      });

      console.log('✅ [OAuth Init] Session token created:', sessionToken.substring(0, 8) + '...');

      // Return the redirect URL with session token
      res.json({ redirectUrl: `/auth/google/login?session=${sessionToken}` });
    } catch (error: any) {
      console.error('Error initializing Google OAuth:', error);
      res.status(500).json({ error: 'Failed to initialize Google authentication' });
    }
  });

  /**
   * GET /auth/google/login
   * Redirects user to Google OAuth consent screen
   * Uses session token from query parameter
   */
  router.get('/login', async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Get session token from query parameter
      const sessionToken = req.query.session as string;
      
      if (!sessionToken) {
        console.warn('OAuth session token missing from query');
        return res.redirect('/settings/integrations?error=session_expired');
      }

      // Look up session from in-memory store
      const session = oauthSessions.get(sessionToken);
      
      if (!session) {
        console.warn('OAuth session not found or expired for token:', sessionToken.substring(0, 8) + '...');
        return res.redirect('/settings/integrations?error=session_expired');
      }

      const { userId, orgId, returnTo, expiresAt } = session;

      // Verify session is not expired
      if (Date.now() > expiresAt) {
        oauthSessions.delete(sessionToken);
        return res.redirect((returnTo || '/settings/integrations') + '?error=session_expired');
      }

      // Delete the session token (single-use)
      oauthSessions.delete(sessionToken);

      console.log('✅ [OAuth Login] Session verified for user:', userId, 'org:', orgId);

      // Get centralized redirect URI (always talentpatriot.com)
      const redirectUri = getRedirectUri(req.headers.host);

      // Generate secure state parameter with return URL
      const state = generateState(userId, orgId, returnTo);

      // Get Google OAuth URL with centralized redirect
      const authUrl = getAuthUrl(state, redirectUri);

      console.log('🔗 [OAuth Login] Redirecting to Google:', authUrl.substring(0, 80) + '...');

      // Redirect to Google
      res.redirect(authUrl);
    } catch (error: any) {
      console.error('Error initiating Google OAuth:', error);
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
