import { google } from 'googleapis';
import { encryptToken, decryptToken } from '../../utils/encryption';
import type { IStorage } from '../../storage';
import type { ConnectedAccount } from '@shared/schema';

/**
 * Token Manager for Google OAuth
 * Handles secure token storage, retrieval, and refresh
 */

interface TokenRefreshResult {
  accessToken: string;
  expiresAt: Date;
}

/**
 * Get valid access token for a connected Google account
 * Automatically refreshes if expired
 */
export async function getValidAccessToken(
  storage: IStorage,
  userId: string,
  orgId: string
): Promise<TokenRefreshResult> {
  // Get connected account
  const account = await storage.communications.getConnectedAccount(userId, orgId, 'google');
  
  if (!account || !account.isActive) {
    throw new Error('Google account not connected');
  }

  if (!account.encryptedRefreshToken) {
    throw new Error('No refresh token stored for Google account');
  }

  // Check if access token is still valid (5 minute buffer)
  const now = new Date();
  const expiresAt = account.accessTokenExpiresAt ? new Date(account.accessTokenExpiresAt) : null;
  
  if (expiresAt && expiresAt.getTime() > now.getTime() + 5 * 60 * 1000) {
    // Token still valid - but we don't store access tokens, only refresh tokens
    // So we always need to refresh
  }

  // Decrypt refresh token
  const refreshToken = decryptToken(account.encryptedRefreshToken);
  
  // Refresh access token
  const { accessToken, expiresAt: newExpiresAt } = await refreshAccessToken(refreshToken);
  
  // Update token expiry in database
  await storage.communications.updateConnectedAccount(account.id, {
    accessTokenExpiresAt: newExpiresAt,
    lastUsedAt: new Date(),
  });
  
  return { accessToken, expiresAt: newExpiresAt };
}

/**
 * Refresh Google OAuth access token using refresh token
 */
async function refreshAccessToken(refreshToken: string): Promise<TokenRefreshResult> {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  try {
    // Set refresh token
    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    // Request new access token
    const { credentials } = await oauth2Client.refreshAccessToken();
    
    if (!credentials.access_token) {
      throw new Error('No access token returned from refresh');
    }

    const expiresAt = credentials.expiry_date 
      ? new Date(credentials.expiry_date)
      : new Date(Date.now() + 3600 * 1000); // Default 1 hour

    return {
      accessToken: credentials.access_token,
      expiresAt,
    };
  } catch (error: any) {
    console.error('Error refreshing access token:', error.message);
    throw new Error(`Failed to refresh Google access token: ${error.message}`);
  }
}

/**
 * Store OAuth tokens securely after initial authorization
 * Handles cases where Google omits refresh_token on subsequent authorizations
 */
export async function storeOAuthTokens(
  storage: IStorage,
  userId: string,
  orgId: string,
  tokens: {
    access_token: string;
    refresh_token?: string;
    expiry_date?: number;
    email?: string;
  }
): Promise<ConnectedAccount> {
  const expiresAt = tokens.expiry_date 
    ? new Date(tokens.expiry_date)
    : new Date(Date.now() + 3600 * 1000);

  // Check if account already exists
  const existingAccount = await storage.communications.getConnectedAccount(userId, orgId, 'google');
  
  // Determine which refresh token to use
  let encryptedRefreshToken: string;
  
  if (tokens.refresh_token) {
    // New refresh token provided - encrypt and use it
    encryptedRefreshToken = encryptToken(tokens.refresh_token);
    console.log('✅ Google OAuth: Received new refresh_token, encrypting and storing');
  } else if (existingAccount?.encryptedRefreshToken) {
    // Reuse existing refresh token (Google omits it on subsequent authorizations)
    encryptedRefreshToken = existingAccount.encryptedRefreshToken;
    console.log('♻️ Google OAuth: No new refresh_token provided, reusing existing encrypted token');
  } else {
    // No refresh token available at all
    throw new Error(
      'No refresh token available. Google did not provide a new token and no existing token found. ' +
      'Try revoking access in Google account settings and reconnecting.'
    );
  }
  
  if (existingAccount) {
    // Update existing account
    console.log(`🔄 Google OAuth: Updating existing connected account for user ${userId}`);
    return await storage.communications.updateConnectedAccount(existingAccount.id, {
      providerEmail: tokens.email || existingAccount.providerEmail,
      encryptedRefreshToken,
      accessTokenExpiresAt: expiresAt,
      isActive: true,
      lastUsedAt: new Date(),
    });
  } else {
    // Create new account
    console.log(`➕ Google OAuth: Creating new connected account for user ${userId}`);
    return await storage.communications.createConnectedAccount({
      userId,
      orgId,
      provider: 'google',
      providerEmail: tokens.email || null,
      scopes: [
        'calendar',
        'calendar.events',
        'userinfo.email',
        'userinfo.profile',
      ],
      encryptedRefreshToken,
      connectorAccountId: `google_${userId}_${Date.now()}`,
      accessTokenExpiresAt: expiresAt,
      isActive: true,
    });
  }
}

/**
 * Revoke Google OAuth access (disconnect account)
 */
export async function revokeGoogleAccess(
  storage: IStorage,
  userId: string,
  orgId: string
): Promise<void> {
  const account = await storage.communications.getConnectedAccount(userId, orgId, 'google');
  
  if (!account) {
    throw new Error('No Google account connected');
  }

  try {
    // Optionally: Call Google's revoke endpoint
    // This would require decrypting the refresh token and calling:
    // oauth2Client.revokeToken(refreshToken)
    
    // For now, just mark as inactive and delete from database
    await storage.communications.deleteConnectedAccount(account.id);
  } catch (error: any) {
    console.error('Error revoking Google access:', error.message);
    throw new Error('Failed to revoke Google access');
  }
}
