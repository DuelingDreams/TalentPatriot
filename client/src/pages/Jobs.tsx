import { PostJobDialog } from '@/components/dialogs/PostJobDialog'
import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { useJobs, useCreateJob } from '@/hooks/useJobs'
import { useClients } from '@/hooks/useClients'
import { useAuth } from '@/contexts/AuthContext'
import { getDemoJobStats, getDemoClientStats } from '@/lib/demo-data'
import { Plus, Briefcase, Building2, Calendar, Loader2, Users, AlertCircle, Eye, Edit, Trash2 } from 'lucide-react'
import { Link } from 'wouter'
import GuidedJobCreation from '@/components/GuidedJobCreation'

// Form schema for new job creation
const newJobSchema = z.object({
  title: z.string().min(1, 'Job title is required'),
  description: z.string().optional(),
  client_id: z.string().optional(),
  status: z.string().optional()
})

type NewJobFormData = z.infer<typeof newJobSchema>

export default function Jobs() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isGuidedModalOpen, setIsGuidedModalOpen] = useState(false)
  const { toast } = useToast()
  const { userRole, currentOrgId } = useAuth()

  // Fetch data using our hooks
  const { data: jobs, isLoading: jobsLoading, error: jobsError } = useJobs()
  const { data: clients, isLoading: clientsLoading } = useClients()
  const createJobMutation = useCreateJob()

  // Use demo data for demo users
  const displayJobs = userRole === 'demo_viewer' ? getDemoJobStats() : jobs || []
  const displayClients = userRole === 'demo_viewer' ? getDemoClientStats() : clients || []
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

  // Form setup
  const form = useForm<NewJobFormData>({
    resolver: zodResolver(newJobSchema),
    defaultValues: {
      title: '',
      description: '',
      client_id: '',
      status: 'open'
    }
  })

  // Handle form submission
  const onSubmit = async (data: NewJobFormData) => {
    console.log('Form submission triggered with data:', data)
    console.log('Form errors:', form.formState.errors)

    if (isDemoMode) {
      toast({
        title: "Demo Mode",
        description: "Creating jobs is disabled in demo mode.",
        variant: "destructive",
      })
      return
    }

    try {
      console.log('Calling createJobMutation with data:', data)
      await createJobMutation.mutateAsync({
        title: data.title,
        orgId: currentOrgId || '',
        clientId: data.client_id,
        description: data.description || null,
        status: (data.status as 'open' | 'closed' | 'on_hold' | 'filled') || 'open'
      })
      toast({
        title: "Job Created",
        description: "New job posting has been created successfully.",
      })
      setIsModalOpen(false)
      form.reset()
    } catch (error) {
      console.error('Job creation error:', error)
      toast({
        title: "Error",
        description: "Failed to create job posting. Please try again.",
        variant: "destructive",
      })
    }
  }

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
      await fetch(`/api/jobs/${jobId}/publish`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      })
      toast({
        title: "Job Published!",
        description: "Job is now live and available for applications.",
      })
      // Refresh jobs list
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

  return (
    <>
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
                        name="client_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Client (Optional)</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a client (optional)" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="z-50 bg-white border border-slate-200 shadow-lg rounded-md max-h-48 overflow-y-auto">
                                <SelectItem value="" className="hover:bg-slate-50 focus:bg-slate-100 cursor-pointer py-2 px-3">
                                  No client assigned
                                </SelectItem>
                                {clientsLoading ? (
                                  <SelectItem value="loading" disabled className="py-2 px-3">
                                    <div className="flex items-center gap-2">
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                      Loading clients...
                                    </div>
                                  </SelectItem>
                                ) : (
                                  clients?.map((client: any) => (
                                    <SelectItem 
                                      key={client.id} 
                                      value={client.id}
                                      className="hover:bg-slate-50 focus:bg-slate-100 cursor-pointer py-2 px-3"
                                    >
                                      {client.name} {client.industry && `(${client.industry})`}
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              You can create a job without assigning it to a client and link it later.
                            </FormDescription>
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
                          onClick={() => {
                            console.log('Create Job button clicked!')
                            console.log('Form state:', form.getValues())
                            console.log('Form errors:', form.formState.errors)
                          }}
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
    </>
  )
}
//The code imports necessary modules and defines a functional component Jobs to manage job postings, incorporating UI elements, data fetching, and job creation functionalities.