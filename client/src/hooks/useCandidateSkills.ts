/**
 * Hook for managing candidate skills with optional proficiency support
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/shared/hooks/use-toast'
import { 
  fetchCandidateSkills, 
  saveCandidateSkills, 
  getProficiencyMap, 
  setProficiencyMap 
} from '@/lib/supabase/candidatesSkills'
import type { Proficiency, SkillsConfig } from '@/lib/skills/types'

interface UseCandidateSkillsOptions {
  enableProficiencyUI?: boolean
}

interface UseCandidateSkillsReturn {
  skills: string[]
  profMap: Record<string, Proficiency> | null
  config: SkillsConfig
  isLoading: boolean
  error: Error | null
  addSkills: (newSkills: string[], proficiency?: Proficiency) => Promise<void>
  removeSkill: (skillName: string) => Promise<void>
  setSkillProficiency: (skillName: string, proficiency: Proficiency) => Promise<void>
  refetch: () => Promise<void>
}

/**
 * Hook for managing candidate skills with optional proficiency support
 * @param candidateId - The candidate ID
 * @param orgId - The organization ID (for cache invalidation)
 * @param options - Configuration options
 * @returns Skills state and management functions
 */
export function useCandidateSkills(
  candidateId: string,
  orgId: string,
  options: UseCandidateSkillsOptions = {}
): UseCandidateSkillsReturn {
  const { enableProficiencyUI = false } = options
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Optimistic update state
  const [optimisticSkills, setOptimisticSkills] = useState<string[] | null>(null)
  const [optimisticProfMap, setOptimisticProfMap] = useState<Record<string, Proficiency> | null>(null)

  // Query for skills
  const { 
    data: skillsData = [], 
    isLoading: skillsLoading, 
    error: skillsError,
    refetch: refetchSkills
  } = useQuery({
    queryKey: ['candidate-skills', candidateId],
    queryFn: () => fetchCandidateSkills(candidateId),
    enabled: !!candidateId,
    staleTime: 30000 // 30 seconds
  })

  // Query for proficiency map (always check if skill_levels column exists)
  const { 
    data: proficiencyData, 
    isLoading: proficiencyLoading,
    error: proficiencyError,
    refetch: refetchProficiency
  } = useQuery({
    queryKey: ['candidate-proficiency', candidateId],
    queryFn: () => getProficiencyMap(candidateId),
    enabled: !!candidateId,
    staleTime: 30000 // 30 seconds
  })

  // Check environment variable for proficiency UI
  const envProficiencyEnabled = import.meta.env.ENABLE_PROFICIENCY_UI === 'true'

  // Configuration object
  const config: SkillsConfig = useMemo(() => ({
    enableProficiencyUI: enableProficiencyUI || envProficiencyEnabled || proficiencyData !== null,
    hasProficiencyData: proficiencyData !== null && Object.keys(proficiencyData || {}).length > 0
  }), [enableProficiencyUI, envProficiencyEnabled, proficiencyData])

  // Final skills and proficiency state (with optimistic updates)
  const skills = optimisticSkills ?? skillsData
  const profMap = optimisticProfMap ?? (config.enableProficiencyUI ? (proficiencyData ?? null) : null)
  const isLoading = skillsLoading || (config.enableProficiencyUI && proficiencyLoading)
  const error = skillsError || proficiencyError

  // Clear optimistic state when real data loads
  useEffect(() => {
    if (!skillsLoading && optimisticSkills !== null) {
      setOptimisticSkills(null)
    }
  }, [skillsLoading, optimisticSkills])

  useEffect(() => {
    if (!proficiencyLoading && optimisticProfMap !== null) {
      setOptimisticProfMap(null)
    }
  }, [proficiencyLoading, optimisticProfMap])

  // Refetch function
  const refetch = useCallback(async () => {
    await Promise.all([
      refetchSkills(),
      config.enableProficiencyUI ? refetchProficiency() : Promise.resolve()
    ])
  }, [refetchSkills, refetchProficiency, config.enableProficiencyUI])

  // Add skills function with optimistic updates
  const addSkills = useCallback(async (newSkills: string[], proficiency?: Proficiency) => {
    if (!newSkills.length) return

    try {
      // Optimistic update for skills
      const currentSkills = optimisticSkills ?? skillsData
      const updatedSkills = [...currentSkills, ...newSkills]
      setOptimisticSkills(updatedSkills)

      // Optimistic update for proficiency map if enabled
      if (config.enableProficiencyUI && proficiency) {
        const currentProfMap = optimisticProfMap ?? proficiencyData ?? {}
        const updatedProfMap = { ...currentProfMap }
        newSkills.forEach(skill => {
          updatedProfMap[skill] = proficiency
        })
        setOptimisticProfMap(updatedProfMap)
      }

      // Save skills to database
      await saveCandidateSkills(candidateId, updatedSkills)

      // Save proficiency map if enabled and proficiency provided
      if (config.enableProficiencyUI && proficiency) {
        const finalProfMap = { ...(proficiencyData ?? {}), ...Object.fromEntries(newSkills.map(skill => [skill, proficiency])) }
        await setProficiencyMap(candidateId, finalProfMap)
      }

      // Invalidate queries to refetch fresh data
      await queryClient.invalidateQueries({ queryKey: ['candidate-skills', candidateId] })
      if (config.enableProficiencyUI) {
        await queryClient.invalidateQueries({ queryKey: ['candidate-proficiency', candidateId] })
      }

      toast({
        title: 'Skills Added',
        description: `Added ${newSkills.length} skill${newSkills.length === 1 ? '' : 's'} successfully.`
      })
    } catch (error) {
      console.error('Error adding skills:', error)
      
      // Rollback optimistic updates
      setOptimisticSkills(null)
      setOptimisticProfMap(null)
      
      toast({
        title: 'Error Adding Skills',
        description: error instanceof Error ? error.message : 'Failed to add skills',
        variant: 'destructive'
      })
      
      throw error
    }
  }, [candidateId, skillsData, proficiencyData, optimisticSkills, optimisticProfMap, config.enableProficiencyUI, queryClient, toast])

  // Remove skill function with optimistic updates
  const removeSkill = useCallback(async (skillName: string) => {
    try {
      // Optimistic update for skills
      const currentSkills = optimisticSkills ?? skillsData
      const updatedSkills = currentSkills.filter(skill => skill !== skillName)
      setOptimisticSkills(updatedSkills)

      // Optimistic update for proficiency map if enabled
      if (config.enableProficiencyUI && profMap) {
        const updatedProfMap = { ...profMap }
        delete updatedProfMap[skillName]
        setOptimisticProfMap(updatedProfMap)
      }

      // Save to database
      await saveCandidateSkills(candidateId, updatedSkills)

      // Update proficiency map if enabled
      if (config.enableProficiencyUI && profMap) {
        const updatedProfMap = { ...profMap }
        delete updatedProfMap[skillName]
        await setProficiencyMap(candidateId, updatedProfMap)
      }

      // Invalidate queries
      await queryClient.invalidateQueries({ queryKey: ['candidate-skills', candidateId] })
      if (config.enableProficiencyUI) {
        await queryClient.invalidateQueries({ queryKey: ['candidate-proficiency', candidateId] })
      }

      toast({
        title: 'Skill Removed',
        description: `Removed "${skillName}" successfully.`
      })
    } catch (error) {
      console.error('Error removing skill:', error)
      
      // Rollback optimistic updates
      setOptimisticSkills(null)
      setOptimisticProfMap(null)
      
      toast({
        title: 'Error Removing Skill',
        description: error instanceof Error ? error.message : 'Failed to remove skill',
        variant: 'destructive'
      })
      
      throw error
    }
  }, [candidateId, skillsData, profMap, optimisticSkills, optimisticProfMap, config.enableProficiencyUI, queryClient, toast])

  // Set skill proficiency function (only works if proficiency is enabled)
  const setSkillProficiency = useCallback(async (skillName: string, proficiency: Proficiency) => {
    if (!config.enableProficiencyUI) {
      console.warn('Proficiency UI is disabled - skipping proficiency update')
      return
    }

    try {
      // Optimistic update for proficiency map
      const currentProfMap = optimisticProfMap ?? proficiencyData ?? {}
      const updatedProfMap = { ...currentProfMap, [skillName]: proficiency }
      setOptimisticProfMap(updatedProfMap)

      // Save to database
      await setProficiencyMap(candidateId, updatedProfMap)

      // Invalidate queries
      await queryClient.invalidateQueries({ queryKey: ['candidate-proficiency', candidateId] })

      toast({
        title: 'Proficiency Updated',
        description: `Set "${skillName}" to ${proficiency} level.`
      })
    } catch (error) {
      console.error('Error setting skill proficiency:', error)
      
      // Rollback optimistic updates
      setOptimisticProfMap(null)
      
      toast({
        title: 'Error Updating Proficiency',
        description: error instanceof Error ? error.message : 'Failed to update proficiency',
        variant: 'destructive'
      })
      
      throw error
    }
  }, [candidateId, proficiencyData, optimisticProfMap, config.enableProficiencyUI, queryClient, toast])

  return {
    skills,
    profMap,
    config,
    isLoading,
    error,
    addSkills,
    removeSkill,
    setSkillProficiency,
    refetch
  }
}

