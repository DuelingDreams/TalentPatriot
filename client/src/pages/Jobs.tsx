import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { useJobs, useClients, useCreateJob } from '@/hooks/useJobs'
import { useAuth } from '@/contexts/AuthContext'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { insertJobSchema } from '@/../../shared/schema'
import { z } from 'zod'
import { 
  Plus, 
  Briefcase, 
  Building2, 
  Calendar, 
  Loader2, 
  Users, 
  Share2, 
  ExternalLink,
  MapPin,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Globe,
  Linkedin,
  BrainCircuit
} from 'lucide-react'
import { Link } from 'wouter'

// Form schema for new job creation
const newJobSchema = insertJobSchema.extend({
  title: z.string().min(1, 'Job title is required'),
  clientId: z.string().min(1, 'Client selection is required'),
  location: z.string().optional(),
  salary: z.string().optional(),
  jobType: z.enum(['full-time', 'part-time', 'contract', 'temporary', 'internship']).optional(),
  experienceLevel: z.enum(['entry', 'mid', 'senior', 'executive']).optional(),
  remote: z.enum(['remote', 'office', 'hybrid']).optional(),
  requirements: z.string().optional(),
  benefits: z.string().optional(),
})

type NewJobFormData = z.infer<typeof newJobSchema>

// External posting platforms
const POSTING_PLATFORMS = [
  { id: 'indeed', name: 'Indeed', icon: Globe, description: 'Post to Indeed job board' },
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, description: 'Post to LinkedIn Jobs' },
  { id: 'monster', name: 'Monster', icon: BrainCircuit, description: 'Post to Monster.com' },
  { id: 'glassdoor', name: 'Glassdoor', icon: Building2, description: 'Post to Glassdoor' },
  { id: 'ziprecruiter', name: 'ZipRecruiter', icon: Share2, description: 'Post to ZipRecruiter' },
]

export default function Jobs() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isPostingModalOpen, setIsPostingModalOpen] = useState(false)
  const [selectedJobForPosting, setSelectedJobForPosting] = useState<any>(null)
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const { toast } = useToast()
  const { userRole } = useAuth()

  // Fetch data using our hooks
  const { data: jobs, isLoading: jobsLoading, error: jobsError } = useJobs()
  const { data: clients, isLoading: clientsLoading } = useClients()
  const createJobMutation = useCreateJob()
  
  const isDemoMode = userRole === 'demo_viewer'

  // Form setup
  const form = useForm<NewJobFormData>({
    resolver: zodResolver(newJobSchema),
    defaultValues: {
      title: '',
      description: '',
      clientId: '',
      status: 'open',
      jobType: 'full-time',
      remote: 'office',
      location: '',
      salary: '',
      experienceLevel: undefined,
      requirements: '',
      benefits: ''
    }
  })

  // Handle external job posting
  const handleExternalPosting = async (job: any, platforms: string[]) => {
    if (isDemoMode) {
      toast({
        title: "Demo Mode",
        description: "External posting is disabled in demo mode.",
        variant: "destructive",
      })
      return
    }

    // Simulate posting to external platforms
    // In a real implementation, this would integrate with actual APIs
    try {
      const postingPromises = platforms.map(async (platform) => {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
        
        // Simulate random success/failure for demo
        if (Math.random() > 0.8) {
          throw new Error(`Failed to post to ${platform}`)
        }
        
        return {
          platform,
          url: `https://${platform}.com/jobs/${job.id}`,
          postedAt: new Date().toISOString()
        }
      })

      const results = await Promise.allSettled(postingPromises)
      const successful = results.filter(r => r.status === 'fulfilled').length
      const failed = results.filter(r => r.status === 'rejected').length

      if (successful > 0) {
        toast({
          title: "Job Posted Successfully",
          description: `Posted to ${successful} platform${successful > 1 ? 's' : ''}${failed > 0 ? `, failed on ${failed}` : ''}.`,
        })
      } else {
        toast({
          title: "Posting Failed",
          description: "Failed to post to all selected platforms. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to post job externally. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsPostingModalOpen(false)
      setSelectedPlatforms([])
    }
  }

  // Handle form submission
  const onSubmit = async (data: NewJobFormData) => {
    if (isDemoMode) {
      toast({
        title: "Demo Mode",
        description: "Creating jobs is disabled in demo mode.",
        variant: "destructive",
      })
      return
    }
    
    try {
      await createJobMutation.mutateAsync(data)
      toast({
        title: "Job Created",
        description: "New job posting has been created successfully.",
      })
      setIsModalOpen(false)
      form.reset()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create job posting. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800'
      case 'closed': return 'bg-gray-100 text-gray-800'
      case 'on_hold': return 'bg-yellow-100 text-yellow-800'
      case 'filled': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
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
              <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger asChild>
                  <Button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    New Job
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Create New Job</DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Job Title</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Senior Software Engineer" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Job Description</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Describe the role, requirements, and responsibilities..."
                                className="min-h-[100px]"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="clientId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Client</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a client" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {clientsLoading ? (
                                  <SelectItem value="loading" disabled>
                                    <div className="flex items-center gap-2">
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                      Loading clients...
                                    </div>
                                  </SelectItem>
                                ) : (
                                  clients?.map((client) => (
                                    <SelectItem key={client.id} value={client.id}>
                                      {client.name} {client.industry && `(${client.industry})`}
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Separator className="my-4" />

                      {/* Job Details Section */}
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="location"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Location</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. San Francisco, CA" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="salary"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Salary Range</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. $80,000 - $120,000" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="jobType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Job Type</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="full-time">Full-time</SelectItem>
                                  <SelectItem value="part-time">Part-time</SelectItem>
                                  <SelectItem value="contract">Contract</SelectItem>
                                  <SelectItem value="temporary">Temporary</SelectItem>
                                  <SelectItem value="internship">Internship</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="experienceLevel"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Experience Level</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select level" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="entry">Entry Level</SelectItem>
                                  <SelectItem value="mid">Mid Level</SelectItem>
                                  <SelectItem value="senior">Senior Level</SelectItem>
                                  <SelectItem value="executive">Executive</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="remote"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Work Type</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="office">On-site</SelectItem>
                                  <SelectItem value="remote">Remote</SelectItem>
                                  <SelectItem value="hybrid">Hybrid</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="requirements"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Requirements</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="List required skills, qualifications, and experience..."
                                className="min-h-[80px]"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="benefits"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Benefits & Perks</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Health insurance, 401k, flexible hours, etc..."
                                className="min-h-[60px]"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end space-x-2 pt-4">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsModalOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={createJobMutation.isPending}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {createJobMutation.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            'Create Job'
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* External Posting Modal */}
        <Dialog open={isPostingModalOpen} onOpenChange={setIsPostingModalOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Post Job Externally</DialogTitle>
              <p className="text-sm text-slate-600">
                Select platforms to post "{selectedJobForPosting?.title}" to external job boards
              </p>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid gap-3">
                {POSTING_PLATFORMS.map((platform) => {
                  const Icon = platform.icon
                  const isSelected = selectedPlatforms.includes(platform.id)
                  
                  return (
                    <div 
                      key={platform.id}
                      className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                      onClick={() => {
                        setSelectedPlatforms(prev => 
                          prev.includes(platform.id)
                            ? prev.filter(id => id !== platform.id)
                            : [...prev, platform.id]
                        )
                      }}
                    >
                      <Checkbox 
                        checked={isSelected}
                        onChange={() => {}} // Handled by parent div onClick
                      />
                      <Icon className="w-5 h-5 text-slate-600" />
                      <div className="flex-1">
                        <div className="font-medium">{platform.name}</div>
                        <div className="text-sm text-slate-600">{platform.description}</div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {selectedPlatforms.length > 0 && (
                <div className="bg-slate-50 p-3 rounded-lg">
                  <h4 className="font-medium mb-2">Posting Preview</h4>
                  <div className="text-sm text-slate-600 space-y-1">
                    <div><strong>Title:</strong> {selectedJobForPosting?.title}</div>
                    <div><strong>Company:</strong> {selectedJobForPosting?.clients?.name}</div>
                    {selectedJobForPosting?.location && (
                      <div><strong>Location:</strong> {selectedJobForPosting.location}</div>
                    )}
                    {selectedJobForPosting?.salary && (
                      <div><strong>Salary:</strong> {selectedJobForPosting.salary}</div>
                    )}
                    <div><strong>Selected Platforms:</strong> {selectedPlatforms.map(id => 
                      POSTING_PLATFORMS.find(p => p.id === id)?.name
                    ).join(', ')}</div>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsPostingModalOpen(false)
                    setSelectedPlatforms([])
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  disabled={selectedPlatforms.length === 0}
                  onClick={() => handleExternalPosting(selectedJobForPosting, selectedPlatforms)}
                >
                  {selectedPlatforms.length > 0 ? (
                    <>
                      <Share2 className="w-4 h-4 mr-2" />
                      Post to {selectedPlatforms.length} Platform{selectedPlatforms.length > 1 ? 's' : ''}
                    </>
                  ) : (
                    'Select Platforms'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

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
        {jobs && jobs.length > 0 ? (
          <div className="grid gap-6">
            {jobs.map((job) => (
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
                            <span>{job.clients?.name}</span>
                            {job.clients?.industry && (
                              <>
                                <span>•</span>
                                <span>{job.clients.industry}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Job Details */}
                      <div className="flex items-center gap-4 mb-3 text-sm text-slate-600">
                        {job.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{job.location}</span>
                          </div>
                        )}
                        {job.salary && (
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            <span>{job.salary}</span>
                          </div>
                        )}
                        {job.jobType && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span className="capitalize">{job.jobType.replace('-', ' ')}</span>
                          </div>
                        )}
                      </div>
                      
                      {job.description && (
                        <p className="text-slate-600 mb-4 line-clamp-2">{job.description}</p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>Created {new Date(job.createdAt || job.created_at).toLocaleDateString()}</span>
                        </div>
                        {job.externalPostings && (
                          <div className="flex items-center gap-1">
                            <ExternalLink className="w-4 h-4" />
                            <span>Posted externally</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-xs"
                          onClick={() => {
                            setSelectedJobForPosting(job)
                            setIsPostingModalOpen(true)
                          }}
                        >
                          <Share2 className="w-3 h-3 mr-1" />
                          Post Job
                        </Button>
                        <Link href={`/jobs/${job.id}`}>
                          <Button size="sm" variant="outline" className="text-xs">
                            <Users className="w-3 h-3 mr-1" />
                            Pipeline
                          </Button>
                        </Link>
                      </div>
                      <Badge className={getStatusColor(job.status)}>
                        {job.status.replace('_', ' ')}
                      </Badge>
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
              <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Job
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>
          )
        )}
      </div>
    </DashboardLayout>
  )
}