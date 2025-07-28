import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { safeStorageOperation } from '@/utils/errorHandler'

interface AuthContextType {
  user: User | null
  session: Session | null
  userRole: string | null
  currentOrgId: string | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, role?: string, orgName?: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  updateUserRole: (role: string) => Promise<{ error: any }>
  setCurrentOrgId: (orgId: string) => Promise<{ error: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [currentOrgId, setCurrentOrgIdState] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    // Simple auth initialization
    const initAuth = async () => {
      try {
        // Get initial session
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!mounted) return

        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          // Special handling for demo user
          if (session.user.email === 'demo@yourapp.com') {
            setUserRole('demo_viewer')
            const demoOrgId = '550e8400-e29b-41d4-a716-446655440000'
            setCurrentOrgIdState(demoOrgId)
            safeStorageOperation(() => {
              sessionStorage.setItem('currentOrgId', demoOrgId)
            })
          } else {
            // For regular users, use default role
            setUserRole('hiring_manager')
            setCurrentOrgIdState(null)
          }
        } else {
          setUserRole(null)
          setCurrentOrgIdState(null)
        }
      } catch (error) {
        console.warn('Auth initialization error:', error)
        // Set safe defaults
        setSession(null)
        setUser(null)
        setUserRole(null)
        setCurrentOrgIdState(null)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    // Initialize auth with error boundary
    initAuth().catch(err => {
      console.warn('Auth init failed:', err)
      setLoading(false)
    })

    // Listen for auth changes with safe subscription
    let subscription: any = null
    try {
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return
      
      try {
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          // Special handling for demo user
          if (session.user.email === 'demo@yourapp.com') {
            setUserRole('demo_viewer')
            const demoOrgId = '550e8400-e29b-41d4-a716-446655440000'
            setCurrentOrgIdState(demoOrgId)
            safeStorageOperation(() => {
              sessionStorage.setItem('currentOrgId', demoOrgId)
            })
          } else {
            // For regular users, use default role
            setUserRole('hiring_manager')
            setCurrentOrgIdState(null)
          }
        } else {
          setUserRole(null)
          setCurrentOrgIdState(null)
        }
        
        setLoading(false)
      } catch (error) {
        console.warn('Auth state change error:', error)
        // Set safe defaults
        setUserRole(session?.user ? 'hiring_manager' : null)
        setCurrentOrgIdState(null)
        setLoading(false)
      }
    })

      subscription = data?.subscription
    } catch (err) {
      console.warn('Auth state change setup failed:', err)
    }

    return () => {
      mounted = false
      subscription?.unsubscribe?.()
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

  const signUp = async (email: string, password: string, role = 'hiring_manager', orgName?: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      })
      return { error }
    } catch (error) {
      console.warn('Sign up error:', error)
      return { error }
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setSession(null)
      setUser(null)
      setUserRole(null)
      setCurrentOrgIdState(null)
      safeStorageOperation(() => {
        sessionStorage.removeItem('currentOrgId')
      })
    } catch (error) {
      console.warn('Sign out error:', error)
    }
  }

  const updateUserRole = async (role: string) => {
    try {
      setUserRole(role)
      return { error: null }
    } catch (error) {
      console.warn('Update role error:', error)
      return { error }
    }
  }

  const setCurrentOrgId = async (orgId: string) => {
    try {
      setCurrentOrgIdState(orgId)
      safeStorageOperation(() => {
        sessionStorage.setItem('currentOrgId', orgId)
      })
      return { error: null }
    } catch (error) {
      console.warn('Set org id error:', error)
      return { error }
    }
  }

  const value = {
    user,
    session,
    userRole,
    currentOrgId,
    loading,
    signIn,
    signUp,
    signOut,
    updateUserRole,
    setCurrentOrgId,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}