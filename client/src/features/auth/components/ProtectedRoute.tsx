import { useAuth } from '@/contexts/AuthContext'
import { useLocation } from 'wouter'
import { useEffect, useState, ReactNode } from 'react'
import { useDemoFlag } from '@/lib/demoFlag'
import { useCanAccess, type RolePermissions } from '../hooks/useRolePermissions'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, ShieldX } from 'lucide-react'

// Base interface for all route guard components
interface BaseGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  showMessage?: boolean
}

// Route-level protection with redirects
interface RouteProtectionProps extends BaseGuardProps {
  requiredRole?: string | string[]
  requiredPermission?: keyof RolePermissions
  requiresOrg?: boolean
  redirectTo?: string
  // Specify guard type for better type checking
  type: 'route'
}

// Component-level protection with inline handling
interface ComponentProtectionProps extends BaseGuardProps {
  requiredRole?: string | string[]
  requiredPermission?: keyof RolePermissions
  requiresOrg?: boolean
  type: 'component'
}

type ProtectedRouteProps = RouteProtectionProps | ComponentProtectionProps

// Main consolidated guard component
export function ProtectedRoute(props: ProtectedRouteProps) {
  const {
    children,
    requiredRole,
    requiredPermission,
    requiresOrg = false,
    fallback = null,
    showMessage = false,
    type
  } = props

  const { user, userRole, currentOrgId, loading } = useAuth()
  const { isDemoUser } = useDemoFlag()
  const [, setLocation] = useLocation()
  const [shouldRender, setShouldRender] = useState(false)
  
  // Use permission-based access if specified
  const canAccess = useCanAccess(requiredPermission)
  const hasPermissionAccess = canAccess

  // Check role access (support both single and array of roles)
  const hasRoleAccess = (() => {
    if (!requiredRole) return true
    if (!userRole) return false
    
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
    return roles.includes(userRole)
  })()

  useEffect(() => {
    if (!loading) {
      // Allow demo users to access protected routes
      if (isDemoUser) {
        setShouldRender(true)
        return
      }

      // Check authentication
      if (!user) {
        if (type === 'route') {
          const redirectTo = (props as RouteProtectionProps).redirectTo || '/login'
          setLocation(redirectTo)
        }
        setShouldRender(false)
        return
      }

      // Check organization requirement
      if (requiresOrg && !currentOrgId) {
        if (type === 'route') {
          setLocation('/settings/organization')
        }
        setShouldRender(false)
        return
      }

      // Check role/permission access
      if (!hasRoleAccess || !hasPermissionAccess) {
        if (type === 'route') {
          setLocation('/unauthorized')
        }
        setShouldRender(false)
        return
      }

      setShouldRender(true)
    }
  }, [
    user, 
    userRole, 
    currentOrgId, 
    loading, 
    requiredRole, 
    requiredPermission,
    requiresOrg, 
    hasRoleAccess,
    hasPermissionAccess,
    isDemoUser,
    type,
    setLocation
  ])

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50" data-testid="loading-guard">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-slate-600">Authenticating...</p>
        </div>
      </div>
    )
  }

  // Access denied handling
  if (!shouldRender) {
    // For component-level guards, show inline feedback
    if (type === 'component') {
      if (showMessage) {
        return (
          <Alert className="border-orange-200 bg-orange-50" data-testid="access-denied-message">
            <ShieldX className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              You don't have permission to access this feature. Contact your admin for access.
            </AlertDescription>
          </Alert>
        )
      }
      return <>{fallback}</>
    }

    // For route-level guards, return null (redirect handled in useEffect)
    return null
  }

  return <>{children}</>
}

// Convenience wrapper for route-level protection
export function RouteGuard({
  children,
  requiredRole,
  requiredPermission,
  requiresOrg,
  redirectTo = '/login'
}: {
  children: ReactNode
  requiredRole?: string | string[]
  requiredPermission?: keyof RolePermissions
  requiresOrg?: boolean
  redirectTo?: string
}) {
  return (
    <ProtectedRoute
      type="route"
      requiredRole={requiredRole}
      requiredPermission={requiredPermission}
      requiresOrg={requiresOrg}
      redirectTo={redirectTo}
    >
      {children}
    </ProtectedRoute>
  )
}

// Convenience wrapper for component-level protection
export function RoleGuard({
  children,
  requiredRole,
  requiredPermission,
  fallback = null,
  showMessage = false
}: {
  children: ReactNode
  requiredRole?: string | string[]
  requiredPermission?: keyof RolePermissions
  fallback?: ReactNode
  showMessage?: boolean
}) {
  return (
    <ProtectedRoute
      type="component"
      requiredRole={requiredRole}
      requiredPermission={requiredPermission}
      fallback={fallback}
      showMessage={showMessage}
    >
      {children}
    </ProtectedRoute>
  )
}

// Convenience components for common use cases
export function AdminOnly({ children, fallback, showMessage = false }: { 
  children: ReactNode
  fallback?: ReactNode 
  showMessage?: boolean
}) {
  return (
    <RoleGuard 
      requiredPermission="canManageOrganization" 
      fallback={fallback}
      showMessage={showMessage}
    >
      {children}
    </RoleGuard>
  )
}

export function HiringManagerOrAdmin({ children, fallback, showMessage = false }: { 
  children: ReactNode
  fallback?: ReactNode
  showMessage?: boolean
}) {
  return (
    <RoleGuard 
      requiredPermission="canDeleteJobs" 
      fallback={fallback}
      showMessage={showMessage}
    >
      {children}
    </RoleGuard>
  )
}

export function RecruiterOrAbove({ children, fallback, showMessage = false }: { 
  children: ReactNode
  fallback?: ReactNode
  showMessage?: boolean 
}) {
  return (
    <RoleGuard 
      requiredPermission="canCreateJobs" 
      fallback={fallback}
      showMessage={showMessage}
    >
      {children}
    </RoleGuard>
  )
}

// Backward compatibility: export the route guard as default
export default RouteGuard