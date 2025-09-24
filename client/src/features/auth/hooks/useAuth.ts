import { useState, useEffect } from 'react'

interface User {
  id: string
  email?: string
  name?: string
}

interface AuthState {
  user: User | null
  isLoading: boolean
  currentOrgId: string | null
}

// Mock auth hook for development - replace with actual auth implementation
export function useAuth(): AuthState & {
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  setCurrentOrg: (orgId: string) => void
} {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null)

  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem('tp_user')
    const storedOrgId = localStorage.getItem('tp_current_org')
    
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    if (storedOrgId) {
      setCurrentOrgId(storedOrgId)
    }
    
    setIsLoading(false)
  }, [])

  const signIn = async (email: string, password: string) => {
    // Mock sign in - replace with actual authentication
    const mockUser = { id: 'user-1', email, name: email.split('@')[0] }
    setUser(mockUser)
    localStorage.setItem('tp_user', JSON.stringify(mockUser))
  }

  const signOut = async () => {
    setUser(null)
    setCurrentOrgId(null)
    localStorage.removeItem('tp_user')
    localStorage.removeItem('tp_current_org')
  }

  const setCurrentOrg = (orgId: string) => {
    setCurrentOrgId(orgId)
    localStorage.setItem('tp_current_org', orgId)
  }

  return {
    user,
    isLoading,
    currentOrgId,
    signIn,
    signOut,
    setCurrentOrg,
  }
}