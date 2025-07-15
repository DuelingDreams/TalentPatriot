import { DemoDashboardLayout } from '@/components/layout/DemoDashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  Calendar, 
  Mail, 
  Phone,
  FileText,
  Building2,
  ChevronRight
} from 'lucide-react'

// Demo data with status='demo' - this would normally come from Supabase
const PIPELINE_STAGES = [
  { id: 'applied', name: 'Applied', color: 'bg-slate-100 text-slate-700' },
  { id: 'screening', name: 'Screening', color: 'bg-blue-100 text-blue-700' },
  { id: 'interview', name: 'Interview', color: 'bg-yellow-100 text-yellow-700' },
  { id: 'technical', name: 'Technical', color: 'bg-purple-100 text-purple-700' },
  { id: 'final', name: 'Final', color: 'bg-orange-100 text-orange-700' },
  { id: 'offer', name: 'Offer', color: 'bg-green-100 text-green-700' },
  { id: 'hired', name: 'Hired', color: 'bg-emerald-100 text-emerald-700' },
  { id: 'rejected', name: 'Rejected', color: 'bg-red-100 text-red-700' }
]

const demoJobCandidates = [
  {
    id: 'jc-1',
    stage: 'applied',
    notes: 'Strong React background, good portfolio',
    assigned_to: 'Sarah Miller',
    updated_at: '2025-01-14T10:00:00Z',
    job: {
      id: 'job-1',
      title: 'Senior React Developer',
      company: 'TechCorp Inc.',
      status: 'demo'
    },
    candidate: {
      id: 'cand-1',
      name: 'Alex Rodriguez',
      email: 'alex.demo@example.com',
      phone: '+1 (555) 123-4567',
      resume_url: null,
      skills: ['React', 'TypeScript', 'Node.js'],
      location: 'San Francisco, CA',
      experience: '5 years',
      created_at: '2025-01-10T09:00:00Z'
    }
  },
  {
    id: 'jc-2',
    stage: 'screening',
    notes: 'Completed initial phone screen, moving to technical',
    assigned_to: 'Mike Johnson',
    updated_at: '2025-01-13T14:30:00Z',
    job: {
      id: 'job-2',
      title: 'DevOps Engineer',
      company: 'CloudStart Ltd.',
      status: 'demo'
    },
    candidate: {
      id: 'cand-2',
      name: 'Sarah Chen',
      email: 'sarah.demo@example.com',
      phone: '+1 (555) 234-5678',
      resume_url: null,
      skills: ['AWS', 'Docker', 'Kubernetes', 'Python'],
      location: 'Austin, TX',
      experience: '7 years',
      created_at: '2025-01-08T11:00:00Z'
    }
  },
  {
    id: 'jc-3',
    stage: 'interview',
    notes: 'Great technical skills, good cultural fit',
    assigned_to: 'Jessica Wang',
    updated_at: '2025-01-12T16:45:00Z',
    job: {
      id: 'job-3',
      title: 'Product Manager',
      company: 'InnovateCo',
      status: 'demo'
    },
    candidate: {
      id: 'cand-3',
      name: 'Michael Park',
      email: 'michael.demo@example.com',
      phone: '+1 (555) 345-6789',
      resume_url: null,
      skills: ['Product Strategy', 'Agile', 'Analytics'],
      location: 'New York, NY',
      experience: '6 years',
      created_at: '2025-01-05T13:00:00Z'
    }
  },
  {
    id: 'jc-4',
    stage: 'technical',
    notes: 'Excellent coding challenge submission',
    assigned_to: 'David Chen',
    updated_at: '2025-01-11T12:15:00Z',
    job: {
      id: 'job-1',
      title: 'Senior React Developer',
      company: 'TechCorp Inc.',
      status: 'demo'
    },
    candidate: {
      id: 'cand-4',
      name: 'Emma Wilson',
      email: 'emma.demo@example.com',
      phone: '+1 (555) 456-7890',
      resume_url: null,
      skills: ['React', 'GraphQL', 'TypeScript'],
      location: 'Seattle, WA',
      experience: '4 years',
      created_at: '2025-01-07T10:30:00Z'
    }
  },
  {
    id: 'jc-5',
    stage: 'final',
    notes: 'Final interview with CEO scheduled',
    assigned_to: 'Tom Anderson',
    updated_at: '2025-01-10T09:20:00Z',
    job: {
      id: 'job-4',
      title: 'UI/UX Designer',
      company: 'StartupXYZ',
      status: 'demo'
    },
    candidate: {
      id: 'cand-5',
      name: 'David Kim',
      email: 'david.demo@example.com',
      phone: '+1 (555) 567-8901',
      resume_url: null,
      skills: ['Figma', 'User Research', 'Prototyping'],
      location: 'Los Angeles, CA',
      experience: '5 years',
      created_at: '2025-01-03T15:00:00Z'
    }
  },
  {
    id: 'jc-6',
    stage: 'offer',
    notes: 'Offer sent, awaiting response',
    assigned_to: 'Emily Rodriguez',
    updated_at: '2025-01-09T11:30:00Z',
    job: {
      id: 'job-5',
      title: 'Backend Engineer',
      company: 'HealthTech Solutions',
      status: 'demo'
    },
    candidate: {
      id: 'cand-6',
      name: 'Lisa Thompson',
      email: 'lisa.demo@example.com',
      phone: '+1 (555) 678-9012',
      resume_url: null,
      skills: ['Python', 'PostgreSQL', 'Django'],
      location: 'Boston, MA',
      experience: '6 years',
      created_at: '2025-01-01T14:00:00Z'
    }
  },
  {
    id: 'jc-7',
    stage: 'hired',
    notes: 'Offer accepted, start date confirmed',
    assigned_to: 'Sarah Miller',
    updated_at: '2025-01-08T13:45:00Z',
    job: {
      id: 'job-6',
      title: 'Full Stack Developer',
      company: 'GreenEnergy Corp',
      status: 'demo'
    },
    candidate: {
      id: 'cand-7',
      name: 'John Martinez',
      email: 'john.demo@example.com',
      phone: '+1 (555) 789-0123',
      resume_url: null,
      skills: ['React', 'Node.js', 'MongoDB'],
      location: 'Chicago, IL',
      experience: '4 years',
      created_at: '2024-12-28T12:00:00Z'
    }
  },
  {
    id: 'jc-8',
    stage: 'rejected',
    notes: 'Skills did not match requirements',
    assigned_to: 'Mike Johnson',
    updated_at: '2025-01-07T16:00:00Z',
    job: {
      id: 'job-2',
      title: 'DevOps Engineer',
      company: 'CloudStart Ltd.',
      status: 'demo'
    },
    candidate: {
      id: 'cand-8',
      name: 'Anna Davis',
      email: 'anna.demo@example.com',
      phone: '+1 (555) 890-1234',
      resume_url: null,
      skills: ['HTML', 'CSS', 'JavaScript'],
      location: 'Miami, FL',
      experience: '2 years',
      created_at: '2024-12-30T11:00:00Z'
    }
  }
]

function DemoBanner() {
  return (
    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <span className="text-2xl">🔓</span>
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-blue-800">
            Demo Mode – Read-Only Pipeline
          </p>
          <p className="text-xs text-blue-600 mt-1">
            This Kanban board shows sample candidate pipeline data. All drag-and-drop and editing functions are disabled.
          </p>
        </div>
      </div>
    </div>
  )
}

function CandidateCard({ jobCandidate, isDemoMode = true }: { jobCandidate: typeof demoJobCandidates[0], isDemoMode?: boolean }) {
  const { candidate, job, stage, notes, assigned_to, updated_at } = jobCandidate

  const getInitials = (name: string) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <Card className="mb-3 hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <Avatar className="w-10 h-10 flex-shrink-0">
            <AvatarImage src="" />
            <AvatarFallback className="bg-blue-100 text-blue-600 text-sm">
              {getInitials(candidate.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-slate-900 truncate">
              {candidate.name}
            </h4>
            <p className="text-sm text-slate-600 truncate">
              {candidate.email}
            </p>
          </div>
        </div>
        
        <div className="mb-3">
          <div className="flex items-center gap-1 mb-1">
            <Building2 className="w-3 h-3 text-slate-500" />
            <span className="text-sm font-medium text-slate-900 truncate">
              {job.title}
            </span>
          </div>
          <p className="text-xs text-slate-600 truncate">
            {job.company}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-1 mb-3">
          {candidate.skills.slice(0, 3).map((skill) => (
            <Badge key={skill} variant="secondary" className="text-xs">
              {skill}
            </Badge>
          ))}
          {candidate.skills.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{candidate.skills.length - 3}
            </Badge>
          )}
        </div>
        
        {notes && (
          <div className="mb-3">
            <p className="text-xs text-slate-600 line-clamp-2">
              {notes}
            </p>
          </div>
        )}
        
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>{assigned_to}</span>
          <span>{formatDate(updated_at)}</span>
        </div>
        
        <div className="mt-3 pt-3 border-t border-slate-100 flex gap-2">
          <Button variant="outline" size="sm" disabled={isDemoMode}>
            <FileText className="w-3 h-3 mr-1" />
            View
          </Button>
          <Button variant="outline" size="sm" disabled={isDemoMode}>
            Notes
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function PipelineColumn({ stage, candidates, isDemoMode = true }: { 
  stage: typeof PIPELINE_STAGES[0], 
  candidates: typeof demoJobCandidates,
  isDemoMode?: boolean 
}) {
  const stageCandidates = candidates.filter(jc => jc.stage === stage.id)
  
  return (
    <div className="flex-1 min-w-80">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`${stage.color} font-medium`}>
              {stage.name}
            </Badge>
            <span className="text-sm text-slate-500">
              {stageCandidates.length}
            </span>
          </div>
          <Button variant="ghost" size="sm" disabled={isDemoMode}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      <div className="space-y-0 max-h-[calc(100vh-300px)] overflow-y-auto">
        {stageCandidates.map((jobCandidate) => (
          <CandidateCard 
            key={jobCandidate.id} 
            jobCandidate={jobCandidate}
            isDemoMode={isDemoMode}
          />
        ))}
        
        {stageCandidates.length === 0 && (
          <div className="text-center py-8 text-slate-400">
            <Users className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">No candidates</p>
          </div>
        )}
      </div>
    </div>
  )
}

function PipelineStats() {
  const totalCandidates = demoJobCandidates.length
  const activeStages = ['applied', 'screening', 'interview', 'technical', 'final', 'offer']
  const activeCandidates = demoJobCandidates.filter(jc => activeStages.includes(jc.stage)).length
  const hiredCandidates = demoJobCandidates.filter(jc => jc.stage === 'hired').length
  const rejectedCandidates = demoJobCandidates.filter(jc => jc.stage === 'rejected').length
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Candidates</p>
              <p className="text-2xl font-bold text-slate-900">{totalCandidates}</p>
            </div>
            <div className="p-2 rounded-lg bg-blue-50">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">In Process</p>
              <p className="text-2xl font-bold text-slate-900">{activeCandidates}</p>
            </div>
            <div className="p-2 rounded-lg bg-yellow-50">
              <Users className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Hired</p>
              <p className="text-2xl font-bold text-slate-900">{hiredCandidates}</p>
            </div>
            <div className="p-2 rounded-lg bg-green-50">
              <Users className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Rejected</p>
              <p className="text-2xl font-bold text-slate-900">{rejectedCandidates}</p>
            </div>
            <div className="p-2 rounded-lg bg-red-50">
              <Users className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function DemoKanban() {
  return (
    <DemoDashboardLayout pageTitle="Demo Pipeline">
      <div className="space-y-6">
        <DemoBanner />
        
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Candidate Pipeline</h1>
          <p className="text-slate-600">
            Track candidates through the recruitment process with this Kanban-style board
          </p>
        </div>
        
        <PipelineStats />
        
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex gap-6 overflow-x-auto pb-4">
            {PIPELINE_STAGES.map((stage) => (
              <PipelineColumn 
                key={stage.id} 
                stage={stage} 
                candidates={demoJobCandidates}
                isDemoMode={true}
              />
            ))}
          </div>
        </div>
        
        <div className="text-center text-sm text-slate-500 mt-6">
          This pipeline shows demo data only (status = 'demo'). All drag-and-drop and editing functions are disabled in demo mode.
        </div>
      </div>
    </DemoDashboardLayout>
  )
}