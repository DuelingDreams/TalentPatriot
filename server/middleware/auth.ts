import type { Request, Response, NextFunction } from 'express';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { storage } from '../storage';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    orgId?: string;
  };
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabaseAdmin: SupabaseClient | null = null;
if (supabaseUrl && supabaseServiceKey) {
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  console.log('✅ Supabase admin client initialized for organization creation');
} else {
  console.warn('⚠️ Supabase credentials missing - organization creation may fail');
}

export { supabaseAdmin };

export async function extractAuthUser(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    let token: string | undefined;
    
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
    
    if (!token) {
      const cookieHeader = req.headers.cookie;
      if (cookieHeader) {
        const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
          const [key, value] = cookie.trim().split('=');
          acc[key] = value;
          return acc;
        }, {} as Record<string, string>);
        
        const authCookieKey = Object.keys(cookies).find(key => 
          key.startsWith('sb-') && key.endsWith('-auth-token')
        );
        
        if (authCookieKey) {
          try {
            const cookieValue = decodeURIComponent(cookies[authCookieKey]);
            const sessionData = JSON.parse(cookieValue);
            token = sessionData?.access_token || sessionData?.[0];
          } catch (e) {
            // Cookie parsing failed
          }
        }
      }
    }
    
    if (!token) {
      return next();
    }
    
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return next();
    }

    const userProfile = await storage.auth.getUserProfile(user.id);
    const orgId = user.user_metadata?.currentOrgId || req.headers['x-org-id'] as string;

    req.user = {
      id: user.id,
      email: user.email || '',
      role: userProfile?.role || 'hiring_manager',
      orgId: orgId,
    };

    next();
  } catch (error) {
    console.error('Auth extraction error:', error);
    next();
  }
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Authentication required', code: 'AUTH_REQUIRED' });
      return;
    }

    const token = authHeader.substring(7);
    if (!supabaseAdmin) {
      res.status(500).json({ error: 'Authentication system unavailable', code: 'AUTH_SYSTEM_UNAVAILABLE' });
      return;
    }

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) {
      res.status(401).json({ error: 'Invalid authentication token', code: 'INVALID_TOKEN' });
      return;
    }

    const userProfile = await storage.auth.getUserProfile(user.id);
    const orgId = user.user_metadata?.currentOrgId || req.headers['x-org-id'] as string;
    
    req.user = {
      id: user.id,
      email: user.email || '',
      role: userProfile?.role || 'hiring_manager',
      orgId: orgId
    };

    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    res.status(500).json({ error: 'Authentication check failed', code: 'AUTH_CHECK_FAILED' });
  }
}

export function requireOrgContext(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user || !req.user.orgId) {
    res.status(400).json({ 
      error: 'Organization context required',
      code: 'ORG_CONTEXT_REQUIRED' 
    });
    return;
  }
  next();
}

export function requirePlatformAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'AUTH_REQUIRED' });
    return;
  }

  const platformAdminRoles = ['platform_admin'];
  if (!platformAdminRoles.includes(req.user.role)) {
    res.status(403).json({ 
      error: 'Platform admin access required for beta application management', 
      code: 'INSUFFICIENT_PERMISSIONS',
      userRole: req.user.role,
      requiredRoles: platformAdminRoles
    });
    return;
  }

  next();
}

export async function requireOrgAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'AUTH_REQUIRED' });
    return;
  }

  const orgId = req.params.orgId || req.headers['x-org-id'] as string;
  if (!orgId) {
    res.status(400).json({ error: 'Organization ID required', code: 'ORG_ID_REQUIRED' });
    return;
  }

  try {
    const userOrg = await storage.auth.getUserOrganization(req.user.id, orgId);
    const organization = await storage.auth.getOrganization(orgId);
    
    const isOrgAdmin = userOrg?.role === 'admin' || organization?.ownerId === req.user.id;
    
    if (!isOrgAdmin) {
      res.status(403).json({ 
        error: 'Organization admin access required', 
        code: 'INSUFFICIENT_PERMISSIONS',
        userRole: userOrg?.role || 'none'
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Organization admin check error:', error);
    res.status(500).json({ error: 'Authorization check failed', code: 'AUTH_CHECK_FAILED' });
  }
}

export async function requireRecruiting(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'AUTH_REQUIRED' });
    return;
  }

  const orgId = req.params.orgId || req.headers['x-org-id'] as string;
  if (!orgId) {
    res.status(400).json({ error: 'Organization ID required', code: 'ORG_ID_REQUIRED' });
    return;
  }

  try {
    const userOrg = await storage.auth.getUserOrganization(req.user.id, orgId);
    
    const hasRecruiterRole = userOrg?.role === 'recruiter' || userOrg?.role === 'admin';
    const hasHiringManagerWithSeat = userOrg?.role === 'hiring_manager' && userOrg?.isRecruiterSeat;
    
    if (!hasRecruiterRole && !hasHiringManagerWithSeat) {
      res.status(403).json({ 
        error: 'Recruiting access required', 
        code: 'RECRUITING_ACCESS_REQUIRED',
        message: 'This feature requires a recruiter role or hiring manager with recruiter seat.',
        userRole: userOrg?.role || 'none',
        hasRecruiterSeat: userOrg?.isRecruiterSeat || false
      });
      return;
    }

    if (userOrg?.role !== 'admin' && !userOrg?.isRecruiterSeat) {
      res.status(403).json({ 
        error: 'Paid recruiter seat required', 
        code: 'RECRUITER_SEAT_REQUIRED',
        message: 'This feature requires a paid recruiter seat. Contact your organization admin to upgrade.'
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Recruiting access check error:', error);
    res.status(500).json({ error: 'Authorization check failed', code: 'AUTH_CHECK_FAILED' });
  }
}
