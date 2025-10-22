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
 * Middleware to extract authenticated user from session
 * Sets req.user with userId, email, role, and orgId
 */
export async function extractAuthUser(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without auth - routes can choose to require it
    }

    const token = authHeader.substring(7);
    
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
