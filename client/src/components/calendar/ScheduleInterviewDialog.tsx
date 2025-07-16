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
import { Calendar as CalendarIcon, Clock, MapPin, Video, Phone, User, Plus } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

// Mock data for candidates and jobs
const mockCandidates = [
  { id: '1', name: 'Sarah Johnson', job: 'Senior Software Engineer', company: 'TechCorp' },
  { id: '2', name: 'Mike Chen', job: 'Product Manager', company: 'InnovateInc' },
  { id: '3', name: 'Emma Wilson', job: 'UX Designer', company: 'DesignStudio' },
  { id: '4', name: 'Alex Brown', job: 'Data Scientist', company: 'DataCorp' },
]

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
  const [isSubmitting, setIsSubmitting] = useState(false)

  const selectedCandidateData = mockCandidates.find(c => c.id === selectedCandidate)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCandidate || !interviewType || !selectedDate || !selectedTime) {
      return
    }

    setIsSubmitting(true)
    
    try {
      // Create interview object
      const [hours, minutes] = selectedTime.split(':').map(Number)
      const scheduledAt = new Date(selectedDate)
      scheduledAt.setHours(hours, minutes, 0, 0)

      const interview = {
        id: crypto.randomUUID(),
        candidateId: selectedCandidate,
        candidateName: selectedCandidateData?.name,
        jobTitle: selectedCandidateData?.job,
        companyName: selectedCandidateData?.company,
        title: title || `${interviewType} Interview - ${selectedCandidateData?.name}`,
        type: interviewType,
        status: 'scheduled',
        scheduledAt,
        duration,
        location,
        notes,
        createdAt: new Date(),
      }

      // Here you would normally make an API call to create the interview
      console.log('Creating interview:', interview)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      onScheduled?.(interview)
      
      // Reset form
      setSelectedCandidate(candidateId || '')
      setInterviewType('')
      setSelectedDate(undefined)
      setSelectedTime('')
      setDuration('60')
      setLocation('')
      setTitle('')
      setNotes('')
      setOpen(false)
      
    } catch (error) {
      console.error('Failed to create interview:', error)
    } finally {
      setIsSubmitting(false)
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule Interview</DialogTitle>
          <DialogDescription>
            Create a new interview appointment with a candidate
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Candidate Selection */}
          <div className="space-y-2">
            <Label htmlFor="candidate">Candidate *</Label>
            <Select value={selectedCandidate} onValueChange={setSelectedCandidate} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a candidate" />
              </SelectTrigger>
              <SelectContent>
                {mockCandidates.map(candidate => (
                  <SelectItem key={candidate.id} value={candidate.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{candidate.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {candidate.job} at {candidate.company}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedCandidateData && (
              <div className="flex gap-2 mt-2">
                <Badge variant="secondary">
                  {selectedCandidateData.job}
                </Badge>
                <Badge variant="outline">
                  {selectedCandidateData.company}
                </Badge>
              </div>
            )}
          </div>

          {/* Interview Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Interview Type *</Label>
            <Select value={interviewType} onValueChange={setInterviewType} required>
              <SelectTrigger>
                <SelectValue placeholder="Select interview type" />
              </SelectTrigger>
              <SelectContent>
                {interviewTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <type.icon className="h-4 w-4" />
                      {type.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date & Time Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date < new Date() || date < new Date("1900-01-01")}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Time *</Label>
              <Select value={selectedTime} onValueChange={setSelectedTime} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map(time => (
                    <SelectItem key={time} value={time}>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {time}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration">Duration</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {durations.map(dur => (
                  <SelectItem key={dur.value} value={dur.value}>
                    {dur.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <div className="flex items-center gap-2">
              <TypeIcon className="h-4 w-4 text-muted-foreground" />
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={
                  interviewType === 'video' ? 'Meeting link (e.g., Zoom, Teams)' :
                  interviewType === 'phone' ? 'Phone number' :
                  interviewType === 'onsite' ? 'Office location or room' :
                  'Location details'
                }
              />
            </div>
          </div>

          {/* Custom Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Custom Title (Optional)</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={selectedCandidateData ? `${interviewType || 'Interview'} - ${selectedCandidateData.name}` : 'Interview title'}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Interview preparation notes, topics to cover, etc."
              rows={3}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Scheduling...' : 'Schedule Interview'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}