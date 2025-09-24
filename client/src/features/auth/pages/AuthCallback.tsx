import { useEffect } from 'react'
import { useLocation } from 'wouter'
import { useAuth } from '@/contexts/AuthContext'
import { useDemoFlag } from '@/lib/demoFlag'
import { Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
  const [, setLocation] = useLocation()
  const { user, loading } = useAuth()
  const { isDemoUser } = useDemoFlag()

  useEffect(() => {
    async function handleAuthCallback() {
      if (loading) return
      
      if (!user) {
        // No user, redirect to login
        setLocation('/login')
        return
      }

      try {
        // Demo protection: skip database checks in demo mode
        if (isDemoUser) {
          // In demo mode, go directly to dashboard
          setLocation('/dashboard')
          return
        }

        // Check if user has completed onboarding by checking if they have an organization
        const { data: userOrgs } = await supabase
          .from('user_organizations')
          .select('org_id')
          .eq('user_id', user.id)
          .limit(1)

        if (!userOrgs || userOrgs.length === 0) {
          // User has no organization, needs onboarding
          // Check if they have completed step 1 (role selection)
          const userRole = user.user_metadata?.role
          
          if (!userRole) {
            // No role set, start from step 2 (OAuth users skip email/password)
            setLocation('/onboarding/step2')
          } else if (!user.user_metadata?.onboardingCompleted) {
            // Has role but onboarding not completed, continue from step 3
            setLocation('/onboarding/step3')
          } else {
            // Has role and onboarding marked complete but no org, setup org
            setLocation('/settings/organization')
          }
        } else {
          // User has organization, go to dashboard
          setLocation('/dashboard')
        }
      } catch (error) {
        console.error('Error checking user onboarding status:', error)
        // On error, default to dashboard and let it handle missing org
        setLocation('/dashboard')
      }
    }

    handleAuthCallback()
  }, [user, loading, setLocation])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
        <p className="text-slate-600">Setting up your account...</p>
      </div>
    </div>
  )
}