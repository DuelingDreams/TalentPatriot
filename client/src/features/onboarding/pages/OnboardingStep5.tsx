import { useEffect, useState } from 'react'
import { Link, useLocation } from 'wouter'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  CheckCircle, 
  Briefcase, 
  Users, 
  UserPlus, 
  MessageCircle, 
  Calendar,
  Sparkles,
  ArrowRight
} from 'lucide-react'

export default function OnboardingStep5() {
  const [, setLocation] = useLocation()
  const [showConfetti, setShowConfetti] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null)

  useEffect(() => {
    // Get the goal from URL parameters
    const urlParams = new URLSearchParams(window.location.search)
    const goal = urlParams.get('goal')
    setSelectedGoal(goal)
    
    // Trigger confetti animation
    setShowConfetti(true)
    const timer = setTimeout(() => setShowConfetti(false), 3000)
    return () => clearTimeout(timer)
  }, [])

  // Get quick actions based on selected goal, with primary action first
  const getQuickActions = () => {
    const baseActions = [
      {
        title: 'Post First Job',
        description: 'Create your first job posting and start attracting candidates',
        icon: Briefcase,
        link: '/jobs?onboarding=true&action=create-guided',
        color: 'bg-info-50 hover:bg-info-100 border-info-200',
        iconColor: 'text-info-600',
        id: 'create-job'
      },
      {
        title: 'Import Candidates',
        description: 'Upload your existing candidate database or resume files',
        icon: Users,
        link: '/candidates?onboarding=true&action=import-guided',
        color: 'bg-success-50 hover:bg-success-100 border-success-200',
        iconColor: 'text-success-600',
        id: 'import-candidates'
      },
      {
        title: 'Invite Team',
        description: 'Add teammates to collaborate on hiring decisions',
        icon: UserPlus,
        link: '/onboarding/checklist?focus=team',
        color: 'bg-tp-primary-light hover:bg-tp-accent/10 border-tp-accent/30',
        iconColor: 'text-tp-accent',
        id: 'invite-team'
      },
      {
        title: 'Explore Dashboard',
        description: 'Take a guided tour of your new ATS platform',
        icon: MessageCircle,
        link: '/dashboard?onboarding=true&tour=welcome',
        color: 'bg-warning-50 hover:bg-warning-100 border-warning-200',
        iconColor: 'text-warning-600',
        id: 'explore'
      }
    ]

    // Put the selected goal action first, with enhanced styling
    if (selectedGoal) {
      const selectedAction = baseActions.find(action => action.id === selectedGoal)
      if (selectedAction) {
        const enhancedAction = {
          ...selectedAction,
          color: 'bg-gradient-to-br from-tp-primary-light to-info-50 hover:from-tp-accent/20 hover:to-info-100 border-tp-accent ring-2 ring-tp-accent/30',
          iconColor: 'text-tp-accent'
        }
        const otherActions = baseActions.filter(action => action.id !== selectedGoal)
        return [enhancedAction, ...otherActions]
      }
    }

    return baseActions
  }

  const quickActions = getQuickActions()

  return (
    <div className="min-h-screen bg-gradient-to-br from-info-50 via-white to-tp-primary-light relative overflow-hidden">
      {/* Confetti Animation */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none z-10">
          <div className="confetti-container">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="confetti"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${2 + Math.random() * 2}s`
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-20 h-20 bg-info-500 rounded-full blur-xl" />
        <div className="absolute top-32 right-20 w-16 h-16 bg-tp-accent rounded-full blur-xl" />
        <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-success-500 rounded-full blur-xl" />
        <div className="absolute bottom-32 right-1/3 w-18 h-18 bg-warning-500 rounded-full blur-xl" />
      </div>

      <div className="relative z-20 container mx-auto px-4 py-12 max-w-4xl">
        {/* Success Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <CheckCircle className="w-20 h-20 text-success-500 mx-auto animate-bounce" />
              <Sparkles className="w-8 h-8 text-warning-400 absolute -top-2 -right-2 animate-pulse" />
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-tp-primary mb-4 tracking-tight">
            You're all set!
          </h1>
          
          <p className="text-xl text-neutral-600 mb-2">
            Welcome to TalentPatriot! Your ATS is ready to help you hire amazing people.
          </p>
          
          <div className="flex flex-col items-center gap-2">
            <Badge variant="secondary" className="bg-success-100 text-success-700 px-4 py-1">
              Account Setup Complete
            </Badge>
            <p className="text-sm text-neutral-500">
              Step 5 of 5 • Onboarding Complete
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-center mb-2 text-tp-primary">
            {selectedGoal === 'create-job' ? "Let's post your first job!" :
             selectedGoal === 'import-candidates' ? "Let's import your candidates!" :
             selectedGoal === 'invite-team' ? "Let's build your team!" :
             selectedGoal === 'explore' ? "Let's explore TalentPatriot!" :
             "What would you like to do first?"}
          </h2>
          {selectedGoal && (
            <p className="text-center text-neutral-600 mb-6">
              Based on your goal selection, we've prioritized the best next steps for you.
            </p>
          )}
          
          <div className="grid md:grid-cols-3 gap-6">
            {quickActions.map((action, index) => (
              <Link key={action.title} href={action.link}>
                <Card className={`${action.color} border-2 transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-pointer group`}>
                  <CardContent className="p-6 text-center">
                    <div className={`w-16 h-16 ${action.iconColor} bg-white rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                      <action.icon className="w-8 h-8" />
                    </div>
                    
                    <h3 className="font-semibold text-lg mb-2 text-neutral-900">
                      {action.title}
                    </h3>
                    
                    <p className="text-sm text-neutral-600 mb-4">
                      {action.description}
                    </p>
                    
                    <div className="flex items-center justify-center text-sm font-medium text-neutral-700 group-hover:text-neutral-900">
                      Get Started
                      <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Help Section */}
        <Card className="bg-white/80 backdrop-blur-sm border-2 border-neutral-200">
          <CardContent className="p-8 text-center">
            <MessageCircle className="w-12 h-12 text-tp-accent mx-auto mb-4" />
            
            <h3 className="text-xl font-semibold mb-3 text-tp-primary">
              Need help getting started?
            </h3>
            
            <p className="text-neutral-600 mb-6">
              Our team is here to help you make the most of TalentPatriot. Get personalized guidance to optimize your hiring process.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="outline" className="border-tp-accent text-tp-accent hover:bg-tp-accent hover:text-white">
                <MessageCircle className="w-4 h-4 mr-2" />
                Chat with us
              </Button>
              
              <Button className="bg-tp-primary hover:bg-tp-accent text-white">
                <Calendar className="w-4 h-4 mr-2" />
                Book a free 10-min tour
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Dashboard Link */}
        <div className="text-center mt-8">
          <div className="flex justify-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" className="text-tp-accent hover:text-tp-primary">
                Go to Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            
            <Link href="/onboarding/checklist">
              <Button variant="outline" className="border-tp-accent text-tp-accent hover:bg-tp-accent hover:text-white">
                View Full Checklist
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          .confetti-container {
            position: relative;
            width: 100%;
            height: 100%;
          }
          
          .confetti {
            position: absolute;
            width: 10px;
            height: 10px;
            background: linear-gradient(45deg, #0EA5E9, #3F88C5, #10B981, #F59E0B);
            animation: confetti-fall linear infinite;
          }
          
          .confetti:nth-child(odd) {
            background: linear-gradient(45deg, #EF4444, #F97316, #10B981, #0EA5E9);
            border-radius: 50%;
          }
          
          .confetti:nth-child(even) {
            background: linear-gradient(45deg, #3F88C5, #EC4899, #10B981, #F59E0B);
          }
          
          @keyframes confetti-fall {
            0% {
              transform: translateY(-100vh) rotate(0deg);
              opacity: 1;
            }
            100% {
              transform: translateY(100vh) rotate(360deg);
              opacity: 0;
            }
          }
        `
      }} />
    </div>
  )
}