export { 
  sendEmail, 
  sendDatabaseTemplateEmail,
  sendBetaConfirmationEmail,
  renderTemplateVariables,
  resend, 
  EMAIL_FROM, 
  SUPPORT_EMAIL,
  TEMPLATE_TYPES,
  type EmailResult,
  type DatabaseTemplateEmailParams,
} from './resend';
export { SYSTEM_TEMPLATES, type SystemTemplate } from './system-templates';
export { 
  betaConfirmationTemplate,
  betaApprovalTemplate,
  welcomeTemplate,
  approvalNotificationTemplate,
  type BetaConfirmationData,
  type BetaApprovalData,
  type WelcomeData,
  type ApprovalNotificationData,
} from './templates';

export {
  sendNewApplicationNotification,
  sendInterviewInvitation,
  sendInterviewReminder,
  sendStatusUpdate,
  sendWelcomeEmail,
  sendJobOffer,
  sendMessageAlert,
  sendEventReminder,
  sendTeamAlert,
} from './ats-emails';
