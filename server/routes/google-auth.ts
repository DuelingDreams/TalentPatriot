import { Router, Response } from 'express';
import { getAuthUrl, exchangeCodeForTokens, generateState, verifyState, getRedirectUri } from '../integrations/google/oauth';
import { storeOAuthTokens, updateConnectionHealth, validateConnectionHealth } from '../integrations/google/token-manager';
import { oauthSessionStore, startSessionCleanupJob } from '../integrations/google/oauth-session-store';
import { extractAuthUser, requireAuth, requireOrgContext, type AuthenticatedRequest } from '../middleware/auth';
import type { IStorage } from '../storage';

startSessionCleanupJob();

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
      const userId = req.user!.id;
      const orgId = req.user!.orgId!;
      const returnTo = req.body?.returnTo || '/settings/integrations';
      const clientIp = req.ip || req.headers['x-forwarded-for']?.toString().split(',')[0];
      const userAgent = req.headers['user-agent'];
      const redirectHost = req.headers.host;

      console.log('🔐 [OAuth Init] Starting Google OAuth for user:', userId.substring(0, 8) + '...', 'org:', orgId.substring(0, 8) + '...');

      const { sessionToken, stateNonce } = await oauthSessionStore.createSession({
        userId,
        orgId,
        returnTo,
        clientIp,
        userAgent,
        redirectHost,
      });

      console.log('✅ [OAuth Init] Database session created:', sessionToken.substring(0, 8) + '...');

      res.json({ redirectUrl: `/auth/google/login?session=${sessionToken}` });
    } catch (error: any) {
      console.error('❌ [OAuth Init] Error:', error.message);
      res.status(500).json({ error: 'Failed to initialize Google authentication' });
    }
  });

  /**
   * GET /auth/google/login
   * Redirects user to Google OAuth consent screen
   * Uses session token from query parameter (consumed from database)
   */
  router.get('/login', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const sessionToken = req.query.session as string;
      
      if (!sessionToken) {
        console.warn('⚠️ [OAuth Login] Session token missing from query');
        return res.redirect('/settings/integrations?error=session_expired');
      }

      const session = await oauthSessionStore.consumeSession(sessionToken);
      
      if (!session) {
        console.warn('⚠️ [OAuth Login] Session not found, expired, or already consumed:', sessionToken.substring(0, 8) + '...');
        return res.redirect('/settings/integrations?error=session_expired');
      }

      const { userId, orgId, returnTo, stateNonce } = session;

      console.log('✅ [OAuth Login] Database session consumed for user:', userId.substring(0, 8) + '...');

      const redirectUri = getRedirectUri(req.headers.host);
      console.log('🔗 [OAuth Login] Generated redirect URI:', redirectUri);
      
      const state = generateState(userId, orgId, returnTo, stateNonce);
      const authUrl = getAuthUrl(state, redirectUri);

      console.log('🔗 [OAuth Login] Redirecting to Google OAuth consent screen');
      console.log('🔗 [OAuth Login] Auth URL:', authUrl.substring(0, 150) + '...');

      res.redirect(authUrl);
    } catch (error: any) {
      console.error('❌ [OAuth Login] Error:', error.message);
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
      
      // Set health status to healthy on successful OAuth
      await updateConnectionHealth(storage, account.id, 'healthy');
      
      console.log('✅ [OAuth Callback] Connected account stored successfully:', {
        accountId: account.id,
        provider: account.provider,
        email: account.providerEmail,
        orgId: account.orgId,
        userId: account.userId,
        isActive: account.isActive,
        healthStatus: 'healthy'
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
   * POST /auth/google/validate
   * Proactively validate Google connection health
   */
  router.post('/validate', requireAuth, requireOrgContext, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const orgId = req.user!.orgId!;

      console.log('🏥 [Validate] Checking Google connection health for user:', userId.substring(0, 8) + '...');

      const health = await validateConnectionHealth(storage, userId, orgId);
      
      console.log('🏥 [Validate] Health check result:', health);

      res.json({
        healthy: health.healthy,
        status: health.status,
        error: health.error,
        needsReconnect: health.status === 'needs_reconnect',
      });
    } catch (error: any) {
      console.error('❌ [Validate] Error checking connection health:', error.message);
      res.status(500).json({ 
        healthy: false, 
        status: 'error', 
        error: 'Failed to validate connection' 
      });
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
