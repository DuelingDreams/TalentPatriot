import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatDistanceToNow } from 'date-fns'
import { Clock, UserPlus, Briefcase, CheckCircle, XCircle, Calendar, ArrowRight } from 'lucide-react'
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

export function RecentActivity({ orgId, limit = 20 }: RecentActivityProps) {
  // Fetch dashboard activity data from analytics endpoint
  const { data: activityData, isLoading, error } = useQuery({
    queryKey: ['/api/analytics/dashboard-activity', orgId, limit],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/dashboard-activity?orgId=${orgId}&limit=${limit}`)
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard activity')
      }
      return response.json()
    },
    staleTime: 15 * 1000, // Cache for 15 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds for real-time feel
  })

  // Transform analytics data to Activity format
  const displayActivities: Activity[] = (activityData || []).map((item: any, index: number) => {
    const candidateInitials = item.candidate_name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
    
    // Create activity based on stage movement
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
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
        <Clock className="w-4 h-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-slate-200 rounded-full animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 rounded animate-pulse w-3/4" />
                    <div className="h-3 bg-slate-200 rounded animate-pulse w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : displayActivities.length > 0 ? (
            <div className="space-y-4">
              {displayActivities.map((activity) => {
                const Icon = activityIcons[activity.type]
                const colorClass = activityColors[activity.type]
                
                return (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="relative">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={activity.user.avatar} alt={activity.user.name} />
                        <AvatarFallback>{activity.user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ${colorClass}`}>
                        <Icon className="w-3 h-3" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">{activity.title}</p>
                      <p className="text-sm text-slate-600 mt-0.5">{activity.description}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Clock className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-sm font-medium text-slate-900">No recent activity</p>
              <p className="text-sm text-slate-500 mt-1">Activity will appear here as your team works</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}