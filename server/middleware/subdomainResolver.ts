import { Request, Response, NextFunction } from 'express';
import { DatabaseStorage } from '../storage';

// Extend Express Request to include organization data
declare global {
  namespace Express {
    interface Request {
      organization?: {
        id: string;
        name: string;
        slug: string;
      };
    }
  }
}

const storage = new DatabaseStorage();

/**
 * Middleware to resolve organization from subdomain
 * Supports patterns like:
 * - company-name.talentpatriot.app
 * - company-name.localhost:5000 (development)
 */
export async function subdomainResolver(req: Request, res: Response, next: NextFunction) {
  try {
    const host = req.get('host');
    if (!host) {
      return next();
    }

    // Skip processing for API requests - they don't need organization context from subdomain
    if (req.path.startsWith('/api/') || req.path.startsWith('/_vite') || req.path.startsWith('/node_modules')) {
      return next();
    }

    // Extract subdomain from host
    const subdomain = extractSubdomain(host);
    
    if (!subdomain) {
      // No subdomain, continue without organization context
      return next();
    }

    // Find organization by slug (subdomain)
    const organizations = await storage.getOrganizations();
    const organization = organizations.find(org => 
      org.slug === subdomain || 
      org.name.toLowerCase().replace(/[^a-z0-9]/g, '-') === subdomain
    );

    if (organization) {
      req.organization = {
        id: organization.id,
        name: organization.name,
        slug: organization.slug || subdomain
      };
      
      console.log(`[SUBDOMAIN] Resolved ${subdomain} → ${organization.name} (${organization.id})`);
    } else {
      // Only log if it's a potential organization subdomain (not Replit URLs)
      if (subdomain.length <= 30 && !/^[a-f0-9\-]{30,}$/i.test(subdomain)) {
        console.log(`[SUBDOMAIN] No organization found for subdomain: ${subdomain}`);
      }
    }

    next();
  } catch (error) {
    console.error('Error in subdomain resolver:', error);
    next(); // Continue even if subdomain resolution fails
  }
}

/**
 * Extract subdomain from hostname
 */
function extractSubdomain(host: string): string | null {
  // Remove port if present
  const hostname = host.split(':')[0];
  
  // Split by dots
  const parts = hostname.split('.');
  
  // For development (localhost) - look for pattern like company.localhost
  if (hostname.includes('localhost') && parts.length >= 2) {
    return parts[0] !== 'localhost' ? parts[0] : null;
  }
  
  // Skip Replit development domains - they're not organization subdomains
  if (hostname.includes('.replit.app') || hostname.includes('.replit.dev') || hostname.includes('.replit.co')) {
    return null;
  }
  
  // Skip localhost and development domains
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1') || hostname === '127') {
    return null;
  }
  
  // Skip other development/internal domains
  if (hostname.includes('.vercel.app') || hostname.includes('.herokuapp.com') || hostname.includes('.netlify.app')) {
    return null;
  }
  
  // For production - look for pattern like company.talentpatriot.app
  if (parts.length >= 3) {
    const subdomain = parts[0];
    // Ignore common non-organization subdomains and UUIDs/random strings
    if (['www', 'api', 'admin', 'app'].includes(subdomain)) {
      return null;
    }
    
    // Skip UUID-like strings (typical of Replit URLs)
    if (subdomain.length > 30 || /^[a-f0-9\-]{30,}$/i.test(subdomain)) {
      return null;
    }
    
    return subdomain;
  }
  
  return null;
}

/**
 * Helper function to generate subdomain URL for an organization
 */
export function getOrganizationCareersUrl(orgSlug: string, baseUrl: string = ''): string {
  if (process.env.NODE_ENV === 'development') {
    return `http://${orgSlug}.localhost:5000/careers`;
  }
  
  // Production - use actual domain
  const domain = baseUrl || 'talentpatriot.app';
  return `https://${orgSlug}.${domain}/careers`;
}