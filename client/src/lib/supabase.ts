import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validate environment variables with safer error handling
if (!supabaseUrl) {
  console.error('Missing env.VITE_SUPABASE_URL - Auth features will not work')
}

if (!supabaseAnonKey) {
  console.error('Missing env.VITE_SUPABASE_ANON_KEY - Auth features will not work')
}

// Create a dummy URL if not provided to prevent crashes
const safeSupabaseUrl = supabaseUrl || 'https://placeholder.supabase.co'
const safeSupabaseAnonKey = supabaseAnonKey || 'placeholder-key'

// Create and export the Supabase client with error handling
export const supabase = createClient<Database>(safeSupabaseUrl, safeSupabaseAnonKey, {
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

// Sanity check: Test basic database connection
if (typeof window !== 'undefined' && supabaseUrl && supabaseAnonKey) {
  Promise.resolve(supabase.from('jobs').select('id').limit(1))
    .then(({ data, error }) => {
      console.info('[SUPABASE] Connection test →', { 
        success: !error, 
        data: data?.length, 
        error: error?.message || 'none' 
      })
    })
    .catch((err: any) => {
      console.warn('[SUPABASE] Connection test exception:', err?.message || err)
    })
}

// Handle global auth errors to prevent refresh token errors from appearing in console
if (typeof window !== 'undefined') {
  // Override console.error to filter out Supabase refresh token errors
  const originalConsoleError = console.error
  console.error = (...args: any[]) => {
    // Check if this is a Supabase refresh token error
    const errorMessage = args[0]
    if (typeof errorMessage === 'object' && errorMessage?.__isAuthError && errorMessage?.code === 'refresh_token_not_found') {
      // Silently handle refresh token errors - these are expected when sessions expire
      console.log('Session expired - refresh token not found (handled gracefully)')
      return
    }
    // For all other errors, use the original console.error
    originalConsoleError.apply(console, args)
  }
}
