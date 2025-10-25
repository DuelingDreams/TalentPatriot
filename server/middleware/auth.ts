import type { Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase';
import { storage } from '../storage';

/**
 * Extended request with authenticated user information
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    orgId?: string;
  };
}

/**
 * Development auth configuration matching client/src/utils/devAuth.ts
 */
const isDevelopment = process.env.NODE_ENV === 'development';
const DEV_HILDEBRAND_USER = {
  id: '81a2aecb-4355-4b83-9b05-27ac4c3020ff',
  email: 'mentalcastlecoach@gmail.com',
  role: 'hiring_manager',
  orgId: '64eea1fa-1993-4966-bbd8-3d5109957c20' // Hildebrand Consulting Group
};

/**
 * Middleware to extract authenticated user from session
 * Sets req.user with userId, email, role, and orgId
 * Supports both Bearer tokens (API calls) and cookies (browser redirects)
 * In development mode, uses hardcoded user to match frontend devAuth
 */
export async function extractAuthUser(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // DEVELOPMENT MODE: Use hardcoded user to match frontend devAuth
    if (isDevelopment) {
      req.user = {
        id: DEV_HILDEBRAND_USER.id,
        email: DEV_HILDEBRAND_USER.email,
        role: DEV_HILDEBRAND_USER.role,
        orgId: DEV_HILDEBRAND_USER.orgId,
      };
      return next();
    }

    // PRODUCTION MODE: Validate with Supabase
    let token: string | undefined;
    
    // Try to get token from Authorization header first (API calls)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
    
    // If no Bearer token, try to extract from Supabase cookies (browser redirects for OAuth)
    if (!token) {
      // Supabase stores access token in cookies with name like 'sb-{project-ref}-auth-token'
      const cookieHeader = req.headers.cookie;
      if (cookieHeader) {
        // Parse cookies and look for Supabase auth token
        const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
          const [key, value] = cookie.trim().split('=');
          acc[key] = value;
          return acc;
        }, {} as Record<string, string>);
        
        // Look for Supabase auth cookie (format: sb-{project-ref}-auth-token)
        const authCookieKey = Object.keys(cookies).find(key => 
          key.startsWith('sb-') && key.endsWith('-auth-token')
        );
        
        if (authCookieKey) {
          try {
            const cookieValue = decodeURIComponent(cookies[authCookieKey]);
            const sessionData = JSON.parse(cookieValue);
            token = sessionData?.access_token || sessionData?.[0];
          } catch (e) {
            // Cookie parsing failed, continue without auth
          }
        }
      }
    }
    
    // If still no token, continue without auth
    if (!token) {
      return next();
    }
    
    // Get user from Supabase auth token
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return next(); // Invalid token - continue without auth
    }

    // Get user profile for role and org information
    const userProfile = await storage.auth.getUserProfile(user.id);
    
    // Get user's current organization
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
    next(); // Continue without auth on error
  }
}

/**
 * Middleware to require authenticated user
 * Must be used after extractAuthUser middleware
 */
export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user || !req.user.id) {
    res.status(401).json({ 
      error: 'Authentication required',
      code: 'AUTH_REQUIRED' 
    });
    return;
  }
  next();
}

/**
 * Middleware to require organization context
 * Ensures req.user.orgId is present
 */
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
