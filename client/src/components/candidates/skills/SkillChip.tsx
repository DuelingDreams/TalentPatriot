/**
 * SkillChip - Individual skill display with optional proficiency and remove action
 */

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type SkillProficiency = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'

interface SkillChipProps {
  name: string
  onRemove?: () => void
  proficiency?: SkillProficiency
  className?: string
  variant?: 'default' | 'secondary' | 'outline'
  size?: 'sm' | 'default' | 'lg'
}

const proficiencyColors: Record<SkillProficiency, string> = {
  'Beginner': 'text-blue-600 bg-blue-50',
  'Intermediate': 'text-green-600 bg-green-50', 
  'Advanced': 'text-orange-600 bg-orange-50',
  'Expert': 'text-purple-600 bg-purple-50'
}

const proficiencyShorthand: Record<SkillProficiency, string> = {
  'Beginner': 'B',
  'Intermediate': 'I',
  'Advanced': 'A', 
  'Expert': 'E'
}

export function SkillChip({ 
  name, 
  onRemove, 
  proficiency, 
  className,
  variant = 'default',
  size = 'default'
}: SkillChipProps) {
  const isRemovable = !!onRemove
  
  return (
    <div 
      className={cn(
        "inline-flex items-center gap-1 max-w-full",
        className
      )}
      data-testid={`skill-chip-${name.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <Badge 
        variant={variant}
        className={cn(
          "flex items-center gap-1 text-sm font-medium transition-colors",
          size === 'sm' && "text-xs px-2 py-0.5",
          size === 'lg' && "text-base px-3 py-1",
          isRemovable && "pr-1"
        )}
      >
        <span className="truncate max-w-[200px]" title={name}>
          {name}
        </span>
        
        {proficiency && (
          <span 
            className={cn(
              "ml-1 px-1.5 py-0.5 rounded text-xs font-bold",
              proficiencyColors[proficiency]
            )}
            title={`Proficiency: ${proficiency}`}
            aria-label={`Proficiency level: ${proficiency}`}
          >
            {proficiencyShorthand[proficiency]}
          </span>
        )}
        
        {isRemovable && (
          <Button
            variant="ghost"
            size="sm"
            className="h-4 w-4 p-0 ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onRemove()
            }}
            aria-label={`Remove ${name} skill`}
            data-testid={`remove-skill-${name.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </Badge>
    </div>
  )
}

/**
 * SkillChipList - Container for multiple skill chips with proper wrapping
 */
interface SkillChipListProps {
  skills: Array<{
    name: string
    proficiency?: SkillProficiency
  }>
  onRemoveSkill?: (skillName: string) => void
  className?: string
  variant?: 'default' | 'secondary' | 'outline'
  size?: 'sm' | 'default' | 'lg'
  maxVisible?: number
}

export function SkillChipList({ 
  skills, 
  onRemoveSkill, 
  className,
  variant,
  size,
  maxVisible 
}: SkillChipListProps) {
  const displaySkills = maxVisible ? skills.slice(0, maxVisible) : skills
  const hiddenCount = maxVisible && skills.length > maxVisible ? skills.length - maxVisible : 0
  
  if (skills.length === 0) {
    return (
      <div 
        className={cn("text-sm text-muted-foreground italic", className)}
        data-testid="skills-empty-state"
      >
        No skills added yet
      </div>
    )
  }
  
  return (
    <div 
      className={cn(
        "flex flex-wrap gap-2",
        className
      )}
      data-testid="skills-chip-list"
    >
      {displaySkills.map((skill, index) => (
        <SkillChip
          key={`${skill.name}-${index}`}
          name={skill.name}
          proficiency={skill.proficiency}
          onRemove={onRemoveSkill ? () => onRemoveSkill(skill.name) : undefined}
          variant={variant}
          size={size}
        />
      ))}
      
      {hiddenCount > 0 && (
        <Badge 
          variant="outline" 
          className="text-xs text-muted-foreground"
          data-testid="skills-overflow-indicator"
        >
          +{hiddenCount} more
        </Badge>
      )}
    </div>
  )
}

export default SkillChip