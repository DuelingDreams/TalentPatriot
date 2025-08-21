import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Calendar as CalendarIcon, Clock, MapPin, Video, Phone, User, Plus, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { useCandidates } from '@/hooks/useCandidates'
import { useCreateInterview } from '@/hooks/useInterviews'
import { useToast } from '@/hooks/use-toast'

const interviewTypes = [
  { value: 'phone', label: 'Phone Call', icon: Phone },
  { value: 'video', label: 'Video Call', icon: Video },
  { value: 'onsite', label: 'On-site', icon: MapPin },
  { value: 'technical', label: 'Technical', icon: User },
  { value: 'cultural', label: 'Cultural Fit', icon: User },
]

const timeSlots = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
]

const durations = [
  { value: '30', label: '30 minutes' },
  { value: '45', label: '45 minutes' },
  { value: '60', label: '1 hour' },
  { value: '90', label: '1.5 hours' },
  { value: '120', label: '2 hours' },
]

interface ScheduleInterviewDialogProps {
  trigger?: React.ReactNode
  candidateId?: string
  onScheduled?: (interview: any) => void
}

export function ScheduleInterviewDialog({ trigger, candidateId, onScheduled }: ScheduleInterviewDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState(candidateId || '')
  const [interviewType, setInterviewType] = useState('')
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [selectedTime, setSelectedTime] = useState('')
  const [duration, setDuration] = useState('60')
  const [location, setLocation] = useState('')
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [jobCandidateId, setJobCandidateId] = useState('')

  const { currentOrgId } = useAuth()
  const { toast } = useToast()
  const { data: candidates = [], isLoading: candidatesLoading } = useCandidates()
  const createInterviewMutation = useCreateInterview()

  const selectedCandidateData = candidates.find((c: any) => c.id === selectedCandidate)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCandidate || !interviewType || !selectedDate || !selectedTime || !jobCandidateId || !currentOrgId) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }
    
    try {
      // Create interview object
      const [hours, minutes] = selectedTime.split(':').map(Number)
      const scheduledAt = new Date(selectedDate)
      scheduledAt.setHours(hours, minutes, 0, 0)

      const interviewData = {
        orgId: currentOrgId,
        jobCandidateId,
        title: title || `${interviewType} Interview - ${selectedCandidateData?.name}`,
        type: interviewType as any,
        scheduledAt: scheduledAt,
        duration,
        location,
        notes,
      }

      await createInterviewMutation.mutateAsync(interviewData)
      
      toast({
        title: "Interview Scheduled",
        description: `Interview with ${selectedCandidateData?.name} has been scheduled successfully.`
      })
      
      onScheduled?.(interviewData)
      
      // Reset form
      setSelectedCandidate(candidateId || '')
      setInterviewType('')
      setSelectedDate(undefined)
      setSelectedTime('')
      setDuration('60')
      setLocation('')
      setTitle('')
      setNotes('')
      setJobCandidateId('')
      setOpen(false)
      
    } catch (error) {
      console.error('Failed to create interview:', error)
      toast({
        title: "Error",
        description: "Failed to schedule interview. Please try again.",
        variant: "destructive"
      })
    }
  }

  const TypeIcon = interviewTypes.find(type => type.value === interviewType)?.icon || User

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Schedule Interview
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto p-6 z-[9999] bg-white shadow-lg border">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-xl font-semibold">Schedule Interview</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Create a new interview appointment with a candidate
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6 relative z-10">
          {/* Candidate Selection */}
          <div className="space-y-2">
            <Label htmlFor="candidate" className="text-sm font-medium">Candidate *</Label>
            <Select value={selectedCandidate} onValueChange={setSelectedCandidate} required disabled={candidatesLoading}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder={candidatesLoading ? "Loading candidates..." : "Select a candidate"} />
              </SelectTrigger>
              <SelectContent>
                {candidatesLoading ? (
                  <div className="p-3 text-center">
                    <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    <span className="text-sm text-muted-foreground mt-1">Loading...</span>
                  </div>
                ) : candidates.length === 0 ? (
                  <div className="p-3 text-center text-muted-foreground text-sm">
                    No candidates found
                  </div>
                ) : (
                  candidates.map((candidate: any) => (
                    <SelectItem key={candidate.id} value={candidate.id}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{candidate.name}</span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {selectedCandidateData && (
              <div className="mt-2">
                <Badge variant="secondary" className="text-xs">
                  {selectedCandidateData.email}
                </Badge>
              </div>
            )}
          </div>

          {/* Interview Type */}
          <div className="space-y-2">
            <Label htmlFor="type" className="text-sm font-medium">Interview Type *</Label>
            <Select value={interviewType} onValueChange={setInterviewType} required>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select interview type" />
              </SelectTrigger>
              <SelectContent>
                {interviewTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-3">
                      <type.icon className="h-4 w-4 text-muted-foreground" />
                      <span>{type.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal h-10",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "MMM d, yyyy") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent 
                className="w-auto p-0 z-[9999] max-h-[400px] overflow-auto bg-white shadow-lg border" 
                align="start"
                side="bottom"
                sideOffset={8}
                avoidCollisions={true}
                collisionPadding={16}
              >
                <div className="lg:w-auto w-screen lg:max-w-none max-w-[calc(100vw-2rem)]">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date < new Date() || date < new Date("1900-01-01")}
                    initialFocus
                    className="lg:p-3 p-4"
                  />
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Selection */}
          <div className="space-y-2">
            <Label htmlFor="time" className="text-sm font-medium">Time *</Label>
            <Select value={selectedTime} onValueChange={setSelectedTime} required>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select time" />
              </SelectTrigger>
              <SelectContent>
                {timeSlots.map(time => (
                  <SelectItem key={time} value={time}>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{time}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration" className="text-sm font-medium">Duration</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {durations.map(dur => (
                  <SelectItem key={dur.value} value={dur.value}>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{dur.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location" className="text-sm font-medium">Location</Label>
            <div className="relative">
              <TypeIcon className="absolute left-3 top-1/2 h-4 w-4 text-muted-foreground transform -translate-y-1/2" />
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="pl-10 h-10"
                placeholder={
                  interviewType === 'video' ? 'Meeting link (e.g., Zoom, Teams)' :
                  interviewType === 'phone' ? 'Phone number' :
                  interviewType === 'onsite' ? 'Office location or room' :
                  'Location details'
                }
              />
            </div>
          </div>

          {/* Job-Candidate ID - Simplified for now */}
          <div className="space-y-2">
            <Label htmlFor="jobCandidateId" className="text-sm font-medium">Job-Candidate ID *</Label>
            <Input
              id="jobCandidateId"
              value={jobCandidateId}
              onChange={(e) => setJobCandidateId(e.target.value)}
              placeholder="Enter job-candidate relationship ID"
              className="h-10"
              required
            />
            <p className="text-xs text-muted-foreground leading-relaxed">
              This connects the interview to a specific job application. You can find this ID in the candidate's job applications.
            </p>
          </div>

          {/* Custom Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">Custom Title (Optional)</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={selectedCandidateData ? `${interviewType || 'Interview'} - ${selectedCandidateData.name}` : 'Interview title'}
              className="h-10"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Interview preparation notes, topics to cover, etc."
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Submit Button */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="h-10">
              Cancel
            </Button>
            <Button type="submit" disabled={createInterviewMutation.isPending} className="h-10">
              {createInterviewMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Scheduling...
                </>
              ) : (
                'Schedule Interview'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}