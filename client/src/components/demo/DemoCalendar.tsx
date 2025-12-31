import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Filter, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  Users,
  Video,
  Phone,
  MapPin
} from 'lucide-react'

interface Interview {
  id: string
  title: string
  candidate: string
  position: string
  time: string
  duration: string
  type: 'video' | 'phone' | 'in-person'
  interviewer: string
  status: 'scheduled' | 'completed' | 'cancelled'
}

const demoInterviews: Interview[] = [
  {
    id: '1',
    title: 'Technical Interview',
    candidate: 'Sarah Chen',
    position: 'Senior Frontend Developer',
    time: '10:00 AM',
    duration: '1 hour',
    type: 'video',
    interviewer: 'Mike Johnson',
    status: 'scheduled'
  },
  {
    id: '2',
    title: 'Final Round',
    candidate: 'Alex Rodriguez',
    position: 'Product Manager',
    time: '2:30 PM',
    duration: '45 minutes',
    type: 'in-person',
    interviewer: 'Emily Davis',
    status: 'scheduled'
  },
  {
    id: '3',
    title: 'Phone Screening',
    candidate: 'David Kim',
    position: 'DevOps Engineer',
    time: '4:00 PM',
    duration: '30 minutes',
    type: 'phone',
    interviewer: 'Lisa Wang',
    status: 'scheduled'
  }
]

const monthDays = Array.from({ length: 31 }, (_, i) => i + 1)
const today = 16 // July 16th as shown in screenshot

export function DemoCalendar() {
  const [selectedDate, setSelectedDate] = useState(today)
  const [currentMonth, setCurrentMonth] = useState('July 2025')

  const getInterviewIcon = (type: Interview['type']) => {
    switch (type) {
      case 'video': return <Video className="w-4 h-4" />
      case 'phone': return <Phone className="w-4 h-4" />
      case 'in-person': return <MapPin className="w-4 h-4" />
    }
  }

  const getStatusColor = (status: Interview['status']) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const todaysInterviews = selectedDate === today ? demoInterviews : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Interview Calendar</h1>
          <p className="mt-1 text-sm text-slate-600">
            Schedule and manage candidate interviews
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-3">
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" />
            Schedule Interview
          </Button>
        </div>
      </div>

      {/* Calendar Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-600">Today's Interviews</CardTitle>
              <CalendarIcon className="w-4 h-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{demoInterviews.length}</div>
            <p className="text-sm text-slate-500 mt-1">Scheduled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-600">This Week</CardTitle>
              <Clock className="w-4 h-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">12</div>
            <p className="text-sm text-slate-500 mt-1">Total interviews</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-600">Video Calls</CardTitle>
              <Video className="w-4 h-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">8</div>
            <p className="text-sm text-slate-500 mt-1">Remote interviews</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-600">Completion Rate</CardTitle>
              <Users className="w-4 h-4 text-yellow-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">94%</div>
            <p className="text-sm text-slate-500 mt-1">This month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold leading-tight">{currentMonth}</CardTitle>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 mb-4">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                <div key={day} className="text-center text-sm font-medium text-slate-500 p-2">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {/* Previous month days */}
              <div className="text-center p-2 text-slate-400 text-sm">29</div>
              <div className="text-center p-2 text-slate-400 text-sm">30</div>
              
              {/* Current month days */}
              {monthDays.map(day => (
                <button
                  key={day}
                  onClick={() => setSelectedDate(day)}
                  className={`text-center p-2 text-sm rounded-md transition-colors ${
                    day === selectedDate
                      ? 'bg-blue-600 text-white'
                      : day === today
                      ? 'bg-blue-100 text-blue-800'
                      : 'hover:bg-slate-100'
                  } ${
                    day === today && demoInterviews.length > 0 ? 'relative' : ''
                  }`}
                >
                  {day}
                  {day === today && demoInterviews.length > 0 && (
                    <div className="absolute top-1 right-1 w-2 h-2 bg-blue-400 rounded-full"></div>
                  )}
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-4 mt-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                <span className="text-slate-600">Has interviews</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                <span className="text-slate-600">Selected date</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Selected Day Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold leading-tight">
              {selectedDate === today ? 'Today, July 16' : `July ${selectedDate}`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todaysInterviews.length === 0 ? (
              <div className="text-center py-8">
                <CalendarIcon className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                <h3 className="text-sm font-medium text-slate-900 mb-2">
                  No interviews scheduled
                </h3>
                <p className="text-sm text-slate-500">
                  {selectedDate === today ? 'for this date' : 'Select a different date'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {todaysInterviews.map(interview => (
                  <div key={interview.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getInterviewIcon(interview.type)}
                        <span className="font-medium text-sm">{interview.title}</span>
                      </div>
                      <Badge className={getStatusColor(interview.status)}>
                        {interview.status}
                      </Badge>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{interview.candidate}</p>
                      <p className="text-xs text-slate-600">{interview.position}</p>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{interview.time} • {interview.duration}</span>
                      <span>with {interview.interviewer}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}