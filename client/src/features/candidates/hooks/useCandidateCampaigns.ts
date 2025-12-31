import { useQuery, useMutation } from '@tanstack/react-query'
import { apiRequest, queryClient } from '@/lib/queryClient'
import type { DripCampaign, CandidateCampaignEnrollment, CampaignEmail, CampaignEmailSend } from '@shared/schema'

interface EnrollmentWithCampaign extends CandidateCampaignEnrollment {
  campaign?: DripCampaign
  drip_campaigns?: DripCampaign
}

interface EmailSendWithEmail extends CampaignEmailSend {
  campaign_emails?: CampaignEmail
}

export function useOrgCampaigns() {
  return useQuery<DripCampaign[]>({
    queryKey: ['/api/campaigns'],
  })
}

export function useCandidateCampaigns(candidateId: string | undefined) {
  return useQuery<EnrollmentWithCampaign[]>({
    queryKey: ['/api/candidates', candidateId, 'campaigns'],
    enabled: !!candidateId,
  })
}

export function useCampaignEmails(campaignId: string | undefined) {
  return useQuery<CampaignEmail[]>({
    queryKey: ['/api/campaigns', campaignId, 'emails'],
    enabled: !!campaignId,
  })
}

export function useEnrollmentEmailSends(enrollmentId: string | undefined) {
  return useQuery<EmailSendWithEmail[]>({
    queryKey: ['/api/enrollments', enrollmentId, 'email-sends'],
    enabled: !!enrollmentId,
  })
}

export function useEnrollInCampaign(candidateId: string) {
  return useMutation({
    mutationFn: async (campaignId: string) => {
      return apiRequest(`/api/candidates/${candidateId}/campaigns/${campaignId}/enroll`, {
        method: 'POST',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/candidates', candidateId, 'campaigns'] })
    },
  })
}

export function useUnenrollFromCampaign(candidateId: string) {
  return useMutation({
    mutationFn: async (enrollmentId: string) => {
      return apiRequest(`/api/candidates/${candidateId}/campaigns/${enrollmentId}`, {
        method: 'DELETE',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/candidates', candidateId, 'campaigns'] })
    },
  })
}

export function useDeleteCampaignEmail(campaignId: string) {
  return useMutation({
    mutationFn: async (emailId: string) => {
      return apiRequest(`/api/campaigns/${campaignId}/emails/${emailId}`, {
        method: 'DELETE',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns', campaignId, 'emails'] })
    },
  })
}
