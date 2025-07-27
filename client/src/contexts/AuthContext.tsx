import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { safeSupabaseOperation, safeStorageOperation } from '@/utils/domExceptionHandler'

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
        if (!mounted) return
        setLoading(true)
        
        // Get session with safe wrapper to prevent DOM exceptions
        const sessionResult = await safeSupabaseOperation(
          () => supabase.auth.getSession(),
          'getSession'
        )
        
        const sessionData = sessionResult || { data: { session: null }, error: null }
        const { data: { session }, error } = sessionData
        
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
            safeStorageOperation(() => {
              sessionStorage.setItem('currentOrgId', demoOrgId)
            })
          } else {
            // For regular users, fetch their actual role from the database
            try {
              const profileResult = await safeSupabaseOperation(
                () => fetch(`/api/user-profiles/${session.user.id}`),
                'fetchUserProfile'
              )
              
              if (profileResult && profileResult.ok) {
                const profile = await profileResult.json()
                setUserRole(profile.role || 'hiring_manager')
              } else {
                // Fallback to default role
                setUserRole('hiring_manager')
              }
              setCurrentOrgIdState(null)
            } catch (error) {
              console.warn('Failed to fetch user profile:', error)
              setUserRole('hiring_manager')
              setCurrentOrgIdState(null)
            }
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
    initializeAuth()

    // Listen for auth changes with simplified error handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
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
            // For regular users in auth state change, fetch their actual role
            try {
              const profileResult = await safeSupabaseOperation(
                () => fetch(`/api/user-profiles/${session.user.id}`),
                'fetchUserProfile'
              )
              
              if (profileResult && profileResult.ok) {
                const profile = await profileResult.json()
                setUserRole(profile.role || 'hiring_manager')
              } else {
                setUserRole('hiring_manager')
              }
              setCurrentOrgIdState(null)
            } catch (error) {
              console.warn('Failed to fetch user profile in auth change:', error)
              setUserRole('hiring_manager')
              setCurrentOrgIdState(null)
            }
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
    })

    return () => {
      mounted = false
      subscription?.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const result = await safeSupabaseOperation(
        () => supabase.auth.signInWithPassword({
          email,
          password,
        }),
        'signIn'
      )
      
      return { error: result?.error || null }
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

  const signUp = async (email: string, password: string, role = 'hiring_manager', orgName?: string) => {
    try {
      // Step 1: Create the user account with safe wrapper
      const authResult = await safeSupabaseOperation(
        () => supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              role: role,
              name: email.split('@')[0], // Use email prefix as default name
            },
          },
        }),
        'signUp'
      )
      
      if (!authResult) {
        return { error: { message: 'Failed to create account. Please try again.' } }
      }
      
      const { data, error: authError } = authResult

      if (authError) {
        return { error: authError }
      }

      // Step 2: If not a demo viewer and user was created, create organization
      if (role !== 'demo_viewer' && data.user) {
        const userId = data.user.id // Store user ID to avoid null access issues
        try {
          // Create organization name from email domain or provided name
          const defaultOrgName = orgName || `${email.split('@')[0]}'s Organization`
          const orgSlug = defaultOrgName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')
          
          // Create organization via API with proper error handling
          const orgResponse = await safeSupabaseOperation(
            () => fetch('/api/organizations', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                name: defaultOrgName,
                ownerId: userId,
                slug: orgSlug,
              }),
            }),
            'create organization'
          )

          if (orgResponse && orgResponse.ok) {
            const organization = await orgResponse.json()
            
            // Step 3: Add user to organization as owner
            await safeSupabaseOperation(
              () => fetch('/api/user-organizations', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  userId: userId,
                  orgId: organization.id,
                  role: 'owner',
                }),
              }),
              'add user to organization'
            )

            // Step 4: Update user metadata with current org ID
            await safeSupabaseOperation(
              () => supabase.auth.updateUser({
                data: { 
                  currentOrgId: organization.id,
                  role: role,
                  name: email.split('@')[0],
                }
              }),
              'update user metadata'
            )

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
      const result = await safeSupabaseOperation(
        () => supabase.auth.signOut(),
        'signOut'
      )
      
      // Always clear local state regardless of result
      setUser(null)
      setSession(null)
      setUserRole(null)
      setCurrentOrgIdState(null)
      
      // Clear storage safely
      safeStorageOperation(() => {
        sessionStorage.removeItem('currentOrgId')
      })
      
    } catch (error) {
      console.warn('Sign out error:', error)
      // Still clear local state even if sign out fails
      setUser(null)
      setSession(null)
      setUserRole(null)
      setCurrentOrgIdState(null)
    }
  }

  const updateUserRole = async (role: string) => {
    try {
      if (!user) {
        return { error: { message: 'No user found' } }
      }

      const result = await safeSupabaseOperation(
        () => supabase.auth.updateUser({
          data: { role }
        }),
        'updateUserRole'
      )

      if (result?.error) {
        return { error: result.error }
      }

      setUserRole(role)
      return { error: null }
    } catch (error) {
      console.warn('Update user role error:', error)
      return { error }
    }
  }

  const setCurrentOrgId = async (orgId: string) => {
    try {
      if (!user) {
        return { error: { message: 'No user found' } }
      }

      const result = await safeSupabaseOperation(
        () => supabase.auth.updateUser({
          data: { currentOrgId: orgId }
        }),
        'setCurrentOrgId'
      )

      if (result?.error) {
        return { error: result.error }
      }

      setCurrentOrgIdState(orgId)
      
      // Update session storage safely
      safeStorageOperation(() => {
        sessionStorage.setItem('currentOrgId', orgId)
      })

      return { error: null }
    } catch (error) {
      console.warn('Set current org ID error:', error)
      return { error }
    }
  }

  return (
    <AuthContext.Provider 
      value={{
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
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}