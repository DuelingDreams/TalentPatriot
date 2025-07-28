import { useState } from 'react'
import { useLocation } from 'wouter'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { 
  Plus, 
  Users, 
  UserPlus, 
  BarChart3,
  ArrowRight,
  CheckCircle
} from 'lucide-react'

const goalOptions = [
  {
    id: 'post-job',
    title: 'Post a job',
    description: 'Create your first job posting and start attracting candidates',
    icon: Plus,
    color: 'bg-blue-500',
    path: '/jobs',
    action: 'create-job'
  },
  {
    id: 'import-candidates',
    title: 'Import candidates',
    description: 'Upload your existing candidate database or resume files',
    icon: Users,
    color: 'bg-green-500',
    path: '/candidates',
    action: 'import-candidates'
  },
  {
    id: 'invite-teammate',
    title: 'Invite a teammate',
    description: 'Add team members to collaborate on hiring decisions',
    icon: UserPlus,
    color: 'bg-purple-500',
    path: '/dashboard',
    action: 'invite-team'
  },
  {
    id: 'explore-dashboard',
    title: 'Explore the dashboard',
    description: 'Take a tour of TalentPatriot and see what you can do',
    icon: BarChart3,
    color: 'bg-orange-500',
    path: '/dashboard',
    action: 'explore'
  }
]

export default function OnboardingStep3() {
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  
  const { user } = useAuth()
  const [, setLocation] = useLocation()
  const { toast } = useToast()

  // Redirect to login if not authenticated
  if (!user) {
    setLocation('/login')
    return null
  }

  const handleGoalSelect = (goalId: string) => {
    setSelectedGoal(goalId)
  }

  const handleGetStarted = async () => {
    if (!selectedGoal) return

    setLoading(true)
    
    const selectedOption = goalOptions.find(option => option.id === selectedGoal)
    if (!selectedOption) return

    try {
      // Mark onboarding as completed
      await fetch(`/api/user-profiles/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          onboardingCompleted: true,
          firstGoal: selectedGoal,
        }),
      })

      toast({
        title: "Welcome to TalentPatriot!",
        description: `Let's get started with ${selectedOption.title.toLowerCase()}.`,
      })

      // Redirect to Step 4 walkthrough with selected goal
      setLocation(`/onboarding/step4?goal=${selectedOption.action}`)
    } catch (error) {
      console.warn('Failed to complete onboarding:', error)
      // Still redirect to dashboard even if API call fails
      setLocation('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F9FC] px-4 font-[Inter,sans-serif]">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 flex items-center justify-center mx-auto mb-6">
            <img 
              src="/tp-logo.png" 
              alt="TalentPatriot Logo" 
              className="w-16 h-16 object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-[#1A1A1A] mb-2 tracking-tight">
            What do you want to do first?
          </h1>
          <p className="text-[#5C667B]">
            Choose your starting point to personalize your TalentPatriot experience
          </p>
        </div>

        <Card className="shadow-lg border-0">
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {goalOptions.map((option) => {
                const IconComponent = option.icon
                const isSelected = selectedGoal === option.id
                
                return (
                  <div
                    key={option.id}
                    className={`
                      relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-200
                      ${isSelected 
                        ? 'border-indigo-500 bg-indigo-50 shadow-md' 
                        : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                      }
                    `}
                    onClick={() => handleGoalSelect(option.id)}
                  >
                    {isSelected && (
                      <div className="absolute top-3 right-3">
                        <CheckCircle className="w-5 h-5 text-indigo-600" />
                      </div>
                    )}
                    
                    <div className="flex items-start space-x-4">
                      <div className={`
                        p-3 rounded-lg text-white flex-shrink-0
                        ${option.color}
                      `}>
                        <IconComponent className="w-6 h-6" />
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 mb-2">
                          {option.title}
                        </h3>
                        <p className="text-sm text-slate-600 leading-relaxed">
                          {option.description}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            
            <Button 
              onClick={handleGetStarted}
              disabled={!selectedGoal || loading}
              className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-base transition-colors"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Getting started...
                </div>
              ) : (
                <div className="flex items-center">
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-2" />
                </div>
              )}
            </Button>
            
            <div className="mt-6 text-center">
              <p className="text-xs text-slate-500 leading-relaxed">
                Step 3 of 5 • You can always change this later in your dashboard
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}