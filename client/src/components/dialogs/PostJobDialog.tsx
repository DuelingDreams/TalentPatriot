import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { useCreateJob } from '@/hooks/useJobs'
import { useClients } from '@/hooks/useClients'
import { Plus, Loader2 } from 'lucide-react'

// Form validation schema with location targeting
const jobSchema = z.object({
  title: z.string().min(1, 'Job title is required'),
  description: z.string().min(1, 'Job description is required'),
  client_id: z.string().min(1, 'Client is required'),
  status: z.enum(['open', 'closed', 'on_hold', 'filled']).default('open'),
  location: z.string().min(1, 'Job location is required'),
  remote_option: z.enum(['onsite', 'remote', 'hybrid']).default('onsite'),
  salary_range: z.string().optional(),
  experience_level: z.enum(['entry', 'mid', 'senior', 'executive']).default('mid'),
  job_type: z.enum(['full_time', 'part_time', 'contract', 'freelance']).default('full_time'),
  posting_targets: z.array(z.string()).default([])
})

type JobFormData = z.infer<typeof jobSchema>

interface PostJobDialogProps {
  triggerButton?: React.ReactNode
}

export function PostJobDialog({ triggerButton }: PostJobDialogProps) {
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
      client_id: '',
      status: 'open',
      location: '',
      remote_option: 'onsite',
      salary_range: '',
      experience_level: 'mid',
      job_type: 'full_time',
      posting_targets: []
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

    if (!currentOrgId) {
      toast({
        title: "Organization Required",
        description: "Please ensure you have an organization set up to post jobs.",
        variant: "destructive",
      })
      return
    }
    
    try {
      // Map form data to job creation payload
      const jobData = {
        title: data.title,
        description: data.description,
        clientId: data.client_id, // Map client_id to clientId
        orgId: currentOrgId, // Add required orgId (now guaranteed to be non-null)
        status: data.status
      }
      
      await createJobMutation.mutateAsync(jobData)
      toast({
        title: "Job Posted",
        description: "Your job has been posted successfully with location targeting.",
      })
      setIsOpen(false)
      form.reset()
    } catch (error) {
      console.error('Job posting error:', error)
      toast({
        title: "Error",
        description: "Failed to post job. Please try again.",
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
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {triggerButton || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Post New Job</DialogTitle>
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
              name="client_id"
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
                      ) : clients && clients.length > 0 ? (
                        clients.map((client: any) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-clients" disabled>
                          No clients available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
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
                name="remote_option"
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
                name="experience_level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Experience Level</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
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
                name="job_type"
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
                        <SelectItem value="full_time">Full Time</SelectItem>
                        <SelectItem value="part_time">Part Time</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="freelance">Freelance</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="salary_range"
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

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select job status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                      <SelectItem value="on_hold">On Hold</SelectItem>
                      <SelectItem value="filled">Filled</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

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
              >
                {createJobMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Posting...
                  </>
                ) : (
                  'Post Job'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}