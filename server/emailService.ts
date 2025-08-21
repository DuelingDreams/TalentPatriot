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

// Email templates for ATS notifications
export class ATSEmailService {
  private fromEmail: string = 'noreply@talentpatriot.com';

  async sendNewApplicationNotification(
    hiringManagerEmail: string,
    candidateName: string,
    jobTitle: string,
    organizationName: string
  ): Promise<boolean> {
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
    organizationName: string
  ): Promise<boolean> {
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