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
    // Check for demo mode first
    const isDemoMode = localStorage.getItem('demo_mode') === 'true'
    const demoUserRole = localStorage.getItem('demo_user_role')
    
    if (isDemoMode && demoUserRole) {
      // Set demo user state
      const demoUser = {
        id: 'demo-user-id',
        email: 'demo@yourapp.com',
        user_metadata: { role: demoUserRole, name: 'Demo User' }
      } as User
      
      setUser(demoUser)
      setUserRole(demoUserRole)
      setLoading(false)
      return
    }

    // Get initial session from Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        const role = session.user.user_metadata?.role || null
        setUserRole(role)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Don't override demo mode
      if (localStorage.getItem('demo_mode') === 'true') {
        return
      }
      
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        const role = session.user.user_metadata?.role || null
        setUserRole(role)
      } else {
        setUserRole(null)
      }
      
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signUp = async (email: string, password: string, role = 'recruiter') => {
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
  }

  const signOut = async () => {
    // Clear demo mode if active
    localStorage.removeItem('demo_mode')
    localStorage.removeItem('demo_user_role')
    
    // Sign out from Supabase
    const { error } = await supabase.auth.signOut()
    
    // Reset state regardless of Supabase result
    setUser(null)
    setSession(null)
    setUserRole(null)
  }

  const updateUserRole = async (role: string) => {
    if (!user) return { error: new Error('No user logged in') }

    const { error } = await supabase.auth.updateUser({
      data: { role: role }
    })

    if (!error) {
      setUserRole(role)
    }

    return { error }
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