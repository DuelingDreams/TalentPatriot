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
   * GET /auth/google/login
   * Redirects user to Google OAuth consent screen
   */
  router.get('/login', requireAuth, requireOrgContext, async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Get userId and orgId from authenticated session ONLY (no fallbacks)
      const userId = req.user!.id;
      const orgId = req.user!.orgId!;

      // Compute dynamic redirect URI based on current host
      const redirectUri = getRedirectUri(req.headers.host);

      // User already verified via requireOrgContext middleware
      // Generate secure state parameter
      const state = generateState(userId, orgId);

      // Get Google OAuth URL with dynamic redirect
      const authUrl = getAuthUrl(state, redirectUri);

      // Redirect to Google
      res.redirect(authUrl);
    } catch (error: any) {
      console.error('Error initiating Google OAuth:', error);
      res.status(500).json({ error: 'Failed to initiate Google authentication' });
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
