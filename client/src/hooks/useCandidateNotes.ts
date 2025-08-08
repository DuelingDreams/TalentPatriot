import { useQuery, useMutation } from '@tanstack/react-query'
import { apiRequest, queryClient } from '@/lib/queryClient'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'

export function useCandidateNotes(candidateId?: string) {
  const { currentOrgId, userRole } = useAuth()
  
  return useQuery({
    queryKey: ['/api/job-candidates', candidateId, 'notes', { orgId: currentOrgId }],
    queryFn: () => {
      if (userRole === 'demo_viewer') {
        // Return demo notes
        if (candidateId === 'demo-candidate-1') {
          return [
            {
              id: 'demo-note-1',
              candidateId: 'demo-candidate-1',
              authorId: 'demo-user-1',
              authorEmail: 'recruiter@company.com',
              content: 'Initial phone screen went very well. Candidate has strong React and TypeScript experience. Available for next round.',
              isPrivate: 'false',
              createdAt: '2024-07-05T15:30:00Z',
              updatedAt: '2024-07-05T15:30:00Z'
            },
            {
              id: 'demo-note-2',
              candidateId: 'demo-candidate-1',
              authorId: 'demo-user-2',
              authorEmail: 'hiring.manager@company.com',
              content: 'Technical interview completed. Excellent problem-solving skills. Code quality is very high. Recommend moving to final round.',
              isPrivate: 'false',
              createdAt: '2024-07-15T10:15:00Z',
              updatedAt: '2024-07-15T10:15:00Z'
            },
            {
              id: 'demo-note-3',
              candidateId: 'demo-candidate-1',
              authorId: 'current-user',
              authorEmail: 'you@company.com',
              content: 'PRIVATE: Salary expectations are within budget range. She mentioned she\'s also interviewing with competitors.',
              isPrivate: 'true',
              createdAt: '2024-07-16T14:20:00Z',
              updatedAt: '2024-07-16T14:20:00Z'
            }
          ]
        }
        if (candidateId === 'demo-candidate-2') {
          return [
            {
              id: 'demo-note-4',
              candidateId: 'demo-candidate-2',
              authorId: 'demo-user-1',
              authorEmail: 'recruiter@company.com',
              content: 'Product management background is impressive. Good understanding of agile methodology. Scheduling technical deep-dive.',
              isPrivate: 'false',
              createdAt: '2024-07-12T11:00:00Z',
              updatedAt: '2024-07-12T11:00:00Z'
            }
          ]
        }
        return []
      }
      
      if (!candidateId || !currentOrgId) {
        return []
      }
      return apiRequest(`/api/job-candidates/${candidateId}/notes?orgId=${currentOrgId}`)
    },
    enabled: !!candidateId,
  })
}

export function useCreateCandidateNote() {
  const { toast } = useToast()
  const { currentOrgId } = useAuth()
  
  return useMutation({
    mutationFn: async (noteData: any) => {
      const response = await fetch('/api/candidate-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(noteData)
      })
      
      if (!response.ok) {
        throw new Error('Failed to create note')
      }
      
      return response.json()
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch notes for this candidate
      queryClient.invalidateQueries({
        queryKey: ['/api/job-candidates', variables.jobCandidateId, 'notes', { orgId: currentOrgId }]
      })
      
      toast({
        title: "Note created",
        description: "Your note has been saved successfully."
      })
    },
    onError: (error) => {
      toast({
        title: "Failed to create note",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      })
    }
  })
}