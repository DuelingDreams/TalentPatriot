import { ReactNode } from 'react'
import { useCanAccess, type RolePermissions } from '@/hooks/useRolePermissions'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ShieldX } from 'lucide-react'

interface RoleGuardProps {
  permission: keyof RolePermissions
  children: ReactNode
  fallback?: ReactNode
  showMessage?: boolean
}

export function RoleGuard({ 
  permission, 
  children, 
  fallback = null, 
  showMessage = false 
}: RoleGuardProps) {
  const canAccess = useCanAccess(permission)
  
  if (!canAccess) {
    if (showMessage) {
      return (
        <Alert className="border-orange-200 bg-orange-50">
          <ShieldX className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            You don't have permission to access this feature. Contact your admin for access.
          </AlertDescription>
        </Alert>
      )
    }
    return <>{fallback}</>
  }
  
  return <>{children}</>
}

// Convenience components for common use cases
export function AdminOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard permission="canManageOrganization" fallback={fallback}>
      {children}
    </RoleGuard>
  )
}

export function HiringManagerOrAdmin({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard permission="canDeleteJobs" fallback={fallback}>
      {children}
    </RoleGuard>
  )
}

export function RecruiterOrAbove({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard permission="canCreateJobs" fallback={fallback}>
      {children}
    </RoleGuard>
  )
}