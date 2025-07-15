import { useAuth } from '@/contexts/AuthContext'
import { useLocation } from 'wouter'
import { useEffect, useState } from 'react'
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
  const [shouldRender, setShouldRender] = useState(false)

  useEffect(() => {
    if (!loading) {
      if (!user) {
        setLocation(redirectTo)
        setShouldRender(false)
        return
      }

      if (requiredRole && userRole !== requiredRole) {
        setLocation('/unauthorized')
        setShouldRender(false)
        return
      }

      setShouldRender(true)
    }
  }, [user, userRole, loading, requiredRole, redirectTo, setLocation])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-slate-600">Authenticating...</p>
        </div>
      </div>
    )
  }

  if (!shouldRender) {
    return null
  }

  return <>{children}</>
}