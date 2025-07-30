import { PostJobDialog } from '@/components/dialogs/PostJobDialog'
import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { useJobs } from '@/hooks/useJobs'
import { useClients } from '@/hooks/useClients'
import { useAuth } from '@/contexts/AuthContext'
import { getDemoJobStats, getDemoClientStats } from '@/lib/demo-data'
import { Plus, Briefcase, Building2, Calendar, Loader2, Users } from 'lucide-react'
import { Link, useLocation } from 'wouter'
import GuidedJobCreation from '@/components/GuidedJobCreation'

export default function Jobs() {
  const [isGuidedModalOpen, setIsGuidedModalOpen] = useState(false)
  const { toast } = useToast()
  const { userRole, currentOrgId } = useAuth()
  const [, setLocation] = useLocation()

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
      const response = await fetch(`/api/jobs/${jobId}/publish`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) throw new Error('Failed to publish job')

      toast({
        title: "Job Published!",
        description: "Your job is now live and accepting applications.",
      })

      // Reload to refresh job status
      window.location.reload()
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
                  // Refresh jobs list after creation
                  window.location.reload()
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
        {displayJobs && displayJobs.length > 0 ? (
          <div className="grid gap-6">
            {displayJobs.map((job: any) => (
              <Card key={job.id} className="bg-white shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Briefcase className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">{job.title}</h3>
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Building2 className="w-4 h-4" />
                            <span>{job.client?.name}</span>
                            {job.client?.industry && (
                              <>
                                <span>•</span>
                                <span>{job.client.industry}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {job.description && (
                        <p className="text-slate-600 mb-4 line-clamp-2">{job.description}</p>
                      )}

                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>Created {new Date(job.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <Link href={`/jobs/${job.id}`}>
                        <Button size="sm" variant="outline" className="text-xs">
                          <Users className="w-3 h-3 mr-1" />
                          View Pipeline
                        </Button>
                      </Link>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(job.status)}>
                          {job.status.replace('_', ' ')}
                        </Badge>
                        {job.status === 'draft' && !isDemoMode && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePublishJob(job.id)}
                            className="text-xs"
                          >
                            Publish
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          !jobsLoading && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto bg-slate-100 rounded-lg flex items-center justify-center mb-4">
                <Briefcase className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">No jobs yet</h3>
              <p className="text-slate-600 mb-6">Get started by creating your first job posting.</p>
              <PostJobDialog 
                triggerButton={
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Job
                  </Button>
                }
                onJobCreated={() => {
                  // Refresh jobs list after creation
                  window.location.reload()
                }}
              />
            </div>
          )
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