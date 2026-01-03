import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { useToast } from '@/shared/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { apiRequest } from '@/lib/queryClient'
import { Megaphone, Mail } from 'lucide-react'

interface EnrollCampaignDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  candidateId: string
  candidateName?: string
  enrolledCampaignIds?: string[]
  onSuccess?: () => void
}

export function EnrollCampaignDialog({
  open,
  onOpenChange,
  candidateId,
  candidateName,
  enrolledCampaignIds = [],
  onSuccess,
}: EnrollCampaignDialogProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { currentOrgId } = useAuth()
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('')

  const { data: campaigns, isLoading: campaignsLoading } = useQuery({
    queryKey: ['/api/campaigns', currentOrgId],
    queryFn: () => apiRequest(`/api/campaigns?org_id=${currentOrgId}`),
    enabled: open && !!currentOrgId,
  })

  const availableCampaigns = campaigns?.filter(
    (campaign: any) => 
      campaign.status === 'active' && 
      !enrolledCampaignIds.includes(campaign.id)
  )

  const enrollMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      return apiRequest(`/api/candidates/${candidateId}/campaigns/${campaignId}/enroll`, {
        method: 'POST',
      })
    },
    onSuccess: () => {
      toast({
        title: 'Enrolled Successfully',
        description: `${candidateName || 'Candidate'} has been enrolled in the campaign.`,
      })
      queryClient.invalidateQueries({ queryKey: ['/api/candidates', candidateId, 'campaigns'] })
      setSelectedCampaignId('')
      onOpenChange(false)
      onSuccess?.()
    },
    onError: (error: any) => {
      toast({
        title: 'Enrollment Failed',
        description: error.message || 'Failed to enroll in campaign',
        variant: 'destructive',
      })
    },
  })

  const handleEnroll = () => {
    if (!selectedCampaignId) {
      toast({
        title: 'No Campaign Selected',
        description: 'Please select a campaign to enroll in.',
        variant: 'destructive',
      })
      return
    }
    enrollMutation.mutate(selectedCampaignId)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" aria-describedby="enroll-campaign-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="w-5 h-5" />
            Enroll in Campaign
          </DialogTitle>
          <p id="enroll-campaign-description" className="text-sm text-gray-500">
            Select a drip campaign to enroll {candidateName || 'this candidate'}.
          </p>
        </DialogHeader>

        <div className="py-4">
          {campaignsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse h-16 bg-gray-100 rounded-lg"></div>
              ))}
            </div>
          ) : availableCampaigns && availableCampaigns.length > 0 ? (
            <RadioGroup
              value={selectedCampaignId}
              onValueChange={setSelectedCampaignId}
              className="space-y-3"
            >
              {availableCampaigns.map((campaign: any) => (
                <div
                  key={campaign.id}
                  className={`flex items-start space-x-3 border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedCampaignId === campaign.id ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedCampaignId(campaign.id)}
                  data-testid={`campaign-option-${campaign.id}`}
                >
                  <RadioGroupItem value={campaign.id} id={campaign.id} className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor={campaign.id} className="font-medium cursor-pointer">
                      {campaign.name}
                    </Label>
                    {campaign.description && (
                      <p className="text-sm text-gray-500 mt-1">{campaign.description}</p>
                    )}
                    <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                      <Mail className="w-3 h-3" />
                      <span>Automated email sequence</span>
                    </div>
                  </div>
                </div>
              ))}
            </RadioGroup>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Megaphone className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p className="font-medium">No Campaigns Available</p>
              <p className="text-sm mt-1">
                {enrolledCampaignIds.length > 0 
                  ? 'This candidate is already enrolled in all active campaigns.'
                  : 'Create a drip campaign first to start automated outreach.'}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleEnroll}
            disabled={!selectedCampaignId || enrollMutation.isPending}
            data-testid="submit-enroll"
          >
            {enrollMutation.isPending ? 'Enrolling...' : 'Enroll in Campaign'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
