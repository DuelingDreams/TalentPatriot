import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validate environment variables
if (!supabaseUrl) {
  throw new Error('Missing env.VITE_SUPABASE_URL')
}

if (!supabaseAnonKey) {
  throw new Error('Missing env.VITE_SUPABASE_ANON_KEY')
}

// Create and export the Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
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
