import { Router } from 'express';
import { z } from 'zod';
import { storage } from '../storage/index';
import { supabase } from '../lib/supabase';
import { 
  type AuthenticatedRequest, 
  requireAuth, 
  requirePlatformAdmin, 
  requireOrgAdmin, 
  requireRecruiting,
  supabaseAdmin 
} from '../middleware/auth';
import { writeLimiter } from '../middleware/rate-limit';
import { addUserToOrganization, removeUserFromOrganization, getOrganizationUsers } from '../../lib/userService';

export function createOrganizationRoutes() {
  const router = Router();

  router.get("/api/organizations", async (req, res) => {
    try {
      const ownerId = req.query.ownerId as string;
      const organizations = await storage.auth.getOrganizations(ownerId);
      res.json(organizations);
    } catch (error) {
      console.error("Error fetching organizations:", error);
      res.status(500).json({ error: "Failed to fetch organizations" });
    }
  });

  router.get("/api/organizations/current", async (req, res) => {
    try {
      let orgId = req.headers['x-org-id'] as string;
      const userId = req.headers['x-user-id'] as string;
      
      if (!orgId && userId) {
        const userOrgs = await storage.auth.getUserOrganizations(userId);
        if (userOrgs && userOrgs.length > 0) {
          orgId = userOrgs[0].orgId;
        }
      }
      
      if (!orgId) {
        return res.status(400).json({ error: "Organization ID not provided and user has no organizations" });
      }
      
      const organization = await storage.auth.getOrganization(orgId);
      if (!organization) {
        return res.status(404).json({ error: "Organization not found" });
      }
      res.json(organization);
    } catch (error) {
      console.error("Error fetching current organization:", error);
      res.status(500).json({ error: "Failed to fetch organization" });
    }
  });

  router.get("/api/organizations/:id", async (req, res) => {
    try {
      const organization = await storage.auth.getOrganization(req.params.id);
      if (!organization) {
        res.status(404).json({ error: "Organization not found" });
        return;
      }
      res.json(organization);
    } catch (error) {
      console.error("Error fetching organization:", error);
      res.status(500).json({ error: "Failed to fetch organization" });
    }
  });

  router.post("/api/organizations", writeLimiter, async (req, res) => {
    try {
      const { name, ownerId, slug, metadata } = req.body;
      
      console.log('Creating organization:', { name, ownerId, slug });
      
      if (!supabaseAdmin) {
        return res.status(500).json({ 
          error: "Server configuration error - authentication system unavailable",
          code: "AUTH_SYSTEM_UNAVAILABLE"
        });
      }

      try {
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(ownerId);
        
        if (authError || !authUser?.user) {
          console.error('User not found in auth system:', authError);
          return res.status(400).json({ 
            error: "Invalid user ID. User must be registered through authentication system first.",
            code: "USER_NOT_FOUND",
            details: "Please ensure the user is properly authenticated before creating an organization."
          });
        }
        
        console.log('Auth user verified:', authUser.user.email);
      } catch (authCheckError) {
        console.error('Auth check error:', authCheckError);
        return res.status(400).json({ 
          error: "Unable to verify user authentication.",
          code: "AUTH_CHECK_FAILED"
        });
      }

      try {
        await storage.auth.ensureUserProfile(ownerId);
        console.log('User profile ensured for:', ownerId);
      } catch (userError) {
        const errorMessage = userError instanceof Error ? userError.message : String(userError);
        console.error('Failed to ensure user profile:', errorMessage);
        return res.status(500).json({ 
          error: "Failed to setup user profile",
          code: "PROFILE_SETUP_FAILED"
        });
      }
      
      const organization = await storage.auth.createOrganization({
        name,
        ownerId,
        slug
      });
      
      console.log('Organization created successfully:', organization.id);

      try {
        await supabaseAdmin.auth.admin.updateUserById(ownerId, {
          user_metadata: {
            currentOrgId: organization.id,
            primary_org_role: 'owner',
            role: 'admin',
            companyName: name,
            companySize: metadata?.companySize,
            onboardingCompleted: true
          }
        });
        
        console.log(`Updated user ${ownerId} metadata with orgId: ${organization.id}, primary_org_role: owner`);
      } catch (metaError) {
        console.warn('Failed to update user metadata (non-critical):', metaError);
      }
      
      res.status(201).json(organization);
    } catch (error) {
      console.error("Error creating organization:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      res.status(400).json({ 
        error: "Failed to create organization",
        details: errorMessage
      });
    }
  });

  router.put("/api/organizations/:id", writeLimiter, async (req, res) => {
    try {
      const organization = await storage.auth.updateOrganization(req.params.id, req.body);
      res.json(organization);
    } catch (error) {
      console.error("Error updating organization:", error);
      res.status(400).json({ error: "Failed to update organization" });
    }
  });

  router.delete("/api/organizations/:id", writeLimiter, async (req, res) => {
    try {
      await storage.auth.deleteOrganization(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting organization:", error);
      res.status(400).json({ error: "Failed to delete organization" });
    }
  });

  router.post('/api/organizations/:orgId/users', writeLimiter, async (req, res) => {
    const { orgId } = req.params;
    const { userId, role = 'hiring_manager' } = req.body;
    
    if (!orgId || !userId) {
      return res.status(400).json({ error: 'orgId and userId are required' });
    }

    if (!supabaseAdmin) {
      return res.status(500).json({ 
        error: "Server configuration error - authentication system unavailable",
        code: "AUTH_SYSTEM_UNAVAILABLE"
      });
    }

    try {
      console.log(`Assigning user ${userId} to organization ${orgId} with role ${role}`);

      const { data: existingMembership } = await supabaseAdmin
        .from('user_organizations')
        .select('id')
        .eq('org_id', orgId)
        .eq('user_id', userId)
        .single();

      if (!existingMembership) {
        const { error: insertErr } = await supabaseAdmin
          .from('user_organizations')
          .insert({ org_id: orgId, user_id: userId, role });
        
        if (insertErr) {
          console.error('Error inserting user-organization membership:', insertErr);
          throw insertErr;
        }
        
        console.log(`Created new membership for user ${userId} in organization ${orgId}`);
      } else {
        console.log(`User ${userId} already has membership in organization ${orgId}`);
      }

      const appRoleMap: Record<string, string> = {
        'owner': 'admin',
        'admin': 'admin',
        'hiring_manager': 'hiring_manager',
        'recruiter': 'recruiter',
        'interviewer': 'interviewer',
        'viewer': 'recruiter'
      };
      const mappedAppRole = appRoleMap[role] || 'recruiter';
      
      const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: { 
          currentOrgId: orgId, 
          primary_org_role: role,
          role: mappedAppRole
        },
      });
      
      if (updateErr) {
        console.error('Error updating user auth metadata:', updateErr);
        throw updateErr;
      }
      
      console.log(`Updated auth metadata for user ${userId} with orgId: ${orgId}, primary_org_role: ${role}, role: ${mappedAppRole}`);

      res.status(201).json({ success: true });
    } catch (err: unknown) {
      console.error('Error assigning user to organization:', err);
      return res.status(400).json({ error: (err as any).message || 'Failed to assign user' });
    }
  });

  router.get("/api/user-organizations", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      const orgId = req.query.orgId as string;
      const userOrganizations = await storage.auth.getUserOrganizations(userId, orgId);
      res.json(userOrganizations);
    } catch (error) {
      console.error("Error fetching user organizations:", error);
      res.status(500).json({ error: "Failed to fetch user organizations" });
    }
  });

  router.get("/api/user-organizations/:id", async (req, res) => {
    try {
      const userOrganization = await storage.auth.getUserOrganization(req.params.id);
      if (!userOrganization) {
        res.status(404).json({ error: "User organization not found" });
        return;
      }
      res.json(userOrganization);
    } catch (error) {
      console.error("Error fetching user organization:", error);
      res.status(500).json({ error: "Failed to fetch user organization" });
    }
  });

  router.get("/api/users/:userId/organizations", async (req, res) => {
    try {
      const userOrganizations = await storage.auth.getUserOrganizationsByUser(req.params.userId);
      res.json(userOrganizations);
    } catch (error) {
      console.error("Error fetching user organizations by user:", error);
      res.status(500).json({ error: "Failed to fetch user organizations" });
    }
  });

  router.get("/api/organizations/:orgId/users", async (req, res) => {
    try {
      const userOrganizations = await storage.auth.getUserOrganizationsByOrg(req.params.orgId);
      res.json(userOrganizations);
    } catch (error) {
      console.error("Error fetching user organizations by org:", error);
      res.status(500).json({ error: "Failed to fetch organization users" });
    }
  });

  router.post("/api/user-organizations", writeLimiter, async (req, res) => {
    try {
      const userOrganization = await storage.auth.createUserOrganization(req.body);
      res.status(201).json(userOrganization);
    } catch (error) {
      console.error("Error creating user organization:", error);
      res.status(400).json({ error: "Failed to create user organization" });
    }
  });

  router.put("/api/user-organizations/:id", writeLimiter, async (req, res) => {
    try {
      const userOrganization = await storage.auth.updateUserOrganization(req.params.id, req.body);
      res.json(userOrganization);
    } catch (error) {
      console.error("Error updating user organization:", error);
      res.status(400).json({ error: "Failed to update user organization" });
    }
  });

  router.delete("/api/user-organizations/:id", writeLimiter, async (req, res) => {
    try {
      await storage.auth.deleteUserOrganization(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting user organization:", error);
      res.status(400).json({ error: "Failed to delete user organization" });
    }
  });

  router.delete("/api/users/:userId/organizations/:orgId", writeLimiter, async (req, res) => {
    try {
      await storage.auth.deleteUserOrganizationByUserAndOrg(req.params.userId, req.params.orgId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing user from organization:", error);
      res.status(400).json({ error: "Failed to remove user from organization" });
    }
  });

  router.post('/api/organizations/:orgId/users', writeLimiter, async (req, res) => {
    const { orgId } = req.params;
    const { userId, role = 'recruiter' } = req.body;
    
    if (!orgId || !userId) {
      return res.status(400).json({ 
        error: 'orgId and userId are required',
        details: 'Both organization ID and user ID must be provided'
      });
    }

    const validRoles = ['owner', 'admin', 'hiring_manager', 'recruiter', 'interviewer', 'viewer'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({
        error: 'Invalid role',
        details: `Role must be one of: ${validRoles.join(', ')}`
      });
    }

    try {
      const result = await addUserToOrganization(orgId, userId, role);
      
      if (result.success) {
        return res.status(201).json({
          success: true,
          message: result.message,
          data: {
            orgId,
            userId,
            role
          }
        });
      } else {
        const statusCode = result.error === 'USER_ALREADY_MEMBER' ? 409 : 
                          result.error === 'ORGANIZATION_NOT_FOUND' ? 404 : 400;
        
        return res.status(statusCode).json({
          error: result.message,
          code: result.error
        });
      }
    } catch (error) {
      console.error('Error in user-organization assignment endpoint:', error);
      return res.status(500).json({ 
        error: 'Failed to assign user to organization',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  router.get('/api/organizations/:orgId/users/details', async (req, res) => {
    const { orgId } = req.params;
    
    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID is required' });
    }

    try {
      const result = await getOrganizationUsers(orgId);
      
      if (result.success) {
        return res.json({
          success: true,
          data: result.data
        });
      } else {
        return res.status(400).json({
          error: result.error
        });
      }
    } catch (error) {
      console.error('Error fetching organization users:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch organization users',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  router.get('/api/organizations/:orgId/email-settings', requireAuth, requireOrgAdmin, async (req, res) => {
    try {
      const { orgId } = req.params;
      const settings = await storage.communications.getOrganizationEmailSettings(orgId);
      res.json(settings);
    } catch (error) {
      console.error('Error fetching email settings:', error);
      res.status(500).json({ error: 'Failed to fetch email settings' });
    }
  });

  router.put('/api/organizations/:orgId/email-settings', requireAuth, requireOrgAdmin, async (req, res) => {
    try {
      const { orgId } = req.params;
      
      const { insertOrganizationEmailSettingsSchema } = await import('@shared/schema');
      const validatedData = insertOrganizationEmailSettingsSchema.parse(req.body);
      
      const settings = await storage.communications.updateOrganizationEmailSettings(orgId, validatedData);
      res.json(settings);
    } catch (error) {
      console.error('Error updating email settings:', error);
      if (error instanceof Error && error.name === 'ZodError') {
        res.status(400).json({ error: 'Invalid request data', details: (error as any).issues });
      } else {
        res.status(500).json({ error: 'Failed to update email settings' });
      }
    }
  });

  router.get('/api/organizations/:orgId/email-templates', requireAuth, requireRecruiting, async (req, res) => {
    try {
      const { orgId } = req.params;
      const templates = await storage.communications.getEmailTemplates(orgId);
      res.json(templates);
    } catch (error) {
      console.error('Error fetching email templates:', error);
      res.status(500).json({ error: 'Failed to fetch email templates' });
    }
  });

  router.post('/api/organizations/:orgId/email-templates', requireAuth, requireOrgAdmin, async (req, res) => {
    try {
      const { orgId } = req.params;
      
      const { insertEmailTemplateSchema } = await import('@shared/schema');
      const validatedData = insertEmailTemplateSchema.parse({ ...req.body, orgId });
      
      const template = await storage.communications.createEmailTemplate(validatedData);
      res.status(201).json(template);
    } catch (error) {
      console.error('Error creating email template:', error);
      if (error instanceof Error && error.name === 'ZodError') {
        res.status(400).json({ error: 'Invalid request data', details: (error as any).issues });
      } else {
        res.status(500).json({ error: 'Failed to create email template' });
      }
    }
  });

  router.put('/api/organizations/:orgId/email-templates/:templateId', requireAuth, requireOrgAdmin, async (req, res) => {
    try {
      const { orgId, templateId } = req.params;
      
      const { insertEmailTemplateSchema } = await import('@shared/schema');
      const validatedData = insertEmailTemplateSchema.partial().parse(req.body);
      
      const template = await storage.communications.updateEmailTemplate(templateId, orgId, validatedData);
      res.json(template);
    } catch (error) {
      console.error('Error updating email template:', error);
      if (error instanceof Error && error.name === 'ZodError') {
        res.status(400).json({ error: 'Invalid request data', details: (error as any).issues });
      } else {
        res.status(500).json({ error: 'Failed to update email template' });
      }
    }
  });

  router.delete('/api/organizations/:orgId/email-templates/:templateId', requireAuth, requireOrgAdmin, async (req, res) => {
    try {
      const { orgId, templateId } = req.params;
      await storage.communications.deleteEmailTemplate(templateId, orgId);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting email template:', error);
      res.status(500).json({ error: 'Failed to delete email template' });
    }
  });

  router.get('/api/organizations/:orgId/email-events', requireAuth, requireRecruiting, async (req, res) => {
    try {
      const { orgId } = req.params;
      const { limit = 50, eventType, status } = req.query;
      const events = await storage.communications.getEmailEvents(orgId, {
        limit: Number(limit),
        eventType: eventType as string,
        status: status as string
      });
      res.json(events);
    } catch (error) {
      console.error('Error fetching email events:', error);
      res.status(500).json({ error: 'Failed to fetch email events' });
    }
  });

  router.get('/api/organizations/branding', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const orgId = req.headers['x-org-id'] as string;
      const channel = req.query.channel as string || 'careers';
      
      if (!orgId) {
        return res.status(400).json({ error: 'Organization ID required' });
      }

      const userOrgs = await storage.auth.getUserOrganizations(req.user?.id, orgId);
      if (userOrgs.length === 0) {
        return res.status(403).json({ error: 'You do not have access to this organization' });
      }

      const { data: branding } = await supabaseAdmin
        .from('organization_branding')
        .select('*')
        .eq('org_id', orgId)
        .eq('channel', channel)
        .maybeSingle();

      res.json(branding || {});
    } catch (error) {
      console.error('Error fetching branding:', error);
      res.status(500).json({ error: 'Failed to fetch branding' });
    }
  });

  const brandingSchema = z.object({
    channel: z.string().default('careers'),
    primary_color: z.string().optional(),
    accent_color: z.string().optional(),
    tagline: z.string().max(100).optional(),
    about_text: z.string().max(500).optional(),
    logo_url: z.string().url().optional().nullable(),
    favicon_url: z.string().url().optional().nullable(),
    custom_css: z.string().max(5000).optional(),
  });

  router.post('/api/organizations/branding', requireAuth, writeLimiter, async (req: AuthenticatedRequest, res) => {
    try {
      const orgId = req.headers['x-org-id'] as string;
      
      if (!orgId) {
        return res.status(400).json({ error: 'Organization ID required' });
      }

      const userOrgs = await storage.auth.getUserOrganizations(req.user?.id, orgId);
      if (userOrgs.length === 0) {
        return res.status(403).json({ error: 'You do not have access to this organization' });
      }

      const validatedData = brandingSchema.parse(req.body);
      const { channel, primary_color, accent_color, tagline, about_text, logo_url, favicon_url, custom_css } = validatedData;

      const { data: branding, error } = await supabaseAdmin
        .from('organization_branding')
        .upsert({
          org_id: orgId,
          channel,
          primary_color,
          accent_color,
          tagline,
          about_text,
          logo_url,
          favicon_url,
          custom_css,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'org_id,channel',
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving branding:', error);
        return res.status(500).json({ error: 'Failed to save branding' });
      }

      res.json(branding);
    } catch (error) {
      console.error('Error saving branding:', error);
      res.status(500).json({ error: 'Failed to save branding' });
    }
  });

  router.post('/api/organizations/publish-careers', requireAuth, writeLimiter, async (req: AuthenticatedRequest, res) => {
    try {
      const orgId = req.headers['x-org-id'] as string;
      
      if (!orgId) {
        return res.status(400).json({ error: 'Organization ID required' });
      }

      const userOrgs = await storage.auth.getUserOrganizations(req.user?.id, orgId);
      const userOrg = userOrgs.length > 0 ? userOrgs[0] : null;
      
      if (!userOrg || (userOrg.role !== 'admin' && userOrg.role !== 'owner' && userOrg.role !== 'hiring_manager')) {
        return res.status(403).json({ error: 'Admin access required to publish careers portal' });
      }

      const { data: org, error } = await supabaseAdmin
        .from('organizations')
        .update({
          careers_published: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orgId)
        .select()
        .single();

      if (error) {
        console.error('Error publishing careers:', error);
        return res.status(500).json({ error: 'Failed to publish careers portal' });
      }

      res.json({ success: true, organization: org });
    } catch (error) {
      console.error('Error publishing careers:', error);
      res.status(500).json({ error: 'Failed to publish careers portal' });
    }
  });

  router.get('/api/organizations/current', requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const orgId = req.headers['x-org-id'] as string;
      
      if (!orgId) {
        return res.status(400).json({ error: 'Organization ID required' });
      }

      const userOrgs = await storage.auth.getUserOrganizations(req.user?.id, orgId);
      if (userOrgs.length === 0) {
        return res.status(403).json({ error: 'You do not have access to this organization' });
      }

      const { data: org } = await supabaseAdmin
        .from('organizations')
        .select('id, name, slug, company_size, careers_published, created_at')
        .eq('id', orgId)
        .single();

      res.json(org || {});
    } catch (error) {
      console.error('Error fetching current org:', error);
      res.status(500).json({ error: 'Failed to fetch organization' });
    }
  });

  router.get('/api/user/profile', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const token = authHeader.replace('Bearer ', '');
      if (!supabaseAdmin) {
        return res.status(500).json({ error: 'Server configuration error' });
      }

      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
      
      if (error || !user) {
        return res.status(401).json({ error: 'Invalid authentication' });
      }

      const profile = await storage.auth.getUserProfile(user.id);
      
      res.json({
        id: user.id,
        email: user.email,
        ...profile
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      res.status(500).json({ error: 'Failed to fetch user profile' });
    }
  });

  router.put('/api/user/profile', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const token = authHeader.replace('Bearer ', '');
      if (!supabaseAdmin) {
        return res.status(500).json({ error: 'Server configuration error' });
      }

      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
      
      if (error || !user) {
        return res.status(401).json({ error: 'Invalid authentication' });
      }

      const profileData = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        phone: req.body.phone,
        jobTitle: req.body.jobTitle,
        department: req.body.department,
        location: req.body.location,
        bio: req.body.bio,
      };

      const updatedProfile = await storage.auth.updateUserProfile(user.id, profileData);
      res.json(updatedProfile);
    } catch (error) {
      console.error('Error updating user profile:', error);
      res.status(500).json({ error: 'Failed to update user profile' });
    }
  });

  router.get('/api/user/settings', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const token = authHeader.replace('Bearer ', '');
      if (!supabaseAdmin) {
        return res.status(500).json({ error: 'Server configuration error' });
      }

      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
      
      if (error || !user) {
        return res.status(401).json({ error: 'Invalid authentication' });
      }

      const settings = await storage.auth.getUserSettings(user.id);
      res.json(settings);
    } catch (error) {
      console.error('Error fetching user settings:', error);
      res.status(500).json({ error: 'Failed to fetch user settings' });
    }
  });

  router.put('/api/user/settings', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ') ) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const token = authHeader.replace('Bearer ', '');
      if (!supabaseAdmin) {
        return res.status(500).json({ error: 'Server configuration error' });
      }

      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
      
      if (error || !user) {
        return res.status(401).json({ error: 'Invalid authentication' });
      }

      const settingsData = {
        userId: user.id,
        emailNotifications: req.body.emailNotifications,
        browserNotifications: req.body.browserNotifications,
        weeklyReports: req.body.weeklyReports,
        teamInvites: req.body.teamInvites,
        publicProfile: req.body.publicProfile,
      };

      const updatedSettings = await storage.auth.updateUserSettings(user.id, settingsData);
      res.json(updatedSettings);
    } catch (error) {
      console.error('Error updating user settings:', error);
      res.status(500).json({ error: 'Failed to update user settings' });
    }
  });

  router.delete('/api/organizations/:orgId/users/:userId', writeLimiter, async (req, res) => {
    const { orgId, userId } = req.params;
    
    if (!orgId || !userId) {
      return res.status(400).json({ 
        error: 'orgId and userId are required' 
      });
    }

    try {
      const result = await removeUserFromOrganization(orgId, userId);
      
      if (result.success) {
        return res.status(200).json({
          success: true,
          message: result.message
        });
      } else {
        const statusCode = result.error === 'USER_NOT_MEMBER' ? 404 : 
                          result.error === 'CANNOT_REMOVE_OWNER' ? 403 : 400;
        
        return res.status(statusCode).json({
          error: result.message,
          code: result.error
        });
      }
    } catch (error) {
      console.error('Error removing user from organization:', error);
      return res.status(500).json({ 
        error: 'Failed to remove user from organization',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  return router;
}
