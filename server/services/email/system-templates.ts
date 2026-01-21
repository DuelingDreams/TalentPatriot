export interface SystemTemplate {
  type: string;
  subject: string;
  html: string;
  variables: string[];
}

export const SYSTEM_TEMPLATES: Record<string, SystemTemplate> = {
  BETA_MAGIC_LINK_INVITATION: {
    type: 'beta_magic_link_invitation',
    subject: "You're Approved! Welcome to TalentPatriot Beta",
    variables: ['first_name', 'magic_link'],
    html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" lang="en">
  <head>
    <meta content="width=device-width" name="viewport" />
    <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta content="IE=edge" http-equiv="X-UA-Compatible" />
    <meta content="telephone=no,address=no,email=no,date=no,url=no" name="format-detection" />
  </head>
  <body style="margin: 0; padding: 0; background-color: #f3f4f6;">
    <div style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0" data-skip-in-text="true">
      Your TalentPatriot beta account is ready — click to get started!
    </div>
    <table border="0" width="100%" cellpadding="0" cellspacing="0" role="presentation" align="center">
      <tbody>
        <tr>
          <td>
            <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; font-size: 1.0769230769230769em; min-height: 100%; line-height: 155%">
              <tbody>
                <tr>
                  <td>
                    <table align="left" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="align: left; width: 100%; padding-left: 0px; padding-right: 0px; line-height: 155%; max-width: 600px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif">
                      <tbody>
                        <tr>
                          <td style="padding: 40px 20px;">
                            <p style="margin: 0; padding: 0; font-size: 1em; padding-top: 0.5em; padding-bottom: 0.5em;">
                              <span>Hi {{first_name}},</span>
                            </p>
                            <p style="margin: 0; padding: 0; font-size: 1em; padding-top: 0.5em; padding-bottom: 0.5em;">
                              <br />
                            </p>
                            <p style="margin: 0; padding: 0; font-size: 1em; padding-top: 0.5em; padding-bottom: 0.5em;">
                              <span>Great news! You've been approved for the <strong>TalentPatriot Beta Program</strong> 🎉</span>
                            </p>
                            <p style="margin: 0; padding: 0; font-size: 1em; padding-top: 0.5em; padding-bottom: 0.5em;">
                              <br />
                            </p>
                            <p style="margin: 0; padding: 0; font-size: 1em; padding-top: 0.5em; padding-bottom: 0.5em;">
                              <span>Click the button below to access your account and get started:</span>
                            </p>
                            <p style="margin: 0; padding: 0; font-size: 1em; padding-top: 1.5em; padding-bottom: 1.5em; text-align: center;">
                              <a href="{{magic_link}}" style="display: inline-block; background-color: #1E3A5F; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Access Your Account</a>
                            </p>
                            <p style="margin: 0; padding: 0; font-size: 0.9em; color: #6b7280; padding-top: 0.5em; padding-bottom: 0.5em; text-align: center;">
                              <span>This link expires in 24 hours</span>
                            </p>
                            <p style="margin: 0; padding: 0; font-size: 1em; padding-top: 1em; padding-bottom: 0.5em;">
                              <strong>What's next?</strong>
                            </p>
                            <ul style="margin: 0; padding-left: 20px;">
                              <li style="padding-top: 0.25em; padding-bottom: 0.25em;">Complete your company profile setup</li>
                              <li style="padding-top: 0.25em; padding-bottom: 0.25em;">Invite your team members</li>
                              <li style="padding-top: 0.25em; padding-bottom: 0.25em;">Create your first job posting</li>
                              <li style="padding-top: 0.25em; padding-bottom: 0.25em;">Start managing candidates</li>
                            </ul>
                            <p style="margin: 0; padding: 0; font-size: 1em; padding-top: 1em; padding-bottom: 0.5em;">
                              <span>As a beta user, you'll have direct access to our team for feedback and support. We're excited to have you on board!</span>
                            </p>
                            <p style="margin: 0; padding: 0; font-size: 1em; padding-top: 1em; padding-bottom: 0.5em;">
                              <span>Questions? Reply to this email or reach us at <a href="mailto:contact@talentpatriot.com" style="color: #14B8A6;">contact@talentpatriot.com</a>.</span>
                            </p>
                            <p style="margin: 0; padding: 0; font-size: 1em; padding-top: 1em; padding-bottom: 0.5em;">
                              <span>—</span>
                            </p>
                            <p style="margin: 0; padding: 0; font-size: 1em; padding-top: 0.25em; padding-bottom: 0.25em;">
                              <strong>The TalentPatriot Team</strong>
                            </p>
                            <p style="margin: 0; padding: 0; font-size: 0.9em; color: #6b7280; padding-top: 0.25em; padding-bottom: 0.5em;">
                              <span>Building recruiting tools for teams that value clarity, speed, and trust</span>
                            </p>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  </body>
</html>`,
  },
  BETA_APPLICATION_CONFIRMATION: {
    type: 'beta_application_confirmation',
    subject: 'Thanks for Applying to TalentPatriot Beta!',
    variables: ['first_name'],
    html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" lang="en">
  <head>
    <meta content="width=device-width" name="viewport" />
    <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta content="IE=edge" http-equiv="X-UA-Compatible" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta content="telephone=no,address=no,email=no,date=no,url=no" name="format-detection" />
  </head>
  <body style="margin: 0; padding: 0; background-color: #f3f4f6;">
    <div style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0" data-skip-in-text="true">
      We've received your application — we'll be in touch with next steps.
    </div>
    <table border="0" width="100%" cellpadding="0" cellspacing="0" role="presentation" align="center">
      <tbody>
        <tr>
          <td>
            <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; font-size: 1.0769230769230769em; min-height: 100%; line-height: 155%">
              <tbody>
                <tr>
                  <td>
                    <table align="left" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="align: left; width: 100%; padding-left: 0px; padding-right: 0px; line-height: 155%; max-width: 600px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif">
                      <tbody>
                        <tr>
                          <td style="padding: 40px 20px;">
                            <p style="margin: 0; padding: 0; font-size: 1em; padding-top: 0.5em; padding-bottom: 0.5em;">
                              <span>Hi {{first_name}},</span>
                            </p>
                            <p style="margin: 0; padding: 0; font-size: 1em; padding-top: 0.5em; padding-bottom: 0.5em;">
                              <br />
                            </p>
                            <p style="margin: 0; padding: 0; font-size: 1em; padding-top: 0.5em; padding-bottom: 0.5em;">
                              <span>Thanks for applying for early access to <strong>TalentPatriot</strong> 👋</span>
                            </p>
                            <p style="margin: 0; padding: 0; font-size: 1em; padding-top: 0.5em; padding-bottom: 0.5em;">
                              <br />
                            </p>
                            <p style="margin: 0; padding: 0; font-size: 1em; padding-top: 0.5em; padding-bottom: 0.5em;">
                              <span>We've received your beta application and really appreciate your interest in helping shape a better recruiting platform for small businesses and boutique staffing teams.</span>
                            </p>
                            <p style="margin: 0; padding: 0; font-size: 1em; padding-top: 0.5em; padding-bottom: 0.5em;">
                              <br />
                            </p>
                            <p style="margin: 0; padding: 0; font-size: 1em; padding-top: 0.5em; padding-bottom: 0.5em;">
                              <strong>What happens next?</strong>
                            </p>
                            <p style="margin: 0; padding: 0; font-size: 1em; padding-top: 0.5em; padding-bottom: 0.5em;">
                              <br />
                            </p>
                            <ul style="margin: 0; padding-left: 20px;">
                              <li style="padding-top: 0.25em; padding-bottom: 0.25em;">Our team is reviewing applications on a rolling basis</li>
                              <li style="padding-top: 0.25em; padding-bottom: 0.25em;">If selected, you'll receive an invite with setup instructions and onboarding access</li>
                              <li style="padding-top: 0.25em; padding-bottom: 0.25em;">We may reach out with a quick follow-up question to better understand your use case</li>
                            </ul>
                            <p style="margin: 0; padding: 0; font-size: 1em; padding-top: 0.5em; padding-bottom: 0.5em;">
                              <br />
                            </p>
                            <p style="margin: 0; padding: 0; font-size: 1em; padding-top: 0.5em; padding-bottom: 0.5em;">
                              <strong>Why beta?</strong>
                            </p>
                            <p style="margin: 0; padding: 0; font-size: 1em; padding-top: 0.5em; padding-bottom: 0.5em;">
                              <br />
                            </p>
                            <p style="margin: 0; padding: 0; font-size: 1em; padding-top: 0.5em; padding-bottom: 0.5em;">
                              <span>Beta users get:</span>
                            </p>
                            <ul style="margin: 0; padding-left: 20px;">
                              <li style="padding-top: 0.25em; padding-bottom: 0.25em;">Early access to new features</li>
                              <li style="padding-top: 0.25em; padding-bottom: 0.25em;">Direct influence on product direction</li>
                              <li style="padding-top: 0.25em; padding-bottom: 0.25em;">Priority support and feedback loops with our team</li>
                            </ul>
                            <p style="margin: 0; padding: 0; font-size: 1em; padding-top: 0.5em; padding-bottom: 0.5em;">
                              <br />
                            </p>
                            <p style="margin: 0; padding: 0; font-size: 1em; padding-top: 0.5em; padding-bottom: 0.5em;">
                              <span>If you have any questions in the meantime, feel free to reply to this email or reach us at <a href="mailto:contact@talentpatriot.com" style="color: #14B8A6;">contact@talentpatriot.com</a>.</span>
                            </p>
                            <p style="margin: 0; padding: 0; font-size: 1em; padding-top: 0.5em; padding-bottom: 0.5em;">
                              <br />
                            </p>
                            <p style="margin: 0; padding: 0; font-size: 1em; padding-top: 0.5em; padding-bottom: 0.5em;">
                              <span>Thanks again for your interest — we're excited to build this with you.</span>
                            </p>
                            <p style="margin: 0; padding: 0; font-size: 1em; padding-top: 1em; padding-bottom: 0.5em;">
                              <span>—</span>
                            </p>
                            <p style="margin: 0; padding: 0; font-size: 1em; padding-top: 0.25em; padding-bottom: 0.25em;">
                              <strong>The TalentPatriot Team</strong>
                            </p>
                            <p style="margin: 0; padding: 0; font-size: 0.9em; color: #6b7280; padding-top: 0.25em; padding-bottom: 0.5em;">
                              <span>Building recruiting tools for teams that value clarity, speed, and trust</span>
                            </p>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  </body>
</html>`,
  },
};
