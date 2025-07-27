import { useState, useMemo } from 'react'
import { useParams } from 'wouter'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, TouchSensor, useSensor, useSensors, useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import { useJobs } from '@/hooks/useJobs'
import { useCandidatesForJob, useUpdateCandidateStage } from '@/hooks/useJobCandidates'
import { ResumeUpload } from '@/components/candidates/ResumeUpload'
import { CandidateNotes } from '@/components/candidates/CandidateNotes'
import { DemoPipelineKanban } from '@/components/demo/DemoPipelineKanban'
import { useAuth } from '@/contexts/AuthContext'
import { ArrowLeft, Briefcase, Building2, Calendar, Users, Mail, Phone, FileText, Loader2, MessageSquare } from 'lucide-react'
import { Link } from 'wouter'

// Define the pipeline stages
const PIPELINE_STAGES = [
  { id: 'applied', label: 'Applied', color: 'bg-slate-100 border-slate-200' },
  { id: 'screening', label: 'Phone Screen', color: 'bg-blue-100 border-blue-200' },
  { id: 'interview', label: 'Interview', color: 'bg-yellow-100 border-yellow-200' },
  { id: 'technical', label: 'Technical', color: 'bg-orange-100 border-orange-200' },
  { id: 'offer', label: 'Offer', color: 'bg-purple-100 border-purple-200' },
  { id: 'hired', label: 'Hired', color: 'bg-green-100 border-green-200' },
  { id: 'rejected', label: 'Rejected', color: 'bg-red-100 border-red-200' }
]

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
  } = useSortable({ id: candidate.id })

  const isCurrentlyDragging = isDragging || isSortableDragging

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isCurrentlyDragging ? 0.5 : 1,
    cursor: isCurrentlyDragging ? 'grabbing' : 'grab',
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
        bg-white shadow-sm border mb-3 transition-all group relative
        ${isCurrentlyDragging 
          ? 'border-blue-500 shadow-xl scale-105 rotate-3' 
          : 'border-slate-200 hover:shadow-md hover:border-blue-300'
        }
      `}>
        <CardContent className="p-4">
          <div className="absolute top-2 right-2 opacity-40 group-hover:opacity-100 transition-opacity">
            <svg className="w-4 h-4 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
            </svg>
          </div>
          <div className="flex items-start gap-3">
            <Avatar className="w-10 h-10">
              <AvatarFallback className="bg-blue-100 text-blue-600 text-sm">
                {candidate.candidates?.name?.split(' ').map(n => n[0]).join('') || 'N/A'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-slate-900 truncate">
                {candidate.candidates?.name || 'Unknown Candidate'}
              </h4>
              <div className="flex items-center gap-1 text-xs text-slate-600 mt-1">
                <Mail className="w-3 h-3" />
                <span className="truncate">{candidate.candidates?.email || 'No email'}</span>
              </div>
              {candidate.candidates?.phone && (
                <div className="flex items-center gap-1 text-xs text-slate-600 mt-1">
                  <Phone className="w-3 h-3" />
                  <span>{candidate.candidates.phone}</span>
                </div>
              )}
              {candidate.notes && (
                <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                  {candidate.notes}
                </p>
              )}
              <div className="mt-3 space-y-2">
                <ResumeUpload
                  candidateId={candidate.candidates?.id || candidate.candidateId}
                  candidateName={candidate.candidates?.name || 'Unknown'}
                  currentResumeUrl={candidate.candidates?.resume_url || null}
                  onResumeUploaded={() => {}} // Pipeline view is read-only for resumes
                />
                <CandidateNotes
                  jobCandidateId={candidate.id}
                  candidateName={candidate.candidates?.name || 'Unknown'}
                >
                  <Button size="sm" variant="outline" className="text-xs w-full">
                    <MessageSquare className="w-3 h-3 mr-1" />
                    Notes
                  </Button>
                </CandidateNotes>
              </div>
              {candidate.assigned_to && (
                <div className="mt-2">
                  <Badge variant="outline" className="text-xs">
                    {candidate.assigned_to}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface PipelineColumnProps {
  stage: typeof PIPELINE_STAGES[0]
  candidates: CandidateCardProps['candidate'][]
}

function PipelineColumn({ stage, candidates }: PipelineColumnProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: stage.id,
  })

  return (
    <div className="flex-1 min-w-[280px] md:min-w-[300px]">
      <div className={`p-4 rounded-t-lg border-2 ${stage.color} ${
        isOver ? 'border-blue-500 shadow-lg' : ''
      }`}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">{stage.label}</h3>
          <Badge variant="secondary" className={`text-xs transition-all ${
            isOver ? 'bg-blue-500 text-white scale-110' : ''
          }`}>
            {candidates.length}
          </Badge>
        </div>
      </div>
      <div 
        ref={setNodeRef}
        className={`min-h-[400px] p-4 border-2 border-t-0 rounded-b-lg transition-all duration-200 ${
          stage.color
        } ${
          isOver 
            ? 'bg-opacity-60 border-blue-500 shadow-inner scale-[1.02]' 
            : 'bg-opacity-20'
        }`}
      >
        <SortableContext items={candidates.map(c => c.id)} strategy={verticalListSortingStrategy}>
          {candidates.map((candidate) => (
            <CandidateCard key={candidate.id} candidate={candidate} />
          ))}
        </SortableContext>
        {candidates.length === 0 && (
          <div className="flex items-center justify-center h-32 text-slate-400">
            <div className="text-center">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No candidates</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Component for individual job cards in pipeline overview
function JobPipelineCard({ job }: { job: any }) {
  const { data: jobCandidates } = useCandidatesForJob(job.id)
  const totalCandidates = jobCandidates?.length || 0

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">{job.title}</CardTitle>
              <div className="flex items-center gap-1 text-sm text-slate-600 mt-1">
                <Building2 className="w-4 h-4" />
                <span>{job.clients?.name}</span>
              </div>
            </div>
          </div>
          <Badge className={
            job.status === 'open' ? 'bg-green-100 text-green-800' :
            job.status === 'closed' ? 'bg-gray-100 text-gray-800' :
            job.status === 'on_hold' ? 'bg-yellow-100 text-yellow-800' :
            'bg-blue-100 text-blue-800'
          }>
            {job.status.replace('_', ' ')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {job.description && (
          <p className="text-slate-600 text-sm mb-4 line-clamp-2">{job.description}</p>
        )}
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4 text-sm text-slate-600">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{totalCandidates} candidate{totalCandidates !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{new Date(job.created_at).toLocaleDateString()}</span>
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
  
  // Fetch data - must be called before any conditional returns
  const { data: jobs } = useJobs()
  const { data: jobCandidates, isLoading: candidatesLoading } = useCandidatesForJob(jobId || null)
  const updateCandidateStage = useUpdateCandidateStage()

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

  // Find the current job
  const currentJob = jobs?.find(job => job.id === jobId)

  // Group candidates by stage
  const candidatesByStage = useMemo(() => {
    if (!jobCandidates) return {}
    
    return jobCandidates.reduce((acc, candidate) => {
      const stage = candidate.stage
      if (!acc[stage]) {
        acc[stage] = []
      }
      acc[stage].push(candidate)
      return acc
    }, {} as Record<string, typeof jobCandidates>)
  }, [jobCandidates])

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
    const candidate = jobCandidates?.find(c => c.id === event.active.id)
    setActiveCandidate(candidate || null)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveCandidate(null)

    if (!over || !active) return

    const candidateId = active.id as string
    const newStage = over.id as string

    // Find the candidate being moved
    const candidate = jobCandidates?.find(c => c.id === candidateId)
    if (!candidate || candidate.stage === newStage) return

    // Optimistically update the UI immediately
    const optimisticUpdate = jobCandidates?.map(c => 
      c.id === candidateId ? { ...c, stage: newStage, updated_at: new Date().toISOString() } : c
    )

    try {
      // Show immediate success feedback
      toast({
        title: "Stage Updated",
        description: `Moving ${candidate.candidates?.name || 'candidate'} to ${PIPELINE_STAGES.find(s => s.id === newStage)?.label}...`,
      })

      // Update the backend
      await updateCandidateStage.mutateAsync({
        id: candidateId,
        stage: newStage
      })

      // Show final success message
      toast({
        title: "Success",
        description: `${candidate.candidates?.name || 'Candidate'} moved to ${PIPELINE_STAGES.find(s => s.id === newStage)?.label}`,
      })
    } catch (error) {
      console.error('Failed to update candidate stage:', error)
      toast({
        title: "Update Failed",
        description: "Failed to update candidate stage. Please try again.",
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
            {jobs?.map(job => {
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
                <Badge className={
                  currentJob.status === 'open' ? 'bg-green-100 text-green-800' :
                  currentJob.status === 'closed' ? 'bg-gray-100 text-gray-800' :
                  currentJob.status === 'on_hold' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-blue-100 text-blue-800'
                }>
                  {currentJob.status.replace('_', ' ')}
                </Badge>
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
                      {candidatesByStage['hired']?.length || 0}
                    </div>
                    <div className="text-sm text-slate-600">Hired</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {candidatesByStage['offer']?.length || 0}
                    </div>
                    <div className="text-sm text-slate-600">Active Offers</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="candidates" className="mt-6">
            {candidatesLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-2 text-slate-600">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Loading candidates...
                </div>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <div className="flex gap-4 overflow-x-auto pb-4 px-2 md:px-0 -mx-2 md:mx-0 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
                  {PIPELINE_STAGES.map(stage => (
                    <PipelineColumn
                      key={stage.id}
                      stage={stage}
                      candidates={candidatesByStage[stage.id] || []}
                    />
                  ))}
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