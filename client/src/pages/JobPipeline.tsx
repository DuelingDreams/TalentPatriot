import { useState, useMemo } from 'react'
import { useParams } from 'wouter'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors, useDroppable } from '@dnd-kit/core'
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
import { useJobs, useCandidatesForJob, useUpdateCandidateStage } from '@/hooks/useJobs'
import { ResumeUpload } from '@/components/ResumeUpload'
import { ArrowLeft, Briefcase, Building2, Calendar, Users, Mail, Phone, FileText, Loader2 } from 'lucide-react'
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

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging || isSortableDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing"
    >
      <Card className="bg-white shadow-sm border border-slate-200 hover:shadow-md transition-shadow mb-3">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Avatar className="w-10 h-10">
              <AvatarFallback className="bg-blue-100 text-blue-600 text-sm">
                {candidate.candidates.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-slate-900 truncate">
                {candidate.candidates.name}
              </h4>
              <div className="flex items-center gap-1 text-xs text-slate-600 mt-1">
                <Mail className="w-3 h-3" />
                <span className="truncate">{candidate.candidates.email}</span>
              </div>
              {candidate.candidates.phone && (
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
              <div className="mt-3">
                <ResumeUpload
                  candidateId={candidate.candidates.id}
                  candidateName={candidate.candidates.name}
                  currentResumeUrl={candidate.candidates.resume_url}
                  onResumeUploaded={() => {}} // Pipeline view is read-only for resumes
                />
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
    <div className="flex-1 min-w-[280px]">
      <div className={`p-4 rounded-t-lg border-2 ${stage.color}`}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">{stage.label}</h3>
          <Badge variant="secondary" className="text-xs">
            {candidates.length}
          </Badge>
        </div>
      </div>
      <div 
        ref={setNodeRef}
        className={`min-h-[400px] p-4 border-2 border-t-0 rounded-b-lg ${stage.color} bg-opacity-20 transition-colors ${
          isOver ? 'bg-opacity-40 border-blue-400' : ''
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

export default function JobPipeline() {
  const params = useParams<{ id: string }>()
  const jobId = params?.id
  const [activeCandidate, setActiveCandidate] = useState<CandidateCardProps['candidate'] | null>(null)
  const [activeTab, setActiveTab] = useState('candidates')
  const { toast } = useToast()

  // Fetch data
  const { data: jobs } = useJobs()
  const { data: jobCandidates, isLoading: candidatesLoading } = useCandidatesForJob(jobId || null)
  const updateCandidateStage = useUpdateCandidateStage()

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

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
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

    try {
      await updateCandidateStage.mutateAsync({
        jobCandidateId: candidateId,
        stage: newStage,
        notes: candidate.notes || undefined
      })

      toast({
        title: "Stage Updated",
        description: `Moved ${candidate.candidates.name} to ${PIPELINE_STAGES.find(s => s.id === newStage)?.label}`,
      })
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update candidate stage. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (!currentJob) {
    return (
      <DashboardLayout pageTitle="Job Pipeline">
        <div className="p-6">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Job Not Found</h2>
            <p className="text-slate-600 mb-6">The job you're looking for doesn't exist.</p>
            <Link href="/jobs">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
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
            <Link href="/jobs">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Jobs
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
                <div className="flex gap-4 overflow-x-auto pb-4">
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
                    <CandidateCard candidate={activeCandidate} isDragging />
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