import { Resend } from 'resend';
import type { EmailTemplate } from '@shared/schema';

const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey) {
  console.warn('[Email] RESEND_API_KEY not configured - emails will be logged but not sent');
}

export const resend = resendApiKey ? new Resend(resendApiKey) : null;

export const EMAIL_FROM = 'TalentPatriot <contact@talentpatriot.com>';
export const SUPPORT_EMAIL = 'support@talentpatriot.com';

export const TEMPLATE_TYPES = {
  BETA_APPLICATION_CONFIRMATION: 'beta_application_confirmation',
  APPLICATION_RECEIVED: 'application_received',
  INTERVIEW_INVITATION: 'interview_invitation',
  STATUS_UPDATE: 'status_update',
  OFFER_LETTER: 'offer_letter',
  WELCOME: 'welcome',
} as const;

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export function renderTemplateVariables(html: string, variables: Record<string, string | number>): string {
  let rendered = html;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
    rendered = rendered.replace(regex, String(value));
  }
  return rendered;
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

export interface DatabaseTemplateEmailParams {
  to: string | string[];
  template: EmailTemplate;
  variables: Record<string, string | number>;
  from?: string;
  replyTo?: string;
  subjectOverride?: string;
}

export async function sendDatabaseTemplateEmail(params: DatabaseTemplateEmailParams): Promise<EmailResult> {
  const { 
    to, 
    template,
    variables, 
    from = EMAIL_FROM, 
    replyTo = SUPPORT_EMAIL,
    subjectOverride 
  } = params;

  const subject = subjectOverride || template.fallbackSubject;
  const htmlContent = template.fallbackHtml;

  if (!subject) {
    console.error('[Email] Template missing subject:', template.templateType);
    return { success: false, error: 'Email template is missing a subject line' };
  }

  if (!htmlContent) {
    console.error('[Email] Template missing HTML content:', template.templateType);
    return { success: false, error: 'Email template is missing HTML content' };
  }

  const html = renderTemplateVariables(htmlContent, variables);

  return sendEmail({
    to,
    subject,
    html,
    from,
    replyTo,
  });
}

export async function sendBetaConfirmationEmail(params: {
  to: string;
  firstName: string;
}): Promise<EmailResult> {
  const { to, firstName } = params;
  
  const { SYSTEM_TEMPLATES } = await import('./system-templates');
  const template = SYSTEM_TEMPLATES.BETA_APPLICATION_CONFIRMATION;
  
  const html = renderTemplateVariables(template.html, { first_name: firstName });
  
  return sendEmail({
    to,
    subject: template.subject,
    html,
  });
}
