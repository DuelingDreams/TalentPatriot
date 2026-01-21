import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { safeStorageOperation } from '@/utils/errorHandler'
import { DEMO_ORG_ID } from '@/lib/demo-data-consolidated'
import { isDemoEnabled } from '@/lib/demoToggle'
import { isDevelopment, setDevelopmentAuth, getDevelopmentAuth, DEV_ORG_ID } from '@/utils/devAuth'

interface AuthContextType {
  user: User | null
  session: Session | null
  userRole: string | null
  orgRole: string | null
  currentOrgId: string | null
  organizationId: string | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, role?: string, orgId?: string) => Promise<{ error: any }>
  signInWithOAuth: (provider: 'google' | 'azure') => Promise<{ error: any }>
  signOut: () => Promise<void>
  updateUserRole: (role: string) => Promise<{ error: any }>
  setCurrentOrgId: (orgId: string) => Promise<{ error: any }>
  refreshOrgRole: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [orgRole, setOrgRole] = useState<string | null>(null)
  const [currentOrgId, setCurrentOrgIdState] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchOrgRole = async (userId: string, orgId: string): Promise<string | null> => {
    try {
      const response = await fetch(`/api/users/${userId}/organizations`)
      if (response.ok) {
        const orgs = await response.json()
        const currentOrg = orgs.find((o: any) => o.orgId === orgId || o.org_id === orgId)
        if (currentOrg) {
          return currentOrg.role || null
        }
      }
    } catch (error) {
      console.warn('[Auth] Failed to fetch org role:', error)
    }
    return null
  }

  useEffect(() => {
    let mounted = true

    // Enhanced auth initialization with development mode support
    const initAuth = async () => {
      try {
        // FIRST: Check for real Supabase session (production or real test users)
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
          } else {
            // Regular user: get role from user metadata
            const appRole = session.user.user_metadata?.role || 'user'
            const orgId = session.user.user_metadata?.currentOrgId
            const primaryOrgRole = session.user.user_metadata?.primary_org_role
            setUserRole(appRole)

            // Use the user's actual organization ID from their metadata
            const effectiveOrgId = orgId || DEV_ORG_ID
            setCurrentOrgIdState(effectiveOrgId)
            safeStorageOperation(() => {
              sessionStorage.setItem('currentOrgId', effectiveOrgId)
            })

            // Fetch org-level role from user_organizations table, fallback to primary_org_role from metadata
            const fetchedOrgRole = await fetchOrgRole(session.user.id, effectiveOrgId)
            if (mounted) {
              setOrgRole(fetchedOrgRole || primaryOrgRole || null)
            }
          }
        } else if (isDevelopment()) {
          // Development mode: create mock auth when no Supabase session
          setDevelopmentAuth('hildebrand') // Use Hildebrand organization for Emily Wright testing
          const devAuth = getDevelopmentAuth()
          if (devAuth) {
            setUser(devAuth.user as any)
            setUserRole(devAuth.userRole)
            setOrgRole(devAuth.userRole) // In dev mode, use same role
            setCurrentOrgIdState(devAuth.orgId)
          }
        } else {
          setUserRole(null)
          setOrgRole(null)
          setCurrentOrgIdState(null)
        }
      } catch (error) {
        console.warn('[Auth] Initialization error:', error)
        
        // Fallback to development auth if available
        if (isDevelopment() && mounted) {
          setDevelopmentAuth('hildebrand') // Use Hildebrand for Emily Wright testing
          const devAuth = getDevelopmentAuth()
          if (devAuth) {
            setUser(devAuth.user as any)
            setUserRole(devAuth.userRole)
            setOrgRole(devAuth.userRole)
            setCurrentOrgIdState(devAuth.orgId)
          }
        } else {
          // Set safe defaults
          setSession(null)
          setUser(null)
          setUserRole(null)
          setOrgRole(null)
          setCurrentOrgIdState(null)
        }
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
        setOrgRole(null)
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
          setOrgRole(null)
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
              const appRole = session.user.user_metadata?.role || 'user'
              const orgId = session.user.user_metadata?.currentOrgId
              const primaryOrgRole = session.user.user_metadata?.primary_org_role
              setUserRole(appRole)

              // Use the user's actual organization ID from their metadata
              const effectiveOrgId = orgId || DEV_ORG_ID
              setCurrentOrgIdState(effectiveOrgId)
              safeStorageOperation(() => {
                sessionStorage.setItem('currentOrgId', effectiveOrgId)
              })

              // Fetch org-level role from user_organizations table, fallback to primary_org_role
              const fetchedOrgRole = await fetchOrgRole(session.user.id, effectiveOrgId)
              if (mounted) {
                setOrgRole(fetchedOrgRole || primaryOrgRole || null)
              }
            }
          } else {
            setUserRole(null)
            setOrgRole(null)
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
            setUserRole(session?.user ? 'user' : null)
            setOrgRole(null)
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
    role = 'recruiter', 
    orgId?: string // Allow caller to specify orgId, no default
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

      // If user was created successfully and orgId is provided, assign them to the organization
      if (user?.id && orgId) {
        try {
          const response = await fetch(`/api/organizations/${orgId}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, role }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            console.warn('Failed to assign user to organization:', errorData);
            return { error: { message: `Sign up successful but failed to assign to organization: ${errorData.error}` } };
          } else {
            
            // Update the user's auth metadata to include currentOrgId
            try {
              await supabase.auth.updateUser({ 
                data: { 
                  currentOrgId: orgId,
                  role: role
                } 
              });
            } catch (metadataError) {
              console.warn('Failed to update auth metadata:', metadataError);
            }
            
            // Update the current user state to reflect the new organization
            if (user) {
              setUserRole(role);
              setCurrentOrgIdState(orgId);
              safeStorageOperation(() => {
                sessionStorage.setItem('currentOrgId', orgId);
              });
            }
          }
        } catch (assignmentError) {
          console.warn('Error during organization assignment:', assignmentError);
          return { error: { message: 'Sign up successful but organization assignment failed' } };
        }
      } else if (!orgId) {
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

  const refreshOrgRole = async () => {
    if (user?.id && currentOrgId) {
      const fetchedOrgRole = await fetchOrgRole(user.id, currentOrgId)
      setOrgRole(fetchedOrgRole)
    }
  }

  const value = {
    user,
    session,
    userRole,
    orgRole,
    currentOrgId,
    organizationId: currentOrgId,
    loading,
    signIn,
    signUp,
    signInWithOAuth,
    signOut,
    updateUserRole,
    setCurrentOrgId,
    refreshOrgRole,
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