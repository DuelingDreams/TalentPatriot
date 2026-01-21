export { 
  sendEmail, 
  sendTemplateEmail,
  sendBetaConfirmationEmail,
  resend, 
  EMAIL_FROM, 
  SUPPORT_EMAIL,
  RESEND_TEMPLATES,
  type EmailResult,
  type TemplateEmailParams,
} from './resend';
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
