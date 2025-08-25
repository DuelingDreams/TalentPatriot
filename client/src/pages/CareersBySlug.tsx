import { useParams, useLocation } from 'wouter'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { usePublicJobBySlug } from '@/hooks/usePublicJobBySlug'
import { PageErrorBoundary } from '@/components/ui/page-error-boundary'
import { MapPin, Clock, Briefcase, Building2, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react'
import type { Job } from '@shared/schema'

export default function CareersBySlug() {
  const { slug, orgSlug } = useParams<{ slug: string; orgSlug?: string }>()
  const [, setLocation] = useLocation()

  // Use shared hook for consistent data fetching
  const { job, isLoading: loading, error, notFound } = usePublicJobBySlug(slug, { orgSlug })

  // Error state
  if (error && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="mt-4 text-center">
              <h3 className="text-lg font-medium text-gray-900">
                {notFound ? 'Job Not Found' : 'Unable to Load Job'}
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                {notFound 
                  ? "This job posting may have been removed or expired."
                  : (String(error) || "We're having trouble loading this job. Please try again later.")
                }
              </p>
              <div className="mt-4 space-y-2">
                <Button onClick={() => window.location.reload()} size="sm">
                  Try Again
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    const careersPath = orgSlug ? `/org/${orgSlug}/careers` : '/careers';
                    setLocation(careersPath);
                  }}
                  size="sm"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Jobs
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading job details...
        </div>
      </div>
    )
  }

  // Should not render if job is null but not loading
  if (!job) {
    return null;
  }

  return (
    <PageErrorBoundary 
      fallbackTitle="Unable to Load Job Details"
      fallbackDescription="There was an error loading the job details page. Please try again."
    >
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Button
            variant="ghost"
            onClick={() => {
              const careersPath = orgSlug ? `/org/${orgSlug}/careers` : '/careers';
              setLocation(careersPath);
            }}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Jobs
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                {job.department && (
                  <div className="flex items-center gap-1">
                    <Building2 className="w-4 h-4" />
                    {job.department}
                  </div>
                )}
                {job.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {job.location}
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Posted {new Date(job.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Job Description */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Job Description</CardTitle>
              </CardHeader>
              <CardContent className="prose max-w-none">
                {job.description ? (
                  <div className="whitespace-pre-wrap text-gray-700">
                    {job.description}
                  </div>
                ) : (
                  <p className="text-gray-500">No description available.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Apply Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Apply for this Position</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Ready to take the next step in your career? Click below to complete our application form.
                </p>
                <Button 
                  onClick={() => {
                    const applyPath = orgSlug 
                      ? `/org/${orgSlug}/careers/${slug}/apply`
                      : `/careers/${slug}/apply`;
                    setLocation(applyPath);
                  }}
                  className="w-full"
                  size="lg"
                >
                  Apply for this Position
                </Button>
              </CardContent>
            </Card>

            {/* Job Details */}
            <Card>
              <CardHeader>
                <CardTitle>Job Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm capitalize">{job.jobType?.replace('-', ' ') || 'Full-time'}</span>
                </div>
                {job.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{job.location}</span>
                  </div>
                )}
                {job.department && (
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{job.department}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
    </PageErrorBoundary>
  )
}