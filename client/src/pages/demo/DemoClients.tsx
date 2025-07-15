import { DemoDashboardLayout } from '@/components/layout/DemoDashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Building2, 
  Briefcase, 
  Users, 
  MapPin,
  Globe,
  Phone,
  Mail,
  Search,
  Plus,
  Filter,
  ExternalLink
} from 'lucide-react'

const demoClients = [
  {
    id: 'demo-cl1',
    name: 'TechCorp Inc.',
    industry: 'Technology',
    location: 'San Francisco, CA',
    website: 'https://techcorp.com',
    description: 'Leading technology company specializing in cloud infrastructure and AI solutions.',
    contactName: 'Sarah Miller',
    contactEmail: 'sarah.miller@techcorp.com',
    contactPhone: '+1 (555) 123-4567',
    activeJobs: 3,
    totalJobs: 8,
    totalCandidates: 24,
    lastContact: '2025-01-14',
    status: 'active'
  },
  {
    id: 'demo-cl2',
    name: 'CloudStart Ltd.',
    industry: 'Cloud Services',
    location: 'Austin, TX',
    website: 'https://cloudstart.io',
    description: 'Innovative startup providing cloud migration and DevOps consulting services.',
    contactName: 'Mike Johnson',
    contactEmail: 'mike.johnson@cloudstart.io',
    contactPhone: '+1 (555) 234-5678',
    activeJobs: 2,
    totalJobs: 5,
    totalCandidates: 15,
    lastContact: '2025-01-12',
    status: 'active'
  },
  {
    id: 'demo-cl3',
    name: 'InnovateCo',
    industry: 'Financial Technology',
    location: 'New York, NY',
    website: 'https://innovateco.com',
    description: 'Fintech company revolutionizing digital payments and financial services.',
    contactName: 'Jessica Wang',
    contactEmail: 'jessica.wang@innovateco.com',
    contactPhone: '+1 (555) 345-6789',
    activeJobs: 1,
    totalJobs: 6,
    totalCandidates: 18,
    lastContact: '2025-01-10',
    status: 'active'
  },
  {
    id: 'demo-cl4',
    name: 'StartupXYZ',
    industry: 'E-commerce',
    location: 'Los Angeles, CA',
    website: 'https://startupxyz.com',
    description: 'Fast-growing e-commerce platform connecting local businesses with customers.',
    contactName: 'David Chen',
    contactEmail: 'david.chen@startupxyz.com',
    contactPhone: '+1 (555) 456-7890',
    activeJobs: 1,
    totalJobs: 3,
    totalCandidates: 9,
    lastContact: '2025-01-13',
    status: 'active'
  },
  {
    id: 'demo-cl5',
    name: 'HealthTech Solutions',
    industry: 'Healthcare Technology',
    location: 'Boston, MA',
    website: 'https://healthtech.com',
    description: 'Healthcare technology company developing telemedicine and patient management solutions.',
    contactName: 'Dr. Emily Rodriguez',
    contactEmail: 'emily.rodriguez@healthtech.com',
    contactPhone: '+1 (555) 567-8901',
    activeJobs: 0,
    totalJobs: 4,
    totalCandidates: 12,
    lastContact: '2025-01-08',
    status: 'inactive'
  },
  {
    id: 'demo-cl6',
    name: 'GreenEnergy Corp',
    industry: 'Renewable Energy',
    location: 'Seattle, WA',
    website: 'https://greenenergy.com',
    description: 'Renewable energy company focused on solar and wind power solutions.',
    contactName: 'Tom Anderson',
    contactEmail: 'tom.anderson@greenenergy.com',
    contactPhone: '+1 (555) 678-9012',
    activeJobs: 2,
    totalJobs: 7,
    totalCandidates: 21,
    lastContact: '2025-01-11',
    status: 'active'
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
            This is sample client data. All editing and creation functions are disabled in demo mode.
          </p>
        </div>
      </div>
    </div>
  )
}

function ClientsHeader() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Clients</h1>
        <p className="text-slate-600">Manage client relationships and track engagement</p>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            placeholder="Search clients..."
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
          Add Client
        </Button>
      </div>
    </div>
  )
}

function ClientCard({ client }: { client: typeof demoClients[0] }) {
  const getStatusBadge = (status: string) => {
    return status === 'active' ? (
      <Badge variant="default" className="bg-green-100 text-green-800">
        Active
      </Badge>
    ) : (
      <Badge variant="default" className="bg-gray-100 text-gray-800">
        Inactive
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
              <AvatarImage src="" />
              <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                {getInitials(client.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-lg mb-1">{client.name}</CardTitle>
              <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                <span>{client.industry}</span>
                <span>•</span>
                <MapPin className="w-3 h-3" />
                <span>{client.location}</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(client.status)}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <p className="text-sm text-slate-600 mb-4 line-clamp-2">
          {client.description}
        </p>
        
        {/* Contact Info */}
        <div className="space-y-2 mb-4 text-sm">
          <div className="flex items-center gap-2 text-slate-600">
            <Users className="w-4 h-4" />
            <span>{client.contactName}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <Mail className="w-4 h-4" />
            <span>{client.contactEmail}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <Phone className="w-4 h-4" />
            <span>{client.contactPhone}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <Globe className="w-4 h-4" />
            <span className="flex items-center gap-1">
              {client.website}
              <ExternalLink className="w-3 h-3" />
            </span>
          </div>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-slate-50 rounded-lg">
          <div className="text-center">
            <div className="text-lg font-semibold text-slate-900">{client.activeJobs}</div>
            <div className="text-xs text-slate-600">Active Jobs</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-slate-900">{client.totalJobs}</div>
            <div className="text-xs text-slate-600">Total Jobs</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-slate-900">{client.totalCandidates}</div>
            <div className="text-xs text-slate-600">Candidates</div>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
          <span>Last contact: {client.lastContact}</span>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled>
            View Details
          </Button>
          <Button variant="outline" size="sm" disabled>
            Edit Client
          </Button>
          <Button variant="outline" size="sm" disabled>
            View Jobs
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function DemoClients() {
  const activeClients = demoClients.filter(client => client.status === 'active').length
  const totalJobs = demoClients.reduce((sum, client) => sum + client.totalJobs, 0)
  const totalCandidates = demoClients.reduce((sum, client) => sum + client.totalCandidates, 0)

  return (
    <DemoDashboardLayout pageTitle="Demo Clients">
      <div className="space-y-6">
        <DemoBanner />
        <ClientsHeader />
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Active Clients</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{activeClients}</p>
                </div>
                <div className="p-3 rounded-lg bg-green-50">
                  <Building2 className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Jobs</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{totalJobs}</p>
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

        {/* Clients Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {demoClients.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))}
        </div>
      </div>
    </DemoDashboardLayout>
  )
}