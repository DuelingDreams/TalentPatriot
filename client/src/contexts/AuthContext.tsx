import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

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

    // Get initial session with robust error handling
    const initializeAuth = async () => {
      try {
        // Check if component is still mounted
        if (!mounted) return
        
        // Set initial loading state
        setLoading(true)
        
        // Get session with comprehensive error handling
        const sessionPromise = supabase.auth.getSession().catch((err) => {
          console.warn('Session retrieval error:', err)
          if (err instanceof DOMException) {
            console.warn('DOM exception in getSession:', err.name, err.message)
            return { data: { session: null }, error: null }
          }
          if (err.message?.includes('NetworkError') || err.message?.includes('Failed to fetch')) {
            console.warn('Network error in getSession:', err.message)
            return { data: { session: null }, error: null }
          }
          // Return null session for any auth error to avoid blocking
          return { data: { session: null }, error: null }
        })
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session timeout')), 5000)
        )
        
        const { data: { session }, error } = await Promise.race([
          sessionPromise,
          timeoutPromise
        ]) as any
        
        if (!mounted) return
        
        if (error) {
          console.warn('Supabase auth error:', error.message)
          setSession(null)
          setUser(null)
          setUserRole(null)
          setCurrentOrgIdState(null)
          setLoading(false)
          return
        }

        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user && mounted) {
          // Special handling for demo user - always assign demo_viewer role
          if (session.user.email === 'demo@yourapp.com') {
            setUserRole('demo_viewer')
            const demoOrgId = '550e8400-e29b-41d4-a716-446655440000'
            setCurrentOrgIdState(demoOrgId)
            try {
              if (typeof sessionStorage !== 'undefined') {
                sessionStorage.setItem('currentOrgId', demoOrgId)
              }
            } catch (e) {
              // Ignore all storage errors including DOMException
              console.warn('SessionStorage error:', e)
            }
          } else {
            // For regular users without session data, just set defaults
            setUserRole('recruiter')
            setCurrentOrgIdState(null)
          }
        } else {
          setUserRole(null)
          setCurrentOrgIdState(null)
        }
        
        if (mounted) {
          setLoading(false)
        }
      } catch (error) {
        console.warn('Failed to initialize auth:', error)
        if (mounted) {
          // Set safe defaults on error
          setSession(null)
          setUser(null)
          setUserRole(null)
          setCurrentOrgIdState(null)
          setLoading(false)
        }
      }
    }

    // Initialize auth
    initializeAuth().catch((e) => {
      console.warn('Auth initialization failed:', e)
      if (mounted) {
        setLoading(false)
      }
    })

    // Listen for auth changes with simplified error handling
    let subscription: any = null
    
    try {
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        // Wrap everything in Promise.resolve to catch any sync errors as well
        Promise.resolve().then(async () => {
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
                try {
                  if (typeof sessionStorage !== 'undefined') {
                    sessionStorage.setItem('currentOrgId', demoOrgId)
                  }
                } catch (e) {
                  // Ignore all storage errors including DOMException
                  console.warn('SessionStorage error:', e)
                }
              } else {
                setUserRole('recruiter')
                setCurrentOrgIdState(null)
              }
            } else {
              setUserRole(null)
              setCurrentOrgIdState(null)
            }
            
            if (mounted) {
              setLoading(false)
            }
          } catch (error) {
            console.warn('Error in auth state change:', error)
            if (mounted) {
              setLoading(false)
            }
          }
        }).catch((error) => {
          // Catch any promise rejections
          console.warn('Unhandled error in auth state change:', error)
          if (mounted) {
            setLoading(false)
          }
        })
      })
      
      subscription = data.subscription
    } catch (error) {
      console.warn('Failed to set up auth listener:', error)
      if (mounted) {
        setLoading(false)
      }
    }

    return () => {
      mounted = false
      if (subscription) {
        try {
          subscription.unsubscribe()
        } catch (error) {
          console.warn('Error unsubscribing from auth:', error)
        }
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
      // Handle DOM exceptions and network errors gracefully
      if (error instanceof DOMException) {
        console.warn('DOM exception during sign in:', error.name, error.message)
        return { error: { message: 'Connection error. Please try again.' } }
      }
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.warn('Network error during sign in:', error.message)
        return { error: { message: 'Network error. Please check your connection.' } }
      }
      console.warn('Sign in error:', error)
      return { error }
    }
  }

  const signUp = async (email: string, password: string, role = 'recruiter', orgName?: string) => {
    try {
      // Step 1: Create the user account
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: role,
            name: email.split('@')[0], // Use email prefix as default name
          },
        },
      })

      if (authError) {
        return { error: authError }
      }

      // Step 2: If not a demo viewer and user was created, create organization
      if (role !== 'demo_viewer' && data.user) {
        try {
          // Create organization name from email domain or provided name
          const defaultOrgName = orgName || `${email.split('@')[0]}'s Organization`
          const orgSlug = defaultOrgName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')
          
          // Create organization via API
          const orgResponse = await fetch('/api/organizations', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: defaultOrgName,
              ownerId: data.user.id,
              slug: orgSlug,
            }),
          })

          if (orgResponse.ok) {
            const organization = await orgResponse.json()
            
            // Step 3: Add user to organization as owner
            await fetch('/api/user-organizations', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                userId: data.user.id,
                orgId: organization.id,
                role: 'owner',
              }),
            })

            // Step 4: Update user metadata with current org ID
            await supabase.auth.updateUser({
              data: { 
                currentOrgId: organization.id,
                role: role,
                name: email.split('@')[0],
              }
            })

            console.log('Organization created and user added as owner:', organization.id)
          } else {
            console.warn('Failed to create organization, but user account was created')
          }
        } catch (orgError) {
          console.warn('Error creating organization for new user:', orgError)
          // Don't fail signup if organization creation fails
        }
      }

      return { error: null }
    } catch (error) {
      // Handle DOM exceptions and network errors gracefully
      if (error instanceof DOMException) {
        console.warn('DOM exception during sign up:', error.name)
        return { error: { message: 'Connection error. Please try again.' } }
      }
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
        setCurrentOrgIdState(null)
        
        // Clear storage safely
        try {
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.removeItem('currentOrgId')
          }
        } catch (e) {
          console.warn('SessionStorage clear error:', e)
        }
      }
    } catch (error) {
      // Handle DOM exceptions during sign out
      if (error instanceof DOMException) {
        console.warn('DOM exception during sign out:', error.name, error.message)
      } else {
        console.warn('Sign out error:', error)
      }
      
      // Still clear the local state even if signOut fails
      setUser(null)
      setSession(null)
      setUserRole(null)
      setCurrentOrgIdState(null)
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

  const setCurrentOrgId = async (orgId: string) => {
    if (!user) return { error: new Error('No user logged in') }

    try {
      const { error } = await supabase.auth.updateUser({
        data: { 
          ...user.user_metadata,
          currentOrgId: orgId 
        }
      })

      if (!error) {
        setCurrentOrgIdState(orgId)
      }

      return { error }
    } catch (error) {
      console.warn('Update current org ID error:', error)
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}