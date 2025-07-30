import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatDistanceToNow } from 'date-fns'
import { Clock, UserPlus, Briefcase, CheckCircle, XCircle, Calendar } from 'lucide-react'

interface Activity {
  id: string
  type: 'candidate_added' | 'job_posted' | 'interview_scheduled' | 'offer_made' | 'candidate_rejected'
  title: string
  description: string
  timestamp: Date
  user: {
    name: string
    avatar?: string
  }
}

interface RecentActivityProps {
  activities?: Activity[]
  loading?: boolean
}

const activityIcons = {
  candidate_added: UserPlus,
  job_posted: Briefcase,
  interview_scheduled: Calendar,
  offer_made: CheckCircle,
  candidate_rejected: XCircle,
}

const activityColors = {
  candidate_added: 'bg-blue-100 text-blue-600',
  job_posted: 'bg-green-100 text-green-600',
  interview_scheduled: 'bg-purple-100 text-purple-600',
  offer_made: 'bg-emerald-100 text-emerald-600',
  candidate_rejected: 'bg-red-100 text-red-600',
}

export function RecentActivity({ activities = [], loading }: RecentActivityProps) {
  // Don't show demo activities for authenticated users - only show actual activities
  const displayActivities = activities

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
        <Clock className="w-4 h-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {loading ? (
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