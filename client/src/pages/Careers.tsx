import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { MapPin, Clock, DollarSign, Briefcase, Building2, Search, Send, Loader2 } from 'lucide-react'
import { apiRequest } from '@/lib/queryClient'

interface PublicJob {
  id: string
  title: string
  description: string
  location: string
  remote_option: 'onsite' | 'remote' | 'hybrid'
  salary_range?: string
  experience_level: 'entry' | 'mid' | 'senior' | 'executive'
  job_type: 'full-time' | 'part-time' | 'contract' | 'internship'
  created_at: string
  client?: {
    name: string
  }
}

interface ApplicationFormData {
  name: string
  email: string
  phone: string
  resume_url?: string
  cover_letter: string
}

export default function Careers() {
  const [jobs, setJobs] = useState<PublicJob[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedJob, setSelectedJob] = useState<PublicJob | null>(null)
  const [isApplying, setIsApplying] = useState(false)
  const [applicationData, setApplicationData] = useState<ApplicationFormData>({
    name: '',
    email: '',
    phone: '',
    cover_letter: ''
  })
  const { toast } = useToast()

  // Fetch public jobs (status = 'open')
  useEffect(() => {
    fetchPublicJobs()
  }, [])

  const fetchPublicJobs = async () => {
    try {
      const response = await fetch('/api/public/jobs')
      if (!response.ok) throw new Error('Failed to fetch jobs')
      const data = await response.json()
      setJobs(data)
    } catch (error) {
      console.error('Error fetching jobs:', error)
      toast({
        title: "Error",
        description: "Failed to load job listings",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleApply = async () => {
    if (!selectedJob) return

    setIsApplying(true)
    try {
      const response = await apiRequest('/api/public/apply', {
        method: 'POST',
        body: JSON.stringify({
          job_id: selectedJob.id,
          ...applicationData
        })
      })

      if (!response.ok) throw new Error('Failed to submit application')

      toast({
        title: "Application Submitted!",
        description: "Thank you for applying. We'll be in touch soon.",
      })

      // Reset form
      setSelectedJob(null)
      setApplicationData({
        name: '',
        email: '',
        phone: '',
        cover_letter: ''
      })
    } catch (error) {
      console.error('Error submitting application:', error)
      toast({
        title: "Error",
        description: "Failed to submit application. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsApplying(false)
    }
  }

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.location.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getExperienceLabel = (level: string) => {
    switch (level) {
      case 'entry': return 'Entry Level'
      case 'mid': return 'Mid Level'
      case 'senior': return 'Senior Level'
      case 'executive': return 'Executive'
      default: return level
    }
  }

  const getJobTypeLabel = (type: string) => {
    return type.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Careers at TalentPatriot</h1>
              <p className="mt-2 text-gray-600">Find your next opportunity</p>
            </div>
            <img 
              src="/api/placeholder/150/50"
              alt="TalentPatriot" 
              className="h-12"
            />
          </div>
        </div>
      </header>

      {/* Search Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search jobs by title, description, or location..."
            className="pl-10 pr-4 py-3 text-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Job Listings */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : filteredJobs.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredJobs.map((job) => (
              <Card key={job.id} className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedJob(job)}>
                <CardHeader>
                  <CardTitle className="text-xl">{job.title}</CardTitle>
                  {job.client && (
                    <div className="flex items-center gap-2 text-gray-600 mt-1">
                      <Building2 className="w-4 h-4" />
                      <span>{job.client.name}</span>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 mb-4 line-clamp-3">{job.description}</p>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{job.location} • {job.remote_option}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      <span>{getJobTypeLabel(job.job_type)} • {getExperienceLabel(job.experience_level)}</span>
                    </div>
                    {job.salary_range && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        <span>{job.salary_range}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>Posted {new Date(job.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <Button className="w-full mt-4">
                    Apply Now
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No open positions</h3>
            <p className="text-gray-600">Check back later for new opportunities</p>
          </div>
        )}
      </div>

      {/* Application Dialog */}
      <Dialog open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Apply for {selectedJob?.title}</DialogTitle>
          </DialogHeader>
          
          {selectedJob && (
            <div className="space-y-6">
              {/* Job Details */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Job Details</h4>
                <p className="text-gray-700 mb-4">{selectedJob.description}</p>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><strong>Location:</strong> {selectedJob.location} • {selectedJob.remote_option}</p>
                  <p><strong>Type:</strong> {getJobTypeLabel(selectedJob.job_type)}</p>
                  <p><strong>Experience:</strong> {getExperienceLabel(selectedJob.experience_level)}</p>
                  {selectedJob.salary_range && (
                    <p><strong>Salary:</strong> {selectedJob.salary_range}</p>
                  )}
                </div>
              </div>

              {/* Application Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Full Name *</label>
                  <Input
                    value={applicationData.name}
                    onChange={(e) => setApplicationData({...applicationData, name: e.target.value})}
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Email *</label>
                  <Input
                    type="email"
                    value={applicationData.email}
                    onChange={(e) => setApplicationData({...applicationData, email: e.target.value})}
                    placeholder="john@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Phone *</label>
                  <Input
                    type="tel"
                    value={applicationData.phone}
                    onChange={(e) => setApplicationData({...applicationData, phone: e.target.value})}
                    placeholder="+1 (555) 123-4567"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Resume URL (optional)</label>
                  <Input
                    type="url"
                    value={applicationData.resume_url || ''}
                    onChange={(e) => setApplicationData({...applicationData, resume_url: e.target.value})}
                    placeholder="https://linkedin.com/in/johndoe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Cover Letter *</label>
                  <Textarea
                    value={applicationData.cover_letter}
                    onChange={(e) => setApplicationData({...applicationData, cover_letter: e.target.value})}
                    placeholder="Tell us why you're a great fit for this role..."
                    rows={6}
                    required
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setSelectedJob(null)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleApply}
                  disabled={isApplying || !applicationData.name || !applicationData.email || !applicationData.phone || !applicationData.cover_letter}
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
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}