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
    detectSessionInUrl: false,
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
