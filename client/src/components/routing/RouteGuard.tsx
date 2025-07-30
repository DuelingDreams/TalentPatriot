
import { useAuth } from '@/contexts/AuthContext'
import { useLocation } from 'wouter'
import { useEffect } from 'react'

interface RouteGuardProps {
  children: React.ReactNode
  requiredRole?: string[]
  requiresOrg?: boolean
}

export function RouteGuard({ 
  children, 
  requiredRole, 
  requiresOrg = true 
}: RouteGuardProps) {
  const { user, userRole, currentOrgId, loading } = useAuth()
  const [, setLocation] = useLocation()

  useEffect(() => {
    if (loading) return

    if (!user) {
      setLocation('/login')
      return
    }

    if (requiresOrg && !currentOrgId) {
      setLocation('/settings/organization')
      return
    }

    if (requiredRole && userRole && !requiredRole.includes(userRole)) {
      setLocation('/unauthorized')
      return
    }
  }, [user, userRole, currentOrgId, loading, requiredRole, requiresOrg, setLocation])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user || (requiresOrg && !currentOrgId) || 
      (requiredRole && userRole && !requiredRole.includes(userRole))) {
    return null
  }

  return <>{children}</>
}
