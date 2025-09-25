import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Proficiency } from '@/lib/skills/types'
import { PROFICIENCY_COLORS, PROFICIENCY_ORDER } from '@/lib/skills/types'

interface ProficiencyBadgeProps {
  proficiency: Proficiency
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * Displays a proficiency level badge with appropriate styling
 */
export function ProficiencyBadge({ 
  proficiency, 
  size = 'sm', 
  className 
}: ProficiencyBadgeProps) {
  const colorClass = PROFICIENCY_COLORS[proficiency]
  
  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  }

  return (
    <Badge
      variant="secondary"
      className={cn(
        sizeClasses[size],
        'font-medium border transition-colors',
        colorClass,
        className
      )}
      data-testid={`badge-proficiency-${proficiency.toLowerCase()}`}
    >
      {proficiency}
    </Badge>
  )
}

/**
 * Utility function to get the numeric order of a proficiency level
 * Used for sorting skills by proficiency
 */
export function getProficiencyOrder(proficiency: Proficiency): number {
  return PROFICIENCY_ORDER[proficiency] || 0
}

/**
 * Utility function to compare two proficiency levels
 * Returns positive if a > b, negative if a < b, 0 if equal
 */
export function compareProficiency(a: Proficiency, b: Proficiency): number {
  return getProficiencyOrder(a) - getProficiencyOrder(b)
}