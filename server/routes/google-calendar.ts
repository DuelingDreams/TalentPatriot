import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { createCalendarEvent, getFreeBusy } from '../integrations/google/calendar-client';
import type { Storage } from '../storage';

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

export function createGoogleCalendarRoutes(storage: Storage) {
  const router = Router();

  /**
   * POST /api/google/meet
   * Create a Google Calendar event with Google Meet link
   */
  router.post('/meet', async (req: Request, res: Response) => {
    try {
      // TODO: Get userId and orgId from authenticated session
      const userId = req.body.userId || req.headers['x-user-id'];
      const orgId = req.body.orgId || req.headers['x-org-id'];

      if (!userId || !orgId) {
        return res.status(401).json({ 
          error: 'Authentication required. userId and orgId must be provided.' 
        });
      }

      // Validate request body
      const validatedData = createMeetSchema.parse(req.body);

      // Get connected Google account
      const account = await storage.communications.getConnectedAccount(
        userId as string,
        orgId as string,
        'google'
      );

      if (!account || !account.isActive) {
        return res.status(403).json({ 
          error: 'Google Calendar not connected. Please connect your Google account first.',
          action: 'connect_google'
        });
      }

      // TODO: Get valid access token (handle refresh if expired)
      // For now, this is a placeholder - in production, retrieve from secure storage
      const accessToken = 'PLACEHOLDER_ACCESS_TOKEN';
      
      console.warn('TODO: Implement secure token retrieval and refresh logic');

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
  router.get('/freebusy', async (req: Request, res: Response) => {
    try {
      // TODO: Get userId and orgId from authenticated session
      const userId = req.query.userId || req.headers['x-user-id'];
      const orgId = req.query.orgId || req.headers['x-org-id'];

      if (!userId || !orgId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Validate query params
      const validatedQuery = freeBusySchema.parse(req.query);

      // Get connected Google account
      const account = await storage.communications.getConnectedAccount(
        userId as string,
        orgId as string,
        'google'
      );

      if (!account || !account.isActive) {
        return res.status(403).json({ 
          error: 'Google Calendar not connected',
          action: 'connect_google'
        });
      }

      // TODO: Get valid access token
      const accessToken = 'PLACEHOLDER_ACCESS_TOKEN';

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
   */
  router.get('/connection-status', async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId || req.headers['x-user-id'];
      const orgId = req.query.orgId || req.headers['x-org-id'];

      if (!userId || !orgId) {
        return res.json({ connected: false });
      }

      const account = await storage.communications.getConnectedAccount(
        userId as string,
        orgId as string,
        'google'
      );

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

  return router;
}
