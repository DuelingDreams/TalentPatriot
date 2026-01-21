import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey) {
  console.warn('[Email] RESEND_API_KEY not configured - emails will be logged but not sent');
}

export const resend = resendApiKey ? new Resend(resendApiKey) : null;

export const EMAIL_FROM = 'TalentPatriot <contact@talentpatriot.com>';
export const SUPPORT_EMAIL = 'support@talentpatriot.com';

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendEmail(params: {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}): Promise<EmailResult> {
  const { to, subject, html, from = EMAIL_FROM, replyTo = SUPPORT_EMAIL } = params;

  if (!resend) {
    console.log('[Email] Would send email:', { to, subject });
    console.log('[Email] HTML:', html.substring(0, 200) + '...');
    return { success: true, messageId: 'mock-' + Date.now() };
  }

  try {
    const result = await resend.emails.send({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      replyTo,
    });

    if (result.error) {
      console.error('[Email] Send error:', result.error);
      return { success: false, error: result.error.message };
    }

    console.info('[Email] Sent successfully:', { to, subject, messageId: result.data?.id });
    return { success: true, messageId: result.data?.id };
  } catch (error) {
    console.error('[Email] Send exception:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
