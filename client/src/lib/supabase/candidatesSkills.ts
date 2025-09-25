/**
 * Supabase helpers for managing candidate skills
 * Works with the existing candidates.skills text[] column and optional skill_levels jsonb column
 */

import { supabase } from '@/lib/supabase'
import { normalizeSkills, validateSkillsArray } from '@/lib/skills/normalize'
import type { Proficiency } from '@/lib/skills/types'

/**
 * Fetches skills for a specific candidate
 * 
 * @param candidateId - UUID of the candidate
 * @returns Array of skills or empty array if none/null
 */
export async function fetchCandidateSkills(candidateId: string): Promise<string[]> {
  try {
    if (!candidateId) {
      throw new Error('Candidate ID is required')
    }

    const { data, error } = await supabase
      .from('candidates')
      .select('skills')
      .eq('id', candidateId)
      .limit(1)
      .single()

    if (error) {
      console.error('Error fetching candidate skills:', error)
      // If it's an RLS recursion error, return empty array gracefully
      if (error.code === '42P17' || error.message?.includes('infinite recursion')) {
        console.warn('RLS recursion detected, returning empty skills array')
        return []
      }
      throw new Error(`Failed to fetch candidate skills: ${error.message}`)
    }

    // Handle null/undefined skills - return empty array
    if (!data?.skills || !Array.isArray(data.skills)) {
      return []
    }

    // Return normalized skills to ensure consistency
    return normalizeSkills(data.skills)
  } catch (error) {
    console.error('Exception in fetchCandidateSkills:', error)
    // Return empty array rather than throwing to prevent UI crashes
    return []
  }
}

/**
 * Saves skills for a specific candidate
 * 
 * @param candidateId - UUID of the candidate
 * @param nextSkills - Array of skills to save
 */
export async function saveCandidateSkills(candidateId: string, nextSkills: string[]): Promise<void> {
  try {
    if (!candidateId) {
      throw new Error('Candidate ID is required')
    }

    // Normalize and validate skills before saving
    const normalizedSkills = normalizeSkills(nextSkills)
    
    // Validate the normalized skills array
    const validation = validateSkillsArray(normalizedSkills, 100)
    if (!validation.isValid) {
      throw new Error(validation.error || 'Invalid skills array')
    }

    // Ensure canonical A→Z order before save
    const canonicalSkills = [...normalizedSkills].sort((a, b) => 
      a.localeCompare(b, 'en', { sensitivity: 'base' })
    )

    const { error } = await supabase
      .from('candidates')
      .update({ 
        skills: canonicalSkills.length > 0 ? canonicalSkills : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', candidateId)

    if (error) {
      console.error('Error saving candidate skills:', error)
      // If it's an RLS recursion error, throw a user-friendly error
      if (error.code === '42P17' || error.message?.includes('infinite recursion')) {
        throw new Error('Unable to save skills due to a database permission issue. Please contact support.')
      }
      throw new Error(`Failed to save candidate skills: ${error.message}`)
    }

    console.log(`Successfully saved ${canonicalSkills.length} skills for candidate ${candidateId}`)
  } catch (error) {
    console.error('Exception in saveCandidateSkills:', error)
    throw error // Re-throw to allow calling code to handle
  }
}

/**
 * In-memory cache for organization skills suggestions
 */
interface OrgSkillsCache {
  [orgId: string]: {
    skills: string[]
    lastFetched: number
    ttl: number
  }
}

const orgSkillsCache: OrgSkillsCache = {}
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes in milliseconds

/**
 * Gets skill suggestions from existing org data with caching
 * 
 * @param orgId - Organization ID to get suggestions for
 * @param query - Search query to filter suggestions
 * @param limit - Maximum number of suggestions to return (default: 20)
 * @returns Array of skill suggestions matching the query
 */
export async function getOrgSkillSuggestions(
  orgId: string, 
  query: string = '', 
  limit: number = 20
): Promise<string[]> {
  try {
    if (!orgId) {
      return []
    }

    const now = Date.now()
    const cacheKey = orgId
    
    // Check if we have valid cached data
    const cached = orgSkillsCache[cacheKey]
    const isCacheValid = cached && (now - cached.lastFetched) < cached.ttl
    
    let allOrgSkills: string[]
    
    if (isCacheValid) {
      // Use cached data
      allOrgSkills = cached.skills
    } else {
      // Fetch fresh data from Supabase
      try {
        const { data, error } = await supabase
          .from('candidates')
          .select('skills')
          .not('skills', 'is', null)

        if (error) {
          console.error('Error fetching org skills:', error)
          allOrgSkills = []
        } else {
          // Extract and normalize all unique skills from all candidates
          const allSkillsFlat = data
            .map(candidate => candidate.skills || [])
            .flat()
            .filter(Boolean)

          allOrgSkills = Array.from(new Set(normalizeSkills(allSkillsFlat)))
            .sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }))
        }
      } catch (error) {
        console.error('Exception fetching org skills:', error)
        allOrgSkills = []
      }
      
      // Cache the results
      orgSkillsCache[cacheKey] = {
        skills: allOrgSkills,
        lastFetched: now,
        ttl: CACHE_TTL
      }
    }
    
    // Filter by query if provided
    let filteredSkills = allOrgSkills
    if (query && query.trim().length > 0) {
      const queryLower = query.toLowerCase()
      filteredSkills = allOrgSkills.filter(skill => 
        skill.toLowerCase().includes(queryLower)
      )
    }
    
    // Return limited results
    return filteredSkills.slice(0, limit)
  } catch (error) {
    console.error('Exception in getOrgSkillSuggestions:', error)
    return []
  }
}

/**
 * Gets proficiency map for a candidate (if skill_levels column exists)
 * @param candidateId - The candidate ID
 * @returns Proficiency map or null if column doesn't exist
 */
export async function getProficiencyMap(candidateId: string): Promise<Record<string, Proficiency> | null> {
  try {
    const response = await fetch(`/api/candidates/${candidateId}/proficiency`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        return null // Candidate not found or no access
      }
      throw new Error(`Failed to fetch proficiency data: ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    // If there's any error, return null to disable proficiency features
    console.warn('Proficiency data not available:', error)
    return null
  }
}

/**
 * Sets proficiency map for a candidate (if skill_levels column exists)
 * @param candidateId - The candidate ID 
 * @param map - Proficiency map to save
 */
export async function setProficiencyMap(candidateId: string, map: Record<string, Proficiency>): Promise<void> {
  try {
    const response = await fetch(`/api/candidates/${candidateId}/proficiency`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(map),
    })

    if (!response.ok) {
      if (response.status === 404) {
        console.warn('Candidate not found or no access')
        return
      }
      throw new Error(`Failed to save proficiency data: ${response.statusText}`)
    }

    const result = await response.json()
    if (!result.success) {
      console.warn('Proficiency update result:', result.message)
    }
  } catch (error) {
    console.warn('Error setting proficiency map:', error)
    // Don't throw - proficiency is optional
  }
}

/**
 * Clears the skills cache for a specific organization
 * Useful when skills are updated and we want fresh suggestions
 * 
 * @param orgId - Organization ID to clear cache for
 */
export function clearOrgSkillsCache(orgId?: string): void {
  if (orgId) {
    delete orgSkillsCache[orgId]
  } else {
    // Clear all cache
    Object.keys(orgSkillsCache).forEach(key => {
      delete orgSkillsCache[key]
    })
  }
}

/**
 * Debounced wrapper for getOrgSkillSuggestions to prevent excessive API calls
 */
let debounceTimeout: NodeJS.Timeout | null = null

export function getDebouncedOrgSkillSuggestions(
  orgId: string,
  query: string = '',
  limit: number = 20,
  debounceMs: number = 250
): Promise<string[]> {
  return new Promise((resolve) => {
    // Clear existing timeout
    if (debounceTimeout) {
      clearTimeout(debounceTimeout)
    }
    
    // Set new timeout
    debounceTimeout = setTimeout(async () => {
      try {
        const suggestions = await getOrgSkillSuggestions(orgId, query, limit)
        resolve(suggestions)
      } catch (error) {
        console.error('Error in debounced suggestions:', error)
        resolve([])
      }
    }, debounceMs)
  })
}