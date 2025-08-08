import { useGenericList, useGenericItem, useGenericCreate } from './useGenericCrud'
import { demoCandidates } from '@/lib/demo-data-consolidated'
import type { Candidate, InsertCandidate } from '@/../../shared/schema'

export function useCandidates(options: { refetchInterval?: number } = {}) {
  const result = useGenericList<Candidate>({
    endpoint: '/api/candidates',
    queryKey: '/api/candidates',
    getDemoData: () => demoCandidates,
    refetchInterval: options.refetchInterval,
    staleTime: 3 * 60 * 1000, // 3 minutes for candidates
  })
  console.info('[RQ] useCandidates', 'loading=', result.isLoading, 'error=', result.error)
  return result
}

export function useCandidate(id?: string) {
  return useGenericItem<Candidate>('/api/candidates', id)
}

export function useCreateCandidate() {
  return useGenericCreate<Candidate, InsertCandidate>('/api/candidates', '/api/candidates')
}