import { useState, useEffect } from 'react'
import { useLocation } from 'wouter'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { 
  CheckCircle2, 
  ArrowRight, 
  Briefcase, 
  Users, 
  UserPlus, 
  BarChart3,
  Sparkles,
  Clock,
  Target
} from 'lucide-react'

interface WalkthroughStep {
  id: string
  title: string
  description: string
  icon: any
  color: string
  estimatedTime: string
  completed: boolean
  action?: () => void
}

export default function OnboardingStep4() {
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<string[]>([])
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null)
  
  const { user } = useAuth()
  const [, setLocation] = useLocation()
  const { toast } = useToast()

  // Get the goal from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const goal = urlParams.get('goal')
    setSelectedGoal(goal)
  }, [])

  // Auto-advance through steps
  useEffect(() => {
    if (!isAutoPlaying) return

    const timer = setTimeout(() => {
      if (currentStep < walkthroughSteps.length - 1) {
        setCurrentStep(prev => prev + 1)
        setCompletedSteps(prev => [...prev, walkthroughSteps[currentStep].id])
      } else {
        setIsAutoPlaying(false)
        // Auto-advance to Step 5 after completing walkthrough
        setTimeout(() => {
          setLocation(`/onboarding/step5?goal=${selectedGoal || 'explore'}`)
        }, 2000)
      }
    }, 3000) // 3 seconds per step

    return () => clearTimeout(timer)
  }, [currentStep, isAutoPlaying, selectedGoal, setLocation])

  // Redirect to login if not authenticated
  if (!user) {
    setLocation('/login')
    return null
  }

  const walkthroughSteps: WalkthroughStep[] = [
    {
      id: 'overview',
      title: 'Dashboard Overview',
      description: 'Your command center for tracking hiring progress, pipeline analytics, and team performance.',
      icon: BarChart3,
      color: 'bg-blue-500',
      estimatedTime: '30 sec',
      completed: completedSteps.includes('overview'),
    },
    {
      id: 'jobs',
      title: 'Job Management',
      description: 'Create, edit, and manage job postings. Set requirements, benefits, and track applications.',
      icon: Briefcase,
      color: 'bg-green-500',
      estimatedTime: '45 sec',
      completed: completedSteps.includes('jobs'),
    },
    {
      id: 'candidates',
      title: 'Candidate Pipeline',
      description: 'View all candidates, track their progress through stages, and manage communications.',
      icon: Users,
      color: 'bg-purple-500',
      estimatedTime: '1 min',
      completed: completedSteps.includes('candidates'),
    },
    {
      id: 'collaboration',
      title: 'Team Collaboration',
      description: 'Invite teammates, assign roles, share feedback, and collaborate on hiring decisions.',
      icon: UserPlus,
      color: 'bg-orange-500',
      estimatedTime: '45 sec',
      completed: completedSteps.includes('collaboration'),
    }
  ]

  const handleSkipWalkthrough = () => {
    setIsAutoPlaying(false)
    setLocation(`/onboarding/step5?goal=${selectedGoal || 'explore'}`)
  }

  const handlePauseResume = () => {
    setIsAutoPlaying(!isAutoPlaying)
  }

  const currentStepData = walkthroughSteps[currentStep]
  const progress = ((currentStep + 1) / walkthroughSteps.length) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4 font-[Inter,sans-serif]">
      <div className="max-w-4xl mx-auto py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 flex items-center justify-center mx-auto mb-6">
            <img 
              src="/tp-logo.png" 
              alt="TalentPatriot Logo" 
              className="w-16 h-16 object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-[#1A1A1A] mb-2 tracking-tight">
            Welcome to TalentPatriot
          </h1>
          <p className="text-[#5C667B] mb-4">
            Let's take a quick tour of your new hiring platform
          </p>
          
          {/* Progress Bar */}
          <div className="max-w-md mx-auto mb-6">
            <div className="flex items-center justify-between text-sm text-[#5C667B] mb-2">
              <span>Step {currentStep + 1} of {walkthroughSteps.length}</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        {/* Main Walkthrough Card */}
        <Card className="shadow-xl border-0 mb-8">
          <CardContent className="p-8">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              {/* Content Side */}
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`w-12 h-12 ${currentStepData.color} rounded-xl flex items-center justify-center`}>
                    <currentStepData.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-[#1A1A1A]">
                      {currentStepData.title}
                    </h2>
                    <div className="flex items-center space-x-2 mt-1">
                      <Clock className="w-4 h-4 text-[#5C667B]" />
                      <span className="text-sm text-[#5C667B]">
                        {currentStepData.estimatedTime}
                      </span>
                    </div>
                  </div>
                </div>
                
                <p className="text-[#5C667B] text-lg leading-relaxed mb-6">
                  {currentStepData.description}
                </p>

                {/* Key Features for Current Step */}
                <div className="space-y-3">
                  {currentStep === 0 && (
                    <>
                      <div className="flex items-center space-x-3">
                        <Target className="w-5 h-5 text-blue-500" />
                        <span className="text-[#1A1A1A]">Real-time hiring metrics and analytics</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Sparkles className="w-5 h-5 text-blue-500" />
                        <span className="text-[#1A1A1A]">Quick actions and workflow shortcuts</span>
                      </div>
                    </>
                  )}
                  {currentStep === 1 && (
                    <>
                      <div className="flex items-center space-x-3">
                        <Target className="w-5 h-5 text-green-500" />
                        <span className="text-[#1A1A1A]">Multi-platform job board distribution</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Sparkles className="w-5 h-5 text-green-500" />
                        <span className="text-[#1A1A1A]">AI-powered job description templates</span>
                      </div>
                    </>
                  )}
                  {currentStep === 2 && (
                    <>
                      <div className="flex items-center space-x-3">
                        <Target className="w-5 h-5 text-purple-500" />
                        <span className="text-[#1A1A1A]">Drag-and-drop Kanban pipeline</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Sparkles className="w-5 h-5 text-purple-500" />
                        <span className="text-[#1A1A1A]">Smart candidate matching and scoring</span>
                      </div>
                    </>
                  )}
                  {currentStep === 3 && (
                    <>
                      <div className="flex items-center space-x-3">
                        <Target className="w-5 h-5 text-orange-500" />
                        <span className="text-[#1A1A1A]">Role-based permissions and access</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Sparkles className="w-5 h-5 text-orange-500" />
                        <span className="text-[#1A1A1A]">Integrated feedback and decision tools</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Visual Side */}
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-8 border">
                <div className="text-center">
                  <div className={`w-24 h-24 ${currentStepData.color} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                    <currentStepData.icon className="w-12 h-12 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#1A1A1A] mb-2">
                    Interactive Preview
                  </h3>
                  <p className="text-[#5C667B] text-sm">
                    This section will show you exactly how {currentStepData.title.toLowerCase()} works in your dashboard.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step Navigation */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {walkthroughSteps.map((step, index) => {
            const IconComponent = step.icon
            const isActive = index === currentStep
            const isCompleted = completedSteps.includes(step.id)
            
            return (
              <Card 
                key={step.id}
                className={`
                  cursor-pointer transition-all duration-200 border-2
                  ${isActive 
                    ? 'border-indigo-500 shadow-md' 
                    : isCompleted
                    ? 'border-green-500 bg-green-50'
                    : 'border-slate-200 hover:border-slate-300'
                  }
                `}
                onClick={() => setCurrentStep(index)}
              >
                <CardContent className="p-4 text-center">
                  <div className={`
                    w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2
                    ${isActive 
                      ? step.color 
                      : isCompleted 
                      ? 'bg-green-500' 
                      : 'bg-slate-200'
                    }
                  `}>
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    ) : (
                      <IconComponent className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    )}
                  </div>
                  <h4 className="text-sm font-medium text-[#1A1A1A]">
                    {step.title}
                  </h4>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handleSkipWalkthrough}
            className="text-[#5C667B]"
          >
            Skip Tour
          </Button>
          
          <div className="flex items-center space-x-3">
            <Badge variant="secondary" className="px-3 py-1">
              {isAutoPlaying ? 'Auto-playing' : 'Paused'}
            </Badge>
            
            <Button
              variant="outline"
              onClick={handlePauseResume}
              className="text-[#5C667B]"
            >
              {isAutoPlaying ? 'Pause' : 'Resume'}
            </Button>
            
            <Button
              onClick={() => setLocation(`/onboarding/step5?goal=${selectedGoal || 'explore'}`)}
              className="bg-[#1F3A5F] hover:bg-[#264C99] text-white"
            >
              Continue to Dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}