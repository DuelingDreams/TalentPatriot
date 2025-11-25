import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Users, Calendar, AlertTriangle } from 'lucide-react'
import { Link } from 'wouter'

interface WorkItem {
  id: string
  title: string
  count: number
  icon: React.ComponentType<any>
  href: string
  priority: 'high' | 'medium' | 'low'
}

interface TodaysWorkProps {
  candidatesNeedingReview?: number
  interviewsToday?: number
  jobsNeedingAttention?: number
  loading?: boolean
}

export function TodaysWork({ 
  candidatesNeedingReview = 4, 
  interviewsToday = 2, 
  jobsNeedingAttention = 1,
  loading = false 
}: TodaysWorkProps) {
  const workItems: WorkItem[] = [
    {
      id: 'review-candidates',
      title: 'Review Candidates',
      count: candidatesNeedingReview,
      icon: Users,
      href: '/candidates?filter=pending_review',
      priority: 'high'
    },
    {
      id: 'interviews-today',
      title: 'Interviews Today',
      count: interviewsToday,
      icon: Calendar,
      href: '/calendar',
      priority: 'medium'
    },
    {
      id: 'jobs-attention',
      title: 'Jobs Needing Attention',
      count: jobsNeedingAttention,
      icon: AlertTriangle,
      href: '/jobs?filter=needs_attention',
      priority: 'high'
    }
  ]

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-50 text-red-600 border-red-200'
      case 'medium': return 'bg-yellow-50 text-yellow-600 border-yellow-200'
      case 'low': return 'bg-blue-50 text-blue-600 border-blue-200'
      default: return 'bg-gray-50 text-gray-600 border-gray-200'
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900" data-testid="todays-work-title">
        Today's Work
      </h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 overflow-hidden">
        {workItems.map((item) => {
          const IconComponent = item.icon
          return (
            <Card
              key={item.id}
              className="hover:shadow-md transition-shadow cursor-pointer min-w-0"
              data-testid={`work-card-${item.id}`}
            >
              <CardContent className="p-4">
                <Link href={item.href}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`p-2 rounded-lg flex-shrink-0 ${getPriorityColor(item.priority)}`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-gray-900 text-sm truncate" data-testid={`work-title-${item.id}`}>
                          {item.title}
                        </h3>
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0">
                      {loading ? (
                        <div className="h-6 w-8 bg-gray-200 animate-pulse rounded" />
                      ) : (
                        <Badge 
                          variant="secondary" 
                          className="text-lg font-bold min-w-[2rem] justify-center"
                          data-testid={`work-count-${item.id}`}
                        >
                          {item.count}
                        </Badge>
                      )}
                    </div>
                  </div>
                </Link>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}