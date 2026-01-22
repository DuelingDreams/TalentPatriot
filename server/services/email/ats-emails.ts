import { sendEmail, EMAIL_FROM, type EmailResult } from './resend';

export async function sendNewApplicationNotification(
  hiringManagerEmail: string,
  candidateName: string,
  jobTitle: string,
  organizationName: string,
  additionalData: {
    candidateEmail?: string;
    candidatePhone?: string;
    candidateLocation?: string;
    applicationDate?: string;
    candidateExperience?: string;
    resumeUrl?: string;
    candidateProfileUrl?: string;
    organizationLogo?: string;
  } = {}
): Promise<EmailResult> {
  const subject = `New Application: ${candidateName} for ${jobTitle}`;
  const html = `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc;">
      <div style="background: linear-gradient(135deg, #1E3A5F 0%, #0EA5E9 100%); color: white; padding: 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">TalentPatriot</h1>
      </div>
      <div style="padding: 32px; background: white; margin: 0;">
        <h2 style="color: #1E3A5F; margin: 0 0 16px 0; font-size: 20px;">New Job Application Received</h2>
        <p style="color: #374151; line-height: 1.6; margin: 0 0 16px 0;">Hello,</p>
        <p style="color: #374151; line-height: 1.6; margin: 0 0 24px 0;">A new candidate has applied for a position at <strong>${organizationName}</strong>:</p>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 0 0 24px 0; border-left: 4px solid #0EA5E9;">
          <h3 style="margin: 0 0 12px 0; color: #1E3A5F; font-size: 16px;">Application Details</h3>
          <p style="margin: 0 0 8px 0; color: #374151;"><strong>Candidate:</strong> ${candidateName}</p>
          <p style="margin: 0 0 8px 0; color: #374151;"><strong>Position:</strong> ${jobTitle}</p>
          ${additionalData.candidateEmail ? `<p style="margin: 0 0 8px 0; color: #374151;"><strong>Email:</strong> ${additionalData.candidateEmail}</p>` : ''}
          ${additionalData.candidatePhone ? `<p style="margin: 0 0 8px 0; color: #374151;"><strong>Phone:</strong> ${additionalData.candidatePhone}</p>` : ''}
          ${additionalData.candidateLocation ? `<p style="margin: 0 0 8px 0; color: #374151;"><strong>Location:</strong> ${additionalData.candidateLocation}</p>` : ''}
          <p style="margin: 0; color: #374151;"><strong>Status:</strong> <span style="color: #0EA5E9;">Applied (ready for review)</span></p>
        </div>
        
        <p style="color: #374151; line-height: 1.6; margin: 0 0 24px 0;">The candidate has been automatically placed in your pipeline's "Applied" stage and is ready for review.</p>
        
        ${additionalData.candidateProfileUrl ? `
        <div style="text-align: center; margin: 0 0 24px 0;">
          <a href="${additionalData.candidateProfileUrl}" style="background: #0EA5E9; color: white; padding: 12px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
            Review Application
          </a>
        </div>
        ` : ''}
        
        <p style="color: #6b7280; font-size: 13px; margin: 0; border-top: 1px solid #e5e7eb; padding-top: 16px;">
          This is an automated notification from TalentPatriot ATS.
        </p>
      </div>
    </div>
  `;

  return sendEmail({ to: hiringManagerEmail, subject, html });
}

export async function sendInterviewInvitation(
  candidateEmail: string,
  candidateName: string,
  jobTitle: string,
  organizationName: string,
  interviewDetails: {
    interviewType?: string;
    interviewDate?: string;
    interviewTime?: string;
    timezone?: string;
    duration?: string;
    interviewLocation?: string;
    meetingLink?: string;
    interviewerNames?: string;
    preparationNotes?: string;
    recruiterEmail?: string;
    recruiterPhone?: string;
  } = {}
): Promise<EmailResult> {
  const subject = `Interview Invitation: ${jobTitle} at ${organizationName}`;
  const html = `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc;">
      <div style="background: linear-gradient(135deg, #1E3A5F 0%, #0EA5E9 100%); color: white; padding: 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">TalentPatriot</h1>
      </div>
      <div style="padding: 32px; background: white; margin: 0;">
        <h2 style="color: #1E3A5F; margin: 0 0 16px 0; font-size: 20px;">Interview Invitation</h2>
        <p style="color: #374151; line-height: 1.6; margin: 0 0 16px 0;">Hello ${candidateName},</p>
        <p style="color: #374151; line-height: 1.6; margin: 0 0 24px 0;">We are pleased to invite you to interview for the <strong>${jobTitle}</strong> position at <strong>${organizationName}</strong>.</p>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 0 0 24px 0; border-left: 4px solid #0EA5E9;">
          <h3 style="margin: 0 0 12px 0; color: #1E3A5F; font-size: 16px;">Interview Details</h3>
          <p style="margin: 0 0 8px 0; color: #374151;"><strong>Type:</strong> ${interviewDetails.interviewType || 'Interview'}</p>
          <p style="margin: 0 0 8px 0; color: #374151;"><strong>Date:</strong> ${interviewDetails.interviewDate || 'TBD'}</p>
          <p style="margin: 0 0 8px 0; color: #374151;"><strong>Time:</strong> ${interviewDetails.interviewTime || 'TBD'} ${interviewDetails.timezone || ''}</p>
          <p style="margin: 0 0 8px 0; color: #374151;"><strong>Duration:</strong> ${interviewDetails.duration || '30 minutes'}</p>
          ${interviewDetails.interviewLocation ? `<p style="margin: 0 0 8px 0; color: #374151;"><strong>Location:</strong> ${interviewDetails.interviewLocation}</p>` : ''}
          ${interviewDetails.interviewerNames ? `<p style="margin: 0; color: #374151;"><strong>Interviewer(s):</strong> ${interviewDetails.interviewerNames}</p>` : ''}
        </div>
        
        ${interviewDetails.meetingLink ? `
        <div style="text-align: center; margin: 0 0 24px 0;">
          <a href="${interviewDetails.meetingLink}" style="background: #0EA5E9; color: white; padding: 12px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
            Join Meeting
          </a>
        </div>
        ` : ''}
        
        ${interviewDetails.preparationNotes ? `
        <div style="background: #fef3c7; padding: 16px; border-radius: 8px; margin: 0 0 24px 0;">
          <p style="margin: 0; color: #92400e; font-size: 14px;"><strong>Preparation Notes:</strong> ${interviewDetails.preparationNotes}</p>
        </div>
        ` : ''}
        
        <p style="color: #374151; line-height: 1.6; margin: 0 0 16px 0;">We're excited to learn more about you. Please arrive a few minutes early and be prepared to discuss your experience and qualifications.</p>
        
        ${interviewDetails.recruiterEmail ? `<p style="color: #374151; line-height: 1.6; margin: 0 0 24px 0;">If you have any questions, please contact us at <a href="mailto:${interviewDetails.recruiterEmail}" style="color: #0EA5E9;">${interviewDetails.recruiterEmail}</a>.</p>` : ''}
        
        <p style="color: #6b7280; font-size: 13px; margin: 0; border-top: 1px solid #e5e7eb; padding-top: 16px;">
          Best of luck with your interview!
        </p>
      </div>
    </div>
  `;

  return sendEmail({ to: candidateEmail, subject, html });
}

export async function sendInterviewReminder(
  candidateEmail: string,
  candidateName: string,
  jobTitle: string,
  interviewDate: string,
  organizationName: string
): Promise<EmailResult> {
  const subject = `Interview Reminder: ${jobTitle} at ${organizationName}`;
  const html = `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc;">
      <div style="background: linear-gradient(135deg, #1E3A5F 0%, #0EA5E9 100%); color: white; padding: 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">TalentPatriot</h1>
      </div>
      <div style="padding: 32px; background: white; margin: 0;">
        <h2 style="color: #1E3A5F; margin: 0 0 16px 0; font-size: 20px;">Interview Reminder</h2>
        <p style="color: #374151; line-height: 1.6; margin: 0 0 16px 0;">Hello ${candidateName},</p>
        <p style="color: #374151; line-height: 1.6; margin: 0 0 24px 0;">This is a friendly reminder about your upcoming interview:</p>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 0 0 24px 0; border-left: 4px solid #0EA5E9;">
          <h3 style="margin: 0 0 12px 0; color: #1E3A5F; font-size: 16px;">Interview Details</h3>
          <p style="margin: 0 0 8px 0; color: #374151;"><strong>Company:</strong> ${organizationName}</p>
          <p style="margin: 0 0 8px 0; color: #374151;"><strong>Position:</strong> ${jobTitle}</p>
          <p style="margin: 0; color: #374151;"><strong>Date & Time:</strong> ${interviewDate}</p>
        </div>
        
        <p style="color: #374151; line-height: 1.6; margin: 0 0 24px 0;">We're looking forward to meeting with you. Please arrive a few minutes early and bring any requested materials.</p>
        
        <p style="color: #6b7280; font-size: 13px; margin: 0; border-top: 1px solid #e5e7eb; padding-top: 16px;">
          Best of luck with your interview!
        </p>
      </div>
    </div>
  `;

  return sendEmail({ to: candidateEmail, subject, html });
}

export async function sendStatusUpdate(
  candidateEmail: string,
  candidateName: string,
  jobTitle: string,
  newStatus: string,
  organizationName: string,
  additionalData: {
    feedback?: string;
    nextStageDetails?: string;
    actionRequired?: string;
    actionUrl?: string;
    recruiterName?: string;
    recruiterEmail?: string;
    careersUrl?: string;
  } = {}
): Promise<EmailResult> {
  const subject = `Application Update: ${jobTitle} at ${organizationName}`;
  
  const isRejection = newStatus.toLowerCase().includes('reject') || newStatus.toLowerCase().includes('not selected');
  const statusColor = isRejection ? '#dc2626' : '#0EA5E9';
  
  const html = `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc;">
      <div style="background: linear-gradient(135deg, #1E3A5F 0%, #0EA5E9 100%); color: white; padding: 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">TalentPatriot</h1>
      </div>
      <div style="padding: 32px; background: white; margin: 0;">
        <h2 style="color: #1E3A5F; margin: 0 0 16px 0; font-size: 20px;">Application Status Update</h2>
        <p style="color: #374151; line-height: 1.6; margin: 0 0 16px 0;">Hello ${candidateName},</p>
        <p style="color: #374151; line-height: 1.6; margin: 0 0 24px 0;">We wanted to update you on the status of your application:</p>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 0 0 24px 0; border-left: 4px solid ${statusColor};">
          <h3 style="margin: 0 0 12px 0; color: #1E3A5F; font-size: 16px;">Application Details</h3>
          <p style="margin: 0 0 8px 0; color: #374151;"><strong>Company:</strong> ${organizationName}</p>
          <p style="margin: 0 0 8px 0; color: #374151;"><strong>Position:</strong> ${jobTitle}</p>
          <p style="margin: 0; color: #374151;"><strong>Current Status:</strong> <span style="color: ${statusColor}; font-weight: 600;">${newStatus}</span></p>
        </div>
        
        ${additionalData.feedback ? `
        <div style="background: #f0f9ff; padding: 16px; border-radius: 8px; margin: 0 0 24px 0;">
          <p style="margin: 0; color: #0c4a6e; font-size: 14px;"><strong>Feedback:</strong> ${additionalData.feedback}</p>
        </div>
        ` : ''}
        
        ${additionalData.nextStageDetails ? `
        <p style="color: #374151; line-height: 1.6; margin: 0 0 16px 0;"><strong>Next Steps:</strong> ${additionalData.nextStageDetails}</p>
        ` : ''}
        
        ${additionalData.actionUrl ? `
        <div style="text-align: center; margin: 0 0 24px 0;">
          <a href="${additionalData.actionUrl}" style="background: #0EA5E9; color: white; padding: 12px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
            ${additionalData.actionRequired || 'View Details'}
          </a>
        </div>
        ` : ''}
        
        <p style="color: #374151; line-height: 1.6; margin: 0 0 24px 0;">Thank you for your continued interest. We'll keep you updated as your application progresses.</p>
        
        ${additionalData.recruiterEmail ? `<p style="color: #374151; line-height: 1.6; margin: 0 0 24px 0;">Questions? Contact ${additionalData.recruiterName || 'our team'} at <a href="mailto:${additionalData.recruiterEmail}" style="color: #0EA5E9;">${additionalData.recruiterEmail}</a>.</p>` : ''}
        
        <p style="color: #6b7280; font-size: 13px; margin: 0; border-top: 1px solid #e5e7eb; padding-top: 16px;">
          This is an automated update from TalentPatriot ATS.
        </p>
      </div>
    </div>
  `;

  return sendEmail({ to: candidateEmail, subject, html });
}

export async function sendWelcomeEmail(
  userEmail: string,
  userName: string,
  userRole: string,
  organizationName: string,
  additionalData: {
    dashboardUrl?: string;
    setupGuideUrl?: string;
    betaProgram?: boolean;
  } = {}
): Promise<EmailResult> {
  const subject = `Welcome to TalentPatriot, ${userName}!`;
  const html = `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc;">
      <div style="background: linear-gradient(135deg, #1E3A5F 0%, #0EA5E9 100%); color: white; padding: 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">Welcome to TalentPatriot!</h1>
      </div>
      <div style="padding: 32px; background: white; margin: 0;">
        <h2 style="color: #1E3A5F; margin: 0 0 16px 0; font-size: 20px;">Welcome aboard, ${userName}!</h2>
        <p style="color: #374151; line-height: 1.6; margin: 0 0 24px 0;">Thank you for joining TalentPatriot. Your account for <strong>${organizationName}</strong> is now ready.</p>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 0 0 24px 0; border-left: 4px solid #0EA5E9;">
          <h3 style="margin: 0 0 12px 0; color: #1E3A5F; font-size: 16px;">Getting Started</h3>
          <p style="margin: 0; color: #374151;">As a <strong>${userRole}</strong>, you have access to powerful recruitment tools to help you find and hire the best candidates.</p>
        </div>
        
        ${additionalData.betaProgram ? `
        <div style="background: #ecfdf5; padding: 16px; border-radius: 8px; margin: 0 0 24px 0;">
          <p style="margin: 0; color: #065f46; font-size: 14px;">🎉 <strong>Beta Program Member</strong> - Thank you for being an early adopter! Your feedback helps us improve.</p>
        </div>
        ` : ''}
        
        <div style="text-align: center; margin: 0 0 24px 0;">
          <a href="${additionalData.dashboardUrl || '/dashboard'}" style="background: #0EA5E9; color: white; padding: 12px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
            Access Your Dashboard
          </a>
        </div>
        
        <p style="color: #6b7280; font-size: 13px; margin: 0; border-top: 1px solid #e5e7eb; padding-top: 16px;">
          If you have any questions, our support team is here to help.
        </p>
      </div>
    </div>
  `;

  return sendEmail({ to: userEmail, subject, html });
}

export async function sendJobOffer(
  candidateEmail: string,
  candidateName: string,
  jobTitle: string,
  organizationName: string,
  offerDetails: {
    startDate?: string;
    employmentType?: string;
    salaryAmount?: string;
    salaryPeriod?: string;
    responseDeadline?: string;
    hiringManagerName?: string;
    hiringManagerEmail?: string;
    offerPortalUrl?: string;
    benefits?: string[];
  } = {}
): Promise<EmailResult> {
  const subject = `Job Offer: ${jobTitle} at ${organizationName}`;
  const benefitsList = offerDetails.benefits?.length 
    ? `<ul style="margin: 8px 0; padding-left: 20px; color: #374151;">${offerDetails.benefits.map(b => `<li style="margin-bottom: 4px;">${b}</li>`).join('')}</ul>` 
    : '';
  
  const html = `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc;">
      <div style="background: linear-gradient(135deg, #1E3A5F 0%, #10B981 100%); color: white; padding: 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">🎉 Congratulations!</h1>
      </div>
      <div style="padding: 32px; background: white; margin: 0;">
        <h2 style="color: #1E3A5F; margin: 0 0 16px 0; font-size: 20px;">Job Offer</h2>
        <p style="color: #374151; line-height: 1.6; margin: 0 0 16px 0;">Dear ${candidateName},</p>
        <p style="color: #374151; line-height: 1.6; margin: 0 0 24px 0;">We are pleased to extend an offer for the position of <strong>${jobTitle}</strong> at <strong>${organizationName}</strong>.</p>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 0 0 24px 0; border-left: 4px solid #10B981;">
          <h3 style="margin: 0 0 12px 0; color: #1E3A5F; font-size: 16px;">Offer Details</h3>
          <p style="margin: 0 0 8px 0; color: #374151;"><strong>Position:</strong> ${jobTitle}</p>
          <p style="margin: 0 0 8px 0; color: #374151;"><strong>Start Date:</strong> ${offerDetails.startDate || 'To be determined'}</p>
          <p style="margin: 0 0 8px 0; color: #374151;"><strong>Employment Type:</strong> ${offerDetails.employmentType || 'Full-time'}</p>
          ${offerDetails.salaryAmount ? `<p style="margin: 0; color: #374151;"><strong>Compensation:</strong> ${offerDetails.salaryAmount} ${offerDetails.salaryPeriod || 'annually'}</p>` : ''}
        </div>
        
        ${benefitsList ? `
        <div style="margin: 0 0 24px 0;">
          <h4 style="margin: 0 0 8px 0; color: #1E3A5F; font-size: 14px;">Benefits Include:</h4>
          ${benefitsList}
        </div>
        ` : ''}
        
        ${offerDetails.offerPortalUrl ? `
        <div style="text-align: center; margin: 0 0 24px 0;">
          <a href="${offerDetails.offerPortalUrl}" style="background: #10B981; color: white; padding: 12px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
            Review & Accept Offer
          </a>
        </div>
        ` : ''}
        
        <p style="color: #374151; line-height: 1.6; margin: 0 0 16px 0;">Please review the complete offer details and let us know your decision by <strong>${offerDetails.responseDeadline || 'your earliest convenience'}</strong>.</p>
        
        ${offerDetails.hiringManagerEmail ? `<p style="color: #374151; line-height: 1.6; margin: 0 0 24px 0;">If you have any questions, please contact ${offerDetails.hiringManagerName || 'our hiring team'} at <a href="mailto:${offerDetails.hiringManagerEmail}" style="color: #0EA5E9;">${offerDetails.hiringManagerEmail}</a>.</p>` : ''}
        
        <p style="color: #6b7280; font-size: 13px; margin: 0; border-top: 1px solid #e5e7eb; padding-top: 16px;">
          We look forward to welcoming you to our team!
        </p>
      </div>
    </div>
  `;

  return sendEmail({ to: candidateEmail, subject, html });
}

export async function sendMessageAlert(
  recipientEmail: string,
  recipientName: string,
  senderName: string,
  organizationName: string,
  messageDetails: {
    messageSubject?: string;
    messagePreview?: string;
    messageTimestamp?: string;
    messageUrl?: string;
    candidateName?: string;
    jobTitle?: string;
    urgent?: boolean;
  } = {}
): Promise<EmailResult> {
  const subject = messageDetails.urgent 
    ? `🔴 Urgent Message: ${messageDetails.messageSubject || 'New Message'}` 
    : `New Message: ${messageDetails.messageSubject || 'TalentPatriot Notification'}`;
  
  const html = `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc;">
      <div style="background: linear-gradient(135deg, #1E3A5F 0%, #0EA5E9 100%); color: white; padding: 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">TalentPatriot</h1>
      </div>
      <div style="padding: 32px; background: white; margin: 0;">
        ${messageDetails.urgent ? '<div style="background: #fef2f2; color: #dc2626; padding: 12px; border-radius: 6px; text-align: center; margin: 0 0 24px 0; font-weight: 500;">⚠️ This is an urgent message</div>' : ''}
        
        <h2 style="color: #1E3A5F; margin: 0 0 16px 0; font-size: 20px;">New Message</h2>
        <p style="color: #374151; line-height: 1.6; margin: 0 0 16px 0;">Hello ${recipientName},</p>
        <p style="color: #374151; line-height: 1.6; margin: 0 0 24px 0;">You have a new message from <strong>${senderName}</strong> at ${organizationName}:</p>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 0 0 24px 0; border-left: 4px solid #0EA5E9;">
          ${messageDetails.messageSubject ? `<h4 style="margin: 0 0 8px 0; color: #1E3A5F;">${messageDetails.messageSubject}</h4>` : ''}
          <p style="margin: 0; color: #374151; font-style: italic;">"${messageDetails.messagePreview || 'You have a new message...'}"</p>
          ${messageDetails.messageTimestamp ? `<p style="margin: 8px 0 0 0; color: #6b7280; font-size: 12px;">${messageDetails.messageTimestamp}</p>` : ''}
        </div>
        
        ${messageDetails.candidateName && messageDetails.jobTitle ? `
        <p style="color: #6b7280; font-size: 14px; margin: 0 0 24px 0;">
          Related to: <strong>${messageDetails.candidateName}</strong> - ${messageDetails.jobTitle}
        </p>
        ` : ''}
        
        ${messageDetails.messageUrl ? `
        <div style="text-align: center; margin: 0 0 24px 0;">
          <a href="${messageDetails.messageUrl}" style="background: #0EA5E9; color: white; padding: 12px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
            View Message
          </a>
        </div>
        ` : ''}
        
        <p style="color: #6b7280; font-size: 13px; margin: 0; border-top: 1px solid #e5e7eb; padding-top: 16px;">
          This is an automated notification from TalentPatriot ATS.
        </p>
      </div>
    </div>
  `;

  return sendEmail({ to: recipientEmail, subject, html });
}

export async function sendEventReminder(
  recipientEmail: string,
  recipientName: string,
  organizationName: string,
  eventDetails: {
    eventType?: string;
    eventTitle?: string;
    eventDate?: string;
    eventTime?: string;
    timezone?: string;
    duration?: string;
    eventLocation?: string;
    meetingLink?: string;
    candidateName?: string;
    jobTitle?: string;
  } = {}
): Promise<EmailResult> {
  const subject = `Reminder: ${eventDetails.eventTitle || eventDetails.eventType || 'Upcoming Event'}`;
  const html = `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc;">
      <div style="background: linear-gradient(135deg, #1E3A5F 0%, #0EA5E9 100%); color: white; padding: 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">TalentPatriot</h1>
      </div>
      <div style="padding: 32px; background: white; margin: 0;">
        <h2 style="color: #1E3A5F; margin: 0 0 16px 0; font-size: 20px;">⏰ Event Reminder</h2>
        <p style="color: #374151; line-height: 1.6; margin: 0 0 16px 0;">Hello ${recipientName},</p>
        <p style="color: #374151; line-height: 1.6; margin: 0 0 24px 0;">This is a reminder about your upcoming ${eventDetails.eventType || 'event'}:</p>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 0 0 24px 0; border-left: 4px solid #f59e0b;">
          <h3 style="margin: 0 0 12px 0; color: #1E3A5F; font-size: 16px;">${eventDetails.eventTitle || 'Event Details'}</h3>
          <p style="margin: 0 0 8px 0; color: #374151;"><strong>Date:</strong> ${eventDetails.eventDate || 'TBD'}</p>
          <p style="margin: 0 0 8px 0; color: #374151;"><strong>Time:</strong> ${eventDetails.eventTime || 'TBD'} ${eventDetails.timezone || ''}</p>
          ${eventDetails.duration ? `<p style="margin: 0 0 8px 0; color: #374151;"><strong>Duration:</strong> ${eventDetails.duration}</p>` : ''}
          ${eventDetails.eventLocation ? `<p style="margin: 0 0 8px 0; color: #374151;"><strong>Location:</strong> ${eventDetails.eventLocation}</p>` : ''}
          ${eventDetails.candidateName ? `<p style="margin: 0; color: #374151;"><strong>Candidate:</strong> ${eventDetails.candidateName}${eventDetails.jobTitle ? ` - ${eventDetails.jobTitle}` : ''}</p>` : ''}
        </div>
        
        ${eventDetails.meetingLink ? `
        <div style="text-align: center; margin: 0 0 24px 0;">
          <a href="${eventDetails.meetingLink}" style="background: #0EA5E9; color: white; padding: 12px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
            Join Meeting
          </a>
        </div>
        ` : ''}
        
        <p style="color: #374151; line-height: 1.6; margin: 0 0 24px 0;">Please make sure to attend on time. We look forward to meeting with you!</p>
        
        <p style="color: #6b7280; font-size: 13px; margin: 0; border-top: 1px solid #e5e7eb; padding-top: 16px;">
          This is an automated reminder from TalentPatriot ATS.
        </p>
      </div>
    </div>
  `;

  return sendEmail({ to: recipientEmail, subject, html });
}

export async function sendTeamAlert(
  teamMemberEmail: string,
  alertType: string,
  message: string,
  organizationName: string
): Promise<EmailResult> {
  const subject = `TalentPatriot Alert: ${alertType}`;
  const html = `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc;">
      <div style="background: linear-gradient(135deg, #1E3A5F 0%, #0EA5E9 100%); color: white; padding: 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">TalentPatriot</h1>
      </div>
      <div style="padding: 32px; background: white; margin: 0;">
        <h2 style="color: #1E3A5F; margin: 0 0 16px 0; font-size: 20px;">${alertType}</h2>
        <p style="color: #374151; line-height: 1.6; margin: 0 0 16px 0;">Hello,</p>
        <p style="color: #374151; line-height: 1.6; margin: 0 0 24px 0;">You have a new notification from your TalentPatriot ATS system at <strong>${organizationName}</strong>:</p>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 0 0 24px 0; border-left: 4px solid #0EA5E9;">
          <p style="margin: 0; color: #374151;">${message}</p>
        </div>
        
        <p style="color: #6b7280; font-size: 13px; margin: 0; border-top: 1px solid #e5e7eb; padding-top: 16px;">
          This is an automated notification from TalentPatriot ATS.
        </p>
      </div>
    </div>
  `;

  return sendEmail({ to: teamMemberEmail, subject, html });
}
