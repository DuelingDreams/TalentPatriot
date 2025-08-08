import { useState, useEffect } from 'react'
import { useParams, useLocation } from 'wouter'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Send, Loader2, MapPin, Clock, DollarSign, Building2, Briefcase } from 'lucide-react'

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
  resume: File | null
}

export default function JobApplicationForm() {
  const { slug } = useParams<{ slug: string }>()
  const [, setLocation] = useLocation()
  const [job, setJob] = useState<PublicJob | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState<ApplicationFormData>({
    name: '',
    email: '',
    phone: '',
    resume: null
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

  const handleInputChange = (field: keyof ApplicationFormData, value: string | File) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!job) return

    // Validation
    if (!formData.name || !formData.email) {
      toast({
        title: "Missing Information",
        description: "Please fill in your name and email address.",
        variant: "destructive"
      })
      return
    }

    if (!formData.resume) {
      toast({
        title: "Resume Required", 
        description: "Please upload your resume.",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    try {
      // Create FormData for file upload
      const submitData = new FormData()
      submitData.append('name', formData.name)
      submitData.append('email', formData.email)
      submitData.append('phone', formData.phone)
      submitData.append('resume', formData.resume)

      const response = await fetch(`/api/jobs/${job.id}/apply`, {
        method: 'POST',
        body: submitData
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to submit application')
      }

      setSubmitted(true)
      toast({
        title: "Application Submitted!",
        description: "Thank you for applying. We'll be in touch soon.",
      })
    } catch (error) {
      console.error('Error submitting application:', error)
      toast({
        title: "Application Failed",
        description: error instanceof Error ? error.message : "Failed to submit application. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
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
            Back to Careers
          </Button>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Send className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Application Submitted!
            </h2>
            <p className="text-gray-600 mb-6">
              Thank you for your interest. We'll review your application and be in touch soon.
            </p>
            <Button 
              onClick={() => setLocation('/careers')}
              variant="outline"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Careers
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Button 
                variant="ghost" 
                onClick={() => setLocation('/careers')}
                className="mb-2"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Careers
              </Button>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{job.title}</h1>
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
              <p className="text-gray-600">Submit your application below</p>
            </div>
          </div>
        </div>
      </header>

      {/* Application Form */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Apply for this Position</CardTitle>
            {job.salaryRange && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <DollarSign className="w-4 h-4" />
                <span>{job.salaryRange}</span>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  name="name"
                  required
                  placeholder="Your full name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="your.email@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  placeholder="(555) 123-4567"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="resume">Resume Upload *</Label>
                <Input
                  id="resume"
                  name="resume"
                  type="file"
                  required
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
                type="submit" 
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting Application...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Application
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}