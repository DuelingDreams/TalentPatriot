import { useAuth } from '@/contexts/AuthContext'
import { useLocation } from 'wouter'
import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: string
  redirectTo?: string
}

export function ProtectedRoute({ 
  children, 
  requiredRole, 
  redirectTo = '/login' 
}: ProtectedRouteProps) {
  const { user, userRole, loading } = useAuth()
  const [, setLocation] = useLocation()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        setLocation(redirectTo)
        return
      }

      if (requiredRole && userRole !== requiredRole) {
        setLocation('/unauthorized')
        return
      }
    }
  }, [user, userRole, loading, requiredRole, redirectTo, setLocation])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (requiredRole && userRole !== requiredRole) {
    return null
  }

  return <>{children}</>
}