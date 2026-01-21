import { useState, useEffect } from 'react'
import { useLocation } from 'wouter'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/shared/hooks/use-toast'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/queryClient'
import { 
  Loader2, 
  CheckCircle, 
  Building2, 
  Palette, 
  Users, 
  Rocket,
  AlertCircle,
  Clock,
  ArrowLeft
} from 'lucide-react'

type OrganizationInfo = {
  id: string
  name: string
  company_size?: string
  careers_published?: boolean
}

type BrandingInfo = {
  primary_color?: string
  accent_color?: string
  tagline?: string
  logo_url?: string
}

export default function OnboardingReview() {
  const { user, organizationId, userRole } = useAuth()
  const [, setLocation] = useLocation()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [launchComplete, setLaunchComplete] = useState(false)

  const isAdmin = userRole === 'admin' || userRole === 'owner' || userRole === 'hiring_manager'

  const { data: orgInfo } = useQuery<OrganizationInfo>({
    queryKey: ['/api/organizations/current'],
    enabled: !!organizationId,
  })

  const { data: branding } = useQuery<BrandingInfo>({
    queryKey: ['/api/organizations/branding', 'careers'],
    enabled: !!organizationId,
  })

  const launchMutation = useMutation({
    mutationFn: async () => {
      if (isAdmin) {
        return apiRequest('/api/organizations/publish-careers', {
          method: 'POST',
        })
      } else {
        return apiRequest('/api/admin/inbox', {
          method: 'POST',
          body: JSON.stringify({
            requestType: 'careers_publish',
            targetTable: 'organizations',
            targetId: organizationId,
            title: 'Request to publish careers portal',
            description: `${user?.email} has completed onboarding and is requesting to publish the careers portal.`,
          }),
        })
      }
    },
    onSuccess: () => {
      setLaunchComplete(true)
      queryClient.invalidateQueries({ queryKey: ['/api/organizations'] })
      
      if (isAdmin) {
        toast({
          title: 'Careers portal published!',
          description: 'Your careers page is now live and accepting applications.',
        })
      } else {
        toast({
          title: 'Request submitted',
          description: 'Your admin will be notified to approve the careers portal launch.',
        })
      }
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to process request',
        variant: 'destructive',
      })
    },
  })

  if (!user) {
    setLocation('/login')
    return null
  }

  const handleLaunch = () => {
    launchMutation.mutate()
  }

  const handleContinue = () => {
    setLocation('/dashboard')
  }

  const reviewItems = [
    {
      icon: Building2,
      label: 'Organization',
      value: orgInfo?.name || 'Loading...',
      complete: !!orgInfo?.name,
    },
    {
      icon: Palette,
      label: 'Branding',
      value: branding?.tagline || 'Default theme',
      complete: true,
      colors: branding ? [branding.primary_color, branding.accent_color] : null,
    },
    {
      icon: Users,
      label: 'Your Role',
      value: userRole || 'Recruiter',
      complete: true,
    },
  ]

  return (
    <div className="min-h-screen flex items-center justify-center bg-tp-page-bg px-4 font-[Inter,sans-serif]">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-16 h-16 flex items-center justify-center mx-auto mb-6">
            <img 
              src="/talentpatriot-logo.png" 
              alt="TalentPatriot Logo" 
              className="w-16 h-16 object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-neutral-900 mb-2 tracking-tight">
            {launchComplete ? "You're all set!" : 'Review & Launch'}
          </h1>
          <p className="text-neutral-600">
            {launchComplete 
              ? 'Your workspace is ready to use'
              : 'Review your setup before going live'}
          </p>
        </div>

        <Card className="shadow-lg border-0">
          <CardContent className="p-8">
            {launchComplete ? (
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-success-600" />
                </div>
                <h2 className="text-xl font-semibold text-neutral-900 mb-2">
                  {isAdmin ? 'Careers Portal is Live!' : 'Request Submitted!'}
                </h2>
                <p className="text-neutral-600 mb-6">
                  {isAdmin 
                    ? 'Candidates can now view your open positions and apply.'
                    : 'Your admin will review and approve the careers portal launch.'}
                </p>
                <Button 
                  onClick={handleContinue}
                  className="bg-tp-primary hover:bg-tp-accent text-white font-semibold h-12 px-8"
                >
                  <Rocket className="w-4 h-4 mr-2" />
                  Go to Dashboard
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-4 mb-8">
                  {reviewItems.map((item, index) => {
                    const Icon = item.icon
                    return (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                            <Icon className="w-5 h-5 text-tp-primary" />
                          </div>
                          <div>
                            <p className="text-sm text-neutral-500">{item.label}</p>
                            <p className="font-medium text-neutral-900">{item.value}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {item.colors && (
                            <div className="flex gap-1">
                              {item.colors.filter(Boolean).map((color, i) => (
                                <div 
                                  key={i}
                                  className="w-5 h-5 rounded-full border border-neutral-200"
                                  style={{ backgroundColor: color }}
                                />
                              ))}
                            </div>
                          )}
                          {item.complete ? (
                            <CheckCircle className="w-5 h-5 text-success-500" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-warning-500" />
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {!isAdmin && (
                  <Alert className="mb-6 border-info-200 bg-info-50">
                    <Clock className="h-4 w-4 text-info-600" />
                    <AlertDescription className="text-info-700 ml-2">
                      As a recruiter, your request to publish the careers portal will need admin approval.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-3">
                  <Button 
                    variant="outline"
                    onClick={() => setLocation('/onboarding/branding')}
                    className="h-12"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button 
                    onClick={handleLaunch}
                    className="flex-1 h-12 bg-tp-primary hover:bg-tp-accent text-white font-semibold" 
                    disabled={launchMutation.isPending}
                  >
                    {launchMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Rocket className="w-4 h-4 mr-2" />
                    )}
                    {launchMutation.isPending 
                      ? 'Processing...' 
                      : isAdmin 
                        ? 'Publish Careers Portal'
                        : 'Request Approval'}
                  </Button>
                </div>
              </>
            )}
            
            <div className="mt-6 text-center">
              <p className="text-sm text-neutral-500 leading-relaxed">
                Step 5 of 5 • Final step
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
