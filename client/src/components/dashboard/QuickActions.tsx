import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Calendar, 
  Users, 
  FileText, 
  MessageSquare,
  Zap,
  ChevronRight
} from 'lucide-react'
import { Link } from 'wouter'
import { PostJobDialog } from '@/components/dialogs/PostJobDialog'
import { useAuth } from '@/contexts/AuthContext'
import { useJobCandidates } from '@/hooks/useJobCandidates'

interface QuickAction {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  href?: string
  priority?: 'high' | 'medium' | 'low'
  badge?: string
  onClick?: () => void
  external?: boolean
}

interface QuickActionsProps {
  actions?: QuickAction[]
  onActionClick?: (actionId: string) => void
}

export function QuickActions({ actions, onActionClick }: QuickActionsProps) {
  const { userRole } = useAuth()
  const { data: jobCandidates } = useJobCandidates()

  const demoActions: QuickAction[] = [
    {
      id: 'post-job',
      title: 'Post New Job',
      description: 'Create urgent position',
      icon: Plus,
      priority: 'high',
      badge: 'Popular',
      onClick: () => onActionClick?.('post-job')
    },
    {
      id: 'schedule-interview',
      title: 'Schedule Interview',
      description: 'Book candidate meetings',
      icon: Calendar,
      href: '/calendar',
      priority: 'high'
    },
    {
      id: 'review-applications',
      title: 'Review Applications',
      description: '8 pending review',
      icon: Users,
      href: '/candidates',
      priority: 'medium',
      badge: '8 new'
    },
    {
      id: 'send-updates',
      title: 'Send Updates',
      description: 'Bulk candidate emails',
      icon: MessageSquare,
      href: '/messages',
      priority: 'medium'
    },
    {
      id: 'generate-report',
      title: 'Generate Report',
      description: 'Weekly performance',
      icon: FileText,
      href: '/dashboard',
      priority: 'low'
    },
    {
      id: 'ai-insights',
      title: 'AI Insights',
      description: 'Smart recommendations',
      icon: Zap,
      href: '/dashboard',
      priority: 'medium',
      badge: 'New'
    }
  ]

  // Calculate real data for authenticated users
  const appliedStageNames = ['applied', 'new', 'inbox']
  const createdKey = (jc: any) => jc.appliedAt || jc.created_at || jc.createdAt
  const isApplied = (jc: any) => appliedStageNames.includes((jc.stage || '').toLowerCase())
  const lastDay = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const pendingReview = (jobCandidates || []).filter((jc: any) => isApplied(jc)).length
  const newInLastDay = (jobCandidates || []).filter((jc: any) => 
    isApplied(jc) && createdKey(jc) && new Date(createdKey(jc)) > lastDay
  ).length

  const realActions: QuickAction[] = [
    {
      id: 'post-job',
      title: 'Post New Job',
      description: 'Create urgent position',
      icon: Plus,
      priority: 'high',
      badge: 'Popular',
      onClick: () => onActionClick?.('post-job')
    },
    {
      id: 'schedule-interview',
      title: 'Schedule Interview',
      description: 'Book candidate meetings',
      icon: Calendar,
      href: '/calendar',
      priority: 'high'
    },
    {
      id: 'review-applications',
      title: 'Review Applications',
      description: pendingReview > 0 ? `${pendingReview} pending review` : 'No new applications',
      icon: Users,
      href: '/candidates',
      priority: 'medium',
      badge: newInLastDay > 0 ? `${newInLastDay} new` : undefined
    },
    {
      id: 'send-updates',
      title: 'Send Updates',
      description: 'Bulk candidate emails',
      icon: MessageSquare,
      href: '/messages',
      priority: 'medium'
    },
    {
      id: 'generate-report',
      title: 'Generate Report',
      description: 'Weekly performance',
      icon: FileText,
      href: '/dashboard',
      priority: 'low'
    },
    {
      id: 'ai-insights',
      title: 'AI Insights',
      description: 'Smart recommendations',
      icon: Zap,
      href: '/dashboard',
      priority: 'medium',
      badge: 'New'
    }
  ]

  // Choose which actions to display based on user role
  const items = userRole === 'demo_viewer'
    ? (actions || demoActions)
    : (actions || realActions)

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500 bg-red-50/30'
      case 'medium':
        return 'border-l-orange-500 bg-orange-50/30'
      case 'low':
        return 'border-l-blue-500 bg-blue-50/30'
      default:
        return 'border-l-gray-500 bg-gray-50/30'
    }
  }

  const handleActionClick = (action: QuickAction) => {
    if (action.onClick) {
      action.onClick()
    } else if (action.href && !action.external) {
      // Navigation will be handled by Link component
    }
    onActionClick?.(action.id)
  }

  return (
    <Card className="card">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="tp-h2 text-[#1A1A1A]">Quick Actions</h3>
          <Badge variant="secondary" className="bg-[#264C99]/10 text-[#264C99]">
            {items.length} available
          </Badge>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((action) => {
            const Icon = action.icon
            const content = (
              <div 
                className={`
                  p-4 rounded-lg border-l-2 hover:shadow-md transition-all duration-200 cursor-pointer
                  ${getPriorityColor(action.priority)}
                `}
                onClick={() => handleActionClick(action)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-[#264C99]/10 rounded-lg">
                      <Icon className="w-4 h-4 text-[#264C99]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="tp-label text-[#1A1A1A] font-medium text-sm">
                          {action.title}
                        </h4>
                        {action.badge && (
                          <Badge variant="secondary" className="text-xs h-5">
                            {action.badge}
                          </Badge>
                        )}
                      </div>
                      <p className="tp-body text-[#5C667B] text-xs">
                        {action.description}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-3 h-3 text-[#5C667B] mt-1" />
                </div>
              </div>
            )

            // Handle Post Job action specially with dialog
            if (action.id === 'post-job') {
              return (
                <PostJobDialog key={action.id} 
                  trigger={
                    <div className="contents">
                      {content}
                    </div>
                  } 
                />
              )
            }

            // Handle actions with href
            if (action.href) {
              return (
                <Link key={action.id} href={action.href}>
                  {content}
                </Link>
              )
            }

            // Handle actions with onClick
            return content
          })}
        </div>
        
        <div className="mt-4 pt-4 border-t border-[#F0F4F8]">
          <p className="tp-body text-[#5C667B] text-xs text-center">
            Need help? <Link href="/help" className="text-[#264C99] hover:underline">View all actions</Link>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}