import React, { useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useAuth } from '@/contexts/AuthContext'
import { useLocation } from 'wouter'
import { useToast } from '@/hooks/use-toast'

import { useJobs } from '@/hooks/useJobs'
import { useClients } from '@/hooks/useClients'
import { useCandidates } from '@/hooks/useCandidates'
import { useJobCandidates } from '@/hooks/useJobCandidates'
import { getDemoClientStats, getDemoJobStats, getDemoPipelineData } from '@/lib/demo-data'
import { DemoDashboard } from '@/components/demo/DemoDashboard'
import { PostJobDialog } from '@/components/dialogs/PostJobDialog'
import { StatCard } from '@/components/dashboard/StatCard'
import { RecentActivity } from '@/components/dashboard/RecentActivity'
import { PipelineOverview } from '@/components/dashboard/PipelineOverview'
import { JobsChart } from '@/components/dashboard/LazyJobsChart'
import { SmartAlerts } from '@/components/dashboard/SmartAlerts'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { AIInsights } from '@/components/ai/AIInsights'
import { RefreshIndicator } from '@/components/dashboard/RefreshIndicator'
import { useRealTimeRefresh } from '@/hooks/useRealTimeRefresh'
import { AuthRequired, hasAuthRequired } from '@/components/AuthRequired'

import { 
  Briefcase, 
  Users, 
  Building2,
  TrendingUp,
  UserCheck,
  Clock,
  DollarSign,
  Plus
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'



export default function Dashboard() {
  const { userRole, currentOrgId } = useAuth()
  const [, setLocation] = useLocation()
  const { toast } = useToast()

  // Handle URL actions (like load-demo)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const action = urlParams.get('action')
    
    if (action === 'load-demo' && userRole === 'demo_viewer') {
      toast({
        title: "Demo Data Loaded!",
        description: "Your dashboard now shows sample data to explore TalentPatriot's features.",
      })
      // Clear the action parameter from URL
      const url = new URL(window.location.href)
      url.searchParams.delete('action')
      window.history.replaceState({}, document.title, url.pathname)
    } else if (action === 'invite-guided' && userRole === 'demo_viewer') {
      toast({
        title: "Team Invitation (Demo)",
        description: "In the full version, you can invite team members to collaborate on hiring.",
      })
      // Clear the action parameter from URL
      const url = new URL(window.location.href)
      url.searchParams.delete('action')
      window.history.replaceState({}, document.title, url.pathname)
    }
  }, [userRole, toast])

  // Demo viewers now use the same dashboard components with demo data

  // Set up real-time refresh for dashboard data - optimized for performance
  const realTimeRefresh = useRealTimeRefresh({
    interval: 60000, // 1 minute for better performance
    enabled: true,
    queries: ['/api/jobs', '/api/clients', '/api/candidates', '/api/job-candidates']
  })

  // Fetch real data using our hooks with real-time refresh - MUST be called before any conditional returns
  const { data: jobs, isLoading: jobsLoading } = useJobs()
  const { data: clients, isLoading: clientsLoading } = useClients()
  const { data: candidates, isLoading: candidatesLoading } = useCandidates()
  const { data: jobCandidates, isLoading: jobCandidatesLoading } = useJobCandidates()

  // Check for auth-required state from any of the data hooks
  if (hasAuthRequired(jobs) || hasAuthRequired(clients) || hasAuthRequired(candidates)) {
    return (
      <DashboardLayout pageTitle="Dashboard">
        <AuthRequired 
          title="Sign in to view dashboard"
          message="Please sign in to access your dashboard data and analytics."
          onSignIn={() => setLocation('/auth/signin')}
        />
      </DashboardLayout>
    )
  }

  // Check if user has an organization after hooks - only for non-demo users
  React.useEffect(() => {
    if (!currentOrgId && userRole !== 'demo_viewer' && !jobsLoading) {
      // User has no organization, redirect to organization setup
      setLocation('/settings/organization')
    }
  }, [currentOrgId, userRole, jobsLoading, setLocation])

  // Type-safe data extraction with proper fallbacks
  const jobsArray = Array.isArray(jobs) ? jobs : []
  const candidatesArray = Array.isArray(candidates) ? candidates : []
  const clientsArray = Array.isArray(clients) ? clients : []
  const jobCandidatesArray = Array.isArray(jobCandidates) ? jobCandidates : []

  // Calculate real stats from data with type safety
  const openJobsCount = jobsArray.filter((job: any) => job.status === 'open').length
  const totalJobsCount = jobsArray.length
  const totalCandidatesCount = candidatesArray.length
  const totalClientsCount = clientsArray.length
  const activeCandidatesCount = jobCandidatesArray.filter((jc: any) => 
    ['screening', 'interview', 'technical', 'reference'].includes(jc.stage)
  ).length
  const hiredThisMonth = jobCandidatesArray.filter((jc: any) => {
    if (jc.stage !== 'hired') return false
    const hiredDate = new Date(jc.updated_at)
    const now = new Date()
    return hiredDate.getMonth() === now.getMonth() && hiredDate.getFullYear() === now.getFullYear()
  }).length

  // Calculate pipeline data with type safety
  const pipelineStages = ['applied', 'screening', 'interview', 'technical', 'reference', 'offer', 'hired', 'rejected']
  const pipelineData = pipelineStages.map(stage => {
    const count = jobCandidatesArray.filter((jc: any) => jc.stage === stage).length
    const total = jobCandidatesArray.length || 1
    return {
      stage: stage.charAt(0).toUpperCase() + stage.slice(1),
      count,
      percentage: Math.round((count / total) * 100)
    }
  })

  // Calculate job status data with type safety
  const jobStatusData = [
    { name: 'Open', value: jobsArray.filter((j: any) => j.status === 'open').length, color: '#22c55e' },
    { name: 'In Progress', value: jobsArray.filter((j: any) => j.status === 'in_progress').length, color: '#3b82f6' },
    { name: 'On Hold', value: jobsArray.filter((j: any) => j.status === 'on_hold').length, color: '#f59e0b' },
    { name: 'Filled', value: jobsArray.filter((j: any) => j.status === 'filled').length, color: '#8b5cf6' },
  ]

  // Generate smart alerts based on real data
  const smartAlerts = React.useMemo(() => {
    const alerts: any[] = []

    if (!currentOrgId) {
      // Special alert for users without organization
      alerts.push({
        id: 'no-org',
        type: 'urgent',
        title: 'Organization Setup Required',
        description: 'Please complete your organization setup to access your data',
        action: {
          label: 'Setup Organization',
          href: '/settings/organization'
        },
        dismissible: false
      })
      return alerts
    }

    // Check for new applications with type safety
    const recentApplications = jobCandidatesArray.filter((jc: any) => {
      const appliedDate = new Date(jc.created_at)
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
      return jc.stage === 'applied' && appliedDate > dayAgo
    })

    if (recentApplications.length > 0) {
      alerts.push({
        id: 'new-applications',
        type: 'warning',
        title: `${recentApplications.length} New Application${recentApplications.length > 1 ? 's' : ''}`,
        description: 'Recent applications require review',
        action: {
          label: 'Review Applications',
          href: '/candidates'
        },
        dismissible: true
      })
    }

    // Check for pipeline bottlenecks with type safety
    const stuckCandidates = jobCandidatesArray.filter((jc: any) => {
      const updatedDate = new Date(jc.updated_at)
      const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      return ['screening', 'interview', 'technical'].includes(jc.stage) && updatedDate < fiveDaysAgo
    })

    if (stuckCandidates.length > 3) {
      alerts.push({
        id: 'pipeline-bottleneck',
        type: 'info',
        title: 'Pipeline Bottleneck',
        description: `${stuckCandidates.length} candidates stuck in pipeline for >5 days`,
        action: {
          label: 'View Pipeline',
          href: '/pipeline'
        },
        dismissible: true
      })
    }

    return alerts
  }, [currentOrgId, jobCandidatesArray])



  return (
    <DashboardLayout pageTitle="Dashboard">
      <div className="p-6 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Welcome back! Here's an overview of your recruitment pipeline.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center gap-3">
            <RefreshIndicator 
              lastRefreshed={realTimeRefresh.lastRefreshed}
              isRefreshing={realTimeRefresh.isRefreshing}
              onRefresh={realTimeRefresh.manualRefresh}
            />
            <PostJobDialog triggerButton={
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Post New Job
              </Button>
            } />
          </div>
        </div>

        {/* Smart Alerts */}
        <SmartAlerts alerts={smartAlerts} />

        {/* Quick Actions */}
        <QuickActions />

        {/* Mobile-specific floating action button */}
        <div className="fixed bottom-6 right-6 md:hidden z-50">
          <PostJobDialog triggerButton={
            <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full w-14 h-14 shadow-lg">
              <Plus className="w-6 h-6" />
            </Button>
          } />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatCard
            label="Open Positions"
            value={openJobsCount}
            icon={Briefcase}
            trend={{ value: 12, label: "from last month" }}
            loading={jobsLoading}
          />
          <StatCard
            label="Total Candidates"
            value={totalCandidatesCount}
            icon={Users}
            trend={{ value: 8, label: "from last month" }}
            loading={candidatesLoading}
          />
          <StatCard
            label="Active Candidates"
            value={activeCandidatesCount}
            icon={UserCheck}
            loading={jobCandidatesLoading}
          />
          <StatCard
            label="Hired This Month"
            value={hiredThisMonth}
            icon={TrendingUp}
            trend={{ value: 25, label: "increase" }}
            loading={jobCandidatesLoading}
          />
        </div>

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          <PipelineOverview data={pipelineData} loading={jobCandidatesLoading} />
          <JobsChart data={jobStatusData} loading={jobsLoading} />
          <AIInsights />
        </div>

        {/* Performance Overview - Only show if there's data */}
        {jobCandidatesArray.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Performance Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Pipeline Conversion</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {Math.round((jobCandidatesArray.filter((jc: any) => jc.stage === 'hired').length / jobCandidatesArray.length) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                    style={{ 
                      width: `${Math.round((jobCandidatesArray.filter((jc: any) => jc.stage === 'hired').length / jobCandidatesArray.length) * 100)}%` 
                    }}
                  ></div>
                </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Avg Time to Hire</span>
                <span className="text-sm font-semibold text-gray-900">21 days</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full transition-all duration-300" style={{ width: '70%' }}></div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Client Satisfaction</span>
                <span className="text-sm font-semibold text-gray-900">92%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full transition-all duration-300" style={{ width: '92%' }}></div>
              </div>
            </div>
          </CardContent>
        </Card>
        )}

        {/* Activity and Actions Grid - Only show if there's data */}
        {jobCandidatesArray.length > 0 || jobsArray.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <RecentActivity loading={false} />
            </div>

          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <button
                  onClick={() => window.location.href = '/jobs'}
                  className="w-full p-4 rounded-lg border border-[#E6F0FF] hover:border-[#264C99] hover:shadow-sm transition-all group bg-white font-[Inter,sans-serif]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#1F3A5F] flex items-center justify-center">
                      <Briefcase className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-[#1A1A1A] group-hover:text-[#264C99]">
                        View All Jobs
                      </div>
                      <div className="text-sm text-[#5C667B]">
                        Browse open positions and requirements
                      </div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => window.location.href = '/pipeline'}
                  className="w-full p-4 rounded-lg border border-[#E6F0FF] hover:border-[#264C99] hover:shadow-sm transition-all group bg-white font-[Inter,sans-serif]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#264C99] flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-[#1A1A1A] group-hover:text-[#264C99]">
                        Pipeline Overview
                      </div>
                      <div className="text-sm text-[#5C667B]">
                        Drag and drop candidates between stages
                      </div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => window.location.href = '/candidates'}
                  className="w-full p-4 rounded-lg border border-[#E6F0FF] hover:border-[#264C99] hover:shadow-sm transition-all group bg-white font-[Inter,sans-serif]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#1F3A5F] flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-[#1A1A1A] group-hover:text-[#264C99]">
                        Browse Candidates
                      </div>
                      <div className="text-sm text-[#5C667B]">
                        Search and view candidate profiles
                      </div>
                    </div>
                  </div>
                </button>
              </CardContent>
            </Card>
          </div>
        </div>
        ) : null}
      </div>
    </DashboardLayout>
  )
}