import { useMemo } from 'react'
import { SkillChip } from './SkillChip'
import { ProficiencyBadge, getProficiencyOrder } from './ProficiencyBadge'
import type { Proficiency, SkillsConfig } from '@/lib/skills/types'
import { cn } from '@/lib/utils'

interface SkillsGridProps {
  skills: string[]
  profMap: Record<string, Proficiency> | null
  config: SkillsConfig
  onRemoveSkill: (skill: string) => void
  onSetProficiency?: (skill: string, proficiency: Proficiency) => void
  className?: string
  readonly?: boolean
  groupBy?: 'proficiency' | 'alphabetical' | 'none'
  size?: 'sm' | 'md' | 'lg'
}

/**
 * Displays skills in an organized grid with optional grouping
 */
export function SkillsGrid({
  skills,
  profMap,
  config,
  onRemoveSkill,
  onSetProficiency,
  className,
  readonly = false,
  groupBy = 'proficiency',
  size = 'md'
}: SkillsGridProps) {
  // Group and sort skills based on the groupBy option
  const organizedSkills = useMemo(() => {
    if (skills.length === 0) return {}

    switch (groupBy) {
      case 'proficiency':
        if (!config.enableProficiencyUI || !profMap) {
          // Fallback to alphabetical if proficiency not available
          return { 'All Skills': skills.sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' })) }
        }

        const groups: Record<string, string[]> = {}
        
        // Add skills with proficiency
        skills.forEach(skill => {
          const proficiency = profMap[skill]
          if (proficiency) {
            if (!groups[proficiency]) groups[proficiency] = []
            groups[proficiency].push(skill)
          } else {
            if (!groups['Unspecified']) groups['Unspecified'] = []
            groups['Unspecified'].push(skill)
          }
        })

        // Sort groups by proficiency order
        const sortedGroups: Record<string, string[]> = {}
        
        // First add proficiency groups in order
        const proficiencyLevels: Proficiency[] = ['Expert', 'Advanced', 'Intermediate', 'Beginner']
        proficiencyLevels.forEach(level => {
          if (groups[level]) {
            sortedGroups[level] = groups[level].sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }))
          }
        })
        
        // Add unspecified last
        if (groups['Unspecified']) {
          sortedGroups['Unspecified'] = groups['Unspecified'].sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }))
        }
        
        return sortedGroups

      case 'alphabetical':
        const alphabeticalGroups: Record<string, string[]> = {}
        const sortedSkills = [...skills].sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }))
        
        sortedSkills.forEach(skill => {
          const firstLetter = skill.charAt(0).toUpperCase()
          if (!alphabeticalGroups[firstLetter]) {
            alphabeticalGroups[firstLetter] = []
          }
          alphabeticalGroups[firstLetter].push(skill)
        })
        
        return alphabeticalGroups

      case 'none':
      default:
        return { 'Skills': skills.sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' })) }
    }
  }, [skills, profMap, config.enableProficiencyUI, groupBy])

  if (skills.length === 0) {
    return (
      <div 
        className={cn(
          'flex flex-col items-center justify-center py-8 text-center border-2 border-dashed border-gray-200 rounded-lg',
          className
        )}
        data-testid="skills-empty-state"
      >
        <p className="text-gray-500 text-sm">No skills added yet</p>
        <p className="text-gray-400 text-xs mt-1">Start adding skills using the input above</p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)} data-testid="skills-grid">
      {Object.entries(organizedSkills).map(([groupName, groupSkills]) => (
        <div key={groupName} className="space-y-2">
          {/* Group header (only show if there are multiple groups) */}
          {Object.keys(organizedSkills).length > 1 && (
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-medium text-gray-700 capitalize">
                {groupName}
              </h4>
              {config.enableProficiencyUI && groupName !== 'Unspecified' && groupName !== 'All Skills' && groupName.length === 1 === false && (
                <ProficiencyBadge 
                  proficiency={groupName as Proficiency} 
                  size="sm" 
                />
              )}
              <span className="text-xs text-gray-400">
                ({groupSkills.length})
              </span>
            </div>
          )}

          {/* Skills grid */}
          <div 
            className="flex flex-wrap gap-2"
            data-testid={`skills-group-${groupName.toLowerCase().replace(/\s+/g, '-')}`}
          >
            {groupSkills.map((skill) => (
              <SkillChip
                key={skill}
                skill={skill}
                proficiency={profMap?.[skill] || null}
                config={config}
                onRemove={onRemoveSkill}
                onSetProficiency={onSetProficiency}
                size={size}
                readonly={readonly}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Compact skills list for preview/summary displays
 */
export function SkillsPreview({
  skills,
  profMap,
  config,
  maxVisible = 6,
  className
}: {
  skills: string[]
  profMap: Record<string, Proficiency> | null
  config: SkillsConfig
  maxVisible?: number
  className?: string
}) {
  const displaySkills = skills.slice(0, maxVisible)
  const hiddenCount = skills.length - maxVisible

  if (skills.length === 0) {
    return (
      <p className={cn('text-sm text-gray-500 italic', className)}>
        No skills added
      </p>
    )
  }

  return (
    <div className={cn('flex flex-wrap gap-1.5', className)} data-testid="skills-preview">
      {displaySkills.map((skill) => (
        <SkillChip
          key={skill}
          skill={skill}
          proficiency={profMap?.[skill] || null}
          config={config}
          onRemove={() => {}} // No remove action in preview
          size="sm"
          readonly={true}
        />
      ))}
      
      {hiddenCount > 0 && (
        <span className="inline-flex items-center px-2 py-1 text-xs text-gray-500 bg-gray-100 rounded-md">
          +{hiddenCount} more
        </span>
      )}
    </div>
  )
}