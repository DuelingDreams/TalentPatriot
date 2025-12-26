import { google } from 'googleapis';
import crypto from 'crypto';

/**
 * Google OAuth 2.0 Helper Functions
 * Handles authentication flow and token management
 */

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];

/**
 * Allowed domains for OAuth redirects
 * Each domain must be registered in Google Cloud Console as an authorized redirect URI
 */
const ALLOWED_OAUTH_DOMAINS = [
  'talentpatriot.com',
  'talentpatriot.replit.app',
];

/**
 * Get the OAuth redirect URI based on the request host
 * Dynamically determines the correct callback URL based on which domain the user is accessing
 * 
 * Priority:
 * 1. GOOGLE_REDIRECT_URI environment variable (if set)
 * 2. Dynamic detection based on request host (if in allowed list)
 * 3. Fallback to talentpatriot.com
 * 
 * IMPORTANT: All domains must be registered in Google Cloud Console:
 * - https://talentpatriot.com/auth/google/callback
 * - https://talentpatriot.replit.app/auth/google/callback
 * 
 * @param host - The host header from the request
 * @returns OAuth redirect URI matching the user's access domain
 */
export function getRedirectUri(host: string | undefined): string {
  // Priority 1: Use environment variable if set (for explicit override)
  const envRedirectUri = process.env.GOOGLE_REDIRECT_URI;
  if (envRedirectUri) {
    console.log('📍 [OAuth] Using GOOGLE_REDIRECT_URI from environment:', envRedirectUri);
    return envRedirectUri;
  }

  // Priority 2: Dynamic detection based on request host
  if (host) {
    // Remove port if present
    const hostWithoutPort = host.split(':')[0];
    
    // Check if the host is in our allowed domains list
    const matchedDomain = ALLOWED_OAUTH_DOMAINS.find(domain => 
      hostWithoutPort === domain || hostWithoutPort.endsWith(`.${domain}`)
    );
    
    if (matchedDomain) {
      const redirectUri = `https://${hostWithoutPort}/auth/google/callback`;
      console.log('📍 [OAuth] Using dynamic redirect URI based on host:', redirectUri);
      return redirectUri;
    }
    
    console.log('⚠️ [OAuth] Host not in allowed list:', hostWithoutPort, '- falling back to default');
  }

  // Priority 3: Fallback to primary domain
  const fallbackUri = `https://${ALLOWED_OAUTH_DOMAINS[0]}/auth/google/callback`;
  console.log('📍 [OAuth] Using fallback redirect URI:', fallbackUri);
  return fallbackUri;
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
