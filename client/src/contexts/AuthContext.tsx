import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  userRole: string | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, role?: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  updateUserRole: (role: string) => Promise<{ error: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session with error handling
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          const role = session.user.user_metadata?.role || null
          console.log('Auth Debug - User:', session.user.email, 'Role from metadata:', role)
          console.log('Auth Debug - Full user metadata:', session.user.user_metadata)
          setUserRole(role)
        }
        setLoading(false)
      })
      .catch((error) => {
        console.warn('Failed to get initial session:', error)
        setLoading(false)
      })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          const role = session.user.user_metadata?.role || null
          console.log('Auth State Change - User:', session.user.email, 'Role:', role)
          console.log('Auth State Change - Event:', event)
          setUserRole(role)
        } else {
          setUserRole(null)
        }
        
        setLoading(false)
      } catch (error) {
        console.warn('Error in auth state change:', error)
        setLoading(false)
      }
    })

    return () => {
      try {
        subscription.unsubscribe()
      } catch (error) {
        console.warn('Error unsubscribing from auth:', error)
      }
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      return { error }
    } catch (error) {
      console.warn('Sign in error:', error)
      return { error }
    }
  }

  const signUp = async (email: string, password: string, role = 'recruiter') => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: role,
            name: email.split('@')[0], // Use email prefix as default name
          },
        },
      })
      return { error }
    } catch (error) {
      console.warn('Sign up error:', error)
      return { error }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (!error) {
        setUser(null)
        setSession(null)
        setUserRole(null)
      }
    } catch (error) {
      console.warn('Sign out error:', error)
      // Still clear the local state even if signOut fails
      setUser(null)
      setSession(null)
      setUserRole(null)
    }
  }

  const updateUserRole = async (role: string) => {
    if (!user) return { error: new Error('No user logged in') }

    try {
      const { error } = await supabase.auth.updateUser({
        data: { role: role }
      })

      if (!error) {
        setUserRole(role)
      }

      return { error }
    } catch (error) {
      console.warn('Update user role error:', error)
      return { error }
    }
  }

  const value = {
    user,
    session,
    userRole,
    loading,
    signIn,
    signUp,
    signOut,
    updateUserRole,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}