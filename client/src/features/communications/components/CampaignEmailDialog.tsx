import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { useToast } from '@/shared/hooks/use-toast'
import { apiRequest } from '@/lib/queryClient'
import { Mail } from 'lucide-react'

const campaignEmailSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  body: z.string().optional(),
  delayDays: z.coerce.number().min(0, 'Delay must be 0 or greater'),
})

type CampaignEmailFormData = z.infer<typeof campaignEmailSchema>

interface CampaignEmailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  campaignId: string
  campaignName?: string
  email?: {
    id: string
    subject: string
    body?: string | null
    delayDays?: number
    delay_days?: number
    orderIndex?: number
    order_index?: number
  } | null
  onSuccess?: () => void
}

export function CampaignEmailDialog({
  open,
  onOpenChange,
  campaignId,
  campaignName,
  email,
  onSuccess,
}: CampaignEmailDialogProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const isEditing = !!email

  const form = useForm<CampaignEmailFormData>({
    resolver: zodResolver(campaignEmailSchema),
    defaultValues: {
      subject: '',
      body: '',
      delayDays: 0,
    },
  })

  useEffect(() => {
    if (email) {
      form.reset({
        subject: email.subject || '',
        body: email.body || '',
        delayDays: email.delayDays ?? email.delay_days ?? 0,
      })
    } else {
      form.reset({
        subject: '',
        body: '',
        delayDays: 0,
      })
    }
  }, [email, form])

  const createMutation = useMutation({
    mutationFn: async (data: CampaignEmailFormData) => {
      return apiRequest(`/api/campaigns/${campaignId}/emails`, {
        method: 'POST',
        body: JSON.stringify(data),
      })
    },
    onSuccess: () => {
      toast({
        title: 'Email Added',
        description: 'New email has been added to the campaign.',
      })
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns', campaignId, 'emails'] })
      form.reset()
      onOpenChange(false)
      onSuccess?.()
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add email',
        variant: 'destructive',
      })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (data: CampaignEmailFormData) => {
      return apiRequest(`/api/campaigns/${campaignId}/emails/${email?.id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })
    },
    onSuccess: () => {
      toast({
        title: 'Email Updated',
        description: 'Campaign email has been updated.',
      })
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns', campaignId, 'emails'] })
      form.reset()
      onOpenChange(false)
      onSuccess?.()
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update email',
        variant: 'destructive',
      })
    },
  })

  const onSubmit = (data: CampaignEmailFormData) => {
    if (isEditing) {
      updateMutation.mutate(data)
    } else {
      createMutation.mutate(data)
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" aria-describedby="campaign-email-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            {isEditing ? 'Edit Email' : 'Add Email'}
          </DialogTitle>
          <p id="campaign-email-description" className="text-sm text-gray-500">
            {isEditing ? 'Update this email in' : 'Add a new email to'} {campaignName || 'the campaign'}.
          </p>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject Line</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. Welcome to our network!" 
                      data-testid="input-email-subject" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="delayDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Send After (Days)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      min="0"
                      placeholder="0"
                      data-testid="input-delay-days"
                      {...field}
                    />
                  </FormControl>
                  <p className="text-xs text-gray-500">
                    Number of days after enrollment to send this email
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Body (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Write your email content here..."
                      rows={6}
                      data-testid="input-email-body"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel-email"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                data-testid="button-save-email"
              >
                {isPending ? 'Saving...' : isEditing ? 'Update Email' : 'Add Email'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
