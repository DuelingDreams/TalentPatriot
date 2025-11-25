import { Button } from '@/components/ui/button'
import { Calendar, Users, MessageSquare, FileText } from 'lucide-react'
import { Link } from 'wouter'

interface QuickAction {
  id: string
  title: string
  icon: React.ComponentType<{ className?: string }>
  href?: string
  onClick?: () => void
}

interface SimpleQuickActionsProps {
  pendingApplications?: number
}

export function SimpleQuickActions({ pendingApplications = 8 }: SimpleQuickActionsProps) {
  const actions: QuickAction[] = [
    {
      id: 'schedule-interview',
      title: 'Schedule Interview',
      icon: Calendar,
      href: '/calendar'
    },
    {
      id: 'review-applications',
      title: 'Review Applications',
      icon: Users,
      href: '/candidates'
    },
    {
      id: 'send-updates',
      title: 'Send Updates',
      icon: MessageSquare,
      href: '/messages'
    },
    {
      id: 'generate-report',
      title: 'Generate Report',
      icon: FileText,
      onClick: () => {
        // TODO: Implement report generation
        console.log('Generate Report clicked')
      }
    }
  ]

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900" data-testid="quick-actions-title">
        Quick Actions
      </h2>
      
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {actions.map((action) => {
          const IconComponent = action.icon
          const content = (
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center space-y-2 hover:shadow-md transition-shadow"
              data-testid={`quick-action-${action.id}`}
              onClick={action.onClick}
            >
              <IconComponent className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-center">{action.title}</span>
            </Button>
          )

          if (action.href) {
            return (
              <Link key={action.id} href={action.href}>
                {content}
              </Link>
            )
          }

          return <div key={action.id}>{content}</div>
        })}
      </div>
    </div>
  )
}