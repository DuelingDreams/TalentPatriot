import { useAuth } from '@/contexts/AuthContext'
import { useDemo } from '@/contexts/DemoContext'

export function useDemoAuth() {
  const { user, userRole } = useAuth()
  const { isDemoMode } = useDemo()
  
  // Check if user is authenticated and has demo_viewer role
  const isAuthenticatedDemo = user && userRole === 'demo_viewer'
  
  // Check if user can access demo data
  const canAccessDemo = isAuthenticatedDemo || isDemoMode
  
  // Get the demo user info (either from auth or demo context)
  const demoUser = isAuthenticatedDemo ? {
    id: user.id,
    email: user.email || 'demo@yourapp.com',
    name: user.user_metadata?.name || 'Demo User',
    role: userRole
  } : {
    id: 'cd99579b-1b80-4802-9651-e881fb707583',
    email: 'demo@yourapp.com',
    name: 'Demo User',
    role: 'demo_viewer'
  }
  
  return {
    isAuthenticatedDemo,
    canAccessDemo,
    demoUser,
    isDemoMode
  }
}