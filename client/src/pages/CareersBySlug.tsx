import { useState, useEffect } from 'react'
import { useParams, useLocation } from 'wouter'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { MapPin, Clock, DollarSign, Briefcase, Building2, Send, Loader2, ArrowLeft } from 'lucide-react'

interface PublicJob {
  id: string
  title: string
  description: string
  location?: string
  salaryRange?: string
  createdAt: string
  publicSlug: string
  client?: {
    name: string
  }
}

interface ApplicationFormData {
  name: string
  email: string
  phone: string
  resumeUrl?: string
}

export default function CareersBySlug() {
  const { slug } = useParams<{ slug: string }>()
  const [, setLocation] = useLocation()
  const [job, setJob] = useState<PublicJob | null>(null)
  const [loading, setLoading] = useState(true)
  const [isApplying, setIsApplying] = useState(false)
  const [applicationSubmitted, setApplicationSubmitted] = useState(false)
  const [applicationData, setApplicationData] = useState<ApplicationFormData>({
    name: '',
    email: '',
    phone: '',
    resumeUrl: ''
  })
  const { toast } = useToast()

  // Fetch job by slug
  useEffect(() => {
    if (!slug) return
    
    const fetchJob = async () => {
      try {
        const response = await fetch(`/api/public/jobs/slug/${slug}`)
        if (!response.ok) {
          if (response.status === 404) {
            toast({
              title: "Job Not Found",
              description: "This job posting may have been removed or expired.",
              variant: "destructive"
            })
            setLocation('/careers')
            return
          }
          throw new Error('Failed to fetch job')
        }
        const data = await response.json()
        setJob(data)
      } catch (error) {
        console.error('Error fetching job:', error)
        toast({
          title: "Error",
          description: "Failed to load job details",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    fetchJob()
  }, [slug, toast, setLocation])

  const handleInputChange = (field: keyof ApplicationFormData, value: string) => {
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

    setIsApplying(true)
    try {
      const response = await fetch(`/api/public/jobs/${job.id}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(applicationData)
      })

      if (!response.ok) {
        const error = await response.json()
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

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Job Not Found</h1>
          <p className="text-gray-600 mb-4">This job posting may have been removed or expired.</p>
          <Button onClick={() => setLocation('/careers')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Jobs
          </Button>
        </div>
      </div>
    )
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
                {job.client && (
                  <div className="flex items-center gap-1">
                    <Building2 className="w-4 h-4" />
                    {job.client.name}
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
                    <Label htmlFor="resumeUrl">Resume URL</Label>
                    <Input
                      id="resumeUrl"
                      value={applicationData.resumeUrl}
                      onChange={(e) => handleInputChange('resumeUrl', e.target.value)}
                      placeholder="Link to your resume"
                    />
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
                {job.salaryRange && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{job.salaryRange}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">Full-time position</span>
                </div>
                {job.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{job.location}</span>
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