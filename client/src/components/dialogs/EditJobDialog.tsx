import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { toast } from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'
import { useClients } from '@/hooks/useClients'
import { useUpdateJob } from '@/hooks/useJobMutation'
import { AppModal } from '@/components/ui/modal'
import { Loader2, Edit } from 'lucide-react'
import type { Job } from '@/../../shared/schema'

const editJobSchema = z.object({
  title: z.string().min(1, "Job title is required"),
  description: z.string().optional(),
  clientId: z.string().optional(),
  location: z.string().optional(),
  remoteOption: z.enum(['onsite', 'remote', 'hybrid']).optional(),
  salaryRange: z.string().optional(),
  experienceLevel: z.enum(['entry', 'mid', 'senior', 'executive']).optional(),
  jobType: z.enum(['full-time', 'part-time', 'contract', 'internship']).optional(),
})

type EditJobFormData = z.infer<typeof editJobSchema>

interface EditJobDialogProps {
  job: Job
  trigger?: React.ReactNode
  onJobUpdated?: () => void
}

export function EditJobDialog({ job, trigger, onJobUpdated }: EditJobDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  // Remove useToast since we're using react-hot-toast
  const { userRole } = useAuth()
  const updateJobMutation = useUpdateJob()
  const { data: clients, isLoading: clientsLoading } = useClients()

  const form = useForm<EditJobFormData>({
    resolver: zodResolver(editJobSchema),
    defaultValues: {
      title: job.title || '',
      description: job.description || '',
      clientId: job.clientId || undefined,
      location: job.location || '',
      remoteOption: job.remoteOption || 'onsite',
      salaryRange: job.salaryRange || '',
      experienceLevel: job.experienceLevel || 'mid',
      jobType: job.jobType || 'full-time',
    }
  })

  // Reset form when job changes
  useEffect(() => {
    form.reset({
      title: job.title || '',
      description: job.description || '',
      clientId: job.clientId || undefined,
      location: job.location || '',
      remoteOption: job.remoteOption || 'onsite',
      salaryRange: job.salaryRange || '',
      experienceLevel: job.experienceLevel || 'mid',
      jobType: job.jobType || 'full-time',
    })
  }, [job, form])

  const onSubmit = async (data: EditJobFormData) => {
    if (userRole === 'demo_viewer') {
      toast.error("Editing jobs is disabled in demo mode.")
      return
    }
    
    try {
      await updateJobMutation.mutateAsync({
        id: job.id,
        ...data,
        clientId: data.clientId === "__no_client" ? undefined : data.clientId,
      })
      
      setIsOpen(false)
      onJobUpdated?.()
      
      toast.success("Job details have been successfully updated.")
    } catch (error) {
      console.error('Job update error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to update job'
      toast.error(errorMessage)
    }
  }

  const defaultTrigger = (
    <Button variant="outline" size="sm" className="flex items-center gap-1">
      <Edit className="w-4 h-4" />
      Edit
    </Button>
  )

  return (
    <>
      {/* Trigger Button */}
      {trigger ? (
        <div onClick={() => setIsOpen(true)}>{trigger}</div>
      ) : (
        <div onClick={() => setIsOpen(true)}>{defaultTrigger}</div>
      )}

      {/* Modal */}
      <AppModal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title="Edit Job"
        className="lg:max-w-2xl"
      >
        <div className="max-h-[70vh] overflow-y-auto pr-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pb-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Title *</FormLabel>
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
                        placeholder="Describe the role, responsibilities, and requirements..."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || "__no_client"}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a client" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="__no_client">No client assigned</SelectItem>
                          {clientsLoading ? (
                            <SelectItem value="loading" disabled>Loading clients...</SelectItem>
                          ) : (
                            clients?.map((client) => (
                              <SelectItem key={client.id} value={client.id}>
                                {client.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="jobType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select job type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="full-time">Full-time</SelectItem>
                          <SelectItem value="part-time">Part-time</SelectItem>
                          <SelectItem value="contract">Contract</SelectItem>
                          <SelectItem value="internship">Internship</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="remoteOption"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Remote Option</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select remote option" />
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="experienceLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Experience Level</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select experience level" />
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
                  name="salaryRange"
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

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  disabled={updateJobMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateJobMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {updateJobMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Job'
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