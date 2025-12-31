import { useState } from 'react'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Mail, 
  Plus, 
  Edit, 
  Trash2,
  Clock,
  CheckCircle,
  Calendar
} from 'lucide-react'
import { useCampaignEmails, useEnrollmentEmailSends, useDeleteCampaignEmail } from '@/features/candidates/hooks/useCandidateCampaigns'
import { CampaignEmailDialog } from '@/components/dialogs/CampaignEmailDialog'
import { useToast } from '@/shared/hooks/use-toast'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface CampaignEnrollmentCardProps {
  enrollment: {
    id: string
    status: string
    enrolledAt?: string
    enrolled_at?: string
    campaignId?: string
    campaign_id?: string
    campaign?: {
      id?: string
      name?: string
      description?: string
      status?: string
    }
    drip_campaigns?: {
      id?: string
      name?: string
      description?: string
      status?: string
    }
  }
  candidateName?: string
}

export function CampaignEnrollmentCard({ enrollment, candidateName }: CampaignEnrollmentCardProps) {
  const { toast } = useToast()
  const [showEmailDialog, setShowEmailDialog] = useState(false)
  const [editingEmail, setEditingEmail] = useState<any>(null)
  const [deletingEmailId, setDeletingEmailId] = useState<string | null>(null)

  const campaign = enrollment.campaign || enrollment.drip_campaigns
  const campaignId = enrollment.campaignId || enrollment.campaign_id || campaign?.id
  const campaignName = campaign?.name || 'Campaign'
  const enrolledDate = enrollment.enrolledAt || enrollment.enrolled_at

  const { data: emails, isLoading: emailsLoading } = useCampaignEmails(campaignId)
  const { data: emailSends } = useEnrollmentEmailSends(enrollment.id)
  const deleteEmailMutation = useDeleteCampaignEmail(campaignId || '')

  const canManageEmails = !!campaignId

  const getEmailSendStatus = (emailId: string) => {
    const send = emailSends?.find((s: any) => 
      (s.campaignEmailId || s.campaign_email_id) === emailId
    )
    return send?.status || null
  }

  const getEmailSendDate = (emailId: string) => {
    const send = emailSends?.find((s: any) => 
      (s.campaignEmailId || s.campaign_email_id) === emailId
    )
    if (!send) return null
    return send.sentAt || send.sent_at || send.scheduledAt || send.scheduled_at
  }

  const handleEditEmail = (email: any) => {
    setEditingEmail(email)
    setShowEmailDialog(true)
  }

  const handleAddEmail = () => {
    setEditingEmail(null)
    setShowEmailDialog(true)
  }

  const handleDeleteEmail = async () => {
    if (!deletingEmailId || !canManageEmails) return
    try {
      await deleteEmailMutation.mutateAsync(deletingEmailId)
      toast({
        title: 'Email Deleted',
        description: 'Campaign email has been removed.',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete email',
        variant: 'destructive',
      })
    }
    setDeletingEmailId(null)
  }

  const getStatusBadge = (status: string | null) => {
    if (status === 'sent') {
      return <Badge className="bg-green-100 text-green-800 text-xs">Sent</Badge>
    }
    if (status === 'scheduled') {
      return <Badge className="bg-yellow-100 text-yellow-800 text-xs">Scheduled</Badge>
    }
    if (status === 'failed') {
      return <Badge className="bg-red-100 text-red-800 text-xs">Failed</Badge>
    }
    return <Badge className="bg-gray-100 text-gray-600 text-xs">Pending</Badge>
  }

  const calculateSendDate = (delayDays: number) => {
    if (!enrolledDate) return null
    const enrollDate = new Date(enrolledDate)
    enrollDate.setDate(enrollDate.getDate() + delayDays)
    return enrollDate
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4" data-testid={`campaign-${enrollment.id}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-lg">{campaignName}</h3>
          <p className="text-sm text-gray-500">
            Enrolled: {enrolledDate 
              ? format(new Date(enrolledDate), 'yyyy-MM-dd') 
              : 'Recently'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={enrollment.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
            {enrollment.status === 'active' ? 'Active' : enrollment.status}
          </Badge>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Edit className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {campaign?.description && (
        <p className="text-sm text-gray-600 mb-4">{campaign.description}</p>
      )}

      <div className="border-t border-gray-100 pt-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-gray-900">Email Sequence</h4>
          {canManageEmails && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={handleAddEmail}
              data-testid="add-email-button"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Email
            </Button>
          )}
        </div>

        {emailsLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse h-16 bg-gray-100 rounded-lg"></div>
            ))}
          </div>
        ) : emails && emails.length > 0 ? (
          <div className="space-y-2">
            {emails.map((email: any, index: number) => {
              const sendStatus = getEmailSendStatus(email.id)
              const sendDate = getEmailSendDate(email.id)
              const delayDays = email.delayDays ?? email.delay_days ?? 0
              const calculatedDate = calculateSendDate(delayDays)
              
              return (
                <div 
                  key={email.id} 
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  data-testid={`campaign-email-${email.id}`}
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{email.subject}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>Day {delayDays}</span>
                      {sendDate && (
                        <>
                          <span className="mx-1">•</span>
                          <span>
                            {sendStatus === 'sent' ? 'Sent' : 'Scheduled'} {format(new Date(sendDate), 'yyyy-MM-dd')}
                          </span>
                        </>
                      )}
                      {!sendDate && calculatedDate && (
                        <>
                          <span className="mx-1">•</span>
                          <span>Est. {format(calculatedDate, 'yyyy-MM-dd')}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(sendStatus)}
                    {canManageEmails && (
                      <>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => handleEditEmail(email)}
                          data-testid={`edit-email-${email.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-red-500 hover:text-red-700"
                          onClick={() => setDeletingEmailId(email.id)}
                          data-testid={`delete-email-${email.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            <Mail className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No emails in this campaign yet</p>
            <p className="text-xs">Add emails to build your sequence</p>
          </div>
        )}
      </div>

      <CampaignEmailDialog
        open={showEmailDialog}
        onOpenChange={setShowEmailDialog}
        campaignId={campaignId || ''}
        campaignName={campaignName}
        email={editingEmail}
      />

      <AlertDialog open={!!deletingEmailId} onOpenChange={() => setDeletingEmailId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Email</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this email from the campaign? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteEmail}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
