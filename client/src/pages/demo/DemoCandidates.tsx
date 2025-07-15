import { DemoDashboardLayout } from '@/components/layout/DemoDashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Users, 
  Briefcase, 
  Mail, 
  Phone,
  MapPin,
  Calendar,
  FileText,
  Search,
  Plus,
  Filter,
  Download
} from 'lucide-react'

const demoCandidates = [
  {
    id: 'demo-c1',
    name: 'Sarah Johnson',
    email: 'sarah.demo@example.com',
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA',
    currentJob: 'Senior Frontend Developer at WebCorp',
    experience: '6 years',
    skills: ['React', 'TypeScript', 'Node.js', 'GraphQL'],
    stage: 'interview',
    job: 'Senior React Developer',
    company: 'TechCorp Inc.',
    appliedDate: '2025-01-10',
    lastUpdate: '2025-01-14',
    resumeUrl: '/demo/resume-sarah.pdf',
    avatar: null,
    status: 'active'
  },
  {
    id: 'demo-c2',
    name: 'Michael Chen',
    email: 'michael.demo@example.com',
    phone: '+1 (555) 234-5678',
    location: 'Austin, TX',
    currentJob: 'DevOps Engineer at CloudTech',
    experience: '8 years',
    skills: ['AWS', 'Docker', 'Kubernetes', 'Python'],
    stage: 'technical',
    job: 'DevOps Engineer',
    company: 'CloudStart Ltd.',
    appliedDate: '2025-01-08',
    lastUpdate: '2025-01-13',
    resumeUrl: '/demo/resume-michael.pdf',
    avatar: null,
    status: 'active'
  },
  {
    id: 'demo-c3',
    name: 'Emma Wilson',
    email: 'emma.demo@example.com',
    phone: '+1 (555) 345-6789',
    location: 'New York, NY',
    currentJob: 'Product Manager at FinanceApp',
    experience: '5 years',
    skills: ['Product Strategy', 'Agile', 'Data Analysis', 'User Research'],
    stage: 'offer',
    job: 'Product Manager',
    company: 'InnovateCo',
    appliedDate: '2025-01-05',
    lastUpdate: '2025-01-12',
    resumeUrl: '/demo/resume-emma.pdf',
    avatar: null,
    status: 'active'
  },
  {
    id: 'demo-c4',
    name: 'Alex Rodriguez',
    email: 'alex.demo@example.com',
    phone: '+1 (555) 456-7890',
    location: 'Los Angeles, CA',
    currentJob: 'UX Designer at DesignStudio',
    experience: '4 years',
    skills: ['Figma', 'User Research', 'Prototyping', 'Design Systems'],
    stage: 'screening',
    job: 'UI/UX Designer',
    company: 'TechCorp Inc.',
    appliedDate: '2025-01-12',
    lastUpdate: '2025-01-14',
    resumeUrl: '/demo/resume-alex.pdf',
    avatar: null,
    status: 'active'
  },
  {
    id: 'demo-c5',
    name: 'Jessica Park',
    email: 'jessica.demo@example.com',
    phone: '+1 (555) 567-8901',
    location: 'Seattle, WA',
    currentJob: 'Backend Developer at DataCorp',
    experience: '7 years',
    skills: ['Python', 'PostgreSQL', 'Django', 'Redis'],
    stage: 'final',
    job: 'Backend Engineer (Contract)',
    company: 'StartupXYZ',
    appliedDate: '2025-01-11',
    lastUpdate: '2025-01-13',
    resumeUrl: '/demo/resume-jessica.pdf',
    avatar: null,
    status: 'active'
  },
  {
    id: 'demo-c6',
    name: 'David Kim',
    email: 'david.demo@example.com',
    phone: '+1 (555) 678-9012',
    location: 'Boston, MA',
    currentJob: 'Full Stack Developer at HealthApp',
    experience: '5 years',
    skills: ['React', 'Python', 'AWS', 'MongoDB'],
    stage: 'hired',
    job: 'Full Stack Developer',
    company: 'HealthTech Solutions',
    appliedDate: '2024-12-20',
    lastUpdate: '2025-01-08',
    resumeUrl: '/demo/resume-david.pdf',
    avatar: null,
    status: 'hired'
  },
  {
    id: 'demo-c7',
    name: 'Lisa Thompson',
    email: 'lisa.demo@example.com',
    phone: '+1 (555) 789-0123',
    location: 'Chicago, IL',
    currentJob: 'Data Scientist at Analytics Inc.',
    experience: '6 years',
    skills: ['Python', 'Machine Learning', 'SQL', 'TensorFlow'],
    stage: 'rejected',
    job: 'Data Scientist',
    company: 'TechCorp Inc.',
    appliedDate: '2024-12-15',
    lastUpdate: '2025-01-05',
    resumeUrl: '/demo/resume-lisa.pdf',
    avatar: null,
    status: 'inactive'
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
            Demo Mode – Read-Only Preview
          </p>
          <p className="text-xs text-blue-600 mt-1">
            This is sample candidate data. All editing and creation functions are disabled in demo mode.
          </p>
        </div>
      </div>
    </div>
  )
}

function CandidatesHeader() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Candidates</h1>
        <p className="text-slate-600">Manage candidate applications and track progress</p>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            placeholder="Search candidates..."
            className="pl-10 w-64"
            disabled
          />
        </div>
        <Button variant="outline" disabled>
          <Filter className="w-4 h-4 mr-2" />
          Filter
        </Button>
        <Button disabled>
          <Plus className="w-4 h-4 mr-2" />
          Add Candidate
        </Button>
      </div>
    </div>
  )
}

function CandidateCard({ candidate }: { candidate: typeof demoCandidates[0] }) {
  const getStageBadge = (stage: string) => {
    const stageColors = {
      applied: 'bg-slate-100 text-slate-800',
      screening: 'bg-blue-100 text-blue-800',
      interview: 'bg-yellow-100 text-yellow-800',
      technical: 'bg-purple-100 text-purple-800',
      final: 'bg-orange-100 text-orange-800',
      offer: 'bg-green-100 text-green-800',
      hired: 'bg-emerald-100 text-emerald-800',
      rejected: 'bg-red-100 text-red-800'
    }
    
    return (
      <Badge variant="default" className={stageColors[stage as keyof typeof stageColors] || 'bg-slate-100 text-slate-800'}>
        {stage.charAt(0).toUpperCase() + stage.slice(1)}
      </Badge>
    )
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase()
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <Avatar className="w-12 h-12">
              <AvatarImage src={candidate.avatar || undefined} />
              <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                {getInitials(candidate.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-lg mb-1">{candidate.name}</CardTitle>
              <div className="text-sm text-slate-600 mb-2">
                {candidate.currentJob}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                <MapPin className="w-3 h-3" />
                <span>{candidate.location}</span>
                <span>•</span>
                <span>{candidate.experience} experience</span>
              </div>
              <div className="flex items-center gap-2">
                {getStageBadge(candidate.stage)}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Current Application */}
        <div className="mb-4 p-3 bg-slate-50 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Briefcase className="w-4 h-4 text-slate-600" />
            <span className="font-medium text-slate-900">{candidate.job}</span>
          </div>
          <div className="text-sm text-slate-600">{candidate.company}</div>
          <div className="text-xs text-slate-500 mt-1">
            Applied: {candidate.appliedDate} • Updated: {candidate.lastUpdate}
          </div>
        </div>
        
        {/* Contact Info */}
        <div className="space-y-2 mb-4 text-sm">
          <div className="flex items-center gap-2 text-slate-600">
            <Mail className="w-4 h-4" />
            <span>{candidate.email}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <Phone className="w-4 h-4" />
            <span>{candidate.phone}</span>
          </div>
        </div>
        
        {/* Skills */}
        <div className="mb-4">
          <div className="text-sm font-medium text-slate-900 mb-2">Skills</div>
          <div className="flex flex-wrap gap-1">
            {candidate.skills.slice(0, 4).map((skill) => (
              <Badge key={skill} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
            {candidate.skills.length > 4 && (
              <Badge variant="secondary" className="text-xs">
                +{candidate.skills.length - 4} more
              </Badge>
            )}
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled>
            View Profile
          </Button>
          <Button variant="outline" size="sm" disabled>
            <FileText className="w-3 h-3 mr-1" />
            Resume
          </Button>
          <Button variant="outline" size="sm" disabled>
            Edit
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function DemoCandidates() {
  const activeCandidates = demoCandidates.filter(c => c.status === 'active').length
  const hiredCandidates = demoCandidates.filter(c => c.status === 'hired').length
  const inProcess = demoCandidates.filter(c => ['interview', 'technical', 'final', 'offer'].includes(c.stage)).length

  return (
    <DemoDashboardLayout pageTitle="Demo Candidates">
      <div className="space-y-6">
        <DemoBanner />
        <CandidatesHeader />
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Active Candidates</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{activeCandidates}</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-50">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">In Process</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{inProcess}</p>
                </div>
                <div className="p-3 rounded-lg bg-yellow-50">
                  <Users className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Hired</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{hiredCandidates}</p>
                </div>
                <div className="p-3 rounded-lg bg-green-50">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Candidates Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {demoCandidates.map((candidate) => (
            <CandidateCard key={candidate.id} candidate={candidate} />
          ))}
        </div>
      </div>
    </DemoDashboardLayout>
  )
}