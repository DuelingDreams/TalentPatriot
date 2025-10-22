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
 * Generate OAuth2 authorization URL
 */
export function getAuthUrl(state: string): string {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
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
 */
export async function exchangeCodeForTokens(code: string): Promise<{
  access_token: string;
  refresh_token?: string;
  expiry_date?: number;
  email?: string;
}> {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  try {
    const { tokens } = await oauth2Client.getToken(code);
    
    // Get user email from userinfo
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    return {
      access_token: tokens.access_token!,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date,
      email: userInfo.data.email || undefined,
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
  const data = JSON.stringify({ userId, orgId, timestamp: Date.now() });
  const signature = crypto
    .createHmac('sha256', process.env.APP_JWT_SECRET || 'default-secret')
    .update(data)
    .digest('hex');
  
  return Buffer.from(JSON.stringify({ data, signature })).toString('base64url');
}

/**
 * Verify and parse state parameter
 */
export function verifyState(state: string): { userId: string; orgId: string } | null {
  try {
    const decoded = JSON.parse(Buffer.from(state, 'base64url').toString());
    const { data, signature } = decoded;
    
    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.APP_JWT_SECRET || 'default-secret')
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
    
    return { userId: parsed.userId, orgId: parsed.orgId };
  } catch (error) {
    console.error('Error verifying state:', error);
    return null;
  }
}
