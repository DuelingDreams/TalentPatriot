import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validate environment variables - fail fast if missing
if (!supabaseUrl || !supabaseAnonKey) {
  const missing = [];
  if (!supabaseUrl) missing.push('VITE_SUPABASE_URL');
  if (!supabaseAnonKey) missing.push('VITE_SUPABASE_ANON_KEY');
  
  const errorMsg = `FATAL: Missing required environment variables: ${missing.join(', ')}. 
    
    For production deployments, ensure these are set in your deployment environment.
    For local development, add them to your .env file.`;
  
  console.error(errorMsg);
  throw new Error(errorMsg);
}

// Create and export the Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true, // Enable to handle OAuth redirects
    flowType: 'pkce', // Use PKCE flow for better security
    // Handle storage errors gracefully in Replit environment
    storage: {
      getItem: (key: string) => {
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            return localStorage.getItem(key)
          }
          return null
        } catch (err) {
          // Catch all storage errors including DOMException
          console.warn('localStorage.getItem failed:', err)
          return null
        }
      },
      setItem: (key: string, value: string) => {
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem(key, value)
          }
        } catch (err) {
          // Catch all storage errors including DOMException
          console.warn('localStorage.setItem failed:', err)
        }
      },
      removeItem: (key: string) => {
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.removeItem(key)
          }
        } catch (err) {
          // Catch all storage errors including DOMException
          console.warn('localStorage.removeItem failed:', err)
        }
      }
    }
  }
})

export async function handleExpiredSession() {
  try {
    await supabase.auth.signOut({ scope: 'local' })
  } catch {
  }
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const keysToRemove = Object.keys(localStorage).filter(k =>
        k.startsWith('sb-') || k.includes('supabase')
      )
      keysToRemove.forEach(k => localStorage.removeItem(k))
    }
  } catch {
  }
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.removeItem('currentOrgId')
    }
  } catch {
  }
  if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
    window.location.href = '/login'
  }
}

if (typeof window !== 'undefined') {
  const originalConsoleError = console.error
  console.error = (...args: any[]) => {
    const errorMessage = args[0]
    if (typeof errorMessage === 'object' && errorMessage?.__isAuthError && errorMessage?.code === 'refresh_token_not_found') {
      console.warn('[Auth] Session expired - signing out and redirecting to login')
      handleExpiredSession()
      return
    }
    const stringified = typeof errorMessage === 'string' ? errorMessage : ''
    if (stringified.includes('refresh_token_not_found') || stringified.includes('Invalid Refresh Token')) {
      console.warn('[Auth] Session expired - signing out and redirecting to login')
      handleExpiredSession()
      return
    }
    originalConsoleError.apply(console, args)
  }
}
