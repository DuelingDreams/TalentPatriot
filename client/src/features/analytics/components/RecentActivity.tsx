import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatDistanceToNow } from 'date-fns'
import { UserPlus, Briefcase, CheckCircle, XCircle, Calendar, ArrowRight } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

interface Activity {
  id: string
  type: 'candidate_added' | 'job_posted' | 'interview_scheduled' | 'offer_made' | 'candidate_rejected' | 'stage_moved'
  title: string
  description: string
  timestamp: Date
  user: {
    name: string
    avatar?: string
  }
}

interface RecentActivityProps {
  orgId: string
  limit?: number
}

const activityIcons = {
  candidate_added: UserPlus,
  job_posted: Briefcase,
  interview_scheduled: Calendar,
  offer_made: CheckCircle,
  candidate_rejected: XCircle,
  stage_moved: ArrowRight,
}

const activityColors = {
  candidate_added: 'bg-blue-100 text-blue-600',
  job_posted: 'bg-green-100 text-green-600',
  interview_scheduled: 'bg-purple-100 text-purple-600',
  offer_made: 'bg-emerald-100 text-emerald-600',
  candidate_rejected: 'bg-red-100 text-red-600',
  stage_moved: 'bg-orange-100 text-orange-600',
}

export function RecentActivity({ orgId, limit = 10 }: RecentActivityProps) {
  const { data: activityData, isLoading, isError } = useQuery({
    queryKey: ['/api/analytics/dashboard-activity', orgId, limit],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/dashboard-activity?orgId=${orgId}&limit=${limit}`)
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard activity')
      }
      return response.json()
    },
    staleTime: 15 * 1000,
    refetchInterval: 30 * 1000,
  })

  const displayActivities: Activity[] = (activityData || []).map((item: any, index: number) => {
    const candidateInitials = item.candidate_name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
    
    const activity: Activity = {
      id: `${item.job_id}_${item.candidate_id}_${item.changed_at}_${index}`,
      type: 'stage_moved',
      title: `${item.candidate_name} moved to ${item.to_stage_display}`,
      description: item.from_stage_display 
        ? `Moved from ${item.from_stage_display} to ${item.to_stage_display} • ${item.job_title}`
        : `Applied to ${item.job_title}`,
      timestamp: new Date(item.changed_at),
      user: {
        name: candidateInitials,
        avatar: undefined
      }
    }
    
    return activity
  })

  return (
    <Card data-testid="recent-activity-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-gray-900">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[280px]">
          {isError ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-sm text-red-500">Failed to load activity</p>
              <p className="text-xs text-gray-400 mt-1">Please refresh the page to try again</p>
            </div>
          ) : isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4" />
                    <div className="h-2.5 bg-gray-200 rounded animate-pulse w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : displayActivities.length > 0 ? (
            <div className="space-y-3">
              {displayActivities.map((activity) => {
                const Icon = activityIcons[activity.type]
                const colorClass = activityColors[activity.type]
                
                return (
                  <div 
                    key={activity.id} 
                    className="flex items-start space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                    data-testid={`activity-item-${activity.id}`}
                  >
                    <div className="relative flex-shrink-0">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={activity.user.avatar} alt={activity.user.name} />
                        <AvatarFallback className="text-xs">{activity.user.name}</AvatarFallback>
                      </Avatar>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center ${colorClass}`}>
                        <Icon className="w-2.5 h-2.5" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{activity.title}</p>
                      <p className="text-xs text-gray-500 truncate">{activity.description}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-sm text-gray-500">No recent activity</p>
              <p className="text-xs text-gray-400 mt-1">Activity will appear here as your team works</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
