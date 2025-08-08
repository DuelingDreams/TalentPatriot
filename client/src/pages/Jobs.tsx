import { PostJobDialog } from '@/components/dialogs/PostJobDialog'
import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { useJobs } from '@/hooks/useJobs'
import { useClients } from '@/hooks/useClients'
import { useAuth } from '@/contexts/AuthContext'
import { useCreateJob, usePublishJob } from '@/hooks/useJobMutation'
import { getDemoJobStats, getDemoClientStats } from '@/lib/demo-data'
import { Plus, Briefcase, Building2, Calendar, Loader2, Users, Globe, ExternalLink } from 'lucide-react'
import { Link, useLocation } from 'wouter'
import GuidedJobCreation from '@/components/jobs/GuidedJobCreation'

export default function Jobs() {
  const [isGuidedModalOpen, setIsGuidedModalOpen] = useState(false)
  const { toast } = useToast()
  const { userRole, currentOrgId } = useAuth()
  const [, setLocation] = useLocation()
  const publishJobMutation = usePublishJob()
  
  // Show demo jobs for demo viewers - check this FIRST
  if (userRole === 'demo_viewer') {
    return (
      <DashboardLayout pageTitle="Jobs">
        <div className="p-6">
          {/* Demo jobs content */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Jobs</h1>
            <p className="mt-2 text-sm text-muted-foreground">
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

  // Fetch data using our hooks
  const { data: jobs, isLoading: jobsLoading, error: jobsError } = useJobs()

  // Use demo data for demo users
  const displayJobs = userRole === 'demo_viewer' ? getDemoJobStats() : jobs || []
  const isDemoMode = userRole === 'demo_viewer'

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

  const handlePublishJob = async (jobId: string) => {
    try {
      const publishedJob = await publishJobMutation.mutateAsync(jobId)

      toast({
        title: "Job Published!",
        description: `Your job is now live at /careers/${publishedJob.publicSlug}`,
      })
      // Jobs list will refresh automatically via React Query
    } catch (error) {
      console.error('Error publishing job:', error)
      toast({
        title: "Error",
        description: "Failed to publish job. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Check if user has organization
  if (!currentOrgId && userRole !== 'demo_viewer') {
    return (
      <DashboardLayout pageTitle="Jobs">
        <div className="p-6">
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-blue-600" />
              </div>
              <CardTitle className="text-2xl">Organization Setup Required</CardTitle>
              <p className="text-[#5C667B] mt-2">
                You need to set up your organization before you can post jobs.
              </p>
            </CardHeader>
            <CardContent className="text-center">
              <Button 
                onClick={() => setLocation('/settings/organization')}
                className="btn-primary"
              >
                Set Up Organization
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout pageTitle="Jobs">
      <div className="p-6">
        {/* Page Header */}
        <div className="mb-8">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Jobs</h2>
              <p className="mt-1 text-sm text-slate-600">Manage your job postings and recruitment positions.</p>
            </div>
            <div className="mt-4 sm:mt-0">
              <PostJobDialog 
                triggerButton={
                  <Button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    New Job
                  </Button>
                }
                onJobCreated={() => {
                  // Jobs list will refresh automatically via React Query
                }}
              />
            </div>
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
              <div className="text-center py-12">
                <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs yet</h3>
                <p className="text-gray-500 mb-6">Get started by posting your first job opening.</p>
                <PostJobDialog 
                  triggerButton={
                    <Button className="btn-primary">
                      <Plus className="w-4 h-4 mr-2" />
                      Post Your First Job
                    </Button>
                  }
                  onJobCreated={() => {
                    // Jobs list will refresh automatically via React Query
                  }}
                />
              </div>
            ) : (
              <div className="grid gap-6">
                {displayJobs.map((job: any) => (
                  <Card key={job.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                            <Badge className={getStatusColor(job.status)}>
                              {job.status}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                            <div className="flex items-center gap-1">
                              <Building2 className="w-4 h-4" />
                              {job.client?.name || 'No client assigned'}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              Created {new Date(job.createdAt).toLocaleDateString()}
                            </div>
                            {job.publicSlug && (
                              <div className="flex items-center gap-1">
                                <Globe className="w-4 h-4" />
                                <a 
                                  href={`/careers/${job.publicSlug}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                >
                                  Public URL
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            )}
                          </div>
                          
                          {job.description && (
                            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                              {job.description}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 ml-6">
                          {job.status === 'draft' && !isDemoMode && (
                            <Button
                              onClick={() => handlePublishJob(job.id)}
                              disabled={publishJobMutation.isPending}
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-1"
                            >
                              {publishJobMutation.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Globe className="w-4 h-4" />
                              )}
                              {publishJobMutation.isPending ? 'Publishing...' : 'Publish'}
                            </Button>
                          )}
                          <Link href={`/pipeline/${job.id}`}>
                            <Button variant="outline" size="sm">
                              View Pipeline
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
        {/* Guided Job Creation Modal */}
        <GuidedJobCreation
          isOpen={isGuidedModalOpen}
          onClose={() => setIsGuidedModalOpen(false)}
          onComplete={(jobData) => {
            // Handle guided job creation completion
            toast({
              title: "Congratulations!",
              description: "Your first job has been posted successfully. Welcome to TalentPatriot!",
            })
            // Clear URL parameters
            window.history.replaceState({}, '', '/jobs')
          }}
        />
      </div>
    </DashboardLayout>
  )
}