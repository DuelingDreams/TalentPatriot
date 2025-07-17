import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/contexts/AuthContext'
import { useCandidates } from '@/hooks/useCandidates'
import { useJobCandidates } from '@/hooks/useJobCandidates'
import { CandidateNotes } from '@/components/CandidateNotes'
import { 
  Search, 
  Filter, 
  Plus, 
  MapPin, 
  Mail, 
  Phone, 
  Calendar,
  Briefcase,
  GraduationCap,
  Clock,
  Download,
  Eye,
  MoreVertical,
  Star,
  FileText
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

interface CandidateCardProps {
  candidate: any
  jobCandidate?: any
}

function CandidateCard({ candidate, jobCandidate }: CandidateCardProps) {
  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      applied: 'bg-blue-100 text-blue-800',
      screening: 'bg-yellow-100 text-yellow-800',
      interview: 'bg-purple-100 text-purple-800',
      technical: 'bg-indigo-100 text-indigo-800',
      reference: 'bg-orange-100 text-orange-800',
      offer: 'bg-green-100 text-green-800',
      hired: 'bg-emerald-100 text-emerald-800',
      rejected: 'bg-red-100 text-red-800'
    }
    return colors[stage] || 'bg-gray-100 text-gray-800'
  }

  return (
    <Card className="hover:shadow-lg transition-all duration-300 border-0 overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-4">
            <Avatar className="w-12 h-12">
              <AvatarImage src={`https://i.pravatar.cc/150?u=${candidate.email}`} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {candidate.name.split(' ').map((n: string) => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-lg">{candidate.name}</h3>
              <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  {candidate.email}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {candidate.phone}
                </span>
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Eye className="w-4 h-4 mr-2" />
                View Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <FileText className="w-4 h-4 mr-2" />
                View Resume
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="w-4 h-4 mr-2" />
                Download Resume
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Skills */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {['JavaScript', 'React', 'TypeScript', 'Node.js'].map((skill) => (
              <Badge key={skill} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
          </div>
        </div>

        {/* Current Status */}
        {jobCandidate && (
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2">
              <Badge className={getStageColor(jobCandidate.stage)}>
                {jobCandidate.stage.charAt(0).toUpperCase() + jobCandidate.stage.slice(1)}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Updated {formatDistanceToNow(new Date(jobCandidate.updated_at), { addSuffix: true })}
              </span>
            </div>
            {jobCandidate.id && (
              <CandidateNotes 
                jobCandidateId={jobCandidate.id} 
                candidateName={candidate.name}
              >
                <Button variant="ghost" size="sm">
                  <FileText className="w-4 h-4" />
                </Button>
              </CandidateNotes>
            )}
          </div>
        )}

        {/* Application Stats */}
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-2xl font-bold">5</p>
            <p className="text-xs text-muted-foreground">Years Exp</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">$120k</p>
            <p className="text-xs text-muted-foreground">Expected</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">2w</p>
            <p className="text-xs text-muted-foreground">Notice</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function ProfessionalCandidates() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStage, setSelectedStage] = useState<string>('all')
  const [selectedSkill, setSelectedSkill] = useState<string>('all')
  const { userRole } = useAuth()
  
  const { data: candidates, isLoading: candidatesLoading } = useCandidates()
  const { data: jobCandidates, isLoading: jobCandidatesLoading } = useJobCandidates()

  // Create a map of candidate applications
  const candidateApplications = jobCandidates?.reduce((acc, jc) => {
    if (!acc[jc.candidate_id]) {
      acc[jc.candidate_id] = []
    }
    acc[jc.candidate_id].push(jc)
    return acc
  }, {} as Record<string, typeof jobCandidates>)

  // Filter candidates
  const filteredCandidates = candidates?.filter(candidate => {
    const matchesSearch = candidate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      candidate.email.toLowerCase().includes(searchQuery.toLowerCase())
    
    if (selectedStage !== 'all') {
      const applications = candidateApplications?.[candidate.id] || []
      const hasStage = applications.some(app => app.stage === selectedStage)
      if (!hasStage) return false
    }

    return matchesSearch
  }) || []

  const stages = [
    { value: 'all', label: 'All Stages' },
    { value: 'applied', label: 'Applied' },
    { value: 'screening', label: 'Screening' },
    { value: 'interview', label: 'Interview' },
    { value: 'technical', label: 'Technical' },
    { value: 'reference', label: 'Reference' },
    { value: 'offer', label: 'Offer' },
    { value: 'hired', label: 'Hired' },
    { value: 'rejected', label: 'Rejected' }
  ]

  const skills = [
    { value: 'all', label: 'All Skills' },
    { value: 'javascript', label: 'JavaScript' },
    { value: 'react', label: 'React' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'nodejs', label: 'Node.js' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' }
  ]

  return (
    <DashboardLayout pageTitle="Candidates">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Candidates</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Manage and track your candidate pipeline
            </p>
          </div>
          <Button className="mt-4 sm:mt-0">
            <Plus className="w-4 h-4 mr-2" />
            Add Candidate
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search candidates by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={selectedStage} onValueChange={setSelectedStage}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by stage" />
                </SelectTrigger>
                <SelectContent>
                  {stages.map(stage => (
                    <SelectItem key={stage.value} value={stage.value}>
                      {stage.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedSkill} onValueChange={setSelectedSkill}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by skill" />
                </SelectTrigger>
                <SelectContent>
                  {skills.map(skill => (
                    <SelectItem key={skill.value} value={skill.value}>
                      {skill.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Candidates ({candidates?.length || 0})</TabsTrigger>
            <TabsTrigger value="active">Active ({jobCandidates?.filter(jc => ['screening', 'interview', 'technical'].includes(jc.stage)).length || 0})</TabsTrigger>
            <TabsTrigger value="new">New This Week</TabsTrigger>
            <TabsTrigger value="favorites">Favorites</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {candidatesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="space-y-3">
                        <div className="h-12 bg-slate-200 rounded animate-pulse" />
                        <div className="h-4 bg-slate-200 rounded animate-pulse w-2/3" />
                        <div className="h-4 bg-slate-200 rounded animate-pulse w-1/2" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredCandidates.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold text-lg mb-2">No candidates found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your filters or add new candidates to get started.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCandidates.map((candidate) => {
                  const applications = candidateApplications?.[candidate.id] || []
                  const latestApplication = applications.sort((a, b) => 
                    new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
                  )[0]
                  
                  return (
                    <CandidateCard
                      key={candidate.id}
                      candidate={candidate}
                      jobCandidate={latestApplication}
                    />
                  )
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}