import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { AlertCircle, Calendar, MessageSquare, User, FileText, Phone, Mail, ExternalLink } from 'lucide-react'
import { getDemoPipelineData, getDemoClientById, getDemoJobById, getDemoCandidateById, getDemoNotesForJobCandidate } from '@/lib/demo-data'

interface CandidateCardProps {
  candidate: any
  isDragging?: boolean
}

function CandidateCard({ candidate, isDragging }: CandidateCardProps) {
  const candidateInfo = candidate.candidates || getDemoCandidateById(candidate.candidateId)
  const jobInfo = candidate.jobs || getDemoJobById(candidate.jobId)
  const clientInfo = candidate.client || (jobInfo ? getDemoClientById(jobInfo.clientId) : null)
  const candidateNotes = Array.isArray(candidate.notes) ? candidate.notes : getDemoNotesForJobCandidate(candidate.id)
  
  if (!candidateInfo || !jobInfo || !clientInfo) return null

  return (
    <Card className={`cursor-move transition-all duration-200 ${
      isDragging ? 'opacity-50 transform rotate-2' : 'hover:shadow-md'
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src="" />
              <AvatarFallback className="bg-blue-100 text-blue-600">
                {candidateInfo.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-sm">{candidateInfo.name}</h3>
              <p className="text-xs text-slate-600">{jobInfo.title}</p>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">
            {clientInfo.name}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="flex items-center text-xs text-slate-600">
            <Mail className="w-3 h-3 mr-1" />
            {candidateInfo.email}
          </div>
          
          {candidateInfo.phone && (
            <div className="flex items-center text-xs text-slate-600">
              <Phone className="w-3 h-3 mr-1" />
              {candidateInfo.phone}
            </div>
          )}
          
          {candidate.notes && typeof candidate.notes === 'string' && (
            <div className="bg-slate-50 p-2 rounded text-xs">
              <div className="flex items-center mb-1">
                <MessageSquare className="w-3 h-3 mr-1" />
                <span className="font-medium">Latest Note:</span>
              </div>
              <p className="text-slate-700">{candidate.notes}</p>
            </div>
          )}
          
          {candidateNotes && candidateNotes.length > 0 && (
            <div className="flex items-center text-xs text-slate-500">
              <FileText className="w-3 h-3 mr-1" />
              {candidateNotes.length} note{candidateNotes.length > 1 ? 's' : ''}
            </div>
          )}
          
          <div className="flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center">
              <Calendar className="w-3 h-3 mr-1" />
              {new Date(candidate.updatedAt).toLocaleDateString()}
            </div>
            
            {candidateInfo.resumeUrl && (
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                <ExternalLink className="w-3 h-3 mr-1" />
                Resume
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface PipelineColumnProps {
  stage: any
  candidates: any[]
}

function PipelineColumn({ stage, candidates }: PipelineColumnProps) {
  return (
    <div className="flex-1 min-w-80">
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">{stage.name}</CardTitle>
            <Badge className={`${stage.color} font-medium`}>
              {candidates.length}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {candidates.length > 0 ? (
              candidates.map((candidate) => (
                <CandidateCard key={candidate.id} candidate={candidate} />
              ))
            ) : (
              <div className="text-center py-8 text-slate-500">
                <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No candidates in this stage</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function DemoKanbanBoard() {
  const [activeId, setActiveId] = useState<string | null>(null)
  const pipelineData = getDemoPipelineData()
  
  // Calculate statistics
  const totalCandidates = pipelineData.reduce((sum, stage) => sum + stage.candidates.length, 0)
  const activeStages = pipelineData.filter(stage => stage.candidates.length > 0).length
  const hiredCount = pipelineData.find(stage => stage.id === 'hired')?.candidates.length || 0
  const rejectedCount = pipelineData.find(stage => stage.id === 'rejected')?.candidates.length || 0

  return (
    <div className="space-y-6">
      {/* Demo Mode Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-blue-600" />
          <span className="text-blue-800 font-medium">Demo Mode - Read Only</span>
        </div>
        <p className="text-sm text-blue-600 mt-1">
          You're viewing sample recruitment data. All editing features are disabled in demo mode.
        </p>
      </div>
      
      {/* Pipeline Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Candidates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{totalCandidates}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Active Stages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{activeStages}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Hired</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{hiredCount}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{rejectedCount}</div>
          </CardContent>
        </Card>
      </div>
      
      {/* Pipeline Kanban Board */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Recruitment Pipeline</h2>
          <p className="text-sm text-slate-600">
            Drag and drop is disabled in demo mode
          </p>
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-4">
          {pipelineData.map((stage) => (
            <PipelineColumn 
              key={stage.id} 
              stage={stage} 
              candidates={stage.candidates} 
            />
          ))}
        </div>
      </div>
      
      {/* Additional Demo Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">About This Demo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Demo Data Includes:</h4>
              <ul className="space-y-1 text-slate-600">
                <li>• 3 demo clients with realistic company profiles</li>
                <li>• 4 open job positions across different industries</li>
                <li>• 5 candidate profiles with contact information</li>
                <li>• 6 job applications across different pipeline stages</li>
                <li>• Candidate notes and interview feedback</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Demo Features:</h4>
              <ul className="space-y-1 text-slate-600">
                <li>• Visual Kanban pipeline with 8 stages</li>
                <li>• Candidate cards with contact details</li>
                <li>• Job and client information display</li>
                <li>• Interview notes and status tracking</li>
                <li>• Resume links and contact information</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}