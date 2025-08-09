import { useState } from 'react'
import { useParams, useLocation } from 'wouter'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { usePublicJobBySlug } from '@/hooks/usePublicJobBySlug'
import { useDemoFlag } from '@/lib/demoFlag'
import { demoAdapter } from '@/lib/dataAdapter'
import { MapPin, Clock, DollarSign, Briefcase, Building2, Send, Loader2, ArrowLeft } from 'lucide-react'
import type { Job } from '@shared/schema'

interface ApplicationFormData {
  name: string
  email: string
  phone: string
  resume?: File | null
}

export default function CareersBySlug() {
  const { slug } = useParams<{ slug: string }>()
  const [, setLocation] = useLocation()
  const [isApplying, setIsApplying] = useState(false)
  const [applicationSubmitted, setApplicationSubmitted] = useState(false)
  const [applicationData, setApplicationData] = useState<ApplicationFormData>({
    name: '',
    email: '',
    phone: '',
    resume: null
  })
  const { toast } = useToast()

  // Use shared hook for consistent data fetching
  const { job, isLoading: loading, error, notFound } = usePublicJobBySlug(slug)

  const handleInputChange = (field: keyof ApplicationFormData, value: string | File | null) => {
    setApplicationData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleApply = async () => {
    if (!job) return

    // Basic validation
    if (!applicationData.name || !applicationData.email) {
      toast({
        title: "Missing Information",
        description: "Please fill in your name and email address.",
        variant: "destructive"
      })
      return
    }

    if (!applicationData.resume) {
      toast({
        title: "Resume Required",
        description: "Please upload your resume.",
        variant: "destructive"
      })
      return
    }

    setIsApplying(true)
    try {
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('name', applicationData.name)
      formData.append('email', applicationData.email)
      formData.append('phone', applicationData.phone)
      formData.append('resume', applicationData.resume)

      const response = await fetch(`/api/jobs/${job.id}/apply`, {
        method: 'POST',
        body: formData  // No Content-Type header for FormData
      })

      if (!response.ok) {
        const error = await response.json()
        // Handle validation errors from new Zod validation
        if (error.details && Array.isArray(error.details)) {
          throw new Error(`${error.error}: ${error.details.join(', ')}`)
        }
        throw new Error(error.error || 'Failed to submit application')
      }

      setApplicationSubmitted(true)
      toast({
        title: "Application Submitted!",
        description: "Thank you for your interest. We'll be in touch soon.",
      })
    } catch (error) {
      console.error('Error submitting application:', error)
      toast({
        title: "Application Failed",
        description: error instanceof Error ? error.message : "Failed to submit application. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsApplying(false)
    }
  }

  // Error state
  if (error && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {notFound ? 'Job Not Found' : 'Unable to Load Job'}
          </h1>
          <p className="text-gray-600 mb-4">
            {notFound 
              ? "This job posting may have been removed or expired."
              : "We're having trouble loading this job. Please try again later."
            }
          </p>
          <Button onClick={() => setLocation('/careers')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Jobs
          </Button>
        </div>
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Button
            variant="ghost"
            onClick={() => setLocation('/careers')}
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

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Apply */}
            {!applicationSubmitted && (
              <Card>
                <CardHeader>
                  <CardTitle>Apply for this Position</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={applicationData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={applicationData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="your.email@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={applicationData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  <div>
                    <Label htmlFor="resume">Resume Upload *</Label>
                    <Input
                      id="resume"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null
                        handleInputChange('resume', file)
                      }}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Accepted formats: PDF, DOC, DOCX (max 10MB)
                    </p>
                  </div>
                  <Button 
                    className="w-full"
                    onClick={handleApply}
                    disabled={isApplying}
                  >
                    {isApplying ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Submit Application
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Application Submitted */}
            {applicationSubmitted && (
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Send className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-green-800 mb-2">
                    Application Submitted!
                  </h3>
                  <p className="text-green-700">
                    Thank you for your interest in this position. 
                    We'll review your application and be in touch soon.
                  </p>
                </CardContent>
              </Card>
            )}

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
  )
}