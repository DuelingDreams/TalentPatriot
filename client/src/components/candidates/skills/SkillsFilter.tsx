import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getOrgSkillSuggestions } from '@/lib/supabase/candidatesSkills'
import { normalizeSkills } from '@/lib/skills/normalize'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Search, X, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SkillsFilterProps {
  selectedSkills: string[]
  onSkillsChange: (skills: string[]) => void
  placeholder?: string
  className?: string
  'data-testid'?: string
}

export function SkillsFilter({ 
  selectedSkills, 
  onSkillsChange, 
  placeholder = "Filter by skills...",
  className = "",
  'data-testid': dataTestId = "skills-filter"
}: SkillsFilterProps) {
  const { currentOrgId } = useAuth()
  const [isExpanded, setIsExpanded] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [allOrgSkills, setAllOrgSkills] = useState<string[]>([])

  // Load org skills for suggestions
  useEffect(() => {
    if (!currentOrgId) return

    const loadOrgSkills = async () => {
      try {
        const orgSkills = await getOrgSkillSuggestions(currentOrgId)
        setAllOrgSkills(orgSkills)
      } catch (error) {
        console.error('Failed to load org skills:', error)
        setAllOrgSkills([])
      }
    }

    loadOrgSkills()
  }, [currentOrgId])

  // Update suggestions based on input
  useEffect(() => {
    if (!inputValue.trim()) {
      setSuggestions([])
      return
    }

    const inputLower = inputValue.toLowerCase()
    const filtered = allOrgSkills
      .filter(skill => 
        skill.toLowerCase().includes(inputLower) && 
        !selectedSkills.some(selected => selected.toLowerCase() === skill.toLowerCase())
      )
      .slice(0, 10) // Limit suggestions

    setSuggestions(filtered)
  }, [inputValue, allOrgSkills, selectedSkills])

  const handleAddSkill = (skill: string) => {
    const normalized = normalizeSkills([skill])[0]
    if (!normalized || selectedSkills.some(s => s.toLowerCase() === normalized.toLowerCase())) {
      return
    }

    onSkillsChange([...selectedSkills, normalized])
    setInputValue('')
    setSuggestions([])
  }

  const handleRemoveSkill = (skillToRemove: string) => {
    onSkillsChange(selectedSkills.filter(skill => skill !== skillToRemove))
  }

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault()
      handleAddSkill(inputValue.trim())
    } else if (e.key === 'Escape') {
      setInputValue('')
      setSuggestions([])
      setIsExpanded(false)
    }
  }

  const handleClearAll = () => {
    onSkillsChange([])
    setInputValue('')
    setSuggestions([])
  }

  return (
    <div className={`relative ${className}`} data-testid={dataTestId}>
      {/* Trigger Button/Input */}
      {!isExpanded && selectedSkills.length === 0 ? (
        <Button
          variant="outline"
          onClick={() => setIsExpanded(true)}
          className="w-full justify-start text-muted-foreground"
          data-testid="skills-filter-trigger"
        >
          <Tag className="w-4 h-4 mr-2" />
          {placeholder}
        </Button>
      ) : (
        <div className="space-y-2">
          {/* Selected Skills */}
          {selectedSkills.length > 0 && (
            <div className="flex flex-wrap gap-1" data-testid="selected-skills">
              {selectedSkills.map((skill) => (
                <Badge 
                  key={skill} 
                  variant="secondary" 
                  className="px-2 py-1 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                  data-testid={`selected-skill-${skill}`}
                >
                  {skill}
                  <button
                    onClick={() => handleRemoveSkill(skill)}
                    className="ml-1 hover:text-blue-900"
                    data-testid={`remove-skill-${skill}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="h-6 px-2 text-xs text-muted-foreground"
                data-testid="clear-all-skills"
              >
                Clear all
              </Button>
            </div>
          )}

          {/* Input Field */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleInputKeyDown}
              onFocus={() => setIsExpanded(true)}
              placeholder={selectedSkills.length > 0 ? "Add more skills..." : placeholder}
              className="pl-10"
              data-testid="skills-filter-input"
            />
            {(isExpanded || selectedSkills.length > 0) && (
              <button
                onClick={() => {
                  setIsExpanded(false)
                  setInputValue('')
                  setSuggestions([])
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                data-testid="close-skills-filter"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto">
              <CardContent className="p-2">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => handleAddSkill(suggestion)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted rounded-md transition-colors"
                    data-testid={`skill-suggestion-${suggestion}`}
                  >
                    {suggestion}
                  </button>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}