/**
 * SkillChip - Individual skill display with optional proficiency and edit/remove actions
 */

import { useState } from 'react'
import { X, ChevronDown, Edit2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { ProficiencyBadge } from './ProficiencyBadge'
import type { Proficiency, SkillsConfig } from '@/lib/skills/types'

interface SkillChipProps {
  skill: string
  proficiency?: Proficiency | null
  config: SkillsConfig
  onRemove: (skill: string) => void
  onSetProficiency?: (skill: string, proficiency: Proficiency) => void
  size?: 'sm' | 'md' | 'lg'
  className?: string
  readonly?: boolean
}

/**
 * Individual skill chip with optional proficiency badge and edit actions
 */
export function SkillChip({
  skill,
  proficiency,
  config,
  onRemove,
  onSetProficiency,
  size = 'md',
  readonly = false,
  className
}: SkillChipProps) {
  const [open, setOpen] = useState(false)

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs gap-1',
    md: 'px-3 py-1.5 text-sm gap-1.5',
    lg: 'px-4 py-2 text-base gap-2'
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
    lg: 'h-4 w-4'
  }

  const handleProficiencyChange = (newProficiency: string) => {
    if (onSetProficiency && newProficiency) {
      onSetProficiency(skill, newProficiency as Proficiency)
      setOpen(false)
    }
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    onRemove(skill)
  }

  return (
    <div 
      className={cn(
        'inline-flex items-center rounded-md border border-gray-200 bg-white shadow-sm transition-colors hover:bg-gray-50',
        sizeClasses[size],
        className
      )}
      data-testid={`chip-skill-${skill.toLowerCase().replace(/\s+/g, '-')}`}
    >
      {/* Skill name */}
      <span className="font-medium text-gray-900 truncate">
        {skill}
      </span>

      {/* Proficiency badge (if enabled and present) */}
      {config.enableProficiencyUI && proficiency && (
        <ProficiencyBadge 
          proficiency={proficiency} 
          size={size === 'lg' ? 'md' : 'sm'} 
        />
      )}

      {/* Action buttons */}
      {!readonly && (
        <div className="flex items-center gap-0.5 ml-1">
          {/* Proficiency edit button */}
          {config.enableProficiencyUI && onSetProficiency && (
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100',
                    iconSizes[size]
                  )}
                  data-testid={`button-edit-proficiency-${skill.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <Edit2 className={iconSizes[size]} />
                  <span className="sr-only">Edit proficiency for {skill}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-2" align="start">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Set proficiency level</p>
                  <Select onValueChange={handleProficiencyChange} value={proficiency || ''}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select level..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Expert">Expert</SelectItem>
                      <SelectItem value="Advanced">Advanced</SelectItem>
                      <SelectItem value="Intermediate">Intermediate</SelectItem>
                      <SelectItem value="Beginner">Beginner</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </PopoverContent>
            </Popover>
          )}

          {/* Remove button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            className={cn(
              'p-0 text-gray-400 hover:text-red-600 hover:bg-red-50',
              iconSizes[size]
            )}
            data-testid={`button-remove-skill-${skill.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <X className={iconSizes[size]} />
            <span className="sr-only">Remove {skill}</span>
          </Button>
        </div>
      )}
    </div>
  )
}

