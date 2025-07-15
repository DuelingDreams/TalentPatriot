import { useState, useMemo } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { useInterviewEvents, useScheduleInterview, useCandidatesForJob, useJobs } from '@/hooks/useJobs'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Calendar as CalendarIcon, Plus, User, Building2, Clock, Loader2, Users } from 'lucide-react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'

// Form schema for scheduling interviews
const scheduleInterviewSchema = z.object({
  jobCandidateId: z.string().min(1, 'Please select a candidate'),
  interviewDate: z.string().min(1, 'Interview date is required'),
  notes: z.string().optional(),
})

type ScheduleInterviewFormData = z.infer<typeof scheduleInterviewSchema>

export default function Calendar() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedJobId, setSelectedJobId] = useState<string>('')
  const { toast } = useToast()

  // Fetch data
  const { data: interviewEvents, isLoading: eventsLoading } = useInterviewEvents()
  const { data: jobs } = useJobs()
  const { data: jobCandidates } = useCandidatesForJob(selectedJobId || null)
  const scheduleInterviewMutation = useScheduleInterview()

  // Form setup
  const form = useForm<ScheduleInterviewFormData>({
    resolver: zodResolver(scheduleInterviewSchema),
    defaultValues: {
      jobCandidateId: '',
      interviewDate: '',
      notes: '',
    }
  })

  // Transform interview events for FullCalendar
  const calendarEvents = useMemo(() => {
    if (!interviewEvents) return []
    
    return interviewEvents.map(event => ({
      id: event.id,
      title: `${event.candidates.name} - ${event.jobs.title}`,
      start: event.interview_date,
      backgroundColor: event.stage === 'interview' ? '#3b82f6' : '#10b981',
      borderColor: event.stage === 'interview' ? '#2563eb' : '#059669',
      extendedProps: {
        candidateName: event.candidates.name,
        candidateEmail: event.candidates.email,
        jobTitle: event.jobs.title,
        clientName: event.jobs.clients?.name,
        stage: event.stage,
      }
    }))
  }, [interviewEvents])

  // Handle form submission
  const onSubmit = async (data: ScheduleInterviewFormData) => {
    try {
      await scheduleInterviewMutation.mutateAsync({
        jobCandidateId: data.jobCandidateId,
        interviewDate: data.interviewDate,
        stage: 'interview'
      })
      
      toast({
        title: "Interview Scheduled",
        description: "The interview has been scheduled successfully.",
      })
      
      setIsModalOpen(false)
      form.reset()
      setSelectedJobId('')
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to schedule interview. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Filter candidates who don't already have interviews scheduled
  const availableCandidates = useMemo(() => {
    if (!jobCandidates) return []
    return jobCandidates.filter(candidate => 
      ['applied', 'screening', 'technical'].includes(candidate.stage)
    )
  }, [jobCandidates])

  return (
    <DashboardLayout pageTitle="Interview Calendar">
      <div className="space-y-6">
        {/* Header with Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Interview Calendar</h1>
            <p className="text-slate-600 mt-1">Schedule and manage candidate interviews</p>
          </div>
          
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Schedule Interview
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Schedule New Interview</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="jobCandidateId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select Job First</FormLabel>
                        <Select value={selectedJobId} onValueChange={setSelectedJobId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a job to see candidates" />
                          </SelectTrigger>
                          <SelectContent>
                            {jobs?.filter(job => job.status === 'open').map((job) => (
                              <SelectItem key={job.id} value={job.id}>
                                {job.title} - {job.clients?.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {selectedJobId && (
                    <FormField
                      control={form.control}
                      name="jobCandidateId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Select Candidate</FormLabel>
                          <Select onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a candidate to interview" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableCandidates.map((candidate) => (
                                <SelectItem key={candidate.id} value={candidate.id}>
                                  <div className="flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    {candidate.candidates.name} - {candidate.stage}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  <FormField
                    control={form.control}
                    name="interviewDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Interview Date & Time</FormLabel>
                        <FormControl>
                          <Input 
                            type="datetime-local"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Additional notes about the interview..."
                            className="min-h-[80px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setIsModalOpen(false)
                        form.reset()
                        setSelectedJobId('')
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={scheduleInterviewMutation.isPending}
                    >
                      {scheduleInterviewMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Scheduling...
                        </>
                      ) : (
                        'Schedule Interview'
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Calendar View */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Upcoming Interviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            {eventsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-2 text-slate-600">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Loading calendar...
                </div>
              </div>
            ) : (
              <div className="calendar-container">
                <FullCalendar
                  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                  initialView="dayGridMonth"
                  headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay'
                  }}
                  events={calendarEvents}
                  height="auto"
                  eventDisplay="block"
                  dayMaxEvents={3}
                  eventClick={(info) => {
                    const props = info.event.extendedProps
                    toast({
                      title: `Interview: ${props.candidateName}`,
                      description: `${props.jobTitle} at ${props.clientName}\nStage: ${props.stage}`,
                    })
                  }}
                  eventContent={(eventInfo) => (
                    <div className="p-1">
                      <div className="text-xs font-medium truncate">
                        {eventInfo.event.extendedProps.candidateName}
                      </div>
                      <div className="text-xs opacity-75 truncate">
                        {eventInfo.event.extendedProps.jobTitle}
                      </div>
                    </div>
                  )}
                  dayCellContent={(dayInfo) => (
                    <div className="text-center">
                      {dayInfo.dayNumberText}
                    </div>
                  )}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span className="text-2xl font-bold">
                  {interviewEvents?.filter(event => {
                    const eventDate = new Date(event.interview_date)
                    const now = new Date()
                    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
                    return eventDate >= now && eventDate <= weekFromNow
                  }).length || 0}
                </span>
                <span className="text-slate-600">interviews</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-green-600" />
                <span className="text-2xl font-bold">
                  {interviewEvents?.filter(event => {
                    const eventDate = new Date(event.interview_date)
                    const now = new Date()
                    const monthFromNow = new Date(now.getFullYear(), now.getMonth() + 1, 0)
                    return eventDate >= now && eventDate <= monthFromNow
                  }).length || 0}
                </span>
                <span className="text-slate-600">scheduled</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Active Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-purple-600" />
                <span className="text-2xl font-bold">
                  {jobs?.filter(job => job.status === 'open').length || 0}
                </span>
                <span className="text-slate-600">open roles</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}