import { useState, useMemo } from 'react'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, TouchSensor, useSensor, useSensors, useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useToast } from '@/shared/hooks/use-toast'
import { AlertCircle, Mail, Phone, MessageSquare, FileText, Users, GripVertical, Calendar, Edit3, ArrowRightLeft, Share2 } from 'lucide-react'
import { getDemoPipelineData, getDemoCandidateById, getDemoJobById, getDemoClientById } from '@/lib/demo-data'

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
  candidate: any
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
  const candidateInfo = getDemoCandidateById(candidate.candidateId)
  const jobInfo = getDemoJobById(candidate.jobId)
  const clientInfo = jobInfo ? getDemoClientById(jobInfo.clientId) : null
  const { toast } = useToast()

  if (!candidateInfo || !jobInfo || !clientInfo) return null

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isCurrentlyDragging ? 0.5 : 1,
    cursor: isCurrentlyDragging ? 'grabbing' : 'grab',
  }

  // Quick Actions handlers
  const handleSchedule = (e: React.MouseEvent) => {
    e.stopPropagation()
    toast({
      title: "Schedule Interview",
      description: `Opening scheduler for ${candidateInfo.name}`,
    })
  }

  const handleAddNote = (e: React.MouseEvent) => {
    e.stopPropagation()
    toast({
      title: "Add Note",
      description: `Adding note for ${candidateInfo.name}`,
    })
  }

  const handleMoveStage = (e: React.MouseEvent) => {
    e.stopPropagation()
    toast({
      title: "Move Stage",
      description: `Moving ${candidateInfo.name} to next stage`,
    })
  }

  const handleShareProfile = (e: React.MouseEvent) => {
    e.stopPropagation()
    toast({
      title: "Share Profile",
      description: `Sharing ${candidateInfo.name}'s profile`,
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
                {candidateInfo.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-slate-900 truncate">
                {candidateInfo.name}
              </h4>
              <p className="text-xs text-slate-600 mt-1">{jobInfo.title}</p>
              <div className="flex items-center gap-1 text-xs text-slate-600 mt-2">
                <Mail className="w-3 h-3" />
                <span className="truncate">{candidateInfo.email}</span>
              </div>
              {candidateInfo.phone && (
                <div className="flex items-center gap-1 text-xs text-slate-600 mt-1">
                  <Phone className="w-3 h-3" />
                  <span>{candidateInfo.phone}</span>
                </div>
              )}
              {candidate.notes && typeof candidate.notes === 'string' && (
                <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                  {candidate.notes}
                </p>
              )}
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="outline" className="text-xs h-7">
                  <FileText className="w-3 h-3 mr-1" />
                  View Resume
                </Button>
                <Button size="sm" variant="outline" className="text-xs h-7">
                  <MessageSquare className="w-3 h-3 mr-1" />
                  Notes
                </Button>
              </div>
              <Badge variant="outline" className="mt-2 text-xs">
                {clientInfo.name}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface PipelineColumnProps {
  stage: typeof PIPELINE_STAGES[0]
  candidates: any[]
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

export function DemoPipelineKanban() {
  const [pipelineData, setPipelineData] = useState(getDemoPipelineData())
  const [activeCandidate, setActiveCandidate] = useState<any | null>(null)
  const { toast } = useToast()

  // Group candidates by stage
  const candidatesByStage = useMemo(() => {
    const grouped: Record<string, any[]> = {}
    PIPELINE_STAGES.forEach(stage => {
      grouped[stage.id] = []
    })
    
    pipelineData.forEach(stageData => {
      // stageData has structure: { id: 'applied', name: 'Applied', color: '...', candidates: [...] }
      if (grouped[stageData.id]) {
        grouped[stageData.id] = stageData.candidates
      }
    })
    
    return grouped
  }, [pipelineData])

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
    const candidateId = event.active.id as string
    // Find the candidate across all stages
    let foundCandidate = null
    for (const stageData of pipelineData) {
      const candidate = stageData.candidates.find((c: any) => c && c.id === candidateId)
      if (candidate) {
        foundCandidate = candidate
        break
      }
    }
    setActiveCandidate(foundCandidate)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveCandidate(null)

    if (!over || !active) return

    const candidateId = active.id as string
    const newStage = over.id as string

    // Find current stage and candidate
    let currentStage = ''
    let candidateToMove = null
    
    for (const stageData of pipelineData) {
      const candidateIndex = stageData.candidates.findIndex((c: any) => c && c.id === candidateId)
      if (candidateIndex !== -1) {
        currentStage = stageData.id
        candidateToMove = stageData.candidates[candidateIndex]
        break
      }
    }

    if (!candidateToMove || currentStage === newStage) return

    // Update the pipeline data
    setPipelineData(prevData => {
      const newData = prevData.map(stageData => {
        if (stageData.id === currentStage) {
          // Remove from current stage
          return {
            ...stageData,
            candidates: stageData.candidates.filter((c: any) => c && c.id !== candidateId)
          }
        } else if (stageData.id === newStage) {
          // Add to new stage
          return {
            ...stageData,
            candidates: [...stageData.candidates, { ...candidateToMove, stage: newStage }]
          }
        }
        return stageData
      })
      return newData
    })

    const candidateInfo = getDemoCandidateById(candidateToMove.candidateId)
    const stageName = PIPELINE_STAGES.find(s => s.id === newStage)?.label

    toast({
      title: "Demo: Stage Updated",
      description: `Moved ${candidateInfo?.name || 'candidate'} to ${stageName}. In a live environment, this would update the database.`,
    })
  }

  return (
    <div className="space-y-6">
      {/* Demo Mode Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-semibold text-amber-900">Demo Mode - Interactive Preview</h3>
          <p className="text-sm text-amber-700 mt-1">
            You can drag and drop candidates between stages to test the pipeline. Changes are temporary and won't be saved.
          </p>
        </div>
      </div>

      {/* Pipeline Kanban */}
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
    </div>
  )
}