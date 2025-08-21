import { useGenericList, useGenericItem, useGenericCreate } from './useGenericCrud'
import { demoCandidates } from '@/lib/demo-data-consolidated'
import type { Candidate, InsertCandidate } from '@shared/schema'

export function useCandidates(options: { refetchInterval?: number } = {}) {
  const getDemoCandidate = (candidateId: string) => {
    return demoCandidates.find(candidate => candidate.id === candidateId) || null
  }

  const result = useGenericList<Candidate>({
    endpoint: '/api/candidates',
    queryKey: '/api/candidates',
    getDemoData: () => demoCandidates.map((c: any) => ({
      ...c,
      createdAt: new Date(c.createdAt),
      updatedAt: new Date(c.updatedAt),
      phone: c.phone || null,
      resumeUrl: c.resumeUrl || null,
      resumeParsed: false,
      skills: [],
      experienceLevel: 'mid' as const,
      totalYearsExperience: null,
      educationLevel: null,
      currentJobTitle: null,
      searchableContent: null,
      summary: null,
      education: null
    })) as Candidate[],
    getDemoItem: (id: string) => {
      const candidate = getDemoCandidate(id);
      if (!candidate) return null;
      return {
        ...candidate,
        createdAt: new Date(candidate.createdAt),
        updatedAt: new Date(candidate.updatedAt),
        phone: candidate.phone || null,
        resumeUrl: candidate.resumeUrl || null,
        resumeParsed: false,
        skills: [],
        experienceLevel: 'mid' as const,
        totalYearsExperience: null,
        educationLevel: null,
        currentJobTitle: null,
        searchableContent: null,
        summary: null,
        education: null
      } as Candidate;
    },
    refetchInterval: options.refetchInterval || 120000, // 2 minutes default
    staleTime: 5 * 60 * 1000, // 5 minutes for candidates - performance optimization
  })
  return result
}

export function useCandidate(id?: string) {
  const getDemoCandidate = (candidateId: string) => {
    return demoCandidates.find(candidate => candidate.id === candidateId) || null
  }
  
  return useGenericItem<Candidate>('/api/candidates', id, (candidateId: string) => {
    const candidate = getDemoCandidate(candidateId);
    if (!candidate) return null;
    return {
      ...candidate,
      createdAt: new Date(candidate.createdAt),
      updatedAt: new Date(candidate.updatedAt),
      phone: candidate.phone || null,
      resumeUrl: candidate.resumeUrl || null,
      resumeParsed: false,
      skills: [],
      experienceLevel: 'mid' as const,
      totalYearsExperience: null,
      educationLevel: null,
      currentJobTitle: null,
      searchableContent: null,
      summary: null,
      education: null
    } as Candidate;
  })
}

export function useCreateCandidate() {
  return useGenericCreate<Candidate, InsertCandidate>('/api/candidates', '/api/candidates')
}