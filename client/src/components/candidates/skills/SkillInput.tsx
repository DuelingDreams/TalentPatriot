/**
 * SkillInput - Input component for adding new skills with autocomplete and proficiency selection
 */

import { useState, useCallback, useRef } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { normalizeSkills } from '@/lib/skills/normalize'
import { getOrgSkillSuggestions } from '@/lib/supabase/candidatesSkills'
import type { Proficiency, SkillsConfig } from '@/lib/skills/types'

interface SkillInputProps {
  orgId: string
  config: SkillsConfig
  onAddSkills: (skills: string[], proficiency?: Proficiency) => Promise<void>
  className?: string
  placeholder?: string
  disabled?: boolean
}

/**
 * Input component for adding new skills with autocomplete and proficiency selection
 */
export function SkillInput({
  orgId,
  config,
  onAddSkills,
  className,
  placeholder = "Add skills (e.g., React, Python, Project Management)",
  disabled = false
}: SkillInputProps) {
  const [input, setInput] = useState('')
  const [proficiency, setProficiency] = useState<Proficiency | ''>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Fetch skill suggestions for autocomplete
  const { data: suggestions = [] } = useQuery({
    queryKey: ['org-skill-suggestions', orgId],
    queryFn: () => getOrgSkillSuggestions(orgId),
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000 // 5 minutes
  })

  // Filter suggestions based on current input
  const filteredSuggestions = suggestions
    .filter(skill => 
      skill.toLowerCase().includes(input.toLowerCase().trim()) && 
      input.trim().length > 0
    )
    .slice(0, 8) // Limit to 8 suggestions

  // Handle form submission
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault()
    
    if (!input.trim() || isSubmitting) return

    try {
      setIsSubmitting(true)
      
      // Parse and normalize skills (supports comma-separated)
      const skillsToAdd = normalizeSkills(input.trim())
      
      if (skillsToAdd.length === 0) return

      // Add skills with optional proficiency
      await onAddSkills(
        skillsToAdd, 
        config.enableProficiencyUI && proficiency ? proficiency as Proficiency : undefined
      )

      // Clear form
      setInput('')
      if (config.enableProficiencyUI) {
        setProficiency('')
      }
      setShowSuggestions(false)
      
      // Focus back to input
      inputRef.current?.focus()
    } catch (error) {
      console.error('Error adding skills:', error)
    } finally {
      setIsSubmitting(false)
    }
  }, [input, proficiency, config.enableProficiencyUI, onAddSkills, isSubmitting])

  // Handle suggestion click
  const handleSuggestionClick = useCallback((suggestion: string) => {
    setInput(suggestion)
    setShowSuggestions(false)
    inputRef.current?.focus()
  }, [])

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInput(value)
    setShowSuggestions(value.trim().length > 0 && filteredSuggestions.length > 0)
  }, [filteredSuggestions.length])

  // Handle input focus
  const handleInputFocus = useCallback(() => {
    if (input.trim().length > 0 && filteredSuggestions.length > 0) {
      setShowSuggestions(true)
    }
  }, [input, filteredSuggestions.length])

  // Handle input blur (with delay to allow suggestion clicks)
  const handleInputBlur = useCallback(() => {
    setTimeout(() => setShowSuggestions(false), 150)
  }, [])

  return (
    <div className={cn('space-y-3', className)}>
      {/* Main input form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              ref={inputRef}
              type="text"
              value={input}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              placeholder={placeholder}
              disabled={disabled || isSubmitting}
              className="pr-10"
              data-testid="input-add-skill"
            />
            
            {/* Suggestions dropdown */}
            {showSuggestions && filteredSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                {filteredSuggestions.map((suggestion, index) => (
                  <button
                    key={suggestion}
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                    onClick={() => handleSuggestionClick(suggestion)}
                    data-testid={`suggestion-${suggestion.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Proficiency selector (if enabled) */}
          {config.enableProficiencyUI && (
            <div className="w-36">
              <Select value={proficiency} onValueChange={setProficiency} disabled={disabled || isSubmitting}>
                <SelectTrigger data-testid="select-proficiency-level">
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Expert">Expert</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Add button */}
          <Button
            type="submit"
            disabled={!input.trim() || isSubmitting}
            size="default"
            data-testid="button-add-skills"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            <span className="sr-only">Add skills</span>
          </Button>
        </div>

        {/* Help text */}
        <p className="text-xs text-gray-500">
          Tip: You can add multiple skills separated by commas (e.g., "React, TypeScript, Node.js")
        </p>
      </form>

      {/* Quick add suggestions (popular skills) */}
      {suggestions.length > 0 && input.trim().length === 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-600">Popular skills in your organization:</p>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.slice(0, 6).map((skill) => (
              <Badge
                key={skill}
                variant="outline"
                className="cursor-pointer hover:bg-gray-50 text-xs"
                onClick={() => handleSuggestionClick(skill)}
                data-testid={`quick-add-${skill.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <Plus className="h-3 w-3 mr-1" />
                {skill}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}