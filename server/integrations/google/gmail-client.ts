import { google } from 'googleapis';

/**
 * Gmail API client for sending emails
 * Uses OAuth access token obtained through the OAuth flow
 */

export interface SendEmailOptions {
  to: string;
  subject: string;
  body: string;
  from?: string; // Optional - will use authenticated user's email if not provided
}

/**
 * Create a properly formatted email message in RFC 2822 format
 * Gmail API requires base64url-encoded MIME messages
 */
function createMimeMessage(options: SendEmailOptions): string {
  const { to, subject, body, from } = options;
  
  // Build email in MIME format (RFC 2822)
  const messageParts = [
    `From: ${from || 'me'}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=utf-8',
    '',
    body
  ];
  
  const message = messageParts.join('\n');
  
  // Encode to base64url (Gmail API requirement)
  const encodedMessage = Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  
  return encodedMessage;
}

/**
 * Send an email using Gmail API
 * @param accessToken - Valid OAuth 2.0 access token
 * @param options - Email details (to, subject, body)
 * @returns Gmail API response with message ID
 */
export async function sendEmail(
  accessToken: string,
  options: SendEmailOptions
): Promise<{ id: string; threadId: string }> {
  // Create OAuth2 client
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });

  // Initialize Gmail API client
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  // Create MIME message
  const raw = createMimeMessage(options);

  try {
    // Send email using Gmail API
    const response = await gmail.users.messages.send({
      userId: 'me', // 'me' refers to the authenticated user
      requestBody: {
        raw,
      },
    });

    console.log('✅ Email sent successfully via Gmail API:', response.data.id);

    return {
      id: response.data.id!,
      threadId: response.data.threadId!,
    };
  } catch (error: any) {
    console.error('❌ Gmail API send error:', error.message);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

/**
 * Send an email with HTML content
 */
export async function sendHtmlEmail(
  accessToken: string,
  options: SendEmailOptions & { htmlBody: string }
): Promise<{ id: string; threadId: string }> {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });

  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  // Build multipart MIME message for HTML
  const boundary = '----=_Part_0_' + Date.now() + '.' + Math.random();
  const { to, subject, body, htmlBody, from } = options;
  
  const messageParts = [
    `From: ${from || 'me'}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=utf-8',
    '',
    body,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset=utf-8',
    '',
    htmlBody,
    '',
    `--${boundary}--`
  ];

  const message = messageParts.join('\n');
  const raw = Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  try {
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw },
    });

    console.log('✅ HTML email sent successfully:', response.data.id);

    return {
      id: response.data.id!,
      threadId: response.data.threadId!,
    };
  } catch (error: any) {
    console.error('❌ Gmail API send error:', error.message);
    throw new Error(`Failed to send HTML email: ${error.message}`);
  }
}
