import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { waitForSession } from "./hooks/useAuthSession";

// Public paths that don't require authentication
const PUBLIC_PATHS = [
  '/',
  '/careers',
  '/org',
  '/public',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/auth/callback',
  '/onboarding',
  '/unauthorized',
  '/privacy',
  '/terms',
  '/about',
  '/health',
  '/beta',
  '/demo',
  '/.well-known'
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [ready, setReady] = useState(false);
  
  // Check if current path is public
  const isPublicPath = PUBLIC_PATHS.some(path => location.startsWith(path));
  
  useEffect(() => {
    if (isPublicPath) {
      // Public paths render immediately
      setReady(true);
    } else {
      // Protected paths wait for auth session
      void waitForSession().finally(() => setReady(true));
    }
  }, [isPublicPath, location]);
  
  if (!ready) return <div className="p-6">Loading…</div>;
  return <>{children}</>;
}