import { useState, useEffect } from 'react'
import { useLocation } from 'wouter'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/shared/hooks/use-toast'
import { useDemoFlag } from '@/lib/demoFlag'
import { clearDemoModeForRealUsers } from '@/lib/demoToggle'
import { Loader2, Building2, Users, Briefcase } from 'lucide-react'

const companySizeOptions = [
  { value: '1-5', label: '1–5 employees' },
  { value: '6-20', label: '6–20 employees' },
  { value: '21-50', label: '21–50 employees' },
  { value: '51-100', label: '51–100 employees' },
  { value: '100+', label: '100+ employees' },
]

const roleOptions = [
  { value: 'hiring_manager', label: 'Hiring Manager', description: 'Team Lead, Director, Founder - Oversees hiring for team/department' },
  { value: 'recruiter', label: 'Recruiter', description: 'Recruiter, Talent Partner, HR Coordinator - Sources and manages candidates' },
  { value: 'admin', label: 'Admin', description: 'Founder, COO, HR Manager - Organization owner with full access' },
  { value: 'interviewer', label: 'Interviewer/Collaborator', description: 'Department Lead, Tech Lead, Peer Interviewer - Reviews resumes and provides feedback' },
]

export default function OnboardingStep2() {
  const [companyName, setCompanyName] = useState('')
  const [companySize, setCompanySize] = useState('')
  const [userRole, setUserRole] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [companyNameError, setCompanyNameError] = useState('')
  
  const { user } = useAuth()
  const [, setLocation] = useLocation()
  const { toast } = useToast()
  const { isDemoUser } = useDemoFlag()

  // Pre-populate with beta application data if available
  useEffect(() => {
    const betaData = sessionStorage.getItem('betaApplicationData')
    if (betaData) {
      try {
        const parsedData = JSON.parse(betaData)
        if (parsedData.companyName) {
          setCompanyName(parsedData.companyName)
        }
        if (parsedData.companySize) {
          setCompanySize(parsedData.companySize)
        }
        // Clear the data after using it
        sessionStorage.removeItem('betaApplicationData')
      } catch (error) {
        console.warn('Failed to parse beta application data:', error)
      }
    }
  }, [])

  // Clear demo mode for real users during onboarding
  useEffect(() => {
    clearDemoModeForRealUsers()
  }, [])

  // Redirect to login if not authenticated
  if (!user) {
    setLocation('/login')
    return null
  }

  const validateForm = () => {
    let isValid = true
    setCompanyNameError('')
    setError('')

    // Company name validation
    if (!companyName.trim()) {
      setCompanyNameError('Company name is required')
      isValid = false
    } else if (companyName.trim().length < 2) {
      setCompanyNameError('Company name must be at least 2 characters')
      isValid = false
    }

    // Company size validation
    if (!companySize) {
      setError('Please select your company size')
      isValid = false
    }

    // Role validation
    if (!userRole) {
      setError('Please select your role')
      isValid = false
    }

    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    setError('')

    // Demo protection: prevent server writes in demo mode
    if (isDemoUser) {
      toast({
        title: "Demo Mode",
        description: "Organization creation is disabled in demo mode. Explore the existing features to see how TalentPatriot works.",
      })
      setLoading(false)
      return
    }

    try {
      // Use the new onboarding service for cleaner organization creation
      const { OnboardingService } = await import('../services/onboardingService')
      
      const result = await OnboardingService.createOrganizationAndAssignUser(
        user.id,
        companyName.trim(),
        companySize,
        userRole
      )

      if (result.success && result.organization) {
        // Update user metadata with role and organization info via Supabase
        const { error: updateError } = await supabase.auth.updateUser({
          data: {
            role: userRole,
            currentOrgId: result.organization.id,
            companyName: companyName.trim(),
            companySize: companySize,
            onboardingCompleted: true,
          }
        })
        
        if (updateError) {
          console.warn('Failed to update user metadata:', updateError)
        }

        toast({
          title: "Organization created!",
          description: `${companyName} has been set up successfully. Let's personalize your experience.`,
        })
        
        // Redirect to Step 3 to choose first goal
        setLocation('/onboarding/step3')
      } else {
        setError(result.error || 'Failed to set up your organization. Please try again.')
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-tp-page-bg px-4 font-[Inter,sans-serif]">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 flex items-center justify-center mx-auto mb-6">
            <img 
              src="/talentpatriot-logo.png" 
              alt="TalentPatriot Logo" 
              className="w-16 h-16 object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-neutral-900 mb-2 tracking-tight">
            Tell us about your team
          </h1>
          <p className="text-neutral-600">
            Help us personalize TalentPatriot for your organization
          </p>
        </div>

        <Card className="shadow-lg border-0">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive" className="border-error-200 bg-error-50">
                  <AlertDescription className="text-error-700">{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="companyName" className="text-neutral-700 font-medium">
                  Company Name
                </Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <Input
                    id="companyName"
                    type="text"
                    placeholder="Acme Corporation"
                    value={companyName}
                    onChange={(e) => {
                      setCompanyName(e.target.value)
                      if (companyNameError) setCompanyNameError('')
                    }}
                    disabled={loading}
                    className={`pl-10 h-12 ${companyNameError ? 'border-error-500 focus-visible:ring-error-500' : 'border-neutral-300 focus-visible:ring-tp-accent'}`}
                  />
                </div>
                {companyNameError && (
                  <p className="text-sm text-error-600 mt-1">{companyNameError}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="companySize" className="text-neutral-700 font-medium">
                  Company Size
                </Label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400 z-10" />
                  <Select value={companySize} onValueChange={setCompanySize} disabled={loading}>
                    <SelectTrigger className="pl-10 h-12 border-neutral-300 focus:ring-tp-accent">
                      <SelectValue placeholder="Select company size" />
                    </SelectTrigger>
                    <SelectContent className="z-50 bg-white border border-neutral-200 shadow-lg rounded-md">
                      {companySizeOptions.map((option) => (
                        <SelectItem 
                          key={option.value} 
                          value={option.value}
                          className="hover:bg-neutral-50 focus:bg-neutral-100 cursor-pointer py-2 px-3"
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="userRole" className="text-neutral-700 font-medium">
                  Your Role
                </Label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400 z-10" />
                  <Select value={userRole} onValueChange={setUserRole} disabled={loading}>
                    <SelectTrigger className="pl-10 h-12 border-neutral-300 focus:ring-tp-accent">
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent className="z-50 bg-white border border-neutral-200 shadow-lg rounded-md max-h-60 overflow-y-auto">
                      {roleOptions.map((option) => (
                        <SelectItem 
                          key={option.value} 
                          value={option.value}
                          className="hover:bg-neutral-50 focus:bg-neutral-100 cursor-pointer py-3 px-3"
                        >
                          <div>
                            <div className="font-medium text-neutral-900">{option.label}</div>
                            <div className="text-xs text-neutral-600 mt-1">{option.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-12 bg-tp-primary hover:bg-tp-accent text-white font-semibold text-base transition-colors mt-8" 
                disabled={loading}
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {loading ? 'Setting up your workspace...' : 'Next'}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-xs text-neutral-500 leading-relaxed">
                Step 2 of 3 • This helps us customize your TalentPatriot experience
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}