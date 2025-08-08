import { useState, useEffect } from 'react'
import { useLocation } from 'wouter'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { 
  CheckCircle, 
  Circle, 
  Plus, 
  Users, 
  UserPlus, 
  BarChart3,
  BookOpen,
  Play,
  Database,
  ArrowRight,
  Sparkles
} from 'lucide-react'

interface ChecklistItem {
  id: string
  title: string
  description: string
  completed: boolean
  action: string
  icon: React.ComponentType<any>
  category: 'setup' | 'data' | 'team' | 'explore'
}

export default function OnboardingChecklist() {
  const [, setLocation] = useLocation()
  const { user } = useAuth()
  const { toast } = useToast()
  const [checklist, setChecklist] = useState<ChecklistItem[]>([])
  const [completedCount, setCompletedCount] = useState(0)
  
  // Get focus parameter from URL
  const urlParams = new URLSearchParams(window.location.search)
  const focus = urlParams.get('focus') || 'explore'

  // Initialize checklist based on focus
  useEffect(() => {
    const baseItems: ChecklistItem[] = [
      {
        id: 'create-job',
        title: 'Post your first job',
        description: 'Create a job posting to start attracting candidates',
        completed: false,
        action: '/jobs?onboarding=true&action=create-guided',
        icon: Plus,
        category: 'setup'
      },
      {
        id: 'import-candidates',
        title: 'Add candidates',
        description: 'Import existing candidates or upload resumes',
        completed: false,
        action: '/candidates?onboarding=true&action=import-guided',
        icon: Users,
        category: 'data'
      },
      {
        id: 'invite-team',
        title: 'Invite your team',
        description: 'Add colleagues to collaborate on hiring',
        completed: false,
        action: '/dashboard?action=invite-guided',
        icon: UserPlus,
        category: 'team'
      },
      {
        id: 'explore-pipeline',
        title: 'Explore your pipeline',
        description: 'See how candidates move through hiring stages',
        completed: false,
        action: '/pipeline?onboarding=true&tour=pipeline',
        icon: BarChart3,
        category: 'explore'
      },
      {
        id: 'job-templates',
        title: 'Browse job templates',
        description: 'Use pre-built templates for common roles',
        completed: false,
        action: '/jobs?onboarding=true&action=templates',
        icon: BookOpen,
        category: 'setup'
      },
      {
        id: 'demo-data',
        title: 'Load demo data',
        description: 'Add sample jobs and candidates to explore features',
        completed: false,
        action: '/dashboard?action=load-demo',
        icon: Database,
        category: 'data'
      },
    ]

    // Prioritize items based on focus
    let prioritizedItems = [...baseItems]
    if (focus === 'team') {
      prioritizedItems = baseItems.sort((a, b) => 
        a.category === 'team' ? -1 : b.category === 'team' ? 1 : 0
      )
    } else if (focus === 'explore') {
      prioritizedItems = baseItems.sort((a, b) => 
        a.category === 'explore' ? -1 : b.category === 'explore' ? 1 : 0
      )
    }

    setChecklist(prioritizedItems)
  }, [focus])

  // Calculate completion
  useEffect(() => {
    const completed = checklist.filter(item => item.completed).length
    setCompletedCount(completed)
  }, [checklist])

  const handleItemClick = (item: ChecklistItem) => {
    // Mark as completed
    setChecklist(prev => prev.map(i => 
      i.id === item.id ? { ...i, completed: true } : i
    ))
    
    toast({
      title: "Great progress!",
      description: `${item.title} completed. Keep going!`,
    })
    
    // Navigate to the action
    setLocation(item.action)
  }

  const handleSkipOnboarding = () => {
    toast({
      title: "Welcome to TalentPatriot!",
      description: "You can always access these features from your dashboard.",
    })
    setLocation('/dashboard')
  }

  const categoryColors = {
    setup: 'bg-blue-100 text-blue-800',
    data: 'bg-green-100 text-green-800', 
    team: 'bg-purple-100 text-purple-800',
    explore: 'bg-orange-100 text-orange-800'
  }

  const getFocusTitle = () => {
    switch (focus) {
      case 'team': return 'Build Your Team'
      case 'explore': return 'Explore TalentPatriot'
      default: return 'Get Started with TalentPatriot'
    }
  }

  const getFocusDescription = () => {
    switch (focus) {
      case 'team': return 'Invite colleagues and set up collaborative hiring'
      case 'explore': return 'Take a guided tour of your new ATS platform'
      default: return 'Complete these steps to make the most of your account'
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 flex items-center justify-center">
                  <img 
                    src="/talentpatriot-logo.png" 
                    alt="TalentPatriot Logo" 
                    className="w-10 h-10 object-contain"
                  />
                </div>
                <h1 className="text-2xl font-bold text-slate-900">
                  {getFocusTitle()}
                </h1>
              </div>
              <p className="text-slate-600">
                {getFocusDescription()}
              </p>
            </div>
            
            <div className="text-right">
              <div className="text-2xl font-bold text-indigo-600 mb-1">
                {completedCount}/{checklist.length}
              </div>
              <div className="text-sm text-slate-500">
                Tasks Completed
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">Progress</span>
              <span className="text-sm text-slate-500">
                {Math.round((completedCount / checklist.length) * 100)}%
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div 
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(completedCount / checklist.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Checklist */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid gap-4">
          {checklist.map((item) => {
            const IconComponent = item.icon
            return (
              <Card 
                key={item.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                  item.completed ? 'bg-green-50 border-green-200' : 'hover:border-slate-300'
                }`}
                onClick={() => !item.completed && handleItemClick(item)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`
                        p-3 rounded-lg flex-shrink-0
                        ${item.completed ? 'bg-green-500 text-white' : 'bg-indigo-100 text-indigo-600'}
                      `}>
                        {item.completed ? (
                          <CheckCircle className="w-6 h-6" />
                        ) : (
                          <IconComponent className="w-6 h-6" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className={`font-semibold ${
                            item.completed ? 'text-green-800' : 'text-slate-900'
                          }`}>
                            {item.title}
                          </h3>
                          <Badge 
                            variant="secondary" 
                            className={categoryColors[item.category]}
                          >
                            {item.category}
                          </Badge>
                        </div>
                        <p className={`text-sm ${
                          item.completed ? 'text-green-700' : 'text-slate-600'
                        }`}>
                          {item.description}
                        </p>
                      </div>
                    </div>
                    
                    {!item.completed && (
                      <ArrowRight className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
        
        {/* Action Buttons */}
        <div className="mt-8 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handleSkipOnboarding}
            className="text-slate-600"
          >
            Skip for now
          </Button>
          
          {completedCount === checklist.length && (
            <Button
              onClick={() => setLocation('/dashboard')}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Go to Dashboard
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}