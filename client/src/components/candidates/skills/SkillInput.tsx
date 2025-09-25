/**
 * SkillInput - Advanced input component for adding skills with autocomplete and proficiency
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Plus, Loader2, ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getDebouncedOrgSkillSuggestions } from '@/lib/supabase/candidatesSkills'
import { normalizeSkills, combineSkillWithProficiency } from '@/lib/skills/normalize'
import type { SkillProficiency } from './SkillChip'

interface SkillInputProps {
  orgId: string
  onAdd: (skills: string[], proficiency?: SkillProficiency) => void
  className?: string
  placeholder?: string
  disabled?: boolean
}

interface SkillWithProficiency {
  name: string
  proficiency?: SkillProficiency
}

export function SkillInput({ 
  orgId, 
  onAdd, 
  className,
  placeholder = "Type a skill...",
  disabled = false
}: SkillInputProps) {
  // State management
  const [inputValue, setInputValue] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const [selectedProficiency, setSelectedProficiency] = useState<SkillProficiency>('Intermediate')
  const [bulkText, setBulkText] = useState('')
  const [isAddingBulk, setIsAddingBulk] = useState(false)
  
  // Refs for focus management
  const inputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Debounced suggestions loading
  const loadSuggestions = useCallback(async (query: string) => {
    if (!orgId || query.length < 1) {
      setSuggestions([])
      return
    }
    
    setIsLoadingSuggestions(true)
    try {
      const results = await getDebouncedOrgSkillSuggestions(orgId, query, 15)
      setSuggestions(results)
    } catch (error) {
      console.error('Error loading skill suggestions:', error)
      setSuggestions([])
    } finally {
      setIsLoadingSuggestions(false)
    }
  }, [orgId])

  // Effect for loading suggestions when input changes
  useEffect(() => {
    loadSuggestions(inputValue)
  }, [inputValue, loadSuggestions])

  // Add single skill
  const handleAddSingle = useCallback(() => {
    if (!inputValue.trim()) return
    
    // Combine skill with proficiency before normalizing
    const skillWithProficiency = combineSkillWithProficiency(inputValue.trim(), selectedProficiency)
    const normalizedSkills = normalizeSkills([skillWithProficiency])
    
    if (normalizedSkills.length > 0) {
      onAdd(normalizedSkills) // Remove proficiency param since it's now encoded in the string
      setInputValue('')
      setIsPopoverOpen(false)
      
      // Focus back to input for better UX
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [inputValue, selectedProficiency, onAdd])

  // Add bulk skills
  const handleAddBulk = useCallback(() => {
    if (!bulkText.trim()) return
    
    setIsAddingBulk(true)
    try {
      // Parse skills and add proficiency to each
      const rawSkills = normalizeSkills(bulkText)
      const skillsWithProficiency = rawSkills.map(skill => 
        combineSkillWithProficiency(skill, selectedProficiency)
      )
      
      if (skillsWithProficiency.length > 0) {
        onAdd(skillsWithProficiency) // Remove proficiency param since it's encoded
        setBulkText('')
        
        // Focus back to input
        setTimeout(() => inputRef.current?.focus(), 100)
      }
    } catch (error) {
      console.error('Error adding bulk skills:', error)
    } finally {
      setIsAddingBulk(false)
    }
  }, [bulkText, selectedProficiency, onAdd])

  // Handle key events
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAddSingle()
    } else if (e.key === 'Escape') {
      setIsPopoverOpen(false)
      inputRef.current?.blur()
    }
  }, [handleAddSingle])

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback((suggestion: string) => {
    setInputValue(suggestion)
    setIsPopoverOpen(false)
    // Auto-add the suggestion
    setTimeout(() => handleAddSingle(), 50)
  }, [handleAddSingle])

  // Filter suggestions that don't match current input
  const filteredSuggestions = suggestions.filter(suggestion =>
    suggestion.toLowerCase().includes(inputValue.toLowerCase())
  )

  // Check if current input would create a new skill
  const isNewSkill = inputValue.trim() && !filteredSuggestions.some(
    s => s.toLowerCase() === inputValue.toLowerCase()
  )

  return (
    <div className={cn("space-y-4", className)} data-testid="skill-input-container">
      {/* Single Skill Input with Autocomplete */}
      <div className="space-y-2">
        <Label htmlFor="skill-input" className="text-sm font-medium">
          Add Skill
        </Label>
        
        <div className="flex gap-2">
          <div className="flex-1 relative">
            {/* Direct input without Popover wrapper */}
            <Input
              ref={inputRef}
              id="skill-input"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value)
                setIsPopoverOpen(true)
              }}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsPopoverOpen(true)}
              onBlur={() => {
                // Delay closing to allow suggestion selection
                setTimeout(() => setIsPopoverOpen(false), 200)
              }}
              placeholder={placeholder}
              disabled={disabled}
              className="pr-8"
              data-testid="skill-input-field"
              aria-label="Skill name input"
              aria-expanded={isPopoverOpen}
              aria-haspopup="listbox"
              role="combobox"
            />
            {isLoadingSuggestions && (
              <Loader2 className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
            
            {/* Suggestions dropdown */}
            {isPopoverOpen && (inputValue.length > 0 || filteredSuggestions.length > 0) && (
              <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-border rounded-md shadow-lg">
                <Command>
                  <CommandList className="max-h-48">
                    {isLoadingSuggestions ? (
                      <div className="p-2 text-sm text-muted-foreground flex items-center gap-2">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Loading suggestions...
                      </div>
                    ) : (
                      <>
                        {isNewSkill && (
                          <CommandGroup>
                            <CommandItem
                              onSelect={() => handleSuggestionSelect(inputValue)}
                              className="cursor-pointer"
                              data-testid="create-new-skill-option"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Create "{inputValue}"
                            </CommandItem>
                          </CommandGroup>
                        )}
                        
                        {filteredSuggestions.length > 0 && (
                          <CommandGroup heading="Suggestions from your organization">
                            {filteredSuggestions.map((suggestion, index) => (
                              <CommandItem
                                key={suggestion}
                                onSelect={() => handleSuggestionSelect(suggestion)}
                                className="cursor-pointer"
                                data-testid={`suggestion-${index}`}
                              >
                                <Check className="h-4 w-4 mr-2 opacity-0" />
                                {suggestion}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        )}
                        
                        {!isNewSkill && filteredSuggestions.length === 0 && inputValue.length > 0 && (
                          <CommandEmpty>No skills found.</CommandEmpty>
                        )}
                      </>
                    )}
                  </CommandList>
                </Command>
              </div>
            )}
          </div>
          
          {/* Proficiency Selector */}
          <Select value={selectedProficiency} onValueChange={(value) => setSelectedProficiency(value as SkillProficiency)}>
            <SelectTrigger className="w-32" data-testid="proficiency-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Beginner">Beginner</SelectItem>
              <SelectItem value="Intermediate">Intermediate</SelectItem>
              <SelectItem value="Advanced">Advanced</SelectItem>
              <SelectItem value="Expert">Expert</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Add Button */}
          <Button 
            onClick={handleAddSingle}
            disabled={!inputValue.trim() || disabled}
            size="default"
            data-testid="add-skill-button"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
        
        <p className="text-xs text-muted-foreground">
          Org-wide suggestions are learned from existing candidate profiles. Press Enter to add.
        </p>
      </div>

      <Separator />

      {/* Bulk Add Section */}
      <div className="space-y-2">
        <Label htmlFor="bulk-skills" className="text-sm font-medium">
          Add Multiple Skills
        </Label>
        
        <Textarea
          ref={textareaRef}
          id="bulk-skills"
          value={bulkText}
          onChange={(e) => setBulkText(e.target.value)}
          placeholder="Enter skills separated by commas, newlines, or semicolons&#10;Example: JavaScript, React, Node.js, TypeScript"
          disabled={disabled}
          rows={3}
          className="resize-none"
          data-testid="bulk-skills-textarea"
          aria-label="Bulk skills input"
        />
        
        <div className="flex justify-between items-center">
          <p className="text-xs text-muted-foreground">
            Add multiple skills at once. They'll be normalized and deduplicated automatically.
          </p>
          
          <Button 
            onClick={handleAddBulk}
            disabled={!bulkText.trim() || disabled || isAddingBulk}
            variant="outline"
            size="sm"
            data-testid="add-bulk-skills-button"
          >
            {isAddingBulk ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-1" />
            )}
            Add All
          </Button>
        </div>
      </div>
      
      {/* Preview of what would be added */}
      {bulkText.trim() && (
        <Card className="bg-muted/30">
          <CardContent className="p-3">
            <Label className="text-xs font-medium text-muted-foreground">
              Preview ({normalizeSkills(bulkText).length} skills):
            </Label>
            <div className="flex flex-wrap gap-1 mt-2">
              {normalizeSkills(bulkText).slice(0, 10).map((skill, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
              {normalizeSkills(bulkText).length > 10 && (
                <Badge variant="outline" className="text-xs">
                  +{normalizeSkills(bulkText).length - 10} more
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default SkillInput