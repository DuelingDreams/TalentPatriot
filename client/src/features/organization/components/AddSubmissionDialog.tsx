import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/shared/hooks/use-toast'
import { useClients } from '@/features/organization/hooks/useClients'
import { useJobs } from '@/features/jobs/hooks/useJobs'
import { apiRequest } from '@/lib/queryClient'
import { useAuth } from '@/contexts/AuthContext'

const submissionSchema = z.object({
  clientId: z.string().min(1, 'Client is required'),
  jobId: z.string().optional(),
  positionTitle: z.string().min(1, 'Position title is required'),
  rate: z.string().optional(),
  status: z.string().default('submitted'),
  feedback: z.string().optional(),
})

type SubmissionFormData = z.infer<typeof submissionSchema>

interface AddSubmissionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  candidateId: string
  candidateName?: string
  onSuccess?: () => void
}

export function AddSubmissionDialog({
  open,
  onOpenChange,
  candidateId,
  candidateName,
  onSuccess,
}: AddSubmissionDialogProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { currentOrgId, user } = useAuth()
  const { data: clients, isLoading: clientsLoading } = useClients()
  const { data: jobs, isLoading: jobsLoading } = useJobs()

  const form = useForm<SubmissionFormData>({
    resolver: zodResolver(submissionSchema),
    defaultValues: {
      clientId: '',
      jobId: '',
      positionTitle: '',
      rate: '',
      status: 'submitted',
      feedback: '',
    },
  })

  const selectedClientId = form.watch('clientId')
  const filteredJobs = jobs?.filter((job: any) => job.clientId === selectedClientId || job.client_id === selectedClientId)

  const createSubmission = useMutation({
    mutationFn: async (data: SubmissionFormData) => {
      return apiRequest(`/api/candidates/${candidateId}/submissions`, {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          jobId: data.jobId && data.jobId !== 'no_job' ? data.jobId : null,
          submittedBy: user?.id,
        }),
      })
    },
    onSuccess: () => {
      toast({
        title: 'Submission Added',
        description: 'Candidate has been submitted to the client.',
      })
      queryClient.invalidateQueries({ queryKey: ['/api/candidates', candidateId, 'submissions'] })
      form.reset()
      onOpenChange(false)
      onSuccess?.()
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create submission',
        variant: 'destructive',
      })
    },
  })

  const onSubmit = (data: SubmissionFormData) => {
    createSubmission.mutate(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" aria-describedby="add-submission-description">
        <DialogHeader>
          <DialogTitle>Submit Candidate to Client</DialogTitle>
          <p id="add-submission-description" className="text-sm text-gray-500">
            Submit {candidateName || 'this candidate'} to a client for a position.
          </p>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-client">
                        <SelectValue placeholder="Select a client" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clientsLoading ? (
                        <SelectItem value="loading" disabled>Loading...</SelectItem>
                      ) : clients && Array.isArray(clients) && clients.length > 0 ? (
                        clients.map((client: any) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>No clients available</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="jobId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <FormControl>
                      <SelectTrigger data-testid="select-job">
                        <SelectValue placeholder="Select a job" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="no_job">No specific job</SelectItem>
                      {jobsLoading ? (
                        <SelectItem value="loading" disabled>Loading...</SelectItem>
                      ) : filteredJobs && filteredJobs.length > 0 ? (
                        filteredJobs.map((job: any) => (
                          <SelectItem key={job.id} value={job.id}>
                            {job.title}
                          </SelectItem>
                        ))
                      ) : selectedClientId ? (
                        <SelectItem value="none" disabled>No jobs for this client</SelectItem>
                      ) : null}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="positionTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Position Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Senior Developer" data-testid="input-position-title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="rate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rate (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. $75/hr or $120k/yr" data-testid="input-rate" {...field} />
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
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="submitted">Submitted</SelectItem>
                      <SelectItem value="reviewing">Reviewing</SelectItem>
                      <SelectItem value="interviewing">Interviewing</SelectItem>
                      <SelectItem value="offered">Offered</SelectItem>
                      <SelectItem value="placed">Placed</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="withdrawn">Withdrawn</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="feedback"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any initial notes about this submission..." 
                      className="resize-none"
                      data-testid="input-feedback"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createSubmission.isPending} data-testid="submit-submission">
                {createSubmission.isPending ? 'Submitting...' : 'Submit Candidate'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
