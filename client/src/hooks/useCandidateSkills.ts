/**
 * Hook for managing candidate skills with optimistic updates
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/shared/hooks/use-toast'
import { 
  fetchCandidateSkills, 
  saveCandidateSkills, 
  clearOrgSkillsCache 
} from '@/lib/supabase/candidatesSkills'
import { normalizeSkills, validateSkillsArray } from '@/lib/skills/normalize'

interface UseCandidateSkillsOptions {
  enabled?: boolean
}

interface UseCandidateSkillsReturn {
  skills: string[]
  isLoading: boolean
  error: Error | null
  addSkills: (newSkills: string[]) => Promise<void>
  removeSkill: (skillName: string) => Promise<void>
  replaceAll: (nextSkills: string[]) => Promise<void>
  refetch: () => void
}

/**
 * Hook for managing candidate skills with optimistic updates and error handling
 * 
 * @param candidateId - UUID of the candidate
 * @param orgId - Organization ID for cache management
 * @param options - Configuration options
 * @returns Skills management interface
 */
export function useCandidateSkills(
  candidateId: string, 
  orgId: string,
  options: UseCandidateSkillsOptions = {}
): UseCandidateSkillsReturn {
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  
  const queryKey = ['candidate-skills', candidateId]
  
  // Query for fetching skills
  const {
    data: skills = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey,
    queryFn: () => fetchCandidateSkills(candidateId),
    enabled: !!candidateId && !!user && (options.enabled !== false),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })

  // Mutation for saving skills
  const saveMutation = useMutation({
    mutationFn: async (nextSkills: string[]) => {
      if (!candidateId) {
        throw new Error('Candidate ID is required')
      }
      
      // Validate before saving
      const validation = validateSkillsArray(nextSkills, 100)
      if (!validation.isValid) {
        throw new Error(validation.error || 'Invalid skills')
      }
      
      await saveCandidateSkills(candidateId, nextSkills)
      return nextSkills
    },
    onMutate: async (nextSkills: string[]) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey })
      
      // Snapshot the previous value
      const previousSkills = queryClient.getQueryData<string[]>(queryKey) || []
      
      // Optimistically update to the new value
      const normalizedSkills = normalizeSkills(nextSkills)
      queryClient.setQueryData(queryKey, normalizedSkills)
      
      // Return context object with snapshot value
      return { previousSkills }
    },
    onSuccess: (savedSkills) => {
      // Clear org skills cache to refresh suggestions
      clearOrgSkillsCache(orgId)
      
      // Show success toast
      toast({
        title: "Skills Updated",
        description: `Successfully saved ${savedSkills.length} skills`,
      })
      
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey })
    },
    onError: (error: Error, _variables, context) => {
      // Rollback to previous value on error
      if (context?.previousSkills) {
        queryClient.setQueryData(queryKey, context.previousSkills)
      }
      
      // Show error toast
      toast({
        title: "Error Updating Skills",
        description: error.message || "Failed to update skills. Please try again.",
        variant: "destructive",
      })
      
      console.error('Error saving candidate skills:', error)
    },
  })

  // Add skills function
  const addSkills = async (newSkills: string[]): Promise<void> => {
    if (!newSkills.length) return
    
    try {
      const currentSkills = queryClient.getQueryData<string[]>(queryKey) || []
      const normalizedNewSkills = normalizeSkills(newSkills)
      
      // Merge with existing skills and remove duplicates
      const mergedSkills = [...currentSkills, ...normalizedNewSkills]
      const uniqueSkills = normalizeSkills(mergedSkills)
      
      await saveMutation.mutateAsync(uniqueSkills)
    } catch (error) {
      // Error is already handled in the mutation
      throw error
    }
  }

  // Remove skill function
  const removeSkill = async (skillName: string): Promise<void> => {
    if (!skillName) return
    
    try {
      const currentSkills = queryClient.getQueryData<string[]>(queryKey) || []
      const filteredSkills = currentSkills.filter(
        skill => skill.toLowerCase() !== skillName.toLowerCase()
      )
      
      await saveMutation.mutateAsync(filteredSkills)
    } catch (error) {
      // Error is already handled in the mutation
      throw error
    }
  }

  // Replace all skills function
  const replaceAll = async (nextSkills: string[]): Promise<void> => {
    try {
      const normalizedSkills = normalizeSkills(nextSkills)
      await saveMutation.mutateAsync(normalizedSkills)
    } catch (error) {
      // Error is already handled in the mutation
      throw error
    }
  }

  return {
    skills,
    isLoading: isLoading || saveMutation.isPending,
    error: error as Error | null,
    addSkills,
    removeSkill,
    replaceAll,
    refetch: () => {
      refetch()
    }
  }
}

/**
 * Specialized hook for adding a single skill with validation
 * 
 * @param candidateId - UUID of the candidate
 * @param orgId - Organization ID
 * @returns Function to add a single skill
 */
export function useAddSingleSkill(candidateId: string, orgId: string) {
  const { addSkills } = useCandidateSkills(candidateId, orgId)
  
  return async (skillName: string): Promise<void> => {
    if (!skillName || !skillName.trim()) {
      throw new Error('Skill name cannot be empty')
    }
    
    await addSkills([skillName.trim()])
  }
}

/**
 * Hook for bulk skills operations
 * 
 * @param candidateId - UUID of the candidate  
 * @param orgId - Organization ID
 * @returns Bulk operations interface
 */
export function useBulkSkillsOperations(candidateId: string, orgId: string) {
  const { replaceAll, skills } = useCandidateSkills(candidateId, orgId)
  const { toast } = useToast()
  
  const clearAllSkills = async (): Promise<void> => {
    try {
      await replaceAll([])
      toast({
        title: "Skills Cleared",
        description: "All skills have been removed",
      })
    } catch (error) {
      // Error handling is done in the mutation
    }
  }
  
  const addBulkSkills = async (skillsText: string): Promise<void> => {
    if (!skillsText || !skillsText.trim()) {
      throw new Error('Skills text cannot be empty')
    }
    
    try {
      // Parse the bulk text (comma/newline separated)
      const newSkills = normalizeSkills(skillsText)
      
      if (newSkills.length === 0) {
        throw new Error('No valid skills found in the text')
      }
      
      // Merge with existing skills
      const mergedSkills = [...skills, ...newSkills]
      const uniqueSkills = normalizeSkills(mergedSkills)
      
      await replaceAll(uniqueSkills)
      
      toast({
        title: "Bulk Skills Added",
        description: `Successfully added ${newSkills.length} skills`,
      })
    } catch (error) {
      toast({
        title: "Error Adding Bulk Skills",
        description: error instanceof Error ? error.message : "Failed to add skills",
        variant: "destructive",
      })
      throw error
    }
  }
  
  return {
    clearAllSkills,
    addBulkSkills,
    currentSkillsCount: skills.length
  }
}