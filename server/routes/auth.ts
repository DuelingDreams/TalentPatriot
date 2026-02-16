import { Router } from 'express';
import { z } from 'zod';
import { storage } from '../storage/index';
import { supabaseAdmin } from '../middleware/auth';
import { authLimiter } from '../middleware/rate-limit';
import { sendEmail } from '../services/email';

export function createAuthRoutes() {
  const router = Router();

  router.post('/api/auth/forgot-password', authLimiter, async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Please enter a valid email address' });
      }

      if (!supabaseAdmin) {
        console.error('Supabase admin client not available - missing environment variables');
        return res.status(500).json({ error: 'Password reset service unavailable' });
      }

      const protocol = req.get('X-Forwarded-Proto') || (req.secure ? 'https' : 'http');
      const host = req.get('Host');
      const redirectUrl = `${protocol}://${host}/reset-password`;

      const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        console.error('Supabase reset password error:', error);
        return res.status(500).json({ error: 'Failed to send reset email' });
      }

      res.status(200).json({ 
        message: 'If that email is registered, you\'ll receive a password reset link shortly.' 
      });

    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ error: 'Failed to send reset email' });
    }
  });

  router.post('/api/test-email', async (req, res) => {
    try {
      const { 
        sendEmail, 
        sendNewApplicationNotification, 
        sendInterviewReminder, 
        sendStatusUpdate 
      } = await import('../services/email');
      const { testType } = req.body;
      
      console.log('🔧 Testing email integration...');
      
      let result: { success: boolean };
      
      if (testType === 'application_notification') {
        result = await sendNewApplicationNotification(
          'hiring-manager@example.com',
          'John Doe',
          'Senior Software Engineer',
          'TalentPatriot Demo Company'
        );
      } else if (testType === 'interview_reminder') {
        result = await sendInterviewReminder(
          'candidate@example.com',
          'Jane Smith', 
          'Product Manager',
          'Tomorrow, August 23rd at 2:00 PM EST',
          'TalentPatriot Demo Company'
        );
      } else if (testType === 'status_update') {
        result = await sendStatusUpdate(
          'candidate@example.com',
          'Jane Smith',
          'Product Manager',
          'Interview Scheduled',
          'TalentPatriot Demo Company'
        );
      } else {
        result = await sendEmail({
          to: 'test@example.com',
          subject: 'TalentPatriot Email Integration Test',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #1E3A5F 0%, #0EA5E9 100%); color: white; padding: 20px; text-align: center;">
                <h1>TalentPatriot</h1>
              </div>
              <div style="padding: 30px; background: #f8fafc;">
                <h2 style="color: #1E3A5F;">✅ Email Integration Confirmed</h2>
                <p>Your email service is working perfectly!</p>
                
                <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="color: #374151;">Email Notifications Now Active:</h3>
                  <ul style="color: #374151;">
                    <li>✅ New job application alerts</li>
                    <li>✅ Interview reminder notifications</li>
                    <li>✅ Candidate status update emails</li>
                    <li>✅ Hiring manager notifications</li>
                  </ul>
                </div>
                
                <p><strong>Test completed:</strong> ${new Date().toLocaleString()}</p>
                
                <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                  This confirms TalentPatriot can send emails through Resend.
                </p>
              </div>
            </div>
          `,
        });
      }
      
      if (result.success) {
        console.log('✅ Test email sent successfully');
        const responseMessage = testType ? 
          `${testType.replace('_', ' ')} email template test successful!` :
          'Email integration working perfectly!';
          
        res.json({ 
          success: true, 
          message: responseMessage,
          testType: testType || 'basic_integration',
          emailServiceStatus: 'active',
          provider: 'resend',
          notificationsReady: ['applications', 'interviews', 'status-updates', 'hiring-alerts'],
          timestamp: new Date().toISOString()
        });
      } else {
        console.log('❌ Email test failed');
        res.status(500).json({ 
          success: false, 
          message: 'Email test failed - check Resend API key',
          emailServiceStatus: 'inactive',
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Email test error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Email integration test failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        emailServiceStatus: 'error',
        timestamp: new Date().toISOString()
      });
    }
  });

  return router;
}
