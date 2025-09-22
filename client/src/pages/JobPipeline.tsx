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
import { PipelineProgressBar } from '@/components/pipeline/PipelineProgressBar'
import { useAuth } from '@/contexts/AuthContext'
import { ArrowLeft, Briefcase, Building2, Calendar, Users, Mail, Phone, FileText, Loader2, MessageSquare, Edit3, ArrowRightLeft, Share2, GripVertical, Clock } from 'lucide-react'
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

// Enhanced Application Card Component
function EnhancedApplicationCard({ 
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

  // Quick Actions handlers focused on Resume and Notes as requested
  const handleViewResume = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (safeResumeUrl && safeResumeUrl.trim() !== '') {
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
  }

  const handleOpenNotes = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!safeCandidateId || safeCandidateId === 'unknown') {
      toast({
        title: "Error",
        description: "Cannot open notes - candidate ID is missing",
        variant: "destructive",
      })
      return
    }
    setNotesDialogOpen(true)
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })
    } catch {
      return 'Unknown'
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        touch-none select-none mb-3
        ${isCurrentlyDragging ? 'z-50' : 'z-0'}
      `}
    >
      <Card className={`
        bg-white shadow-sm border transition-all group relative
        ${isCurrentlyDragging 
          ? 'border-blue-500 shadow-xl scale-105 rotate-2' 
          : 'border-slate-200 hover:shadow-md hover:border-blue-300'
        }
      `}>
        <CardContent className="p-4">
          {/* Drag Handle */}
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-60 transition-opacity">
            <GripVertical className="w-4 h-4 text-slate-400" />
          </div>

          {/* Main Content */}
          <div className="pr-6">
            {/* Candidate Name and Status */}
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-semibold text-slate-900 text-sm leading-tight">
                {safeCandidateName}
              </h4>
              <Badge 
                variant="outline" 
                className="text-xs px-2 py-1 ml-2 flex-shrink-0"
              >
                {status === 'active' ? 'Active' : status}
              </Badge>
            </div>
            
            {/* Job Title and Company */}
            <div className="mb-2">
              <p className="text-sm font-medium text-slate-700">
                {jobInfo?.title || 'Position Title'}
              </p>
              <p className="text-xs text-slate-500">
                {clientInfo?.name || jobInfo?.client?.name || 'Company Name'}
              </p>
            </div>

            {/* Contact Info */}
            <div className="mb-3 space-y-1">
              <div className="flex items-center gap-1 text-xs text-slate-600">
                <Mail className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{safeCandidateEmail}</span>
              </div>
              {safeCandidatePhone && (
                <div className="flex items-center gap-1 text-xs text-slate-600">
                  <Phone className="w-3 h-3 flex-shrink-0" />
                  <span>{safeCandidatePhone}</span>
                </div>
              )}
            </div>

            {/* Applied Date */}
            <div className="mb-3">
              <span className="text-xs text-slate-500">
                Applied: {formatDate(appliedAt || '')}
              </span>
            </div>

            {/* Quick Action Buttons - Resume and Notes as requested */}
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                className="text-xs h-8 flex-1"
                onClick={handleViewResume}
                data-testid={`resume-${applicationId}`}
              >
                <FileText className="w-3 h-3 mr-1" />
                {safeResumeUrl ? 'Resume' : 'No Resume'}
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="text-xs h-8 flex-1"
                onClick={handleOpenNotes}
                data-testid={`notes-${applicationId}`}
              >
                <MessageSquare className="w-3 h-3 mr-1" />
                Notes
              </Button>
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

// Keep the original ApplicationCard for backward compatibility
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
  const { toast } = useToast()

  // Enhanced column styling with specific colors as requested
  const getColumnStyling = (columnId: string, title: string) => {
    const normalizedId = columnId.toLowerCase()
    const normalizedTitle = title.toLowerCase()
    
    if (normalizedId.includes('applied') || normalizedTitle.includes('applied')) {
      return {
        headerBg: 'bg-gray-100',
        headerBorder: 'border-gray-300',
        headerText: 'text-gray-800',
        columnBg: 'bg-gray-50',
        columnBorder: 'border-gray-200',
        accent: 'gray'
      }
    }
    if (normalizedId.includes('screen') || normalizedTitle.includes('screen')) {
      return {
        headerBg: 'bg-blue-100',
        headerBorder: 'border-blue-300',
        headerText: 'text-blue-800',
        columnBg: 'bg-blue-50',
        columnBorder: 'border-blue-200',
        accent: 'blue'
      }
    }
    if (normalizedId.includes('interview') || normalizedTitle.includes('interview')) {
      return {
        headerBg: 'bg-yellow-100',
        headerBorder: 'border-yellow-300',
        headerText: 'text-yellow-800',
        columnBg: 'bg-yellow-50',
        columnBorder: 'border-yellow-200',
        accent: 'yellow'
      }
    }
    if (normalizedId.includes('offer') || normalizedTitle.includes('offer')) {
      return {
        headerBg: 'bg-purple-100',
        headerBorder: 'border-purple-300',
        headerText: 'text-purple-800',
        columnBg: 'bg-purple-50',
        columnBorder: 'border-purple-200',
        accent: 'purple'
      }
    }
    if (normalizedId.includes('hired') || normalizedTitle.includes('hired')) {
      return {
        headerBg: 'bg-green-100',
        headerBorder: 'border-green-300',
        headerText: 'text-green-800',
        columnBg: 'bg-green-50',
        columnBorder: 'border-green-200',
        accent: 'green'
      }
    }
    // Default fallback
    return {
      headerBg: 'bg-slate-100',
      headerBorder: 'border-slate-300',
      headerText: 'text-slate-800',
      columnBg: 'bg-slate-50',
      columnBorder: 'border-slate-200',
      accent: 'slate'
    }
  }

  const styling = getColumnStyling(column.id, column.title)
  
  // Calculate average time in stage with dynamic data
  const calculateAverageTime = () => {
    if (applications.length === 0) return '-'
    
    try {
      const now = new Date()
      const stageTransitions = applications
        .map(app => {
          // Try to get the most recent stage entry date
          const appliedDate = app.appliedAt || app.created_at || app.updatedAt
          if (!appliedDate) return null
          
          const entryDate = new Date(appliedDate)
          if (isNaN(entryDate.getTime())) return null
          
          // Calculate days in current stage
          const daysInStage = Math.floor((now.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24))
          return Math.max(0, daysInStage) // Ensure non-negative
        })
        .filter(days => days !== null) as number[]
      
      if (stageTransitions.length === 0) return '-'
      
      // Calculate average
      const averageDays = Math.round(
        stageTransitions.reduce((sum, days) => sum + days, 0) / stageTransitions.length
      )
      
      if (averageDays === 0) return '<1 day'
      if (averageDays === 1) return '1 day'
      return `${averageDays} days`
      
    } catch (error) {
      console.warn('Error calculating average time in stage:', error)
      return '-'
    }
  }

  const handleAddCandidate = () => {
    toast({
      title: "Add Candidate",
      description: `Adding new candidate to ${column.title} stage`,
    })
  }

  return (
    <div className="flex-1 min-w-[280px] md:min-w-[320px]">
      {/* Enhanced Column Header Card */}
      <Card className={`${styling.headerBg} ${styling.headerBorder} border-2 rounded-b-none shadow-sm`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`font-semibold ${styling.headerText} text-lg`}>{column.title}</h3>
              <div className="flex items-center gap-4 mt-1">
                <span className={`text-sm ${styling.headerText} opacity-75`}>
                  {applications.length} candidate{applications.length !== 1 ? 's' : ''}
                </span>
                <div className={`flex items-center gap-1 text-xs ${styling.headerText} opacity-60`}>
                  <Clock className="w-3 h-3" />
                  <span>{calculateAverageTime()}</span>
                </div>
              </div>
            </div>
            <Badge 
              variant="secondary" 
              className={`text-sm font-medium ${
                styling.accent === 'gray' ? 'bg-gray-200 text-gray-800' :
                styling.accent === 'blue' ? 'bg-blue-200 text-blue-800' :
                styling.accent === 'yellow' ? 'bg-yellow-200 text-yellow-800' :
                styling.accent === 'purple' ? 'bg-purple-200 text-purple-800' :
                styling.accent === 'green' ? 'bg-green-200 text-green-800' :
                'bg-slate-200 text-slate-800'
              } ${
                isOver ? 'scale-110 shadow-md' : ''
              } transition-all`}
            >
              {applications.length}
            </Badge>
          </div>
        </CardHeader>
      </Card>
      
      {/* Column Content Area */}
      <div 
        ref={setNodeRef}
        className={`
          min-h-[500px] p-4 border-2 border-t-0 rounded-t-none rounded-b-lg
          transition-all duration-200
          ${styling.columnBg} ${styling.columnBorder}
          ${
            isOver 
              ? 'border-blue-500 shadow-lg bg-opacity-80 scale-[1.01]' 
              : ''
          }
        `}
      >
        {/* Add Candidate Button */}
        <Button
          onClick={handleAddCandidate}
          variant="outline"
          className={`
            w-full mb-4 border-dashed border-2 h-12
            ${styling.accent === 'gray' ? 'border-gray-300 hover:bg-gray-100 text-gray-600' :
              styling.accent === 'blue' ? 'border-blue-300 hover:bg-blue-100 text-blue-600' :
              styling.accent === 'yellow' ? 'border-yellow-300 hover:bg-yellow-100 text-yellow-600' :
              styling.accent === 'purple' ? 'border-purple-300 hover:bg-purple-100 text-purple-600' :
              styling.accent === 'green' ? 'border-green-300 hover:bg-green-100 text-green-600' :
              'border-slate-300 hover:bg-slate-100 text-slate-600'
            }
            hover:border-solid transition-all
          `}
          data-testid={`add-candidate-${column.id}`}
        >
          <Users className="w-4 h-4 mr-2" />
          + Add Candidate
        </Button>

        {/* Candidates List */}
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
              <EnhancedApplicationCard 
                key={application.id}
                {...safeApplicationData}
              />
            )
          })?.filter(Boolean) || []}
        </SortableContext>
        
        {/* Enhanced Empty State */}
        {applications.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400">
            <div className="text-center">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium mb-1">No candidates yet</p>
              <p className="text-xs opacity-75">Drag candidates here or use the button above</p>
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
  const { userRole, currentOrgId } = useAuth()
  
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
  const { 
    data: jobPipelineData, 
    isLoading: pipelineLoading, 
    error: pipelineError,
    isSuccess: pipelineSuccess 
  } = useJobPipeline(jobId, { enableRealTime: true })
  const moveApplication = useMoveApplication(jobId || '')

  // Enhanced loading state validation - prevents drag operations during loading
  const isPipelineReady = pipelineSuccess && 
                           jobPipelineData && 
                           jobPipelineData.columns && 
                           Array.isArray(jobPipelineData.columns) && 
                           jobPipelineData.columns.length > 0 && 
                           jobPipelineData.applications &&
                           Array.isArray(jobPipelineData.applications)

  // NEW PIPELINE SYSTEM: Organize applications by columns with defensive coding
  const applicationsByColumn = useMemo(() => {
    // Defensive validation of pipeline data with detailed logging
    if (!jobPipelineData) {
      return new Map()
    }
    
    if (!jobPipelineData.columns || !Array.isArray(jobPipelineData.columns)) {
      return new Map()
    }
    
    if (!jobPipelineData.applications || !Array.isArray(jobPipelineData.applications)) {
      return new Map()
    }
    
    try {
      // Use job-specific pipeline data directly with additional validation
      const validApplications = jobPipelineData.applications.filter(
        app => {
          if (!app || !app.id) {
            return false
          }
          if (!app.candidate) {
            return false
          }
          return true
        }
      )
      const validColumns = jobPipelineData.columns.filter(
        col => {
          if (!col || !col.id || !col.title) {
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

  // Retry mechanism for failed moves with exponential backoff
  const retryMove = async (candidateId: string, columnId: string, attempts = 3): Promise<boolean> => {
    for (let i = 0; i < attempts; i++) {
      try {
        await moveApplication.mutateAsync({ candidateId, columnId })
        return true
      } catch (error) {
        console.error(`Move attempt ${i + 1} failed:`, error)
        if (i === attempts - 1) throw error
        // Exponential backoff: wait 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)))
      }
    }
    return false
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveCandidate(null)

    // CRITICAL: Prevent drag operations when data isn't ready
    if (!isPipelineReady) {
      console.warn('Drag operation blocked - pipeline data not ready:', {
        pipelineLoading,
        pipelineError,
        hasData: !!jobPipelineData,
        hasColumns: !!jobPipelineData?.columns,
        columnsCount: jobPipelineData?.columns?.length || 0,
        hasApplications: !!jobPipelineData?.applications,
        applicationsCount: jobPipelineData?.applications?.length || 0
      })
      toast({
        title: "Move Not Available",
        description: "Pipeline data is still loading. Please wait a moment and try again.",
        variant: "destructive",
      })
      return
    }

    // Defensive validation of drag event
    if (!over || !active) {
      console.warn('Invalid drag event - missing over or active')
      return
    }

    const applicationId = active.id as string
    let newColumnId = over.id as string

    // CRITICAL FIX: Check if we dropped on another candidate instead of a column
    // If so, get the column ID from that candidate's data
    const isDroppedOnColumn = jobPipelineData.columns.some(col => col.id === newColumnId)
    
    if (!isDroppedOnColumn) {
      // We dropped on another candidate, find that candidate's column
      const targetApplication = jobPipelineData.applications.find(app => app.id === newColumnId)
      if (targetApplication?.columnId) {
        console.log('[Drag Fix] Dropped on candidate, using their column:', {
          droppedOnCandidateId: newColumnId,
          extractedColumnId: targetApplication.columnId
        })
        newColumnId = targetApplication.columnId
      } else {
        console.error('Could not determine target column:', {
          overId: over.id,
          isColumn: isDroppedOnColumn,
          availableColumns: jobPipelineData.columns.map(c => c.id),
          availableApplications: jobPipelineData.applications.map(a => a.id)
        })
        toast({
          title: "Move Failed",
          description: "Could not determine target column for drop operation",
          variant: "destructive",
        })
        return
      }
    }

    // Enhanced validation with detailed logging
    if (!applicationId || !newColumnId) {
      console.error('Drag validation failed:', {
        applicationId: applicationId || 'missing',
        newColumnId: newColumnId || 'missing'
      })
      toast({
        title: "Move Failed",
        description: "Invalid drag operation - missing identifiers",
        variant: "destructive",
      })
      return
    }

    try {
      const application = jobPipelineData.applications.find(app => app?.id === applicationId)
      if (!application) {
        console.error('Application not found:', {
          searchId: applicationId,
          availableApplications: jobPipelineData.applications.map(app => ({
            id: app?.id || 'no-id',
            candidateName: (app as any)?.candidate?.name || (app as any)?.candidateName || 'no-name'
          }))
        })
        toast({
          title: "Move Failed",
          description: `Application ${applicationId} not found in pipeline data`,
          variant: "destructive",
        })
        return
      }

      // Skip if already in the same column
      if (application.columnId === newColumnId) {
        return
      }

      // Enhanced column validation with comprehensive logging
      const newColumn = jobPipelineData.columns.find(col => col?.id === newColumnId)
      if (!newColumn) {
        console.error('Column validation failed:', {
          targetColumnId: newColumnId,
          availableColumns: jobPipelineData.columns.map(c => ({ 
            id: c?.id || 'no-id', 
            title: c?.title || 'no-title'
          })),
          totalColumns: jobPipelineData.columns.length,
          pipelineDataStructure: {
            columnsType: Array.isArray(jobPipelineData.columns) ? 'array' : typeof jobPipelineData.columns,
            applicationsType: Array.isArray(jobPipelineData.applications) ? 'array' : typeof jobPipelineData.applications
          }
        })
        
        const availableColumnTitles = jobPipelineData.columns
          .filter(c => c && c.title)
          .map(c => c.title)
          .join(', ')
          
        toast({
          title: "Move Failed - Column Not Found",
          description: `Target column "${newColumnId}" not found. Available columns: ${availableColumnTitles}`,
          variant: "destructive",
        })
        return
      }
      
      // Additional validation for required IDs
      if (!application.id || !newColumn.id) {
        console.error('Invalid IDs:', {
          applicationId: application.id || 'missing',
          newColumnId: newColumn.id || 'missing'
        })
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
        title: "Moving Candidate",
        description: `Moving ${candidateName} to ${newColumn.title}...`,
      })

      // Enhanced move operation with retry mechanism
      try {
        // Extract candidateId from application data - handle different data structures
        const candidateId = application.candidateId || application.candidate?.id || 
                            (application as any).candidate_id
        
        if (!candidateId) {
          throw new Error('Cannot move application: candidateId not found')
        }
        
        const success = await retryMove(candidateId, newColumn.id)
        if (success) {
          toast({
            title: "Success",
            description: `${candidateName} moved to ${newColumn.title}`,
          })
        }
      } catch (retryError) {
        // Final fallback error handling
        console.error('All retry attempts failed:', retryError)
        toast({
          title: "Move Failed After Retries",
          description: `Failed to move ${candidateName} after multiple attempts. Please try again or refresh the page.`,
          variant: "destructive",
        })
      }
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
            {(candidatesLoading || pipelineLoading || !isPipelineReady) ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-3 text-slate-600">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <div className="text-center">
                    <div className="font-medium">Loading pipeline...</div>
                    <div className="text-sm text-slate-500 mt-1">
                      {pipelineLoading ? 'Fetching pipeline data' : 
                       candidatesLoading ? 'Loading candidates' : 
                       !isPipelineReady ? 'Preparing pipeline structure' : 'Almost ready'}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                {/* Pipeline Progress Bar Summary */}
                <PipelineProgressBar 
                  columns={jobPipelineData?.columns || []}
                  applicationsByColumn={applicationsByColumn}
                  jobId={jobId}
                  orgId={currentOrgId || ''}
                  showTiming={true}
                />
                
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
              </div>
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