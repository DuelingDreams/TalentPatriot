import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { safeStorageOperation } from '@/utils/errorHandler'
import { DEMO_ORG_ID } from '@/lib/demo-data-consolidated'
import { isDemoEnabled } from '@/lib/demoToggle'

interface AuthContextType {
  user: User | null
  session: Session | null
  userRole: string | null
  currentOrgId: string | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, role?: string, orgId?: string) => Promise<{ error: any }>
  signInWithOAuth: (provider: 'google' | 'azure') => Promise<{ error: any }>
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

        // Determine if user is in demo mode - only for specific demo email or explicit demo flag
        const isDemoUser = session?.user?.email === 'demo@yourapp.com' || 
                          session?.user?.email === 'demo@talentpatriot.com' ||
                          (isDemoEnabled() && session?.user?.email?.includes('demo'))

        if (session?.user) {
          if (isDemoUser) {
            // Demo mode: set demo role and org
            setUserRole('demo_viewer')
            setCurrentOrgIdState(DEMO_ORG_ID)
            safeStorageOperation(() => {
              sessionStorage.setItem('currentOrgId', DEMO_ORG_ID)
            })
            console.log('Auth: Demo mode enabled')
          } else {
            // Regular user: get role from user metadata
            const role = session.user.user_metadata?.role || 'hiring_manager'
            const orgId = session.user.user_metadata?.currentOrgId
            console.log('Auth: Regular user role:', role, 'orgId:', orgId)
            setUserRole(role)

            // Use demo org as fallback for development
            if (!orgId) {
              console.warn('No orgId found for regular user, using demo organization')
              setCurrentOrgIdState(DEMO_ORG_ID)
            } else {
              setCurrentOrgIdState(orgId)
            }
          }
        } else if (isDemoUser) {
          // Demo mode without authentication
          setUserRole('demo_viewer')
          setCurrentOrgIdState(DEMO_ORG_ID)
          safeStorageOperation(() => {
            sessionStorage.setItem('currentOrgId', DEMO_ORG_ID)
          })
          console.log('Auth: Demo mode enabled without authentication')
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

    // Initialize auth with comprehensive error boundary
    initAuth().catch(err => {
      console.warn('Auth init failed:', err)
      if (mounted) {
        setLoading(false)
        // Set safe fallback state
        setSession(null)
        setUser(null)
        setUserRole(null)
        setCurrentOrgIdState(null)
      }
    })

    // Listen for auth changes with comprehensive error handling
    let subscription: any = null
    try {
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        // Early return if component unmounted
        if (!mounted) return

        // Handle specific auth events
        if (event === 'SIGNED_OUT') {
          // User signed out - clear all state
          setSession(null)
          setUser(null)
          setUserRole(null)
          setCurrentOrgIdState(null)
          safeStorageOperation(() => {
            sessionStorage.removeItem('currentOrgId')
          })
          if (mounted) {
            setLoading(false)
          }
          return
        }

        if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed successfully')
        }

        // Wrap all auth state changes in try-catch to prevent DOM exceptions
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
                if (typeof window !== 'undefined') {
                  sessionStorage.setItem('currentOrgId', demoOrgId)
                }
              })
            } else {
              // For regular users, get role from user metadata
              const role = session.user.user_metadata?.role || 'hiring_manager'
              const orgId = session.user.user_metadata?.currentOrgId
              console.log('Auth change: Regular user role:', role, 'orgId:', orgId)
              setUserRole(role)

              // For regular users, set the orgId from metadata or leave null
              if (orgId) {
                setCurrentOrgIdState(orgId)
              } else {
                console.warn('No orgId found for regular user - organization selection needed')
                setCurrentOrgIdState(null)
              }
            }
          } else {
            setUserRole(null)
            setCurrentOrgIdState(null)
            safeStorageOperation(() => {
              sessionStorage.removeItem('currentOrgId')
            })
          }

          if (mounted) {
            setLoading(false)
          }
        } catch (error) {
          console.warn('Auth state change error safely handled:', error)
          // Set safe defaults only if component is still mounted
          if (mounted) {
            setUserRole(session?.user ? 'hiring_manager' : null)
            setCurrentOrgIdState(null)
            setLoading(false)
          }
        }
      })

      subscription = data?.subscription
    } catch (err) {
      console.warn('Auth state change setup failed safely:', err)
      // Ensure loading is false even if subscription fails
      if (mounted) {
        setLoading(false)
      }
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

  const signUp = async (
    email: string, 
    password: string, 
    role = 'hiring_manager', 
    orgId = DEMO_ORG_ID // Default to demo org for development, can be overridden
  ) => {
    try {
      const { data: { user }, error: signUpError } = await supabase.auth.signUp({ 
        email, 
        password 
      });
      
      if (signUpError) {
        console.warn('Sign up error:', signUpError);
        return { error: signUpError };
      }

      // If user was created successfully, assign them to the organization
      if (user?.id) {
        try {
          const response = await fetch(`/api/organizations/${orgId}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, role }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            console.warn('Failed to assign user to organization:', errorData);
            // Don't fail the entire signup if organization assignment fails
            // The user can be assigned to an organization later
          } else {
            console.log('User successfully assigned to organization during signup');
          }
        } catch (assignmentError) {
          console.warn('Error during organization assignment:', assignmentError);
          // Don't fail the entire signup process
        }
      }

      return { error: null };
    } catch (err) {
      console.warn('Sign up error:', err);
      return { error: err };
    }
  }

  const signInWithOAuth = async (provider: 'google' | 'azure') => {
    try {
      // For OAuth, we redirect to a special route that checks onboarding status
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      })
      return { error }
    } catch (error) {
      console.warn('OAuth sign in error:', error)
      return { error }
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      await supabase.auth.signOut()
      setUser(null)
      setCurrentOrgIdState(null)
      setUserRole(null)

      // Clear all cached data
      // queryClient.clear() //queryClient is not defined in this context.

      // Redirect to login
      window.location.href = '/login'
    } catch (error) {
      console.warn('Sign out error:', error)
      // Force clear local state even if API call fails
      setUser(null)
      setCurrentOrgIdState(null)
      setUserRole(null)
      window.location.href = '/login'
    } finally {
      setLoading(false)
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
    signInWithOAuth,
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

// Helper hook for demo mode detection
export const useDemoFlag = () => ({
  isDemoUser: useContext(AuthContext)?.userRole === 'demo_viewer'
})