import { PostJobDialog } from '@/components/dialogs/PostJobDialog'
import { EditJobDialog } from '@/components/dialogs/EditJobDialog'
import { VirtualizedJobsList } from '@/components/performance/VirtualizedJobsList'
import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/shared/hooks/use-toast'
import { useClients } from '@/features/organization/hooks/useClients'
import { useAuth } from '@/contexts/AuthContext'
import { useJobsQuery, useCreateJob, usePublishJob } from '@/features/jobs/hooks/useJobMutation'
import { getDemoJobStats, getDemoClientStats } from '@/lib/demo-data'
import { Plus, Briefcase, Building2, Calendar, Loader2, Users, Globe, ExternalLink, FileX, ArrowUpDown, Filter, Eye, UserPlus, AlertTriangle, Clock, CheckCircle } from 'lucide-react'
import { Link, useLocation } from 'wouter'

import { EmptyState } from '@/components/ui/empty-state'

type SortOption = 'date' | 'candidates' | 'status' | 'health'
type FilterOption = 'all' | 'open' | 'closed' | 'on_hold' | 'draft'
type JobHealth = 'healthy' | 'needs_attention' | 'stale'

// Job health calculation logic
function calculateJobHealth(job: any, candidateCount: number): JobHealth {
  const now = new Date()
  const createdDate = new Date(job.created_at)
  const daysSinceCreated = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
  const publishedDate = job.published_at ? new Date(job.published_at) : null
  const daysSincePublished = publishedDate ? Math.floor((now.getTime() - publishedDate.getTime()) / (1000 * 60 * 60 * 24)) : null
  
  // For draft jobs
  if (job.status === 'draft') {
    return daysSinceCreated > 7 ? 'stale' : 'healthy'
  }
  
  // For published jobs
  if (job.status === 'open') {
    // Healthy: Recent job with good candidate flow
    if (daysSincePublished && daysSincePublished <= 14 && candidateCount >= 3) return 'healthy'
    if (daysSincePublished && daysSincePublished <= 7) return 'healthy'
    
    // Needs attention: Low candidate count or moderate age
    if (candidateCount === 0 && daysSincePublished && daysSincePublished > 3) return 'needs_attention'
    if (candidateCount < 3 && daysSincePublished && daysSincePublished > 14) return 'needs_attention'
    
    // Stale: Old job with poor performance
    if (daysSincePublished && daysSincePublished > 30) return 'stale'
    if (candidateCount === 0 && daysSincePublished && daysSincePublished > 7) return 'stale'
    
    return candidateCount >= 2 ? 'healthy' : 'needs_attention'
  }
  
  // Closed, on hold, or filled jobs
  return 'healthy'
}

function getHealthColor(health: JobHealth): string {
  switch (health) {
    case 'healthy': return 'bg-green-100 text-green-800'
    case 'needs_attention': return 'bg-yellow-100 text-yellow-800'
    case 'stale': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

function getHealthIcon(health: JobHealth) {
  switch (health) {
    case 'healthy': return CheckCircle
    case 'needs_attention': return AlertTriangle
    case 'stale': return Clock
    default: return CheckCircle
  }
}

export default function Jobs() {
  const [isGuidedModalOpen, setIsGuidedModalOpen] = useState(false)
  const [sortBy, setSortBy] = useState<SortOption>('date')
  const [filterBy, setFilterBy] = useState<FilterOption>('all')
  const { toast } = useToast()
  const { userRole, currentOrgId } = useAuth()
  const [, setLocation] = useLocation()

  // Guard: Wait for organization to load before proceeding
  if (!currentOrgId) {
    return (
      <DashboardLayout pageTitle="Jobs">
        <div className="p-4 text-sm text-muted-foreground">Loading organization...</div>
      </DashboardLayout>
    )
  }

  // Handle onboarding actions for demo users
  useEffect(() => {
    if (userRole === 'demo_viewer') {
      const urlParams = new URLSearchParams(window.location.search)
      const action = urlParams.get('action')
      const isOnboarding = urlParams.get('onboarding') === 'true'
      
      if (action === 'create-guided' && isOnboarding) {
        toast({
          title: "Job Creation (Demo)",
          description: "Explore job creation features - all demo jobs are already set up for you!",
        })
        // Clear parameters
        const url = new URL(window.location.href)
        url.searchParams.delete('action')
        url.searchParams.delete('onboarding')
        window.history.replaceState({}, document.title, url.pathname)
      } else if (action === 'templates' && isOnboarding) {
        toast({
          title: "Job Templates (Demo)",
          description: "Check out the pre-filled demo jobs to see different template styles!",
        })
        // Clear parameters
        const url = new URL(window.location.href)
        url.searchParams.delete('action')
        url.searchParams.delete('onboarding')
        window.history.replaceState({}, document.title, url.pathname)
      }
    }
  }, [userRole, toast])
  
  // Show demo jobs for demo viewers - check this FIRST
  if (userRole === 'demo_viewer') {
    return (
      <DashboardLayout pageTitle="Jobs">
        <div className="p-6 space-y-6">
          {/* Demo jobs content */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Jobs</h1>
            <p className="text-base text-gray-700 mt-2">
              Explore demo job postings and recruitment positions.
            </p>
          </div>
          {/* Demo stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#5C667B]">Total Jobs</p>
                    <p className="text-2xl font-bold text-[#1A1A1A]">12</p>
                  </div>
                  <Briefcase className="h-8 w-8 text-[#264C99]" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#5C667B]">Open Positions</p>
                    <p className="text-2xl font-bold text-[#1A1A1A]">8</p>
                  </div>
                  <Users className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#5C667B]">Active Clients</p>
                    <p className="text-2xl font-bold text-[#1A1A1A]">5</p>
                  </div>
                  <Building2 className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>
          {/* Demo jobs list */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Demo Job Postings</CardTitle>
                <Badge variant="secondary">Demo Mode</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getDemoJobStats().map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">{job.title}</h3>
                      <p className="text-sm text-[#5C667B]">{job.client?.name || 'No client'} • {job.status}</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">{job.status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  // Guard: Show loading if no currentOrgId
  if (!currentOrgId && userRole !== 'demo_viewer') {
    return (
      <DashboardLayout pageTitle="Jobs">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-2 text-slate-600">
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading organization...
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // Fetch data using our hooks
  const { data: jobs, isLoading: jobsLoading, error: jobsError } = useJobsQuery()
  const createJob = useCreateJob()
  const publishJob = usePublishJob()

  // Use demo data for demo users
  const rawJobs = userRole === 'demo_viewer' ? getDemoJobStats() : jobs || []
  const isDemoMode = userRole === 'demo_viewer'
  
  // Jobs already include candidate counts from the API
  const jobsWithStats = rawJobs.map((job: any) => ({
    ...job,
    candidateCount: job.candidateCount || 0, // Use real data from API
    health: calculateJobHealth(job, job.candidateCount || 0)
  }))
  
  // Apply filtering
  const filteredJobs = jobsWithStats.filter((job: any) => {
    if (filterBy === 'all') return true
    return job.status === filterBy
  })
  
  // Apply sorting
  const sortedJobs = [...filteredJobs].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      case 'candidates':
        return b.candidateCount - a.candidateCount
      case 'status':
        return a.status.localeCompare(b.status)
      case 'health':
        const healthOrder: Record<JobHealth, number> = { healthy: 0, needs_attention: 1, stale: 2 }
        return healthOrder[a.health as JobHealth] - healthOrder[b.health as JobHealth]
      default:
        return 0
    }
  })
  
  const displayJobs = sortedJobs

  // Check for onboarding parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const isOnboarding = urlParams.get('onboarding') === 'true'
    const action = urlParams.get('action')

    if (isOnboarding && action === 'create-guided') {
      setIsGuidedModalOpen(true)
    }
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-600'
      case 'open': return 'bg-green-100 text-green-800'
      case 'closed': return 'bg-gray-100 text-gray-800'
      case 'on_hold': return 'bg-yellow-100 text-yellow-800'
      case 'filled': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleCreate = (values: any) => {
    createJob.mutate(values)
  }

  const handlePublish = (jobId: string) => {
    publishJob.mutate(jobId)
  }

  return (
    <DashboardLayout pageTitle="Jobs">
      <div className="p-6">
        {/* Page Header */}
        <div>
          <div className="sm:flex sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Jobs</h2>
              <p className="mt-2 text-base text-gray-700">Manage your job postings and recruitment positions.</p>
            </div>
            <div className="mt-4 sm:mt-0">
              <PostJobDialog 
                triggerButton={
                  <Button className="bg-primary text-white py-2 px-4 rounded-2xl shadow-sm hover:shadow-lg">
                    <Plus className="w-4 h-4 mr-2" />
                    Post New Job
                  </Button>
                }
                onJobCreated={() => {
                  // Jobs list will refresh automatically via React Query
                }}
              />
            </div>
          </div>
        </div>
        
        {/* Filters and Sorting */}
        <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filter:</span>
            <Select value={filterBy} onValueChange={(value: FilterOption) => setFilterBy(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Jobs</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Sort by:</span>
            <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date Posted</SelectItem>
                <SelectItem value="candidates">Candidate Count</SelectItem>
                <SelectItem value="status">Status</SelectItem>
                <SelectItem value="health">Health</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-gray-500">{displayJobs.length} job{displayJobs.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Loading State */}
        {jobsLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2 text-slate-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              Loading jobs...
            </div>
          </div>
        )}

        {/* Error State */}
        {jobsError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">Failed to load jobs: {jobsError.message}</p>
          </div>
        )}

        {/* Jobs Grid */}
        {!jobsLoading && !jobsError && (
          <div className="space-y-6">
            {displayJobs.length === 0 ? (
              <EmptyState
                icon={Briefcase}
                title="No jobs yet"
                description="Get started by posting your first job opening to begin recruiting candidates."
                action={{
                  label: "Post New Job",
                  onClick: () => setIsGuidedModalOpen(true)
                }}
              />
            ) : (
              // Use virtualization for larger datasets (>10 jobs) to improve performance
              displayJobs.length > 10 ? (
                <VirtualizedJobsList
                  jobs={displayJobs}
                  onPublish={handlePublish}
                  isPublishing={publishJob.isPending}
                  isDemoMode={isDemoMode}
                  containerHeight={Math.min(800, typeof window !== 'undefined' ? window.innerHeight - 300 : 600)}
                  // showCompactCards={true} // TODO: Add this prop to VirtualizedJobsList
                />
              ) : (
                // Use regular rendering for smaller datasets - redesigned compact cards
                <div className="grid gap-4" data-testid="jobs-list-regular">
                  {displayJobs.map((job: any) => {
                    const HealthIcon = getHealthIcon(job.health)
                    return (
                      <Card key={job.id} className="border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200" data-testid={`job-card-${job.id}`}>
                        <CardContent className="p-5">
                          <div className="flex items-center justify-between">
                            {/* Left side - Job info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start gap-3 mb-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-lg font-semibold text-gray-900 truncate" data-testid={`job-title-${job.id}`}>
                                      {job.title}
                                    </h3>
                                    <Badge className={getStatusColor(job.status)} data-testid={`job-status-${job.id}`}>
                                      {job.status}
                                    </Badge>
                                    <Badge className={getHealthColor(job.health)} data-testid={`job-health-${job.id}`}>
                                      <HealthIcon className="w-3 h-3 mr-1" />
                                      {job.health.replace('_', ' ')}
                                    </Badge>
                                  </div>
                                  
                                  <div className="flex items-center gap-4 text-sm text-gray-500">
                                    <div className="flex items-center gap-1">
                                      <Users className="w-4 h-4" />
                                      <span data-testid={`job-candidates-${job.id}`}>
                                        {job.candidateCount} candidate{job.candidateCount !== 1 ? 's' : ''}
                                      </span>
                                    </div>
                                    
                                    <div className="flex items-center gap-1">
                                      <Calendar className="w-4 h-4" />
                                      <span data-testid={`job-created-${job.id}`}>
                                        {job.published_at 
                                          ? `Posted ${new Date(job.published_at).toLocaleDateString()}`
                                          : `Created ${new Date(job.created_at).toLocaleDateString()}`
                                        }
                                      </span>
                                    </div>
                                    
                                    {job.client?.name && (
                                      <div className="flex items-center gap-1">
                                        <Building2 className="w-4 h-4" />
                                        <span data-testid={`job-client-${job.id}`} className="truncate max-w-32">
                                          {job.client.name}
                                        </span>
                                      </div>
                                    )}
                                    
                                    {job.publicSlug && (
                                      <div className="flex items-center gap-1">
                                        <Globe className="w-4 h-4" />
                                        <a 
                                          href={`/careers/${job.publicSlug}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                          data-testid={`job-public-url-${job.id}`}
                                        >
                                          Live
                                          <ExternalLink className="w-3 h-3" />
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Right side - Actions */}
                            <div className="flex items-center gap-2 ml-4">
                              {job.status === 'draft' && !isDemoMode && (
                                <>
                                  <EditJobDialog 
                                    job={job}
                                    onJobUpdated={() => {
                                      // Refresh jobs data after update
                                    }}
                                  />
                                  <Button
                                    onClick={() => handlePublish(job.id)}
                                    disabled={publishJob.isPending}
                                    variant="outline"
                                    size="sm"
                                    className="flex items-center gap-1"
                                    data-testid={`job-publish-${job.id}`}
                                  >
                                    {publishJob.isPending ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Globe className="w-4 h-4" />
                                    )}
                                    {publishJob.isPending ? 'Publishing...' : 'Publish'}
                                  </Button>
                                </>
                              )}
                              
                              {/* Quick Actions */}
                              <Link href={`/pipeline/${job.id}`}>
                                <Button variant="outline" size="sm" className="flex items-center gap-1" data-testid={`job-pipeline-${job.id}`}>
                                  <Eye className="w-4 h-4" />
                                  Pipeline
                                </Button>
                              </Link>
                              
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex items-center gap-1"
                                onClick={() => {
                                  // TODO: Implement add candidate modal/flow
                                  toast({ title: "Add Candidate", description: "Feature coming soon!" })
                                }}
                                data-testid={`job-add-candidate-${job.id}`}
                              >
                                <UserPlus className="w-4 h-4" />
                                Add
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )
            )}
          </div>
        )}
        {/* Job Creation Modal */}
        {isGuidedModalOpen && (
          <PostJobDialog
            trigger={<></>}
            onJobCreated={() => setIsGuidedModalOpen(false)}
          />
        )}
      </div>
    </DashboardLayout>
  )
}