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
import { StatCard } from '../components/StatCard'
import { RecentActivity } from '../components/RecentActivity'
import { PipelineOverview } from '../components/PipelineOverview'
import { JobsChart } from '../components/LazyJobsChart'
import { SmartAlerts } from '../components/SmartAlerts'
import { QuickActions } from '../components/QuickActions'
import { TodaysWork } from '../components/TodaysWork'
import { SimpleQuickActions } from '../components/SimpleQuickActions'
import { SmartHiringTips } from '../components/SmartHiringTips'
import { PipelineSnapshot } from '../components/PipelineSnapshot'
import { RefreshIndicator } from '../components/RefreshIndicator'
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
  const pipelineStages = ['applied', 'phone_screen', 'interview', 'technical', 'final', 'offer', 'hired', 'rejected']
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

  // Calculate Today's Work data
  const candidatesNeedingReview = jobCandidatesArray.filter((jc: any) => 
    jc.stage === 'applied' || jc.stage === 'phone_screen'
  ).length
  
  const interviewsToday = jobCandidatesArray.filter((jc: any) => {
    // Mock calculation - in real app would check interview schedule
    return jc.stage === 'interview'
  }).length
  
  const jobsNeedingAttention = jobsArray.filter((job: any) => {
    // Mock calculation - jobs with no applications in last 7 days
    const now = new Date()
    const createdDate = new Date(job.createdAt)
    const daysSinceCreated = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
    return job.status === 'open' && daysSinceCreated > 7
  }).length



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

        {/* Today's Work */}
        <TodaysWork 
          candidatesNeedingReview={candidatesNeedingReview}
          interviewsToday={interviewsToday}
          jobsNeedingAttention={jobsNeedingAttention}
          loading={jobCandidatesLoading}
        />

        {/* Quick Actions */}
        <SimpleQuickActions />

        {/* Mobile-specific floating action button */}
        <div className="fixed bottom-6 right-6 md:hidden z-50">
          <PostJobDialog triggerButton={
            <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full w-14 h-14 shadow-lg">
              <Plus className="w-6 h-6" />
            </Button>
          } />
        </div>

        {/* Insights & Trends */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Insights & Trends</h2>
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
              trend={{ value: 5, label: "from last month" }}
              loading={jobCandidatesLoading}
            />
            <StatCard
              label="Hired This Month"
              value={hiredThisMonth}
              icon={TrendingUp}
              trend={{ value: 25, label: "from last month" }}
              loading={jobCandidatesLoading}
            />
          </div>
        </div>

        {/* Smart Alerts for Job Health */}
        <SmartAlerts orgId={currentOrgId || ''} />

        {/* Smart Hiring Tips and Pipeline Snapshot */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SmartHiringTips loading={jobCandidatesLoading} />
          <PipelineSnapshot 
            orgId={currentOrgId || ''} 
          />
        </div>

        {/* Recent Activity */}
        <RecentActivity orgId={currentOrgId || ''} />

      </div>
    </DashboardLayout>
  )
}