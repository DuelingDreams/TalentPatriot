const baseStyles = `
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #1f2937;
  line-height: 1.6;
`;

const buttonStyles = `
  display: inline-block;
  background-color: #1E3A5F;
  color: white;
  padding: 12px 24px;
  text-decoration: none;
  border-radius: 6px;
  font-weight: 600;
  margin: 16px 0;
`;

const containerStyles = `
  max-width: 600px;
  margin: 0 auto;
  padding: 40px 20px;
  background-color: #ffffff;
`;

const headerStyles = `
  text-align: center;
  margin-bottom: 32px;
`;

const footerStyles = `
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
  text-align: center;
  color: #6b7280;
  font-size: 14px;
`;

function wrapTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6;">
  <div style="${containerStyles}">
    <div style="${headerStyles}">
      <h1 style="color: #1E3A5F; margin: 0; font-size: 28px;">TalentPatriot</h1>
    </div>
    <div style="${baseStyles}">
      ${content}
    </div>
    <div style="${footerStyles}">
      <p>&copy; ${new Date().getFullYear()} TalentPatriot. All rights reserved.</p>
      <p>Building the future of recruitment for growing teams.</p>
    </div>
  </div>
</body>
</html>
`;
}

export interface BetaConfirmationData {
  contactName: string;
  companyName: string;
}

export function betaConfirmationTemplate(data: BetaConfirmationData): string {
  return wrapTemplate(`
    <h2 style="color: #1E3A5F; margin-bottom: 24px;">Thank You for Applying!</h2>
    
    <p>Hi ${data.contactName},</p>
    
    <p>We've received your beta application for <strong>${data.companyName}</strong>. Thank you for your interest in TalentPatriot!</p>
    
    <p>Our team will review your application within 24-48 hours. Here's what happens next:</p>
    
    <ul style="padding-left: 20px;">
      <li><strong>Review:</strong> We'll evaluate your application and recruitment needs</li>
      <li><strong>Approval:</strong> You'll receive an email with your access credentials</li>
      <li><strong>Onboarding:</strong> We'll schedule a brief call to set up your account</li>
    </ul>
    
    <p>In the meantime, feel free to explore our <a href="https://talentpatriot.com/about" style="color: #14B8A6;">About page</a> to learn more about what TalentPatriot can do for your team.</p>
    
    <p>Questions? Reply to this email or contact us at <a href="mailto:support@talentpatriot.com" style="color: #14B8A6;">support@talentpatriot.com</a>.</p>
    
    <p style="margin-top: 32px;">Best regards,<br><strong>The TalentPatriot Team</strong></p>
  `);
}

export interface BetaApprovalData {
  contactName: string;
  companyName: string;
  onboardingUrl: string;
}

export function betaApprovalTemplate(data: BetaApprovalData): string {
  return wrapTemplate(`
    <h2 style="color: #14B8A6; margin-bottom: 24px;">You're Approved! 🎉</h2>
    
    <p>Hi ${data.contactName},</p>
    
    <p>Great news! Your beta application for <strong>${data.companyName}</strong> has been approved.</p>
    
    <p>You now have full access to TalentPatriot's beta program, including:</p>
    
    <ul style="padding-left: 20px;">
      <li>AI-powered resume parsing</li>
      <li>Multi-client pipeline management</li>
      <li>Public careers portal with custom branding</li>
      <li>Team collaboration tools</li>
      <li>Priority support from our team</li>
    </ul>
    
    <div style="text-align: center;">
      <a href="${data.onboardingUrl}" style="${buttonStyles}">Complete Your Setup</a>
    </div>
    
    <p style="color: #6b7280; font-size: 14px;">This link will take you to complete your account setup and configure your organization.</p>
    
    <p style="margin-top: 32px;">Welcome to the team!<br><strong>The TalentPatriot Team</strong></p>
  `);
}

export interface WelcomeData {
  userName: string;
  organizationName: string;
  dashboardUrl: string;
}

export function welcomeTemplate(data: WelcomeData): string {
  return wrapTemplate(`
    <h2 style="color: #1E3A5F; margin-bottom: 24px;">Welcome to TalentPatriot!</h2>
    
    <p>Hi ${data.userName},</p>
    
    <p>Your organization <strong>${data.organizationName}</strong> is now set up and ready to go!</p>
    
    <p>Here are some quick actions to get started:</p>
    
    <ul style="padding-left: 20px;">
      <li><strong>Post your first job:</strong> Create a job posting to start attracting candidates</li>
      <li><strong>Set up your careers page:</strong> Customize your public careers portal</li>
      <li><strong>Invite your team:</strong> Add recruiters and hiring managers</li>
      <li><strong>Import candidates:</strong> Bring in your existing candidate database</li>
    </ul>
    
    <div style="text-align: center;">
      <a href="${data.dashboardUrl}" style="${buttonStyles}">Go to Dashboard</a>
    </div>
    
    <p>Need help getting started? Check out our <a href="https://talentpatriot.com/docs" style="color: #14B8A6;">documentation</a> or reply to this email.</p>
    
    <p style="margin-top: 32px;">Happy recruiting!<br><strong>The TalentPatriot Team</strong></p>
  `);
}

export interface BetaApplicationNotificationData {
  contactName: string;
  email: string;
  companyName: string;
  companySize: string;
  role: string;
  painPoints: string;
  currentAts?: string;
  expectations?: string;
  adminDashboardUrl: string;
}

export function betaApplicationNotificationTemplate(data: BetaApplicationNotificationData): string {
  return wrapTemplate(`
    <h2 style="color: #1E3A5F; margin-bottom: 24px;">New Beta Application Received</h2>
    
    <p>A new beta application has been submitted and is ready for your review:</p>
    
    <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin: 0 0 16px 0; color: #1E3A5F;">Contact Details</h3>
      <p style="margin: 8px 0;"><strong>Name:</strong> ${data.contactName}</p>
      <p style="margin: 8px 0;"><strong>Email:</strong> <a href="mailto:${data.email}" style="color: #14B8A6;">${data.email}</a></p>
      <p style="margin: 8px 0;"><strong>Role:</strong> ${data.role}</p>
    </div>
    
    <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin: 0 0 16px 0; color: #1E3A5F;">Company Information</h3>
      <p style="margin: 8px 0;"><strong>Company:</strong> ${data.companyName}</p>
      <p style="margin: 8px 0;"><strong>Size:</strong> ${data.companySize}</p>
      ${data.currentAts ? `<p style="margin: 8px 0;"><strong>Current ATS:</strong> ${data.currentAts}</p>` : ''}
    </div>
    
    <div style="background-color: #fff7ed; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f97316;">
      <h3 style="margin: 0 0 12px 0; color: #c2410c;">Pain Points</h3>
      <p style="margin: 0; white-space: pre-wrap;">${data.painPoints}</p>
    </div>
    
    ${data.expectations ? `
    <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22c55e;">
      <h3 style="margin: 0 0 12px 0; color: #15803d;">Expectations</h3>
      <p style="margin: 0; white-space: pre-wrap;">${data.expectations}</p>
    </div>
    ` : ''}
    
    <p><strong>Next Steps:</strong></p>
    <ol style="padding-left: 20px;">
      <li>Schedule a discovery call with the applicant</li>
      <li>After the call, approve their application in the admin dashboard</li>
      <li>They'll receive an invite email with their onboarding link</li>
    </ol>
    
    <div style="text-align: center;">
      <a href="${data.adminDashboardUrl}" style="${buttonStyles}">View in Admin Dashboard</a>
    </div>
    
    <p style="margin-top: 32px; color: #6b7280; font-size: 14px;">This is an automated notification from TalentPatriot.</p>
  `);
}

export interface ApprovalNotificationData {
  adminName: string;
  requestType: string;
  requestTitle: string;
  requesterName: string;
  inboxUrl: string;
}

export function approvalNotificationTemplate(data: ApprovalNotificationData): string {
  return wrapTemplate(`
    <h2 style="color: #1E3A5F; margin-bottom: 24px;">New Approval Request</h2>
    
    <p>Hi ${data.adminName},</p>
    
    <p>A new ${data.requestType} request requires your attention:</p>
    
    <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0;"><strong>Request:</strong> ${data.requestTitle}</p>
      <p style="margin: 8px 0 0 0;"><strong>Requested by:</strong> ${data.requesterName}</p>
    </div>
    
    <div style="text-align: center;">
      <a href="${data.inboxUrl}" style="${buttonStyles}">Review Request</a>
    </div>
    
    <p style="margin-top: 32px;">Best regards,<br><strong>TalentPatriot</strong></p>
  `);
}
