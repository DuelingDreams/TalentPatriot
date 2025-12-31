import { useQuery, useMutation } from '@tanstack/react-query'
import { apiRequest, queryClient } from '@/lib/queryClient'
import type { DripCampaign, CandidateCampaignEnrollment } from '@shared/schema'

interface EnrollmentWithCampaign extends CandidateCampaignEnrollment {
  campaign?: DripCampaign
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
