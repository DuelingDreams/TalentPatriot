import { useGenericList, useGenericItem, useGenericCreate } from './useGenericCrud'
import { demoCandidates } from '@/lib/demo-data-consolidated'
import type { Candidate, InsertCandidate } from '../../shared/schema'

export function useCandidates(options: { refetchInterval?: number } = {}) {
  const getDemoCandidate = (candidateId: string) => {
    return demoCandidates.find(candidate => candidate.id === candidateId) || null
  }

  const result = useGenericList<Candidate>({
    endpoint: '/api/candidates',
    queryKey: '/api/candidates',
    getDemoData: () => demoCandidates as Candidate[],
    getDemoItem: getDemoCandidate,
    refetchInterval: options.refetchInterval || 120000, // 2 minutes default
    staleTime: 5 * 60 * 1000, // 5 minutes for candidates - performance optimization
  })
  console.info('[RQ] useCandidates', 'loading=', result.isLoading, 'error=', result.error)
  return result
}

export function useCandidate(id?: string) {
  const getDemoCandidate = (candidateId: string) => {
    return demoCandidates.find(candidate => candidate.id === candidateId) || null
  }
  
  return useGenericItem<Candidate>('/api/candidates', id, getDemoCandidate)
}

export function useCreateCandidate() {
  return useGenericCreate<Candidate, InsertCandidate>('/api/candidates', '/api/candidates')
}