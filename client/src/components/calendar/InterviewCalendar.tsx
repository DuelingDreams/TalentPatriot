import { useState } from 'react'
import { Calendar } from '@/components/ui/LazyCalendar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { 
  CalendarDays, 
  Clock, 
  MapPin, 
  Video, 
  Phone, 
  User, 
  Plus,
  Filter,
  Loader2
} from 'lucide-react'
import { format, isSameDay } from 'date-fns'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { useInterviews } from '@/features/communications/hooks/useInterviews'
import { ScheduleInterviewDialog } from './ScheduleInterviewDialog'

const InterviewTypeIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'video':
      return <Video className="h-4 w-4" />
    case 'phone':
      return <Phone className="h-4 w-4" />
    case 'onsite':
      return <MapPin className="h-4 w-4" />
    default:
      return <CalendarDays className="h-4 w-4" />
  }
}

const StatusBadge = ({ status }: { status: string }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800'
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'completed':
        return 'bg-gray-100 text-gray-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'no_show':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Badge variant="secondary" className={cn('text-xs', getStatusColor(status))}>
      {status.replace('_', ' ')}
    </Badge>
  )
}

const InterviewCard = ({ interview }: { interview: any }) => (
  <Card className="mb-3 border-l-4 border-l-blue-500">
    <CardContent className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <InterviewTypeIcon type={interview.type} />
            <h4 className="font-medium text-sm truncate">{interview.candidateName}</h4>
            <StatusBadge status={interview.status} />
          </div>
          
          <div className="space-y-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{format(interview.scheduledAt, 'h:mm a')} ({interview.duration} min)</span>
            </div>
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span>{interview.jobTitle} at {interview.companyName}</span>
            </div>
            {interview.location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span className="truncate">{interview.location}</span>
              </div>
            )}
          </div>
        </div>
        
        <Avatar className="h-8 w-8 ml-2">
          <AvatarFallback className="text-xs">
            {interview.candidateName.split(' ').map((n: string) => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
      </div>
      
      {interview.notes && (
        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
          {interview.notes}
        </p>
      )}
    </CardContent>
  </Card>
)

export function InterviewCalendar() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const { user, currentOrgId } = useAuth()
  const { data: interviews = [], isLoading, error } = useInterviews(currentOrgId || undefined)

  // Handle calendar date selection
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date)
    }
  }

  // Get interviews for selected date
  const selectedDateInterviews = interviews.filter((interview: any) =>
    isSameDay(new Date(interview.scheduledAt), selectedDate)
  )

  const interviewDates = interviews.map((interview: any) => new Date(interview.scheduledAt))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      {/* Calendar Section */}
      <div className="lg:col-span-2">
        <Card className="h-fit">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Interview Calendar</CardTitle>
                <CardDescription>
                  Schedule and manage candidate interviews
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
                <ScheduleInterviewDialog
                  trigger={
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Schedule Interview
                    </Button>
                  }
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              className="rounded-md border w-full"
            />
            
            <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded"></div>
                <span>Has interviews</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-primary border border-primary rounded"></div>
                <span>Selected date</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Interview Details Section */}
      <div className="space-y-6">
        {/* Selected Date Interviews */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">
              {format(selectedDate, 'EEEE, MMMM d')}
            </CardTitle>
            <CardDescription>
              {selectedDateInterviews.length === 0 
                ? 'No interviews scheduled' 
                : `${selectedDateInterviews.length} interview${selectedDateInterviews.length > 1 ? 's' : ''} scheduled`
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading interviews...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-destructive mb-4">Failed to load interviews</p>
                <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                  Try Again
                </Button>
              </div>
            ) : selectedDateInterviews.length === 0 ? (
              <div className="text-center py-8">
                <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No interviews scheduled for this date</p>
                <ScheduleInterviewDialog
                  trigger={
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Schedule Interview
                    </Button>
                  }
                />
              </div>
            ) : (
              selectedDateInterviews
                .sort((a: any, b: any) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
                .map((interview: any) => (
                  <InterviewCard key={interview.id} interview={interview} />
                ))
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">This Week</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">8</div>
                <div className="text-xs text-muted-foreground">Scheduled</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">3</div>
                <div className="text-xs text-muted-foreground">Completed</div>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Video Calls</span>
                <span className="font-medium">5</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Phone Calls</span>
                <span className="font-medium">2</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">On-site</span>
                <span className="font-medium">4</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}