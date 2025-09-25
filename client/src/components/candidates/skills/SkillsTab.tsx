/**
 * SkillsTab - Main skills management interface for candidate profiles
 */

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog'
import { 
  Plus, 
  Trash2, 
  AlertCircle, 
  Loader2, 
  Tag, 
  FileText,
  Users,
  Lightbulb
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { useCandidateSkills, useBulkSkillsOperations } from '@/hooks/useCandidateSkills'
import { SkillChip, SkillChipList } from './SkillChip'
import { SkillInput } from './SkillInput'
import { parseSkillString } from '@/lib/skills/normalize'
import type { SkillProficiency } from './SkillChip'

interface SkillsTabProps {
  candidateId: string
  orgId: string
  className?: string
}

export function SkillsTab({ candidateId, orgId, className }: SkillsTabProps) {
  const { user } = useAuth()
  const [bulkInputText, setBulkInputText] = useState('')
  
  // Main skills hook
  const {
    skills,
    isLoading,
    error,
    addSkills,
    removeSkill,
    refetch
  } = useCandidateSkills(candidateId, orgId)
  
  // Bulk operations hook
  const {
    clearAllSkills,
    addBulkSkills,
    currentSkillsCount
  } = useBulkSkillsOperations(candidateId, orgId)

  // Handle adding skills from SkillInput
  const handleAddSkills = async (newSkills: string[], proficiency?: SkillProficiency) => {
    try {
      await addSkills(newSkills)
    } catch (error) {
      console.error('Error adding skills:', error)
      // Error is already shown via toast in the hook
    }
  }

  // Handle removing a skill
  const handleRemoveSkill = async (skillName: string) => {
    try {
      await removeSkill(skillName)
    } catch (error) {
      console.error('Error removing skill:', error)
      // Error is already shown via toast in the hook
    }
  }

  // Handle bulk text addition
  const handleBulkAdd = async () => {
    if (!bulkInputText.trim()) return
    
    try {
      await addBulkSkills(bulkInputText)
      setBulkInputText('')
    } catch (error) {
      console.error('Error adding bulk skills:', error)
      // Error is already shown via toast in the hook
    }
  }

  // Handle clear all with confirmation
  const handleClearAll = async () => {
    try {
      await clearAllSkills()
    } catch (error) {
      console.error('Error clearing skills:', error)
      // Error is already shown via toast in the hook
    }
  }

  // Loading state
  if (isLoading && !skills.length) {
    return (
      <div className={cn("p-6", className)} data-testid="skills-tab-loading">
        <div className="flex items-center justify-center space-y-4">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-muted-foreground">Loading skills...</span>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className={cn("p-6", className)} data-testid="skills-tab-error">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load skills: {error.message}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refetch}
              className="ml-2"
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className={cn("space-y-6 p-4 md:p-6", className)} data-testid="skills-tab">
      {/* Header with stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Skills & Expertise
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage candidate skills and proficiency levels
          </p>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{currentSkillsCount} skills</span>
          {currentSkillsCount >= 90 && (
            <Alert className="ml-2 p-2">
              <AlertCircle className="h-3 w-3" />
              <AlertDescription className="text-xs">
                Approaching limit (100 max)
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>

      {/* Section 1: Current Skills */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Current Skills
            </span>
            
            {currentSkillsCount > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    data-testid="clear-all-skills-button"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Clear All
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear All Skills?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove all {currentSkillsCount} skills from this candidate. 
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleClearAll}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Clear All Skills
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          {currentSkillsCount === 0 ? (
            <div className="text-center py-8" data-testid="skills-empty-state">
              <Tag className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">No skills added yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Start building this candidate's skill profile by adding their technical expertise below.
              </p>
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Lightbulb className="h-3 w-3" />
                <span>Skills help match candidates to relevant opportunities</span>
              </div>
            </div>
          ) : (
            <ScrollArea className="max-h-[300px]">
              <SkillChipList
                skills={skills.map(skill => {
                  const parsed = parseSkillString(skill)
                  return {
                    name: parsed.name,
                    proficiency: parsed.proficiency as SkillProficiency
                  }
                })}
                onRemoveSkill={handleRemoveSkill}
                className="p-1"
                data-testid="current-skills-list"
              />
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Section 2: Add Skills */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Skills
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <SkillInput
            orgId={orgId}
            onAdd={handleAddSkills}
            disabled={isLoading}
            placeholder="Type a skill (e.g., JavaScript, Project Management)..."
          />
        </CardContent>
      </Card>

      {/* Section 3: Bulk Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Bulk Actions
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bulk-paste-input" className="text-sm font-medium">
              Paste Skills from Resume or Job Description
            </Label>
            
            <div className="space-y-2">
              <Input
                id="bulk-paste-input"
                value={bulkInputText}
                onChange={(e) => setBulkInputText(e.target.value)}
                placeholder="Paste comma-separated skills: JavaScript, React, Node.js, SQL..."
                disabled={isLoading}
                data-testid="bulk-paste-input"
              />
              
              <div className="flex justify-between items-center">
                <p className="text-xs text-muted-foreground">
                  Paste skills from any source. They'll be automatically cleaned and deduplicated.
                </p>
                
                <Button
                  onClick={handleBulkAdd}
                  disabled={!bulkInputText.trim() || isLoading}
                  size="sm"
                  data-testid="bulk-add-button"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4 mr-1" />
                  )}
                  Add All
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-3 w-3" />
              <span><strong>Pro tip:</strong> Skills are learned from your organization's candidate data</span>
            </div>
            <div className="flex items-center gap-2">
              <Tag className="h-3 w-3" />
              <span>Skills are automatically normalized and sorted alphabetically</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-3 w-3" />
              <span>Maximum 100 skills per candidate to maintain performance</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default SkillsTab