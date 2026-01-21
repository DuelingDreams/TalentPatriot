import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey) {
  console.warn('[Email] RESEND_API_KEY not configured - emails will be logged but not sent');
}

export const resend = resendApiKey ? new Resend(resendApiKey) : null;

export const EMAIL_FROM = 'TalentPatriot <contact@talentpatriot.com>';
export const SUPPORT_EMAIL = 'support@talentpatriot.com';

export const RESEND_TEMPLATES = {
  BETA_APPLICATION_CONFIRMATION: 'beta-application-confirmation',
} as const;

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

export interface TemplateEmailParams {
  to: string | string[];
  templateId: string;
  variables: Record<string, string | number>;
  from?: string;
  replyTo?: string;
  subject?: string;
}

export async function sendTemplateEmail(params: TemplateEmailParams): Promise<EmailResult> {
  const { 
    to, 
    templateId, 
    variables, 
    from = EMAIL_FROM, 
    replyTo = SUPPORT_EMAIL,
    subject 
  } = params;

  if (!resend) {
    console.log('[Email] Would send template email:', { to, templateId, variables });
    return { success: true, messageId: 'mock-template-' + Date.now() };
  }

  try {
    const emailPayload: any = {
      from,
      to: Array.isArray(to) ? to : [to],
      replyTo,
      template: {
        id: templateId,
        variables,
      },
    };
    
    if (subject) {
      emailPayload.subject = subject;
    }
    
    const result = await resend.emails.send(emailPayload);

    if (result.error) {
      console.error('[Email] Template send error:', result.error);
      return { success: false, error: result.error.message };
    }

    console.info('[Email] Template email sent:', { to, templateId, messageId: result.data?.id });
    return { success: true, messageId: result.data?.id };
  } catch (error) {
    console.error('[Email] Template send exception:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export async function sendBetaConfirmationEmail(params: {
  to: string;
  firstName: string;
}): Promise<EmailResult> {
  const { to, firstName } = params;
  
  const templateId = process.env.RESEND_BETA_CONFIRMATION_TEMPLATE_ID;
  
  if (!templateId) {
    console.warn('[Email] RESEND_BETA_CONFIRMATION_TEMPLATE_ID not set, using fallback HTML');
    const { betaConfirmationTemplate } = await import('./templates');
    return sendEmail({
      to,
      subject: 'Thanks for Applying to TalentPatriot Beta!',
      html: betaConfirmationTemplate({ contactName: firstName, companyName: '' }),
    });
  }

  return sendTemplateEmail({
    to,
    templateId,
    variables: {
      first_name: firstName,
    },
  });
}
