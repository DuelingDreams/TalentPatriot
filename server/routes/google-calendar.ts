import { Router, Response } from 'express';
import { z } from 'zod';
import { createCalendarEvent, getFreeBusy } from '../integrations/google/calendar-client';
import { sendEmail } from '../integrations/google/gmail-client';
import { getValidAccessToken } from '../integrations/google/token-manager';
import { extractAuthUser, requireAuth, requireOrgContext, type AuthenticatedRequest } from '../middleware/auth';
import type { IStorage } from '../storage';

const createMeetSchema = z.object({
  summary: z.string().min(1, 'Summary is required'),
  description: z.string().optional(),
  start: z.string().datetime({ message: 'Invalid start datetime' }),
  end: z.string().datetime({ message: 'Invalid end datetime' }),
  attendees: z.array(z.string().email()).optional(),
  timezone: z.string().default('UTC'),
});

const freeBusySchema = z.object({
  start: z.string().datetime(),
  end: z.string().datetime(),
  timezone: z.string().optional(),
});

const sendEmailSchema = z.object({
  to: z.string().email('Invalid recipient email'),
  subject: z.string().min(1, 'Subject is required'),
  body: z.string().min(1, 'Email body is required'),
});

export function createGoogleCalendarRoutes(storage: IStorage) {
  const router = Router();

  // Apply authentication middleware to all routes
  router.use(extractAuthUser);

  /**
   * POST /api/google/meet
   * Create a Google Calendar event with Google Meet link
   */
  router.post('/meet', requireAuth, requireOrgContext, async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Get userId and orgId from authenticated session
      const userId = req.user!.id;
      const orgId = req.user!.orgId!;

      // Validate request body
      const validatedData = createMeetSchema.parse(req.body);

      // Get valid access token (automatically refreshes if expired)
      const { accessToken } = await getValidAccessToken(storage, userId, orgId);

      // Create calendar event with Google Meet
      const event = await createCalendarEvent(accessToken, {
        ...validatedData,
        conferenceData: true, // Enable Google Meet
      });

      // Extract Meet link from conference data
      const meetUrl = event.conferenceData?.entryPoints?.find(
        (ep: any) => ep.entryPointType === 'video'
      )?.uri;

      // Store calendar event in database
      const calendarEvent = await storage.communications.createCalendarEvent({
        orgId: orgId as string,
        provider: 'google',
        providerEventId: event.id,
        threadId: null, // Can be linked to message thread if needed
        summary: validatedData.summary,
        description: validatedData.description || null,
        startAt: new Date(validatedData.start),
        endAt: new Date(validatedData.end),
        timezone: validatedData.timezone,
        conferenceUrl: meetUrl || null,
        attendees: validatedData.attendees 
          ? validatedData.attendees.map(email => ({ email, status: 'needsAction' }))
          : [],
        status: 'confirmed',
        createdBy: userId as string,
      });

      res.status(201).json({
        success: true,
        meetUrl,
        eventId: event.id,
        event: calendarEvent,
      });
    } catch (error: any) {
      console.error('Error creating Google Meet:', error);
      
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          error: 'Invalid request data',
          details: error.errors 
        });
      }

      res.status(500).json({ 
        error: 'Failed to create Google Meet event',
        message: error.message 
      });
    }
  });

  /**
   * GET /api/google/freebusy
   * Fetch user's calendar availability for scheduling
   */
  router.get('/freebusy', requireAuth, requireOrgContext, async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Get userId and orgId from authenticated session
      const userId = req.user!.id;
      const orgId = req.user!.orgId!;

      // Validate query params
      const validatedQuery = freeBusySchema.parse(req.query);

      // Get valid access token (automatically refreshes if expired)
      const { accessToken } = await getValidAccessToken(storage, userId, orgId);

      // Fetch free/busy data
      const freeBusyData = await getFreeBusy(accessToken, validatedQuery);

      res.json({
        success: true,
        timeMin: validatedQuery.start,
        timeMax: validatedQuery.end,
        busy: freeBusyData.busy,
      });
    } catch (error: any) {
      console.error('Error fetching free/busy:', error);
      
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          error: 'Invalid request parameters',
          details: error.errors 
        });
      }

      res.status(500).json({ 
        error: 'Failed to fetch availability',
        message: error.message 
      });
    }
  });

  /**
   * GET /api/google/connection-status
   * Check if user has connected their Google account
   * Automatically backfills providerEmail if missing
   */
  router.get('/connection-status', async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Allow this endpoint without auth for frontend to check status
      const userId = req.user?.id;
      const orgId = req.user?.orgId;

      if (!userId || !orgId) {
        return res.json({ connected: false });
      }

      let account = await storage.communications.getConnectedAccount(userId, orgId, 'google');

      // If account exists but providerEmail is null, fetch it from Google and update database
      if (account && account.isActive && !account.providerEmail) {
        console.log('🔄 Backfilling missing providerEmail for user', userId);
        try {
          // Get valid access token
          const { accessToken } = await getValidAccessToken(storage, userId, orgId);
          
          // Fetch email from Google userinfo API
          const oauth2Client = new (await import('googleapis')).google.auth.OAuth2();
          oauth2Client.setCredentials({ access_token: accessToken });
          const oauth2 = (await import('googleapis')).google.oauth2({ version: 'v2', auth: oauth2Client });
          const userInfo = await oauth2.userinfo.get();
          
          if (userInfo.data.email) {
            // Update the database record with the email
            account = await storage.communications.updateConnectedAccount(account.id, {
              providerEmail: userInfo.data.email,
            });
            console.log('✅ Backfilled providerEmail:', userInfo.data.email);
          }
        } catch (backfillError: any) {
          console.error('⚠️  Failed to backfill providerEmail:', backfillError.message);
          // Don't fail the entire request, just log the error
        }
      }

      res.json({
        connected: !!account && account.isActive,
        email: account?.providerEmail || null,
        scopes: account?.scopes || [],
      });
    } catch (error: any) {
      console.error('Error checking connection status:', error);
      res.json({ connected: false, error: error.message });
    }
  });

  /**
   * POST /api/google/send-email
   * Send an email using Gmail API
   */
  router.post('/send-email', requireAuth, requireOrgContext, async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Get userId and orgId from authenticated session
      const userId = req.user!.id;
      const orgId = req.user!.orgId!;

      console.log(`📧 Attempting to send email for user ${userId} from org ${orgId}`);

      // Validate request body
      const validatedData = sendEmailSchema.parse(req.body);
      console.log(`✅ Email request validated: to=${validatedData.to}, subject="${validatedData.subject}"`);

      // Get connected account to retrieve email
      const account = await storage.communications.getConnectedAccount(userId, orgId, 'google');
      if (!account || !account.isActive) {
        console.error(`❌ Google account not found or inactive for user ${userId}`);
        return res.status(403).json({
          error: 'Google account not connected',
          message: 'Please connect your Google account in Settings → Integrations'
        });
      }

      console.log(`✅ Found connected account: email=${account.providerEmail}, scopes=${account.scopes?.join(', ')}`);

      // Check if gmail.send scope is present
      if (!account.scopes?.includes('gmail.send')) {
        console.error(`❌ Missing gmail.send scope for user ${userId}`);
        return res.status(403).json({
          error: 'Missing Gmail permission',
          message: 'Please reconnect your Google account to grant Gmail send permission'
        });
      }

      // Get valid access token (automatically refreshes if expired)
      console.log(`🔑 Getting access token for user ${userId}...`);
      const { accessToken } = await getValidAccessToken(storage, userId, orgId);
      console.log(`✅ Access token retrieved (expires: ${account.accessTokenExpiresAt})`);

      // Send email via Gmail API
      console.log(`📤 Sending email via Gmail API from ${account.providerEmail} to ${validatedData.to}...`);
      const result = await sendEmail(accessToken, {
        to: validatedData.to,
        subject: validatedData.subject,
        body: validatedData.body,
        from: account.providerEmail || undefined, // Use the connected Google account email
      });

      console.log(`✅ Email sent successfully from ${account.providerEmail} to ${validatedData.to} (Message ID: ${result.id})`);

      res.status(200).json({
        success: true,
        messageId: result.id,
        threadId: result.threadId,
        from: account.providerEmail,
        to: validatedData.to,
        subject: validatedData.subject,
      });
    } catch (error: any) {
      console.error('❌ Error sending email via Gmail API:', {
        message: error.message,
        code: error.code,
        errors: error.errors,
        stack: error.stack,
      });
      
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          error: 'Invalid request data',
          details: error.errors 
        });
      }

      // Check if it's a Google API error
      if (error.message?.includes('insufficient authentication scopes')) {
        console.error('❌ Insufficient authentication scopes - user needs to reconnect');
        return res.status(403).json({
          error: 'Missing Gmail permission',
          message: 'Please reconnect your Google account with Gmail send permission',
        });
      }

      // Check for token/auth errors
      if (error.message?.includes('invalid_grant') || error.message?.includes('Token has been expired or revoked')) {
        console.error('❌ Token expired or revoked - user needs to reconnect');
        return res.status(401).json({
          error: 'Authentication expired',
          message: 'Please reconnect your Google account in Settings → Integrations',
        });
      }

      res.status(500).json({ 
        error: 'Failed to send email',
        message: error.message 
      });
    }
  });

  return router;
}
