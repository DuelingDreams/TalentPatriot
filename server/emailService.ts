import { MailService } from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  console.warn("SENDGRID_API_KEY not found - email notifications will be disabled");
}

const mailService = new MailService();
if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
}

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

interface DynamicEmailParams {
  to: string;
  from: string;
  templateId: string;
  dynamicTemplateData: Record<string, any>;
  subject?: string; // Fallback subject if template doesn't have one
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.log('Email disabled - no SendGrid API key configured');
    return false;
  }

  try {
    await mailService.send({
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text || '',
      html: params.html || '',
    });
    console.log(`Email sent successfully to ${params.to}`);
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

export async function sendDynamicEmail(params: DynamicEmailParams): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.log('Email disabled - no SendGrid API key configured');
    return false;
  }

  try {
    const emailData: any = {
      to: params.to,
      from: params.from,
      templateId: params.templateId,
      dynamicTemplateData: params.dynamicTemplateData,
    };

    // Add fallback subject if provided
    if (params.subject) {
      emailData.subject = params.subject;
    }

    await mailService.send(emailData);
    console.log(`Dynamic email sent successfully to ${params.to} using template ${params.templateId}`);
    return true;
  } catch (error) {
    console.error('SendGrid dynamic email error:', error);
    return false;
  }
}

// Email templates for ATS notifications
export class ATSEmailService {
  private fromEmail: string = 'noreply@talentpatriot.com';

  private getTemplateId(templateKey: string): string | null {
    return process.env[templateKey] || null;
  }

  async sendNewApplicationNotification(
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
      organizationAddress?: string;
    } = {}
  ): Promise<boolean> {
    const templateId = this.getTemplateId('SG_TPL_NEW_CANDIDATE_ALERT');
    
    if (templateId) {
      // Use dynamic template
      const templateData = {
        organization_name: organizationName,
        organization_logo: additionalData.organizationLogo,
        organization_address: additionalData.organizationAddress,
        candidate_name: candidateName,
        candidate_email: additionalData.candidateEmail || 'Not provided',
        candidate_phone: additionalData.candidatePhone || 'Not provided',
        candidate_location: additionalData.candidateLocation || 'Not provided',
        job_title: jobTitle,
        application_date: additionalData.applicationDate || new Date().toLocaleDateString(),
        candidate_experience: additionalData.candidateExperience,
        resume_url: additionalData.resumeUrl,
        candidate_profile_url: additionalData.candidateProfileUrl,
      };

      return await sendDynamicEmail({
        to: hiringManagerEmail,
        from: this.fromEmail,
        templateId,
        dynamicTemplateData: templateData,
        subject: `New Application: ${candidateName} for ${jobTitle}` // Fallback subject
      });
    } else {
      // Fallback to static HTML if template not configured
      console.warn('SG_TPL_NEW_CANDIDATE_ALERT template ID not found, using fallback HTML');
      const subject = `New Application: ${candidateName} for ${jobTitle}`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1e40af; color: white; padding: 20px; text-align: center;">
            <h1>TalentPatriot</h1>
          </div>
          <div style="padding: 30px; background: #f8fafc;">
            <h2 style="color: #1e40af;">New Job Application Received</h2>
            <p>Hello,</p>
            <p>A new candidate has applied for a position at <strong>${organizationName}</strong>:</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #374151;">Application Details</h3>
              <p><strong>Candidate:</strong> ${candidateName}</p>
              <p><strong>Position:</strong> ${jobTitle}</p>
              <p><strong>Status:</strong> Applied (ready for review)</p>
            </div>
            
            <p>The candidate has been automatically placed in your pipeline's "Applied" stage and is ready for review.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="#" style="background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Review Application
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px;">
              This is an automated notification from TalentPatriot ATS.
            </p>
          </div>
        </div>
      `;

      return await sendEmail({
        to: hiringManagerEmail,
        from: this.fromEmail,
        subject,
        html,
        text: `New application from ${candidateName} for ${jobTitle} at ${organizationName}. The candidate is ready for review in your pipeline.`
      });
    }
  }

  async sendInterviewInvitation(
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
      interviewAgenda?: string;
      preparationNotes?: string;
      confirmUrl?: string;
      calendarLink?: string;
      recruiterEmail?: string;
      recruiterPhone?: string;
      organizationLogo?: string;
      organizationAddress?: string;
    } = {}
  ): Promise<boolean> {
    const templateId = this.getTemplateId('SG_TPL_INTERVIEW_INVITE');
    
    if (templateId) {
      // Use dynamic template
      const templateData = {
        organization_name: organizationName,
        organization_logo: interviewDetails.organizationLogo,
        organization_address: interviewDetails.organizationAddress,
        candidate_name: candidateName,
        job_title: jobTitle,
        interview_type: interviewDetails.interviewType || 'Phone',
        interview_date: interviewDetails.interviewDate || 'TBD',
        interview_time: interviewDetails.interviewTime || 'TBD',
        timezone: interviewDetails.timezone || 'PST',
        interview_duration: interviewDetails.duration || '30 minutes',
        interview_location: interviewDetails.interviewLocation,
        meeting_link: interviewDetails.meetingLink,
        interviewer_names: interviewDetails.interviewerNames || 'Hiring Team',
        interview_agenda: interviewDetails.interviewAgenda,
        preparation_notes: interviewDetails.preparationNotes,
        confirm_url: interviewDetails.confirmUrl,
        calendar_link: interviewDetails.calendarLink,
        recruiter_email: interviewDetails.recruiterEmail,
        recruiter_phone: interviewDetails.recruiterPhone,
      };

      return await sendDynamicEmail({
        to: candidateEmail,
        from: this.fromEmail,
        templateId,
        dynamicTemplateData: templateData,
        subject: `Interview Invitation: ${jobTitle} at ${organizationName}` // Fallback subject
      });
    } else {
      // Fallback to previous method for compatibility
      console.warn('SG_TPL_INTERVIEW_INVITE template ID not found, using fallback HTML');
      return await this.sendInterviewReminderToCandidate(
        candidateEmail,
        candidateName,
        jobTitle,
        interviewDetails.interviewDate || 'TBD',
        organizationName
      );
    }
  }

  async sendInterviewReminderToCandidate(
    candidateEmail: string,
    candidateName: string,
    jobTitle: string,
    interviewDate: string,
    organizationName: string
  ): Promise<boolean> {
    const subject = `Interview Reminder: ${jobTitle} at ${organizationName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1e40af; color: white; padding: 20px; text-align: center;">
          <h1>TalentPatriot</h1>
        </div>
        <div style="padding: 30px; background: #f8fafc;">
          <h2 style="color: #1e40af;">Interview Reminder</h2>
          <p>Hello ${candidateName},</p>
          <p>This is a friendly reminder about your upcoming interview:</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #374151;">Interview Details</h3>
            <p><strong>Company:</strong> ${organizationName}</p>
            <p><strong>Position:</strong> ${jobTitle}</p>
            <p><strong>Date & Time:</strong> ${interviewDate}</p>
          </div>
          
          <p>We're looking forward to meeting with you. Please arrive a few minutes early and bring any requested materials.</p>
          
          <p style="color: #6b7280; font-size: 14px;">
            Best of luck with your interview!
          </p>
        </div>
      </div>
    `;

    return await sendEmail({
      to: candidateEmail,
      from: this.fromEmail,
      subject,
      html,
      text: `Interview reminder: ${jobTitle} at ${organizationName} on ${interviewDate}`
    });
  }

  async sendStatusUpdateToCandidate(
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
      actionText?: string;
      recruiterName?: string;
      recruiterEmail?: string;
      recruiterPhone?: string;
      otherPositions?: string;
      careersUrl?: string;
      organizationLogo?: string;
      organizationAddress?: string;
    } = {}
  ): Promise<boolean> {
    const templateId = this.getTemplateId('SG_TPL_STATUS_UPDATE');
    
    if (templateId) {
      // Use dynamic template
      const templateData = {
        organization_name: organizationName,
        organization_logo: additionalData.organizationLogo,
        organization_address: additionalData.organizationAddress,
        candidate_name: candidateName,
        job_title: jobTitle,
        status: newStatus,
        feedback: additionalData.feedback,
        next_stage_details: additionalData.nextStageDetails,
        action_required: additionalData.actionRequired,
        action_url: additionalData.actionUrl,
        action_text: additionalData.actionText,
        recruiter_name: additionalData.recruiterName,
        recruiter_email: additionalData.recruiterEmail,
        recruiter_phone: additionalData.recruiterPhone,
        other_positions: additionalData.otherPositions,
        careers_url: additionalData.careersUrl,
      };

      return await sendDynamicEmail({
        to: candidateEmail,
        from: this.fromEmail,
        templateId,
        dynamicTemplateData: templateData,
        subject: `Application Update: ${jobTitle} at ${organizationName}` // Fallback subject
      });
    } else {
      // Fallback to static HTML if template not configured
      console.warn('SG_TPL_STATUS_UPDATE template ID not found, using fallback HTML');
      const subject = `Application Update: ${jobTitle} at ${organizationName}`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1e40af; color: white; padding: 20px; text-align: center;">
            <h1>TalentPatriot</h1>
          </div>
          <div style="padding: 30px; background: #f8fafc;">
            <h2 style="color: #1e40af;">Application Status Update</h2>
            <p>Hello ${candidateName},</p>
            <p>We wanted to update you on the status of your application:</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #374151;">Application Details</h3>
              <p><strong>Company:</strong> ${organizationName}</p>
              <p><strong>Position:</strong> ${jobTitle}</p>
              <p><strong>Current Status:</strong> ${newStatus}</p>
            </div>
            
            <p>Thank you for your continued interest. We'll keep you updated as your application progresses.</p>
            
            <p style="color: #6b7280; font-size: 14px;">
              This is an automated update from TalentPatriot ATS.
            </p>
          </div>
        </div>
      `;

      return await sendEmail({
        to: candidateEmail,
        from: this.fromEmail,
        subject,
        html,
        text: `Application update: Your application for ${jobTitle} at ${organizationName} is now in ${newStatus} stage.`
      });
    }
  }

  async sendWelcomeEmail(
    userEmail: string,
    userName: string,
    userRole: string,
    organizationName: string,
    additionalData: {
      planTier?: string;
      betaProgram?: boolean;
      dashboardUrl?: string;
      setupGuideUrl?: string;
      profileUrl?: string;
      documentationUrl?: string;
      supportUrl?: string;
      onboardingCallUrl?: string;
      organizationLogo?: string;
      organizationAddress?: string;
    } = {}
  ): Promise<boolean> {
    const templateId = this.getTemplateId('SG_TPL_WELCOME');
    
    if (templateId) {
      // Use dynamic template
      const templateData = {
        organization_name: organizationName,
        organization_logo: additionalData.organizationLogo,
        organization_address: additionalData.organizationAddress,
        user_name: userName,
        user_email: userEmail,
        user_role: userRole,
        plan_tier: additionalData.planTier || 'Free',
        beta_program: additionalData.betaProgram || false,
        dashboard_url: additionalData.dashboardUrl || '/dashboard',
        setup_guide_url: additionalData.setupGuideUrl || '/docs/getting-started',
        profile_url: additionalData.profileUrl || '/profile',
        documentation_url: additionalData.documentationUrl || '/docs',
        support_url: additionalData.supportUrl || '/help',
        onboarding_call_url: additionalData.onboardingCallUrl,
      };

      return await sendDynamicEmail({
        to: userEmail,
        from: this.fromEmail,
        templateId,
        dynamicTemplateData: templateData,
        subject: `Welcome to TalentPatriot, ${userName}!` // Fallback subject
      });
    } else {
      // Fallback to basic welcome email
      console.warn('SG_TPL_WELCOME template ID not found, using fallback HTML');
      const subject = `Welcome to TalentPatriot, ${userName}!`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1e40af; color: white; padding: 20px; text-align: center;">
            <h1>Welcome to TalentPatriot!</h1>
          </div>
          <div style="padding: 30px; background: #f8fafc;">
            <h2 style="color: #1e40af;">Welcome aboard, ${userName}!</h2>
            <p>Thank you for joining TalentPatriot. Your account for <strong>${organizationName}</strong> is now ready.</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #374151;">Getting Started</h3>
              <p>As a <strong>${userRole}</strong>, you have access to powerful recruitment tools to help you find and hire the best candidates.</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="/dashboard" style="background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Access Your Dashboard
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px;">
              If you have any questions, our support team is here to help.
            </p>
          </div>
        </div>
      `;

      return await sendEmail({
        to: userEmail,
        from: this.fromEmail,
        subject,
        html,
        text: `Welcome to TalentPatriot, ${userName}! Your account for ${organizationName} is ready. Visit /dashboard to get started.`
      });
    }
  }

  async sendJobOffer(
    candidateEmail: string,
    candidateName: string,
    jobTitle: string,
    organizationName: string,
    offerDetails: {
      department?: string;
      startDate?: string;
      employmentType?: string;
      workLocation?: string;
      reportingManager?: string;
      salaryAmount?: string;
      salaryPeriod?: string;
      bonusEligible?: boolean;
      bonusDetails?: string;
      benefits?: string[];
      offerDetails?: string;
      offerPortalUrl?: string;
      responseDeadline?: string;
      hiringManagerName?: string;
      hiringManagerEmail?: string;
      organizationLogo?: string;
      organizationAddress?: string;
    } = {}
  ): Promise<boolean> {
    const templateId = this.getTemplateId('SG_TPL_OFFER');
    
    if (templateId) {
      // Use dynamic template
      const templateData = {
        organization_name: organizationName,
        organization_logo: offerDetails.organizationLogo,
        organization_address: offerDetails.organizationAddress,
        candidate_name: candidateName,
        job_title: jobTitle,
        department: offerDetails.department,
        start_date: offerDetails.startDate,
        employment_type: offerDetails.employmentType || 'Full-time',
        work_location: offerDetails.workLocation,
        reporting_manager: offerDetails.reportingManager,
        salary_amount: offerDetails.salaryAmount,
        salary_period: offerDetails.salaryPeriod || 'annually',
        bonus_eligible: offerDetails.bonusEligible || false,
        bonus_details: offerDetails.bonusDetails,
        benefits: offerDetails.benefits || [],
        offer_details: offerDetails.offerDetails,
        offer_portal_url: offerDetails.offerPortalUrl,
        response_deadline: offerDetails.responseDeadline,
        hiring_manager_name: offerDetails.hiringManagerName,
        hiring_manager_email: offerDetails.hiringManagerEmail,
      };

      return await sendDynamicEmail({
        to: candidateEmail,
        from: this.fromEmail,
        templateId,
        dynamicTemplateData: templateData,
        subject: `Job Offer: ${jobTitle} at ${organizationName}` // Fallback subject
      });
    } else {
      // Fallback to basic offer email
      console.warn('SG_TPL_OFFER template ID not found, using fallback HTML');
      const subject = `Job Offer: ${jobTitle} at ${organizationName}`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1e40af; color: white; padding: 20px; text-align: center;">
            <h1>TalentPatriot</h1>
          </div>
          <div style="padding: 30px; background: #f8fafc;">
            <h2 style="color: #1e40af;">Congratulations! Job Offer</h2>
            <p>Dear ${candidateName},</p>
            <p>We are pleased to offer you the position of <strong>${jobTitle}</strong> at <strong>${organizationName}</strong>.</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #374151;">Offer Details</h3>
              <p><strong>Position:</strong> ${jobTitle}</p>
              <p><strong>Start Date:</strong> ${offerDetails.startDate || 'To be determined'}</p>
              <p><strong>Employment Type:</strong> ${offerDetails.employmentType || 'Full-time'}</p>
              ${offerDetails.salaryAmount ? `<p><strong>Salary:</strong> ${offerDetails.salaryAmount} ${offerDetails.salaryPeriod || 'annually'}</p>` : ''}
            </div>
            
            <p>Please review the complete offer details and let us know your decision by ${offerDetails.responseDeadline || 'your earliest convenience'}.</p>
            
            <p style="color: #6b7280; font-size: 14px;">
              We look forward to welcoming you to our team!
            </p>
          </div>
        </div>
      `;

      return await sendEmail({
        to: candidateEmail,
        from: this.fromEmail,
        subject,
        html,
        text: `Job offer: ${jobTitle} at ${organizationName}. Please review the offer details and respond by ${offerDetails.responseDeadline || 'your earliest convenience'}.`
      });
    }
  }

  async sendTeamAlert(
    teamMemberEmail: string,
    alertType: string,
    message: string,
    organizationName: string
  ): Promise<boolean> {
    const subject = `TalentPatriot Alert: ${alertType}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1e40af; color: white; padding: 20px; text-align: center;">
          <h1>TalentPatriot</h1>
        </div>
        <div style="padding: 30px; background: #f8fafc;">
          <h2 style="color: #1e40af;">${alertType}</h2>
          <p>Hello,</p>
          <p>You have a new notification from your TalentPatriot ATS system at <strong>${organizationName}</strong>:</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p>${message}</p>
          </div>
          
          <p style="color: #6b7280; font-size: 14px;">
            This is an automated notification from TalentPatriot ATS.
          </p>
        </div>
      </div>
    `;

    return await sendEmail({
      to: teamMemberEmail,
      from: this.fromEmail,
      subject,
      html,
      text: `${alertType}: ${message}`
    });
  }
}

export const atsEmailService = new ATSEmailService();