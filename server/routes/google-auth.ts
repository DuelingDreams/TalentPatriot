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

      // Set a SIGNED temporary session cookie (expires in 10 minutes)
      // signed: true uses cookie-parser's signature to prevent forgery
      // This allows the subsequent browser redirect to maintain authentication
      res.cookie('oauth_session', JSON.stringify({
        userId,
        orgId,
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
      const { userId, orgId, timestamp } = session;

      // Verify session is not expired (10 minutes)
      if (Date.now() - timestamp > 10 * 60 * 1000) {
        // Clear expired cookie
        res.clearCookie('oauth_session', { path: '/auth/google' });
        return res.redirect('/settings/integrations?error=session_expired');
      }

      // Compute dynamic redirect URI based on current host
      const redirectUri = getRedirectUri(req.headers.host);

      // Generate secure state parameter
      const state = generateState(userId, orgId);

      // Get Google OAuth URL with dynamic redirect
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
    try {
      const { code, state, error } = req.query;

      // Handle OAuth errors
      if (error) {
        console.error('OAuth error:', error);
        return res.redirect(`/settings/integrations?error=oauth_${error}`);
      }

      if (!code || !state) {
        return res.redirect('/settings/integrations?error=missing_params');
      }

      // Verify and parse state
      const stateData = verifyState(state as string);
      if (!stateData) {
        return res.redirect('/settings/integrations?error=invalid_state');
      }

      const { userId, orgId } = stateData;

      // Compute dynamic redirect URI (must match what was used in /login)
      const redirectUri = getRedirectUri(req.headers.host);

      // Exchange authorization code for tokens using same redirect URI
      const tokens = await exchangeCodeForTokens(code as string, redirectUri);

      // Store tokens securely with encryption
      await storeOAuthTokens(storage, userId, orgId, tokens);

      // Clear any remaining oauth_session cookie
      res.clearCookie('oauth_session', { path: '/auth/google' });

      // Redirect back to integrations page with success
      res.redirect('/settings/integrations?google=connected');
    } catch (error: any) {
      console.error('Error in Google OAuth callback:', error);
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

      // User already verified via requireOrgContext middleware
      // Get connected account (must belong to this user in this org)
      const account = await storage.communications.getConnectedAccount(userId, orgId, 'google');
      
      if (!account) {
        return res.status(404).json({ error: 'No Google account connected' });
      }

      // Verify ownership - account must belong to the authenticated user
      if (account.userId !== userId) {
        return res.status(403).json({ 
          error: 'Cannot disconnect another user\'s Google account',
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }

      // Delete connected account
      await storage.communications.deleteConnectedAccount(account.id);

      res.json({ success: true, message: 'Google account disconnected' });
    } catch (error: any) {
      console.error('Error disconnecting Google account:', error);
      res.status(500).json({ error: 'Failed to disconnect Google account' });
    }
  });

  return router;
}
