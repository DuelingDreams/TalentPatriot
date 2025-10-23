import { google } from 'googleapis';
import crypto from 'crypto';

/**
 * Google OAuth 2.0 Helper Functions
 * Handles authentication flow and token management
 */

const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
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
 * Always returns the same URL regardless of which subdomain initiated the flow
 * 
 * @param host - The host header from the request (used for validation only)
 * @returns Centralized redirect URI (https://talentpatriot.com/auth/google/callback)
 * @throws Error if host is not a valid talentpatriot.com domain
 */
export function getRedirectUri(host: string | undefined): string {
  if (!host) {
    throw new Error('Host header is required for OAuth security validation');
  }

  // Remove port if present (e.g., localhost:3000 -> localhost)
  const cleanHost = host.split(':')[0];

  // Security check: validate host is talentpatriot.com or a valid subdomain
  const isRootDomain = cleanHost === PRODUCTION_DOMAIN;
  const isWwwDomain = cleanHost === `www.${PRODUCTION_DOMAIN}`;
  const isValidSubdomain = cleanHost.endsWith(`.${PRODUCTION_DOMAIN}`) && 
    cleanHost.length > PRODUCTION_DOMAIN.length + 1 &&
    /^[a-z0-9\-]+\.talentpatriot\.com$/.test(cleanHost);

  if (!isRootDomain && !isWwwDomain && !isValidSubdomain) {
    throw new Error(
      `Host "${cleanHost}" is not a valid ${PRODUCTION_DOMAIN} domain. ` +
      `OAuth requests must originate from ${PRODUCTION_DOMAIN} or organization subdomains.`
    );
  }

  // Always return the centralized callback URI
  // The original subdomain is preserved in the OAuth state parameter
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
 */
export function generateState(userId: string, orgId: string): string {
  if (!process.env.APP_JWT_SECRET) {
    throw new Error('APP_JWT_SECRET environment variable is required for secure OAuth state signing');
  }
  
  const data = JSON.stringify({ 
    userId, 
    orgId, 
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
export function verifyState(state: string): { userId: string; orgId: string } | null {
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
    
    // Check if state is not too old (5 minutes)
    if (Date.now() - parsed.timestamp > 5 * 60 * 1000) {
      console.error('State parameter expired');
      return null;
    }
    
    return { 
      userId: parsed.userId, 
      orgId: parsed.orgId
    };
  } catch (error) {
    console.error('Error verifying state:', error);
    return null;
  }
}
