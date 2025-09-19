import { useState, useMemo } from 'react'
import { useParams } from 'wouter'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, TouchSensor, useSensor, useSensors, useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MobilePipeline } from '@/components/MobilePipeline'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import { useJobs } from '@/hooks/useJobs'
import { useClients } from '@/hooks/useClients'
import { useCandidatesForJob } from '@/hooks/useCandidatesForJob'
import { usePipeline, useJobPipeline, usePipelineColumns, useMoveApplication, organizeApplicationsByColumn } from '@/hooks/usePipeline'
import { ResumeUpload } from '@/components/resume/ResumeUpload'
import { CandidateNotes } from '@/components/CandidateNotes'
import { DemoPipelineKanban } from '@/components/demo/DemoPipelineKanban'
import { useAuth } from '@/contexts/AuthContext'
import { ArrowLeft, Briefcase, Building2, Calendar, Users, Mail, Phone, FileText, Loader2, MessageSquare, Edit3, ArrowRightLeft, Share2, GripVertical } from 'lucide-react'
import { CandidateNotesDialog } from '@/components/dialogs/CandidateNotesDialog'
import { Link } from 'wouter'


// NEW APPLICATION CARD for the new pipeline system
interface ApplicationCardProps {
  applicationId: string
  candidateId: string
  candidateName: string
  candidateEmail: string
  candidatePhone?: string | null
  resumeUrl?: string | null
  jobId: string
  columnId: string | null
  status: string
  appliedAt?: string
  isDragging?: boolean
}

function ApplicationCard({ 
  applicationId, 
  candidateId, 
  candidateName, 
  candidateEmail, 
  candidatePhone,
  resumeUrl,
  jobId,
  columnId,
  status,
  appliedAt,
  isDragging 
}: ApplicationCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: applicationId || 'unknown-app' })

  const isCurrentlyDragging = isDragging || isSortableDragging
  const { toast } = useToast()
  const [notesDialogOpen, setNotesDialogOpen] = useState(false)
  
  // Defensive coding: Safe defaults for all data
  const safeCandidateName = candidateName || 'Unknown Candidate'
  const safeCandidateEmail = candidateEmail || 'No email provided'
  const safeCandidatePhone = candidatePhone && candidatePhone.trim() !== '' ? candidatePhone : null
  const safeResumeUrl = resumeUrl && resumeUrl.trim() !== '' ? resumeUrl : null
  const safeCandidateId = candidateId || 'unknown'
  const safeApplicationId = applicationId || 'unknown-app'
  const safeJobId = jobId || ''
  
  // Early return if critical data is missing
  if (!applicationId || !candidateId) {
    return (
      <Card className="bg-red-50 border-red-200 mb-3 p-4">
        <div className="text-red-600 text-sm">Error: Application or candidate data is missing</div>
        <div className="text-red-500 text-xs mt-1">
          Application ID: {applicationId || 'Missing'} | Candidate ID: {candidateId || 'Missing'}
        </div>
      </Card>
    )
  }
  
  // Fetch job and client data with real-time updates for pipeline
  const { data: jobs } = useJobs({ enableRealTime: true })
  const { data: clients } = useClients()
  
  // Find job and client info with defensive checks
  const jobInfo = jobs?.find((job: any) => job?.id === jobId) || null
  const clientInfo = jobInfo?.clientId 
    ? clients?.find((client: any) => client?.id === jobInfo.clientId) || null
    : null

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isCurrentlyDragging ? 0.5 : 1,
    cursor: isCurrentlyDragging ? 'grabbing' : 'grab',
  }

  // Quick Actions handlers with comprehensive validation
  const handleSchedule = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!safeCandidateId || safeCandidateId === 'unknown') {
      toast({
        title: "Error",
        description: "Cannot schedule interview - candidate ID is missing",
        variant: "destructive",
      })
      return
    }
    toast({
      title: "Schedule Interview",
      description: `Opening scheduler for ${safeCandidateName}`,
    })
  }

  const handleAddNote = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!safeCandidateId || safeCandidateId === 'unknown') {
      toast({
        title: "Error",
        description: "Cannot add note - candidate ID is missing",
        variant: "destructive",
      })
      return
    }
    toast({
      title: "Add Note",
      description: `Adding note for ${safeCandidateName}`,
    })
  }

  const handleMoveStage = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!safeApplicationId || safeApplicationId === 'unknown-app') {
      toast({
        title: "Error",
        description: "Cannot move stage - application ID is missing",
        variant: "destructive",
      })
      return
    }
    toast({
      title: "Move Stage",
      description: `Moving ${safeCandidateName} to next stage`,
    })
  }

  const handleShareProfile = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!safeCandidateId || safeCandidateId === 'unknown') {
      toast({
        title: "Error",
        description: "Cannot share profile - candidate ID is missing",
        variant: "destructive",
      })
      return
    }
    toast({
      title: "Share Profile",
      description: `Sharing ${safeCandidateName}'s profile`,
    })
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        touch-none select-none
        ${isCurrentlyDragging ? 'z-50' : 'z-0'}
      `}
    >
      <Card className={`
        bg-white shadow-sm border mb-3 transition-all group relative overflow-visible
        ${isCurrentlyDragging 
          ? 'border-blue-500 shadow-xl scale-105 rotate-3' 
          : 'border-slate-200 hover:shadow-md hover:border-blue-300'
        }
      `}>
        <CardContent className="p-4">
          {/* Drag Handle */}
          <div className="absolute top-2 right-2 opacity-40 group-hover:opacity-100 transition-opacity">
            <GripVertical className="w-4 h-4 text-slate-400" />
          </div>

          {/* Quick Actions Toolbar - appears on hover/focus */}
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-all duration-200 ease-in-out translate-y-1 group-hover:translate-y-0 pointer-events-none group-hover:pointer-events-auto">
            <div className="flex items-center gap-1 bg-white shadow-lg border border-slate-200 rounded-full px-2 py-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 rounded-full hover:bg-blue-50 hover:text-blue-600"
                onClick={handleSchedule}
                title="Schedule Interview"
              >
                <Calendar className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 rounded-full hover:bg-green-50 hover:text-green-600"
                onClick={handleAddNote}
                title="Add Note"
              >
                <Edit3 className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 rounded-full hover:bg-purple-50 hover:text-purple-600"
                onClick={handleMoveStage}
                title="Move Stage"
              >
                <ArrowRightLeft className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 rounded-full hover:bg-orange-50 hover:text-orange-600"
                onClick={handleShareProfile}
                title="Share Profile"
              >
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Avatar className="w-10 h-10">
              <AvatarFallback className="bg-blue-100 text-blue-600 text-sm">
                {safeCandidateName && safeCandidateName !== 'Unknown Candidate'
                  ? safeCandidateName.split(' ').map((n: string) => n?.[0] || '').join('').slice(0, 2) || 'N/A'
                  : 'N/A'
                }
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-slate-900 truncate">
                {safeCandidateName}
              </h4>
              <p className="text-xs text-slate-600 mt-1">{jobInfo?.title || 'Position Title'}</p>
              <div className="flex items-center gap-1 text-xs text-slate-600 mt-1">
                <Mail className="w-3 h-3" />
                <span className="truncate">{safeCandidateEmail}</span>
              </div>
              {safeCandidatePhone && (
                <div className="flex items-center gap-1 text-xs text-slate-600 mt-1">
                  <Phone className="w-3 h-3" />
                  <span>{safeCandidatePhone}</span>
                </div>
              )}
              <div className="mt-3 flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-xs h-7"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (safeResumeUrl) {
                      try {
                        window.open(safeResumeUrl, '_blank')
                        toast({
                          title: "Opening Resume",
                          description: `Opening resume for ${safeCandidateName}`,
                        })
                      } catch (error) {
                        console.error('Error opening resume:', error)
                        toast({
                          title: "Error",
                          description: "Failed to open resume. Please check the URL.",
                          variant: "destructive"
                        })
                      }
                    } else {
                      toast({
                        title: "No Resume",
                        description: "This candidate hasn't uploaded a resume yet",
                        variant: "destructive"
                      })
                    }
                  }}
                >
                  <FileText className="w-3 h-3 mr-1" />
                  {safeResumeUrl ? 'View Resume' : 'No Resume'}
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-xs h-7"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (!safeCandidateId || safeCandidateId === 'unknown') {
                      toast({
                        title: "Error",
                        description: "Cannot open notes - candidate data is missing",
                        variant: "destructive",
                      })
                      return
                    }
                    setNotesDialogOpen(true)
                  }}
                >
                  <MessageSquare className="w-3 h-3 mr-1" />
                  Notes
                </Button>
              </div>
              <Badge variant="outline" className="mt-2 text-xs">
                {clientInfo?.name || 'TechCorp Solutions'}
              </Badge>
              <div className="mt-1 text-xs text-slate-500">
                Applied {appliedAt ? new Date(appliedAt).toLocaleDateString() : 'Recently'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <CandidateNotesDialog
        open={notesDialogOpen}
        onClose={() => setNotesDialogOpen(false)}
        candidateId={safeCandidateId}
        jobCandidateId={safeApplicationId}
        candidateName={safeCandidateName}
      />
    </div>
  )
}

// OLD CANDIDATE CARD for fallback system
interface CandidateCardProps {
  candidate: {
    id: string
    stage: string
    notes: string | null
    assigned_to: string | null
    updated_at: string
    candidates: {
      id: string
      name: string
      email: string
      phone: string | null
      resume_url: string | null
      created_at: string
    }
  }
  isDragging?: boolean
}

function CandidateCard({ candidate, isDragging }: CandidateCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: candidate?.id || 'unknown' })

  const isCurrentlyDragging = isDragging || isSortableDragging
  const { toast } = useToast()

  // Defensive coding: Extract candidate data with safe defaults
  const candidateData = candidate?.candidates
  const candidateName = candidateData?.name || 'Unknown Candidate'
  const candidateEmail = candidateData?.email || 'No email'
  const candidatePhone = candidateData?.phone || null
  const resumeUrl = candidateData?.resume_url || null
  const candidateId = candidateData?.id || 'unknown'

  // Early return if essential data is missing
  if (!candidate) {
    return (
      <Card className="bg-red-50 border-red-200 mb-3 p-4">
        <div className="text-red-600 text-sm">Error: Candidate data is missing</div>
      </Card>
    )
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isCurrentlyDragging ? 0.5 : 1,
    cursor: isCurrentlyDragging ? 'grabbing' : 'grab',
  }

  // Quick Actions handlers with defensive coding
  const handleSchedule = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!candidateName || candidateName === 'Unknown Candidate') {
      toast({
        title: "Error",
        description: "Cannot schedule interview - candidate name is missing",
        variant: "destructive",
      })
      return
    }
    toast({
      title: "Schedule Interview",
      description: `Opening scheduler for ${candidateName}`,
    })
  }

  const handleAddNote = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!candidateName || candidateName === 'Unknown Candidate') {
      toast({
        title: "Error",
        description: "Cannot add note - candidate name is missing",
        variant: "destructive",
      })
      return
    }
    toast({
      title: "Add Note",
      description: `Adding note for ${candidateName}`,
    })
  }

  const handleMoveStage = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!candidateName || candidateName === 'Unknown Candidate') {
      toast({
        title: "Error",
        description: "Cannot move stage - candidate name is missing",
        variant: "destructive",
      })
      return
    }
    toast({
      title: "Move Stage",
      description: `Moving ${candidateName} to next stage`,
    })
  }

  const handleShareProfile = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!candidateName || candidateName === 'Unknown Candidate') {
      toast({
        title: "Error",
        description: "Cannot share profile - candidate name is missing",
        variant: "destructive",
      })
      return
    }
    toast({
      title: "Share Profile",
      description: `Sharing ${candidateName}'s profile`,
    })
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        touch-none select-none
        ${isCurrentlyDragging ? 'z-50' : 'z-0'}
      `}
    >
      <Card className={`
        bg-white shadow-sm border mb-3 transition-all group relative overflow-visible
        ${isCurrentlyDragging 
          ? 'border-blue-500 shadow-xl scale-105 rotate-3' 
          : 'border-slate-200 hover:shadow-md hover:border-blue-300'
        }
      `}>
        <CardContent className="p-4">
          {/* Drag Handle */}
          <div className="absolute top-2 right-2 opacity-40 group-hover:opacity-100 transition-opacity">
            <GripVertical className="w-4 h-4 text-slate-400" />
          </div>

          {/* Quick Actions Toolbar - appears on hover/focus */}
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-all duration-200 ease-in-out translate-y-1 group-hover:translate-y-0 pointer-events-none group-hover:pointer-events-auto">
            <div className="flex items-center gap-1 bg-white shadow-lg border border-slate-200 rounded-full px-2 py-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 rounded-full hover:bg-blue-50 hover:text-blue-600"
                onClick={handleSchedule}
                title="Schedule Interview"
              >
                <Calendar className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 rounded-full hover:bg-green-50 hover:text-green-600"
                onClick={handleAddNote}
                title="Add Note"
              >
                <Edit3 className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 rounded-full hover:bg-purple-50 hover:text-purple-600"
                onClick={handleMoveStage}
                title="Move Stage"
              >
                <ArrowRightLeft className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 rounded-full hover:bg-orange-50 hover:text-orange-600"
                onClick={handleShareProfile}
                title="Share Profile"
              >
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Avatar className="w-10 h-10">
              <AvatarFallback className="bg-blue-100 text-blue-600 text-sm">
                {candidateName && candidateName !== 'Unknown Candidate' 
                  ? candidateName.split(' ').map((n: string) => n?.[0] || '').join('').slice(0, 2) || 'N/A'
                  : 'N/A'
                }
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-slate-900 truncate">
                {candidateName}
              </h4>
              <div className="flex items-center gap-1 text-xs text-slate-600 mt-1">
                <Mail className="w-3 h-3" />
                <span className="truncate">{candidateEmail}</span>
              </div>
              {candidatePhone && candidatePhone.trim() !== '' && (
                <div className="flex items-center gap-1 text-xs text-slate-600 mt-1">
                  <Phone className="w-3 h-3" />
                  <span>{candidatePhone}</span>
                </div>
              )}
              {/* Notes can be added via separate component */}
              <div className="mt-3 flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-xs h-7"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (resumeUrl && resumeUrl.trim() !== '') {
                      try {
                        window.open(resumeUrl, '_blank')
                        toast({
                          title: "Opening Resume",
                          description: `Opening resume for ${candidateName}`,
                        })
                      } catch (error) {
                        console.error('Error opening resume:', error)
                        toast({
                          title: "Error",
                          description: "Failed to open resume. Please try again.",
                          variant: "destructive"
                        })
                      }
                    } else {
                      toast({
                        title: "No Resume",
                        description: "This candidate hasn't uploaded a resume yet",
                        variant: "destructive"
                      })
                    }
                  }}
                >
                  <FileText className="w-3 h-3 mr-1" />
                  {resumeUrl ? 'View Resume' : 'No Resume'}
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-xs h-7"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (!candidateName || candidateName === 'Unknown Candidate') {
                      toast({
                        title: "Error",
                        description: "Cannot open notes - candidate data is missing",
                        variant: "destructive",
                      })
                      return
                    }
                    toast({
                      title: "Notes",
                      description: `Opening notes for ${candidateName}`,
                    })
                  }}
                >
                  <MessageSquare className="w-3 h-3 mr-1" />
                  Notes
                </Button>
              </div>
              {/* Assigned to info can be added here if needed */}
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}

// PIPELINE COLUMN for the system
interface PipelineColumnProps {
  column: { id: string; title: string; position: string }
  applications: any[]
  jobId: string
}

function PipelineColumn({ column, applications, jobId }: PipelineColumnProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: column.id,
  })

  // Column colors based on position/title
  const getColumnColor = (title: string) => {
    switch (title.toLowerCase()) {
      case 'new':
      case 'applied': return 'bg-[#F0F4F8] border-gray-200'
      case 'screening': return 'bg-[#E6F0FF] border-[#264C99]/20'
      case 'interview': return 'bg-yellow-100 border-yellow-200'
      case 'offer': return 'bg-purple-100 border-purple-200'
      case 'hired': return 'bg-green-100 border-green-200'
      case 'rejected': return 'bg-red-100 border-red-200'
      default: return 'bg-slate-100 border-slate-200'
    }
  }

  const columnColor = getColumnColor(column.title)

  return (
    <div className="flex-1 min-w-[280px] md:min-w-[300px]">
      <div className={`p-4 rounded-t-lg border-2 ${columnColor} ${
        isOver ? 'border-blue-500 shadow-lg' : ''
      }`}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">{column.title}</h3>
          <Badge variant="secondary" className={`text-xs transition-all ${
            isOver ? 'bg-blue-500 text-white scale-110' : ''
          }`}>
            {applications.length}
          </Badge>
        </div>
      </div>
      <div 
        ref={setNodeRef}
        className={`min-h-[400px] p-4 border-2 border-t-0 rounded-b-lg transition-all duration-200 ${
          columnColor
        } ${
          isOver 
            ? 'bg-opacity-60 border-blue-500 shadow-inner scale-[1.02]' 
            : 'bg-opacity-20'
        }`}
      >
        <SortableContext 
          items={applications?.filter(app => app?.id).map(app => app.id) || []} 
          strategy={verticalListSortingStrategy}
        >
          {applications?.map((application) => {
            // Defensive check for application data
            if (!application || !application.id) {
              console.warn('Skipping invalid application:', application)
              return null
            }
            
            // Safe candidate data extraction with comprehensive validation
            const candidateData = application.candidate || {}
            
            // Ensure all required fields have safe defaults
            const safeApplicationData = {
              applicationId: application.id || `temp-${Date.now()}`,
              candidateId: candidateData.id || application.candidateId || 'unknown',
              candidateName: candidateData.name || application.candidateName || 'Unknown Candidate',
              candidateEmail: candidateData.email || application.candidateEmail || 'No email provided',
              candidatePhone: candidateData.phone || application.candidatePhone || null,
              resumeUrl: candidateData.resumeUrl || candidateData.resume_url || application.resumeUrl || null,
              jobId: application.jobId || jobId || 'unknown',
              columnId: application.columnId || application.pipeline_column_id || null,
              status: application.status || 'active',
              appliedAt: application.appliedAt || application.created_at || new Date().toISOString()
            }
            
            return (
              <ApplicationCard 
                key={application.id}
                {...safeApplicationData}
              />
            )
          })?.filter(Boolean) || []}
        </SortableContext>
        {applications.length === 0 && (
          <div className="flex items-center justify-center h-32 text-slate-400">
            <div className="text-center">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No applications</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


// Component for individual job cards in pipeline overview
function JobPipelineCard({ job }: { job: any }) {
  // Defensive check for job data
  if (!job || !job.id) {
    return (
      <Card className="bg-red-50 border-red-200 p-4">
        <div className="text-red-600 text-sm">Error: Invalid job data</div>
      </Card>
    )
  }
  
  const { data: jobCandidates } = useCandidatesForJob(job.id)
  const totalCandidates = jobCandidates?.length || 0
  
  // Safe job data extraction
  const jobTitle = job.title || 'Untitled Position'
  const jobStatus = job.status || 'unknown'
  const clientName = job.clients?.name || job.client?.name || 'Unknown Client'
  const jobDescription = job.description || ''
  const createdAt = job.created_at || job.createdAt || new Date().toISOString()

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">{jobTitle}</CardTitle>
              <div className="flex items-center gap-1 text-sm text-slate-600 mt-1">
                <Building2 className="w-4 h-4" />
                <span>{clientName}</span>
              </div>
            </div>
          </div>
          <Badge className={
            jobStatus === 'open' ? 'bg-green-100 text-green-800' :
            jobStatus === 'closed' ? 'bg-gray-100 text-gray-800' :
            jobStatus === 'on_hold' ? 'bg-yellow-100 text-yellow-800' :
            'bg-blue-100 text-blue-800'
          }>
            {jobStatus.replace('_', ' ')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {jobDescription && jobDescription.trim() !== '' && (
          <p className="text-slate-600 text-sm mb-4 line-clamp-2">{jobDescription}</p>
        )}
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4 text-sm text-slate-600">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{totalCandidates} candidate{totalCandidates !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>
                {(() => {
                  try {
                    return new Date(createdAt).toLocaleDateString()
                  } catch (error) {
                    console.warn('Invalid date:', createdAt)
                    return 'Unknown date'
                  }
                })()}
              </span>
            </div>
          </div>
        </div>
        
        <Link href={`/pipeline/${job.id}`}>
          <Button className="w-full">
            View Pipeline
            <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}

export default function JobPipeline() {
  const params = useParams<{ id: string }>()
  const jobId = params?.id
  const [activeCandidate, setActiveCandidate] = useState<CandidateCardProps['candidate'] | null>(null)
  const [activeTab, setActiveTab] = useState('candidates')
  const { toast } = useToast()
  const { userRole } = useAuth()
  
  // Fetch data - must be called before any conditional returns (with real-time updates)
  const { data: jobs } = useJobs({ enableRealTime: true })
  const { 
    data: jobCandidates, 
    isLoading: candidatesLoading,
    realtimeStatus,
    lastRealtimeEvent,
    isRealtimeEnabled,
    refresh: refreshCandidates
  } = useCandidatesForJob(jobId, { 
    enableRealtime: true, 
    pollingInterval: 30 
  })
  // Show demo kanban board for demo viewers
  if (userRole === 'demo_viewer') {
    return (
      <DashboardLayout pageTitle="Demo Pipeline">
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">Recruitment Pipeline</h1>
            <p className="text-slate-600 mt-1">Experience the ATS pipeline with interactive drag and drop functionality</p>
          </div>
          <DemoPipelineKanban />
        </div>
      </DashboardLayout>
    )
  }

  // Find the current job with defensive validation
  const currentJob = useMemo(() => {
    if (!jobs || !Array.isArray(jobs) || !jobId) {
      return null
    }
    return jobs.find((job: any) => job?.id === jobId) || null
  }, [jobs, jobId])

  // NEW PIPELINE SYSTEM: Get pipeline data for the specific job with real-time updates
  const { user } = useAuth()
  const { data: jobPipelineData, isLoading: pipelineLoading } = useJobPipeline(jobId, { enableRealTime: true })
  const moveApplication = useMoveApplication(jobId || '')

  // NEW PIPELINE SYSTEM: Organize applications by columns with defensive coding
  const applicationsByColumn = useMemo(() => {
    // Defensive validation of pipeline data with detailed logging
    if (!jobPipelineData) {
      console.log('[Pipeline Debug] No pipeline data available')
      return new Map()
    }
    
    if (!jobPipelineData.columns || !Array.isArray(jobPipelineData.columns)) {
      console.warn('[Pipeline Debug] Invalid columns structure:', jobPipelineData.columns)
      return new Map()
    }
    
    if (!jobPipelineData.applications || !Array.isArray(jobPipelineData.applications)) {
      console.warn('[Pipeline Debug] Invalid applications structure:', jobPipelineData.applications)
      return new Map()
    }
    
    try {
      // Use job-specific pipeline data directly with additional validation
      const validApplications = jobPipelineData.applications.filter(
        app => {
          if (!app || !app.id) {
            console.warn('[Pipeline Debug] Application missing ID:', app)
            return false
          }
          if (!app.candidate) {
            console.warn('[Pipeline Debug] Application missing candidate data:', app)
            return false
          }
          return true
        }
      )
      const validColumns = jobPipelineData.columns.filter(
        col => {
          if (!col || !col.id || !col.title) {
            console.warn('[Pipeline Debug] Invalid column:', col)
            return false
          }
          return true
        }
      )
      
      return organizeApplicationsByColumn(validApplications, validColumns)
    } catch (error) {
      console.error('Error organizing applications by column:', error)
      return new Map()
    }
  }, [jobPipelineData])


  // DnD sensors - support both mouse and touch
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    // Defensive validation of drag start event
    if (!event?.active?.id) {
      console.warn('Invalid drag start event')
      setActiveCandidate(null)
      return
    }
    
    // Find the application instead of job candidate to match expected type structure
    const application = jobPipelineData?.applications?.find((app: any) => app?.id === event.active.id)
    if (application) {
      // Create a compatible structure for the active candidate state
      const candidateForState = {
        id: application.id,
        stage: application.status || 'applied', 
        notes: null,
        assigned_to: null,
        updated_at: application.appliedAt || new Date().toISOString(),
        candidates: {
          id: (application as any).candidateId || (application as any).candidate?.id || 'unknown',
          name: (application as any).candidateName || (application as any).candidate?.name || 'Unknown Candidate',
          email: (application as any).candidateEmail || (application as any).candidate?.email || 'No email',
          phone: (application as any).candidatePhone || (application as any).candidate?.phone || null,
          resume_url: (application as any).resumeUrl || (application as any).candidate?.resumeUrl || null,
          created_at: application.appliedAt || new Date().toISOString()
        }
      }
      setActiveCandidate(candidateForState)
    } else {
      setActiveCandidate(null)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveCandidate(null)

    // Defensive validation of drag event
    if (!over || !active) {
      console.warn('Invalid drag event - missing over or active')
      return
    }

    const applicationId = active.id as string
    const newColumnId = over.id as string

    // Comprehensive validation of required data
    if (!applicationId || !newColumnId || 
        !jobPipelineData?.columns || !jobPipelineData?.applications) {
      toast({
        title: "Move Failed",
        description: "Missing required data for move operation",
        variant: "destructive",
      })
      return
    }

    try {
      const application = jobPipelineData.applications.find(app => app?.id === applicationId)
      if (!application) {
        toast({
          title: "Move Failed",
          description: "Application not found",
          variant: "destructive",
        })
        return
      }

      // Skip if already in the same column
      if (application.columnId === newColumnId) {
        return
      }

      const newColumn = jobPipelineData.columns.find(col => col?.id === newColumnId)
      if (!newColumn) {
        toast({
          title: "Move Failed",
          description: "Target column not found",
          variant: "destructive",
        })
        return
      }
      
      // Additional validation for required IDs
      if (!application.id || !newColumn.id) {
        toast({
          title: "Move Failed",
          description: "Invalid application or column ID",
          variant: "destructive",
        })
        return
      }
      
      // Safely extract candidate name with multiple fallbacks 
      const candidateName = (application as any).candidate?.name || 
                           (application as any).candidateName || 
                           'Unknown Candidate'
      
      toast({
        title: "Stage Updated",
        description: `Moving ${candidateName} to ${newColumn.title}...`,
      })

      await moveApplication.mutateAsync({ 
        applicationId: application.id, 
        columnId: newColumn.id
      })

      toast({
        title: "Success",
        description: `${candidateName} moved to ${newColumn.title}`,
      })
    } catch (error) {
      console.error('Failed to move application:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      toast({
        title: "Move Failed",
        description: `Failed to move application: ${errorMessage}`,
        variant: "destructive",
      })
    }
  }

  // If no job ID is provided, show pipeline overview with job selection
  if (!jobId) {
    return (
      <DashboardLayout pageTitle="Pipeline Overview">
        <div className="p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Pipeline Overview</h1>
            <p className="text-slate-600">Select a job to view its recruitment pipeline and manage candidates.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs?.map((job: any) => {
              return (
                <JobPipelineCard key={job.id} job={job} />
              );
            })}
          </div>

          {(!jobs || jobs.length === 0) && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No Jobs Available</h3>
              <p className="text-slate-600 mb-6">Create a job to start managing candidates in the pipeline.</p>
              <Link href="/jobs">
                <Button>
                  <Briefcase className="w-4 h-4 mr-2" />
                  Go to Jobs
                </Button>
              </Link>
            </div>
          )}
        </div>
      </DashboardLayout>
    )
  }

  // If job ID is provided but job not found, show error
  if (!currentJob) {
    return (
      <DashboardLayout pageTitle="Job Pipeline">
        <div className="p-6">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Job Not Found</h2>
            <p className="text-slate-600 mb-6">The job you're looking for doesn't exist.</p>
            <Link href="/pipeline">
              <Button variant="outline" className="mr-3">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Pipeline Overview
              </Button>
            </Link>
            <Link href="/jobs">
              <Button>
                <Briefcase className="w-4 h-4 mr-2" />
                Back to Jobs
              </Button>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout pageTitle={`${currentJob.title} - Pipeline`}>
      <div className="p-6">
        {/* Job Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/pipeline">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Pipeline Overview
              </Button>
            </Link>
            <Link href="/jobs">
              <Button variant="ghost" size="sm">
                <Briefcase className="w-4 h-4 mr-2" />
                All Jobs
              </Button>
            </Link>
          </div>
          
          <Card className="bg-white shadow-sm border border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900">{currentJob.title}</h1>
                    <div className="flex items-center gap-2 text-slate-600 mt-1">
                      <Building2 className="w-4 h-4" />
                      <span>{currentJob.clients?.name}</span>
                      {currentJob.clients?.industry && (
                        <>
                          <span>•</span>
                          <span>{currentJob.clients.industry}</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 text-sm mt-2">
                      <Calendar className="w-4 h-4" />
                      <span>Created {new Date(currentJob.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge className={
                    currentJob.status === 'open' ? 'bg-green-100 text-green-800' :
                    currentJob.status === 'closed' ? 'bg-gray-100 text-gray-800' :
                    currentJob.status === 'on_hold' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }>
                    {currentJob.status.replace('_', ' ')}
                  </Badge>
                  
                  {/* Realtime Status Indicator */}
                  {isRealtimeEnabled && (
                    <Badge variant="outline" className={`
                      ${realtimeStatus === 'connected' ? 'text-green-600 border-green-300' : ''}
                      ${realtimeStatus === 'connecting' ? 'text-yellow-600 border-yellow-300' : ''}
                      ${realtimeStatus === 'disconnected' ? 'text-red-600 border-red-300' : ''}
                    `}>
                      <div className={`w-2 h-2 rounded-full mr-1 ${
                        realtimeStatus === 'connected' ? 'bg-green-500' : 
                        realtimeStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                        realtimeStatus === 'disconnected' ? 'bg-red-500' : 'bg-gray-500'
                      }`} />
                      {realtimeStatus === 'connected' ? 'Live' :
                       realtimeStatus === 'connecting' ? 'Connecting...' :
                       realtimeStatus === 'disconnected' ? 'Offline' : 'Static'}
                    </Badge>
                  )}
                </div>
              </div>
              {currentJob.description && (
                <p className="text-slate-600 mt-4">{currentJob.description}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="candidates">Candidates</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Job Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {jobCandidates?.length || 0}
                    </div>
                    <div className="text-sm text-slate-600">Total Candidates</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {jobPipelineData?.applications?.length || 0}
                    </div>
                    <div className="text-sm text-slate-600">Applications</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {jobPipelineData?.columns?.length || 0}
                    </div>
                    <div className="text-sm text-slate-600">Pipeline Stages</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="candidates" className="mt-6">
            {(candidatesLoading || pipelineLoading) ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-2 text-slate-600">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Loading pipeline...
                </div>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <div className="flex gap-4 overflow-x-auto pb-4 px-2 md:px-0 -mx-2 md:mx-0 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
                  {/* PIPELINE SYSTEM: Use dynamic columns */}
                  {jobPipelineData?.columns && applicationsByColumn ? (
                    jobPipelineData.columns.map(column => (
                      <PipelineColumn
                        key={column.id}
                        column={column}
                        applications={applicationsByColumn.get(column.id) || []}
                        jobId={jobId || ''}
                      />
                    ))
                  ) : (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-slate-600">No pipeline data available</div>
                    </div>
                  )}
                </div>
                
                <DragOverlay>
                  {activeCandidate ? (
                    <div className="cursor-grabbing">
                      <CandidateCard candidate={activeCandidate} isDragging />
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            )}
          </TabsContent>

          <TabsContent value="files" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Job Files</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-slate-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>File management coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}