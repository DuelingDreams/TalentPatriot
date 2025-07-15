import { DemoDashboardLayout } from '@/components/layout/DemoDashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Briefcase, 
  Building2, 
  Users, 
  Calendar,
  Search,
  Plus,
  Filter
} from 'lucide-react'

const demoJobs = [
  {
    id: 'demo-1',
    title: 'Senior React Developer',
    description: 'Looking for an experienced React developer to join our growing team. Must have 5+ years of experience with React, TypeScript, and modern frontend tools.',
    client: {
      id: 'client-1',
      name: 'TechCorp Inc.',
      industry: 'Technology'
    },
    status: 'open',
    location: 'San Francisco, CA',
    salary: '$120,000 - $160,000',
    type: 'Full-time',
    candidates: 8,
    createdAt: '2025-01-10',
    updatedAt: '2025-01-14'
  },
  {
    id: 'demo-2',
    title: 'DevOps Engineer',
    description: 'We need a skilled DevOps engineer to help scale our cloud infrastructure. Experience with AWS, Docker, and Kubernetes required.',
    client: {
      id: 'client-2',
      name: 'CloudStart Ltd.',
      industry: 'Cloud Services'
    },
    status: 'open',
    location: 'Remote',
    salary: '$110,000 - $150,000',
    type: 'Full-time',
    candidates: 5,
    createdAt: '2025-01-08',
    updatedAt: '2025-01-13'
  },
  {
    id: 'demo-3',
    title: 'Product Manager',
    description: 'Seeking a strategic product manager to lead our mobile app development. Experience in fintech preferred.',
    client: {
      id: 'client-3',
      name: 'InnovateCo',
      industry: 'Financial Technology'
    },
    status: 'filled',
    location: 'New York, NY',
    salary: '$130,000 - $170,000',
    type: 'Full-time',
    candidates: 12,
    createdAt: '2025-01-05',
    updatedAt: '2025-01-12'
  },
  {
    id: 'demo-4',
    title: 'UI/UX Designer',
    description: 'Creative designer needed for our design team. Must have experience with Figma, user research, and mobile design.',
    client: {
      id: 'client-1',
      name: 'TechCorp Inc.',
      industry: 'Technology'
    },
    status: 'on_hold',
    location: 'San Francisco, CA',
    salary: '$90,000 - $120,000',
    type: 'Full-time',
    candidates: 3,
    createdAt: '2025-01-03',
    updatedAt: '2025-01-10'
  },
  {
    id: 'demo-5',
    title: 'Backend Engineer (Contract)',
    description: 'Short-term contract for backend development. Python and PostgreSQL experience required.',
    client: {
      id: 'client-4',
      name: 'StartupXYZ',
      industry: 'E-commerce'
    },
    status: 'open',
    location: 'Remote',
    salary: '$80/hour',
    type: 'Contract',
    candidates: 6,
    createdAt: '2025-01-12',
    updatedAt: '2025-01-14'
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
            This is sample job data. All editing and creation functions are disabled in demo mode.
          </p>
        </div>
      </div>
    </div>
  )
}

function JobsHeader() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Jobs</h1>
        <p className="text-slate-600">Manage job postings and track applications</p>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            placeholder="Search jobs..."
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
          Add Job
        </Button>
      </div>
    </div>
  )
}

function JobCard({ job }: { job: typeof demoJobs[0] }) {
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      open: { color: 'bg-green-100 text-green-800', label: 'Open' },
      filled: { color: 'bg-blue-100 text-blue-800', label: 'Filled' },
      on_hold: { color: 'bg-yellow-100 text-yellow-800', label: 'On Hold' },
      closed: { color: 'bg-gray-100 text-gray-800', label: 'Closed' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.open
    return (
      <Badge variant="default" className={config.color}>
        {config.label}
      </Badge>
    )
  }

  const getTypeBadge = (type: string) => {
    return type === 'Contract' ? (
      <Badge variant="outline" className="text-purple-700 border-purple-300">
        Contract
      </Badge>
    ) : (
      <Badge variant="outline">
        Full-time
      </Badge>
    )
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-1">{job.title}</CardTitle>
            <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
              <Building2 className="w-4 h-4" />
              <span>{job.client.name}</span>
              <span>•</span>
              <span>{job.location}</span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(job.status)}
              {getTypeBadge(job.type)}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <p className="text-sm text-slate-600 mb-4 line-clamp-2">
          {job.description}
        </p>
        
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4 text-slate-500">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{job.candidates} candidates</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>Posted {job.createdAt}</span>
            </div>
          </div>
          
          <div className="font-medium text-slate-900">
            {job.salary}
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>
              View Details
            </Button>
            <Button variant="outline" size="sm" disabled>
              Edit Job
            </Button>
            <Button variant="outline" size="sm" disabled>
              View Pipeline
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function DemoJobs() {
  const activeJobs = demoJobs.filter(job => job.status === 'open').length
  const filledJobs = demoJobs.filter(job => job.status === 'filled').length
  const totalCandidates = demoJobs.reduce((sum, job) => sum + job.candidates, 0)

  return (
    <DemoDashboardLayout pageTitle="Demo Jobs">
      <div className="space-y-6">
        <DemoBanner />
        <JobsHeader />
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Active Jobs</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{activeJobs}</p>
                </div>
                <div className="p-3 rounded-lg bg-green-50">
                  <Briefcase className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Filled Jobs</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{filledJobs}</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-50">
                  <Briefcase className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Candidates</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{totalCandidates}</p>
                </div>
                <div className="p-3 rounded-lg bg-purple-50">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Jobs Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {demoJobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      </div>
    </DemoDashboardLayout>
  )
}