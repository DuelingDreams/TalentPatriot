import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { testSupabaseConnection } from '@/lib/supabase-test'
import { useJobs } from '@/hooks/useJobs'
import { useClients } from '@/hooks/useClients'
import { useCandidates } from '@/hooks/useCandidates'
import { getDemoClientStats, getDemoJobStats, getDemoPipelineData } from '@/lib/demo-data'
import { AddCandidateDialog } from '@/components/dialogs/AddCandidateDialog'
import { AddClientDialog } from '@/components/dialogs/AddClientDialog'
import { ScheduleInterviewDialog } from '@/components/calendar/ScheduleInterviewDialog'
import { SendMessageDialog } from '@/components/dialogs/SendMessageDialog'
import { PostJobDialog } from '@/components/dialogs/PostJobDialog'

import { 
  Plus, 
  Briefcase, 
  Users, 
  Clock, 
  TrendingUp,
  UserPlus,
  Building2,
  Calendar,
  MessageSquare,
  ChevronRight,
  Database
} from 'lucide-react'

interface StatCard {
  label: string
  value: string
  icon: React.ElementType
  bgColor: string
  iconColor: string
}

interface Activity {
  id: string
  user: {
    name: string
    avatar: string
  }
  description: string
  project: string
  timestamp: string
}

interface TeamMember {
  id: string
  name: string
  role: string
  avatar: string
  status: 'Online' | 'Away' | 'Offline'
}

export default function Dashboard() {
  const [supabaseStatus, setSupabaseStatus] = useState<'testing' | 'connected' | 'error'>('testing')
  const { toast } = useToast()
  const { userRole } = useAuth()

  // Fetch real data using our hooks
  const { data: jobs, isLoading: jobsLoading, error: jobsError } = useJobs()
  const { data: clients, isLoading: clientsLoading } = useClients()
  const { data: candidates, isLoading: candidatesLoading } = useCandidates()

  useEffect(() => {
    // Test Supabase connection on component mount
    testSupabaseConnection().then((result) => {
      if (result.success) {
        setSupabaseStatus('connected')
        toast({
          title: "Database Connected",
          description: "Successfully connected to Supabase database",
        })
      } else {
        setSupabaseStatus('error')
        toast({
          title: "Database Connection Failed",
          description: result.error || "Could not connect to database",
          variant: "destructive",
        })
      }
    })
  }, [toast])

  // Calculate real stats from data or demo data
  let openJobsCount = 0
  let totalCandidatesCount = 0
  let totalClientsCount = 0
  
  if (userRole === 'demo_viewer') {
    const demoJobs = getDemoJobStats()
    const demoClients = getDemoClientStats()
    const demoPipeline = getDemoPipelineData()
    
    openJobsCount = demoJobs.filter(job => job.status === 'open').length
    totalClientsCount = demoClients.length
    totalCandidatesCount = demoPipeline.reduce((total, stage) => total + stage.candidates.length, 0)
  } else {
    openJobsCount = jobs?.filter(job => job.status === 'open').length || 0
    totalCandidatesCount = candidates?.length || 0
    totalClientsCount = clients?.length || 0
  }

  const stats: StatCard[] = [
    {
      label: 'Open Jobs',
      value: jobsLoading ? '...' : openJobsCount.toString(),
      icon: Briefcase,
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    {
      label: 'Total Candidates',
      value: candidatesLoading ? '...' : totalCandidatesCount.toString(),
      icon: Users,
      bgColor: 'bg-emerald-100',
      iconColor: 'text-emerald-600'
    },
    {
      label: 'Active Clients',
      value: clientsLoading ? '...' : totalClientsCount.toString(),
      icon: Building2,
      bgColor: 'bg-orange-100',
      iconColor: 'text-orange-600'
    }
  ]

  const [activities] = useState<Activity[]>([
    {
      id: '1',
      user: {
        name: 'Sarah Chen',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b9e7b565?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=64&h=64'
      },
      description: 'scheduled interview for',
      project: 'Senior Developer Position',
      timestamp: '2 hours ago'
    },
    {
      id: '2',
      user: {
        name: 'Mike Johnson',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=64&h=64'
      },
      description: 'submitted application for',
      project: 'Marketing Manager Role',
      timestamp: '4 hours ago'
    },
    {
      id: '3',
      user: {
        name: 'Emily Davis',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=64&h=64'
      },
      description: 'completed screening call for',
      project: 'UX Designer Position',
      timestamp: '6 hours ago'
    }
  ])

  const [teamMembers] = useState<TeamMember[]>([
    {
      id: '1',
      name: 'Alex Thompson',
      role: 'HR Recruiter',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=64&h=64',
      status: 'Online'
    },
    {
      id: '2',
      name: 'Maria Garcia',
      role: 'Talent Specialist',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=64&h=64',
      status: 'Away'
    },
    {
      id: '3',
      name: 'David Kim',
      role: 'Hiring Manager',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=64&h=64',
      status: 'Online'
    }
  ])

  const getStatusBadgeProps = (status: string) => {
    switch (status) {
      case 'Online':
        return { className: 'bg-green-100 text-green-800' }
      case 'Away':
        return { className: 'bg-yellow-100 text-yellow-800' }
      default:
        return { className: 'bg-gray-100 text-gray-800' }
    }
  }

  return (
    <DashboardLayout pageTitle="Dashboard">
      <div className="p-6">
        {/* Page Header */}
        <div className="mb-8">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-slate-900">Welcome to ATS</h2>
                <div className="flex items-center gap-2">
                  <Database className={`w-4 h-4 ${
                    supabaseStatus === 'connected' ? 'text-green-600' : 
                    supabaseStatus === 'error' ? 'text-red-600' : 'text-yellow-600'
                  }`} />
                  <span className={`text-xs font-medium ${
                    supabaseStatus === 'connected' ? 'text-green-600' : 
                    supabaseStatus === 'error' ? 'text-red-600' : 'text-yellow-600'
                  }`}>
                    {supabaseStatus === 'connected' ? 'Connected' : 
                     supabaseStatus === 'error' ? 'Disconnected' : 'Connecting...'}
                  </span>
                </div>
              </div>
              <p className="mt-1 text-sm text-slate-600">Manage your recruitment pipeline and track hiring progress.</p>
            </div>
            <div className="mt-4 sm:mt-0">
              <PostJobDialog />
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.label} className="bg-white shadow-sm border border-slate-200">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className={`w-8 h-8 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${stat.iconColor}`} />
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-slate-600">{stat.label}</p>
                      <p className="text-2xl font-semibold text-slate-900">{stat.value}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Real Jobs Data Preview */}
        {jobs && jobs.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Jobs from Database</h3>
            <div className="grid gap-4">
              {jobs.slice(0, 3).map((job) => (
                <Card key={job.id} className="bg-white border border-slate-200 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-slate-900">{job.title}</h4>
                        <p className="text-sm text-slate-600">
                          {job.clients?.name} • {job.clients?.industry}
                        </p>
                      </div>
                      <Badge variant={job.status === 'open' ? 'default' : 'secondary'}>
                        {job.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Show loading state */}
        {jobsLoading && (
          <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-600">Loading jobs from database...</p>
          </div>
        )}

        {/* Show error if jobs failed to load */}
        {jobsError && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">Failed to load jobs: {jobsError.message}</p>
          </div>
        )}

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <Card className="bg-white shadow-sm border border-slate-200">
              <div className="px-6 py-4 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900">Recent Activity</h3>
              </div>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={activity.user.avatar} />
                          <AvatarFallback>{activity.user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-slate-900">
                          <span className="font-medium">{activity.user.name}</span> {activity.description} <span className="font-medium">{activity.project}</span>
                        </p>
                        <p className="text-xs text-slate-500 mt-1">{activity.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions and Team Status */}
          <div className="space-y-6">
            {/* Quick Actions Card */}
            <Card className="bg-white shadow-sm border border-slate-200">
              <div className="px-6 py-4 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900">Quick Actions</h3>
              </div>
              <CardContent className="p-4 space-y-2">
                <AddCandidateDialog>
                  <Button 
                    variant="ghost" 
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 rounded-lg transition-colors"
                  >
                    <span className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                        <UserPlus className="w-5 h-5 text-blue-600" />
                      </div>
                      <span className="text-sm font-medium text-slate-900">Add Candidate</span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </Button>
                </AddCandidateDialog>
                
                <AddClientDialog>
                  <Button 
                    variant="ghost" 
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 rounded-lg transition-colors"
                  >
                    <span className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-green-600" />
                      </div>
                      <span className="text-sm font-medium text-slate-900">Add Client</span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </Button>
                </AddClientDialog>
                
                <ScheduleInterviewDialog>
                  <Button 
                    variant="ghost" 
                    className="w-full flex items-center justify-between px-4 py-3 text-left bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    <span className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                        <Calendar className="w-5 h-5 text-blue-600" />
                      </div>
                      <span className="text-sm font-medium text-blue-900">Schedule Interview</span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-blue-600" />
                  </Button>
                </ScheduleInterviewDialog>
                
                <SendMessageDialog>
                  <Button 
                    variant="ghost" 
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 rounded-lg transition-colors"
                  >
                    <span className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                        <MessageSquare className="w-5 h-5 text-purple-600" />
                      </div>
                      <span className="text-sm font-medium text-slate-900">Send Message</span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </Button>
                </SendMessageDialog>
              </CardContent>
            </Card>

            {/* Team Status */}
            <Card className="bg-white shadow-sm border border-slate-200">
              <div className="px-6 py-4 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900">Team Status</h3>
              </div>
              <CardContent className="p-6 space-y-4">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{member.name}</p>
                        <p className="text-xs text-slate-500">{member.role}</p>
                      </div>
                    </div>
                    <Badge 
                      variant="secondary" 
                      {...getStatusBadgeProps(member.status)}
                    >
                      {member.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
