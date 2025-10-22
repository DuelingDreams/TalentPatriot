import { Router, Request, Response } from 'express';
import { getAuthUrl, exchangeCodeForTokens, generateState, verifyState } from '../integrations/google/oauth';
import type { IStorage } from '../storage';

export function createGoogleAuthRoutes(storage: IStorage) {
  const router = Router();

  /**
   * GET /auth/google/login
   * Redirects user to Google OAuth consent screen
   */
  router.get('/login', (req: Request, res: Response) => {
    try {
      // TODO: Get userId and orgId from authenticated session
      // For now, accept as query params (DEV ONLY - replace with proper auth)
      const userId = req.query.user_id as string;
      const orgId = req.query.org_id as string;

      if (!userId || !orgId) {
        return res.status(400).json({ 
          error: 'Missing user_id or org_id. These will come from authenticated session in production.' 
        });
      }

      // Generate secure state parameter
      const state = generateState(userId, orgId);

      // Get Google OAuth URL
      const authUrl = getAuthUrl(state);

      // Redirect to Google
      res.redirect(authUrl);
    } catch (error: any) {
      console.error('Error initiating Google OAuth:', error);
      res.status(500).json({ error: 'Failed to initiate Google authentication' });
    }
  });

  /**
   * GET /auth/google/callback
   * OAuth callback endpoint - exchanges code for tokens and stores them
   */
  router.get('/callback', async (req: Request, res: Response) => {
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

      // Exchange authorization code for tokens
      const tokens = await exchangeCodeForTokens(code as string);

      // Calculate token expiry
      const expiresAt = tokens.expiry_date 
        ? new Date(tokens.expiry_date)
        : new Date(Date.now() + 3600 * 1000); // Default 1 hour

      // Store connected account (without raw tokens - they would be encrypted in production)
      await storage.communications.createConnectedAccount({
        userId,
        orgId,
        provider: 'google',
        providerEmail: tokens.email,
        scopes: [
          'calendar',
          'calendar.events',
          'userinfo.email',
          'userinfo.profile',
        ],
        // In production, store encrypted refresh_token via separate encryption service
        connectorAccountId: `google_${userId}_${Date.now()}`,
        accessTokenExpiresAt: expiresAt,
        isActive: true,
      });

      // TODO: In production, securely store tokens in encrypted storage
      // For now, log warning about token storage
      console.warn('TODO: Implement secure token storage with encryption');

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
  router.delete('/disconnect', async (req: Request, res: Response) => {
    try {
      const { userId, orgId } = req.body;

      if (!userId || !orgId) {
        return res.status(400).json({ error: 'Missing userId or orgId' });
      }

      // Get connected account
      const account = await storage.communications.getConnectedAccount(userId, orgId, 'google');
      
      if (!account) {
        return res.status(404).json({ error: 'No Google account connected' });
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
