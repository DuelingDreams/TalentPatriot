import { useEffect, useMemo } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useAuth } from '@/contexts/AuthContext'
import { useLocation, Link } from 'wouter'
import { useToast } from '@/shared/hooks/use-toast'

import { useJobs } from '@/features/jobs/hooks/useJobs'
import { useCandidates } from '@/features/candidates/hooks/useCandidates'
import { useJobCandidates } from '@/features/jobs/hooks/useJobCandidates'
import { RecentActivity } from '../components/RecentActivity'
import { TodaysWork } from '../components/TodaysWork'
import { SimpleQuickActions } from '../components/SimpleQuickActions'
import { PipelineSnapshot } from '../components/PipelineSnapshot'
import { InsightsTrends } from '../components/InsightsTrends'
import { AuthRequired, hasAuthRequired } from '@/components/AuthRequired'

import { Button } from '@/components/ui/button'

export default function Dashboard() {
  const { userRole, currentOrgId } = useAuth()
  const [, setLocation] = useLocation()
  const { toast } = useToast()

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const action = urlParams.get('action')
    
    if (action === 'load-demo' && userRole === 'demo_viewer') {
      toast({
        title: "Demo Data Loaded!",
        description: "Your dashboard now shows sample data to explore TalentPatriot's features.",
      })
      const url = new URL(window.location.href)
      url.searchParams.delete('action')
      window.history.replaceState({}, document.title, url.pathname)
    } else if (action === 'invite-guided' && userRole === 'demo_viewer') {
      toast({
        title: "Team Invitation (Demo)",
        description: "In the full version, you can invite team members to collaborate on hiring.",
      })
      const url = new URL(window.location.href)
      url.searchParams.delete('action')
      window.history.replaceState({}, document.title, url.pathname)
    }
  }, [userRole, toast])

  const { data: jobs, isLoading: jobsLoading } = useJobs()
  const { data: candidates, isLoading: candidatesLoading } = useCandidates()
  const { data: jobCandidates, isLoading: jobCandidatesLoading } = useJobCandidates()

  if (hasAuthRequired(jobs) || hasAuthRequired(candidates)) {
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

  useEffect(() => {
    if (!currentOrgId && userRole !== 'demo_viewer' && !jobsLoading) {
      setLocation('/settings/organization')
    }
  }, [currentOrgId, userRole, jobsLoading, setLocation])

  const jobsArray = useMemo(() => Array.isArray(jobs) ? jobs : [], [jobs])
  const candidatesArray = useMemo(() => Array.isArray(candidates) ? candidates : [], [candidates])
  const jobCandidatesArray = useMemo(() => Array.isArray(jobCandidates) ? jobCandidates : [], [jobCandidates])

  const dashboardStats = useMemo(() => {
    const openJobsCount = jobsArray.filter((job: any) => job.status === 'open').length
    const totalCandidatesCount = candidatesArray.length
    const activeCandidatesCount = jobCandidatesArray.filter((jc: any) => 
      ['screening', 'interview', 'technical', 'reference'].includes(jc.stage)
    ).length
    
    const hiredThisMonth = jobCandidatesArray.filter((jc: any) => {
      if (jc.stage !== 'hired') return false
      const hiredDate = new Date(jc.updated_at)
      const now = new Date()
      return hiredDate.getMonth() === now.getMonth() && hiredDate.getFullYear() === now.getFullYear()
    }).length

    return {
      openJobsCount,
      totalCandidatesCount,
      activeCandidatesCount,
      hiredThisMonth
    }
  }, [jobsArray, candidatesArray, jobCandidatesArray])

  const todaysWorkData = useMemo(() => {
    const candidatesNeedingReview = jobCandidatesArray.filter((jc: any) => 
      jc.stage === 'applied' || jc.stage === 'phone_screen'
    ).length
    
    const interviewsToday = jobCandidatesArray.filter((jc: any) => {
      return jc.stage === 'interview'
    }).length

    return { candidatesNeedingReview, interviewsToday }
  }, [jobCandidatesArray])

  const isLoading = jobsLoading || candidatesLoading || jobCandidatesLoading

  return (
    <DashboardLayout pageTitle="Dashboard">
      <div className="p-6 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900" data-testid="dashboard-title">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">
              Welcome back! Here's an overview of your recruitment pipeline.
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Link href="/pipeline">
              <Button 
                variant="outline" 
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
                data-testid="see-all-pipelines-btn"
              >
                See All Pipelines
              </Button>
            </Link>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left Column */}
          <div className="space-y-6">
            <TodaysWork 
              candidatesNeedingReview={todaysWorkData.candidatesNeedingReview}
              interviewsToday={todaysWorkData.interviewsToday}
              loading={isLoading}
            />

            <SimpleQuickActions />

            <RecentActivity orgId={currentOrgId || ''} />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <PipelineSnapshot orgId={currentOrgId || ''} />

            <InsightsTrends
              openPositions={dashboardStats.openJobsCount}
              totalCandidates={dashboardStats.totalCandidatesCount}
              activeCandidates={dashboardStats.activeCandidatesCount}
              hiredThisMonth={dashboardStats.hiredThisMonth}
              loading={isLoading}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
