import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AppModal } from '@/components/ui/AppModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { useCreateJob } from '@/hooks/useJobMutation'
import { useClients } from '@/hooks/useClients'
import { Plus, Loader2, Globe, Building2, Users, Briefcase, HelpCircle } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { flags } from '@/lib/flags'

// Form validation schema - always creates drafts, slug is generated server-side
const jobSchema = z.object({
  title: z.string().min(1, 'Job title is required'),
  description: z.string().optional(), // Optional for draft creation
  clientId: z.string().optional(),
  location: z.string().optional(), // Optional for draft creation  
  remoteOption: z.enum(['onsite', 'remote', 'hybrid']).default('onsite'),
  salaryRange: z.string().optional(),
  experienceLevel: z.enum(['entry', 'mid', 'senior', 'executive']).default('mid'),
  jobType: z.enum(['full-time', 'part-time', 'contract', 'internship']).default('full-time'),
  ...(flags.jobBoardDistribution && {
    postingTargets: z.array(z.string()).default([]),
    autoPost: z.boolean().default(false)
  })
})

type JobFormData = z.infer<typeof jobSchema>

// Available job boards with their details
const jobBoards = [
  { 
    id: 'linkedin', 
    name: 'LinkedIn', 
    icon: Building2, 
    description: 'Professional network with 800M+ users',
    pricing: 'Paid plans starting at $495/month'
  },
  { 
    id: 'indeed', 
    name: 'Indeed', 
    icon: Globe, 
    description: 'World\'s largest job site',
    pricing: 'Pay-per-click or sponsored posts'
  },
  { 
    id: 'monster', 
    name: 'Monster', 
    icon: Users, 
    description: 'Global employment website',
    pricing: 'Job posting packages from $249/month'
  },
  { 
    id: 'glassdoor', 
    name: 'Glassdoor', 
    icon: Briefcase, 
    description: 'Jobs with company insights',
    pricing: 'Starting at $599/month for small teams'
  },
  { 
    id: 'ziprecruiter', 
    name: 'ZipRecruiter', 
    icon: Globe, 
    description: 'AI-powered job matching',
    pricing: 'Plans from $249/month'
  },
  { 
    id: 'craigslist', 
    name: 'Craigslist', 
    icon: Globe, 
    description: 'Local classified ads',
    pricing: '$75 per job post in most cities'
  }
]

interface PostJobDialogProps {
  trigger?: React.ReactNode
  triggerButton?: React.ReactNode
  onJobCreated?: () => void
}

export function PostJobDialog({ trigger, triggerButton, onJobCreated }: PostJobDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { toast } = useToast()
  const { userRole, currentOrgId } = useAuth()
  const createJobMutation = useCreateJob()
  const { data: clients, isLoading: clientsLoading } = useClients()

  const form = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      title: '',
      description: '',
      clientId: undefined,
      location: '',
      remoteOption: 'onsite',
      salaryRange: '',
      experienceLevel: 'mid',
      jobType: 'full-time',
      ...(flags.jobBoardDistribution && {
        postingTargets: [],
        autoPost: false
      })
    }
  })

  const onSubmit = async (data: JobFormData) => {
    if (userRole === 'demo_viewer') {
      toast({
        title: "Demo Mode",
        description: "Creating jobs is disabled in demo mode.",
        variant: "destructive",
      })
      return
    }
    
    try {
      // Map form data to job creation payload - orgId is auto-injected by hook
      const values = {
        title: data.title,
        description: data.description,
        clientId: data.clientId === "__no_client" ? undefined : data.clientId,
        location: data.location,
        remoteOption: data.remoteOption,
        salaryRange: data.salaryRange || undefined,
        experienceLevel: data.experienceLevel,
        jobType: data.jobType,
        ...(flags.jobBoardDistribution && {
          postingTargets: data.postingTargets,
          autoPost: data.autoPost
        })
      }
      
      createJobMutation.mutate(values)
      
      setIsOpen(false)
      form.reset()
      onJobCreated?.() // Call success callback
    } catch (error) {
      console.error('Job posting error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to post job'
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const defaultTrigger = (
    <Button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">
      <Plus className="w-4 h-4 mr-2" />
      Post New Job
    </Button>
  )

  return (
    <>
      {/* Trigger Button */}
      {trigger ? (
        <div onClick={() => setIsOpen(true)}>{trigger}</div>
      ) : triggerButton ? (
        <div onClick={() => setIsOpen(true)}>{triggerButton}</div>
      ) : (
        <div onClick={() => setIsOpen(true)}>{defaultTrigger}</div>
      )}

      {/* Modal */}
      <AppModal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title="Create New Job Draft"
        className="lg:max-w-4xl"
      >
        <div className="max-h-[70vh] overflow-y-auto pr-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pb-4">
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
                      className="min-h-[120px]"
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
                  <FormLabel>Client (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || "__no_client"}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a client (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="z-[100] bg-white border border-slate-200 shadow-lg rounded-md max-h-48 overflow-y-auto">
                      <SelectItem value="__no_client" className="hover:bg-slate-50 focus:bg-slate-100 cursor-pointer py-2 px-3">
                        No client assigned
                      </SelectItem>
                      {clientsLoading ? (
                        <SelectItem value="loading" disabled className="py-2 px-3">
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Loading clients...
                          </div>
                        </SelectItem>
                      ) : clients && clients.length > 0 ? (
                        clients.map((client: any) => (
                          <SelectItem 
                            key={client.id} 
                            value={client.id}
                            className="hover:bg-slate-50 focus:bg-slate-100 cursor-pointer py-2 px-3"
                          >
                            {client.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-clients" disabled className="py-2 px-3">
                          No clients available
                        </SelectItem>
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Location</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. San Francisco, CA" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="remoteOption"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      Work Type
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-slate-400 hover:text-slate-600" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>On-site: Work from office only<br/>Remote: Work from anywhere<br/>Hybrid: Mix of office and remote work</p>
                        </TooltipContent>
                      </Tooltip>
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="z-[100]">
                        <SelectItem value="onsite">On-site</SelectItem>
                        <SelectItem value="remote">Remote</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="experienceLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      Experience Level
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-slate-400 hover:text-slate-600" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Entry: 0-2 years experience<br/>Mid: 2-5 years experience<br/>Senior: 5+ years experience<br/>Executive: Leadership roles</p>
                        </TooltipContent>
                      </Tooltip>
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="z-[100]">
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
                      <SelectContent className="z-[100]">
                        <SelectItem value="full-time">Full Time</SelectItem>
                        <SelectItem value="part-time">Part Time</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="internship">Internship</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="salaryRange"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Salary Range (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. $80,000 - $120,000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />


            {flags.jobBoardDistribution && (
              <>
                {/* Job Board Selection Section */}
                <div className="space-y-4 p-4 border rounded-lg bg-slate-50">
                  <div className="flex items-center gap-2 mb-2">
                    <Globe className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-slate-700">Distribution Settings</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium">Job Board Distribution</h4>
                      <p className="text-xs text-slate-600">Select where to post this job</p>
                    </div>
                    <FormField
                      control={form.control}
                      name="autoPost"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Checkbox
                              checked={Boolean(field.value)}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="text-xs">Auto-post to selected boards</FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="postingTargets"
                    render={() => (
                      <FormItem>
                        <div className="grid grid-cols-1 gap-3">
                          {jobBoards.map((board) => {
                            const IconComponent = board.icon
                            return (
                              <FormField
                                key={board.id}
                                control={form.control}
                                name="postingTargets"
                                render={({ field }) => {
                                  return (
                                    <FormItem
                                      key={board.id}
                                      className="flex items-start space-x-3 space-y-0 p-3 border rounded-md hover:bg-white transition-colors"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={Array.isArray(field.value) && field.value.includes(board.id)}
                                          onCheckedChange={(checked) => {
                                            const currentValue = Array.isArray(field.value) ? field.value : [];
                                            return checked
                                              ? field.onChange([...currentValue, board.id])
                                              : field.onChange(
                                                  currentValue.filter(
                                                    (value: string) => value !== board.id
                                                  )
                                                )
                                          }}
                                        />
                                      </FormControl>
                                      <div className="flex items-center space-x-3 flex-1">
                                        <IconComponent className="h-5 w-5 text-blue-600" />
                                        <div className="flex-1">
                                          <FormLabel className="text-sm font-medium">
                                            {board.name}
                                          </FormLabel>
                                          <p className="text-xs text-slate-600">{board.description}</p>
                                          <p className="text-xs text-green-600 font-medium">{board.pricing}</p>
                                        </div>
                                      </div>
                                    </FormItem>
                                  )
                                }}
                              />
                            )
                          })}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
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
                    Saving Draft...
                  </>
                ) : (
                  'Save as Draft'
                )}
              </Button>
            </div>
            </form>
          </Form>
        </div>
      </AppModal>
    </>
  )
}