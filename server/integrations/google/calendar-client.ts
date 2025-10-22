import { google } from 'googleapis';

/**
 * Google Calendar API Client
 * Wrapper for Google Calendar API using OAuth2 credentials
 */

export interface CalendarEventInput {
  summary: string;
  description?: string;
  start: string; // ISO timestamp
  end: string; // ISO timestamp
  attendees?: string[]; // Email addresses
  conferenceData?: boolean; // Whether to create Google Meet link
  timezone?: string;
}

export interface FreeBusyQuery {
  start: string; // ISO timestamp
  end: string; // ISO timestamp
  timeZone?: string;
}

export interface FreeBusyResponse {
  busy: Array<{
    start: string;
    end: string;
  }>;
}

/**
 * Create OAuth2 client with user's access token
 */
export function createCalendarClient(accessToken: string) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    access_token: accessToken,
  });

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

/**
 * Create a calendar event with optional Google Meet link
 */
export async function createCalendarEvent(
  accessToken: string,
  eventData: CalendarEventInput
): Promise<any> {
  const calendar = createCalendarClient(accessToken);

  const event: any = {
    summary: eventData.summary,
    description: eventData.description,
    start: {
      dateTime: eventData.start,
      timeZone: eventData.timezone || 'UTC',
    },
    end: {
      dateTime: eventData.end,
      timeZone: eventData.timezone || 'UTC',
    },
  };

  // Add attendees if provided
  if (eventData.attendees && eventData.attendees.length > 0) {
    event.attendees = eventData.attendees.map(email => ({ email }));
  }

  // Add Google Meet conference if requested
  if (eventData.conferenceData) {
    event.conferenceData = {
      createRequest: {
        requestId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    };
  }

  try {
    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
      conferenceDataVersion: eventData.conferenceData ? 1 : 0,
      sendUpdates: 'all', // Send email invitations to attendees
    });

    return response.data;
  } catch (error: any) {
    console.error('Error creating calendar event:', error.message);
    throw new Error(`Failed to create calendar event: ${error.message}`);
  }
}

/**
 * Query free/busy information for scheduling
 */
export async function getFreeBusy(
  accessToken: string,
  query: FreeBusyQuery
): Promise<FreeBusyResponse> {
  const calendar = createCalendarClient(accessToken);

  try {
    const response = await calendar.freebusy.query({
      requestBody: {
        timeMin: query.start,
        timeMax: query.end,
        timeZone: query.timeZone || 'UTC',
        items: [{ id: 'primary' }],
      },
    });

    const primaryCalendar = response.data.calendars?.primary;
    const busySlots = primaryCalendar?.busy || [];

    return {
      busy: busySlots.map((slot: any) => ({
        start: slot.start!,
        end: slot.end!,
      })),
    };
  } catch (error: any) {
    console.error('Error fetching free/busy:', error.message);
    throw new Error(`Failed to fetch free/busy: ${error.message}`);
  }
}

/**
 * Get user's calendar list
 */
export async function getCalendarList(accessToken: string): Promise<any[]> {
  const calendar = createCalendarClient(accessToken);

  try {
    const response = await calendar.calendarList.list();
    return response.data.items || [];
  } catch (error: any) {
    console.error('Error fetching calendar list:', error.message);
    throw new Error(`Failed to fetch calendar list: ${error.message}`);
  }
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string;
  expires_in: number;
}> {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  try {
    const { credentials } = await oauth2Client.refreshAccessToken();
    
    return {
      access_token: credentials.access_token!,
      expires_in: credentials.expiry_date 
        ? Math.floor((credentials.expiry_date - Date.now()) / 1000)
        : 3600,
    };
  } catch (error: any) {
    console.error('Error refreshing access token:', error.message);
    throw new Error(`Failed to refresh access token: ${error.message}`);
  }
}
