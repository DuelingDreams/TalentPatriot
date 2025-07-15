import { DemoDashboardLayout } from '@/components/layout/DemoDashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  Briefcase, 
  Building2, 
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Link as LinkIcon
} from 'lucide-react'

// Demo data - this would normally come from Supabase with status='demo'
const demoStats = {
  totalJobs: 12,
  activeJobs: 8,
  totalCandidates: 45,
  totalClients: 6
}

const demoJobs = [
  {
    id: 'demo-1',
    title: 'Senior React Developer',
    client: 'TechCorp Inc.',
    status: 'open',
    candidates: 8,
    created: '2025-01-10'
  },
  {
    id: 'demo-2',
    title: 'DevOps Engineer',
    client: 'CloudStart Ltd.',
    status: 'open',
    candidates: 5,
    created: '2025-01-08'
  },
  {
    id: 'demo-3',
    title: 'Product Manager',
    client: 'InnovateCo',
    status: 'filled',
    candidates: 12,
    created: '2025-01-05'
  }
]

const demoCandidates = [
  {
    id: 'demo-c1',
    name: 'Sarah Johnson',
    email: 'sarah.demo@example.com',
    stage: 'interview',
    job: 'Senior React Developer',
    avatar: null
  },
  {
    id: 'demo-c2',
    name: 'Michael Chen',
    email: 'michael.demo@example.com',
    stage: 'technical',
    job: 'DevOps Engineer',
    avatar: null
  },
  {
    id: 'demo-c3',
    name: 'Emma Wilson',
    email: 'emma.demo@example.com',
    stage: 'offer',
    job: 'Product Manager',
    avatar: null
  }
]

const demoClients = [
  {
    id: 'demo-cl1',
    name: 'TechCorp Inc.',
    industry: 'Technology',
    activeJobs: 3,
    totalJobs: 5
  },
  {
    id: 'demo-cl2',
    name: 'CloudStart Ltd.',
    industry: 'Cloud Services',
    activeJobs: 2,
    totalJobs: 4
  },
  {
    id: 'demo-cl3',
    name: 'InnovateCo',
    industry: 'Product Development',
    activeJobs: 1,
    totalJobs: 3
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
            This is a demonstration of the ATS system using sample data. All editing functions are disabled.
          </p>
        </div>
      </div>
    </div>
  )
}

function StatsCards() {
  const stats = [
    {
      label: 'Total Jobs',
      value: demoStats.totalJobs.toString(),
      icon: Briefcase,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600'
    },
    {
      label: 'Active Jobs',
      value: demoStats.activeJobs.toString(),
      icon: TrendingUp,
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600'
    },
    {
      label: 'Total Candidates',
      value: demoStats.totalCandidates.toString(),
      icon: Users,
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600'
    },
    {
      label: 'Total Clients',
      value: demoStats.totalClients.toString(),
      icon: Building2,
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

function RecentJobs() {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="default" className="bg-green-100 text-green-800">Open</Badge>
      case 'filled':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Filled</Badge>
      case 'on_hold':
        return <Badge variant="default" className="bg-yellow-100 text-yellow-800">On Hold</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="w-5 h-5" />
          Recent Jobs
        </CardTitle>
        <CardDescription>Latest job postings in the system</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {demoJobs.map((job) => (
            <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50">
              <div className="flex-1">
                <h4 className="font-semibold text-slate-900">{job.title}</h4>
                <p className="text-sm text-slate-600">{job.client}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {job.candidates} candidates
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {job.created}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(job.status)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function RecentCandidates() {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Recent Candidates
        </CardTitle>
        <CardDescription>Latest candidate applications</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {demoCandidates.map((candidate) => (
            <div key={candidate.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={candidate.avatar || undefined} />
                  <AvatarFallback>
                    {candidate.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-semibold text-slate-900">{candidate.name}</h4>
                  <p className="text-sm text-slate-600">{candidate.email}</p>
                  <p className="text-xs text-slate-500">{candidate.job}</p>
                </div>
              </div>
              <div>
                {getStageBadge(candidate.stage)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function ClientsList() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Active Clients
        </CardTitle>
        <CardDescription>Companies currently working with us</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {demoClients.map((client) => (
            <div key={client.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50">
              <div>
                <h4 className="font-semibold text-slate-900">{client.name}</h4>
                <p className="text-sm text-slate-600">{client.industry}</p>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-slate-900">
                  {client.activeJobs} active jobs
                </div>
                <div className="text-xs text-slate-500">
                  {client.totalJobs} total jobs
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default function DemoMode() {
  return (
    <DemoDashboardLayout pageTitle="Demo Dashboard">
      <div className="space-y-6">
        <DemoBanner />
        
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">ATS Demo Dashboard</h1>
          <p className="text-slate-600">
            Welcome to the ATS demo! This shows how the system works with sample recruitment data.
          </p>
        </div>

        <StatsCards />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentJobs />
          <RecentCandidates />
        </div>

        <ClientsList />

        <Card className="border-dashed border-2 border-slate-200">
          <CardContent className="p-8 text-center">
            <div className="max-w-md mx-auto">
              <LinkIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Ready to get started?
              </h3>
              <p className="text-slate-600 mb-4">
                Sign up for a full account to access all features and manage your own recruitment data.
              </p>
              <Button asChild>
                <a href="/signup">Create Account</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DemoDashboardLayout>
  )
}