import { google } from 'googleapis';
import crypto from 'crypto';

/**
 * Google OAuth 2.0 Helper Functions
 * Handles authentication flow and token management
 */

const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];

/**
 * Production domain for OAuth redirects
 * Uses centralized callback pattern - Google OAuth does NOT support wildcard redirect URIs
 */
const PRODUCTION_DOMAIN = 'talentpatriot.com';

/**
 * Centralized OAuth redirect URI
 * Google Cloud Console Configuration: https://talentpatriot.com/auth/google/callback
 * 
 * NOTE: Google does NOT support wildcard redirect URIs (*.talentpatriot.com)
 * We use a single callback URL and handle subdomain redirects server-side
 */
const OAUTH_REDIRECT_URI = `https://${PRODUCTION_DOMAIN}/auth/google/callback`;

/**
 * Get the centralized OAuth redirect URI
 * Uses GOOGLE_REDIRECT_URI environment variable if set, otherwise falls back to production domain
 * 
 * @param host - The host header from the request (used for validation in production)
 * @returns Centralized redirect URI from env or production default
 */
export function getRedirectUri(host: string | undefined): string {
  // Use the environment variable if set (for both dev and prod)
  const envRedirectUri = process.env.GOOGLE_REDIRECT_URI;
  if (envRedirectUri) {
    console.log('📍 [OAuth] Using GOOGLE_REDIRECT_URI from environment:', envRedirectUri);
    return envRedirectUri;
  }

  // Fallback to production domain
  console.log('📍 [OAuth] No GOOGLE_REDIRECT_URI set, using production default:', OAUTH_REDIRECT_URI);
  return OAUTH_REDIRECT_URI;
}

/**
 * Generate OAuth2 authorization URL
 * @param state - Signed state parameter containing userId and orgId
 * @param redirectUri - Dynamic redirect URI based on current host
 */
export function getAuthUrl(state: string, redirectUri: string): string {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    state: state,
    prompt: 'consent', // Force consent to get refresh token
  });
}

/**
 * Exchange authorization code for tokens
 * @param code - Authorization code from Google
 * @param redirectUri - Same redirect URI used in getAuthUrl (must match exactly)
 */
export async function exchangeCodeForTokens(code: string, redirectUri: string): Promise<{
  access_token: string;
  refresh_token?: string;
  expiry_date?: number;
  email?: string;
}> {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );

  try {
    const { tokens } = await oauth2Client.getToken(code);
    
    // Get user email from userinfo
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    return {
      access_token: tokens.access_token!,
      refresh_token: tokens.refresh_token ?? undefined,
      expiry_date: tokens.expiry_date ?? undefined,
      email: userInfo.data.email ?? undefined,
    };
  } catch (error: any) {
    console.error('Error exchanging code for tokens:', error.message);
    throw new Error(`Failed to exchange authorization code: ${error.message}`);
  }
}

/**
 * Generate a secure state parameter for OAuth flow
 * @param userId - The authenticated user's ID
 * @param orgId - The organization ID
 * @param returnTo - Optional return URL after OAuth completes (defaults to /settings/integrations)
 * @param nonce - Session nonce for additional CSRF protection
 */
export function generateState(userId: string, orgId: string, returnTo?: string, nonce?: string): string {
  if (!process.env.APP_JWT_SECRET) {
    throw new Error('APP_JWT_SECRET environment variable is required for secure OAuth state signing');
  }
  
  // Validate returnTo is a safe internal URL (starts with /)
  const safeReturnTo = returnTo && returnTo.startsWith('/') ? returnTo : '/settings/integrations';
  
  const data = JSON.stringify({ 
    userId, 
    orgId, 
    returnTo: safeReturnTo,
    nonce: nonce || null,
    timestamp: Date.now() 
  });
  const signature = crypto
    .createHmac('sha256', process.env.APP_JWT_SECRET)
    .update(data)
    .digest('hex');
  
  return Buffer.from(JSON.stringify({ data, signature })).toString('base64url');
}

/**
 * Verify and parse state parameter
 */
export function verifyState(state: string): { userId: string; orgId: string; returnTo: string; nonce: string | null } | null {
  if (!process.env.APP_JWT_SECRET) {
    console.error('APP_JWT_SECRET not configured');
    return null;
  }
  
  try {
    const decoded = JSON.parse(Buffer.from(state, 'base64url').toString());
    const { data, signature } = decoded;
    
    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.APP_JWT_SECRET)
      .update(data)
      .digest('hex');
    
    if (signature !== expectedSignature) {
      console.error('Invalid state signature');
      return null;
    }
    
    const parsed = JSON.parse(data);
    
    // Check if state is not too old (10 minutes to match session TTL)
    if (Date.now() - parsed.timestamp > 10 * 60 * 1000) {
      console.error('State parameter expired');
      return null;
    }
    
    // Extract and validate returnTo - trim whitespace and ensure it starts with /
    const storedReturnTo = typeof parsed.returnTo === 'string' ? parsed.returnTo.trim() : '';
    const safeReturnTo = storedReturnTo.startsWith('/') ? storedReturnTo : '/settings/integrations';
    
    return { 
      userId: parsed.userId, 
      orgId: parsed.orgId,
      returnTo: safeReturnTo,
      nonce: parsed.nonce || null
    };
  } catch (error) {
    console.error('Error verifying state:', error);
    return null;
  }
}
