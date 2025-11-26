import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, FileText, Send, BarChart3 } from 'lucide-react'
import { Link } from 'wouter'

interface QuickAction {
  id: string
  title: string
  icon: React.ComponentType<{ className?: string }>
  href?: string
  onClick?: () => void
}

export function SimpleQuickActions() {
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
      icon: FileText,
      href: '/candidates'
    },
    {
      id: 'send-updates',
      title: 'Send Updates',
      icon: Send,
      href: '/messages'
    },
    {
      id: 'generate-report',
      title: 'Generate Report',
      icon: BarChart3,
      href: '/reports'
    }
  ]

  return (
    <Card data-testid="quick-actions-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-gray-900">
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action) => {
            const IconComponent = action.icon
            const content = (
              <div 
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all cursor-pointer"
                data-testid={`quick-action-${action.id}`}
                onClick={action.onClick}
              >
                <IconComponent className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">{action.title}</span>
              </div>
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
      </CardContent>
    </Card>
  )
}
