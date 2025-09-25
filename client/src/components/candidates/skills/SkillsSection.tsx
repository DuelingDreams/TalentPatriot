import { useState } from 'react'
import { Settings, Plus, Filter, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useCandidateSkills } from '@/hooks/useCandidateSkills'
import { SkillsGrid, SkillsPreview } from './SkillsGrid'
import { SkillInput } from './SkillInput'
import { ManageSkillsModal } from './ManageSkillsModal'
import type { Proficiency } from '@/lib/skills/types'

interface SkillsSectionProps {
  candidateId: string
  orgId: string
  compact?: boolean
  className?: string
  enableProficiencyUI?: boolean
  'data-testid'?: string
}

/**
 * Main skills section orchestrator component
 */
export function SkillsSection({
  candidateId,
  orgId,
  compact = false,
  className,
  enableProficiencyUI = false,
  'data-testid': dataTestId
}: SkillsSectionProps) {
  const [isManageModalOpen, setIsManageModalOpen] = useState(false)
  const [groupBy, setGroupBy] = useState<'proficiency' | 'alphabetical' | 'none'>('proficiency')
  const [gridSize, setGridSize] = useState<'sm' | 'md' | 'lg'>('md')

  // Skills state management
  const {
    skills,
    profMap,
    config,
    isLoading,
    error,
    addSkills,
    removeSkill,
    setSkillProficiency,
    refetch
  } = useCandidateSkills(candidateId, orgId, { enableProficiencyUI })

  // Handle clear all skills
  const handleClearAll = async () => {
    // Remove all skills one by one (could be optimized with a bulk operation)
    for (const skill of skills) {
      await removeSkill(skill)
    }
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Error loading skills: {error.message}</p>
            <Button variant="outline" onClick={() => refetch()} className="mt-2">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Compact preview mode for sidebar/summary views
  if (compact) {
    return (
      <div className={className}>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">Skills</h3>
            <span className="text-xs text-gray-500">
              {skills.length} total
            </span>
          </div>
          
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-3/4" />
            </div>
          ) : (
            <SkillsPreview
              skills={skills}
              profMap={profMap}
              config={config}
              maxVisible={6}
            />
          )}
        </div>
      </div>
    )
  }

  // Full skills management interface
  return (
    <Card className={className} data-testid={dataTestId}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              Skills & Expertise
              {config.enableProficiencyUI && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                  Proficiency Enabled
                </span>
              )}
            </CardTitle>
            <p className="text-sm text-gray-600">
              {skills.length} skills total
              {config.enableProficiencyUI && profMap && (
                <>
                  {' • '}
                  {Object.keys(profMap).length} with proficiency levels
                </>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Group by selector */}
            {skills.length > 3 && (
              <Select value={groupBy} onValueChange={(value: any) => setGroupBy(value)}>
                <SelectTrigger className="w-32">
                  <Filter className="h-4 w-4 mr-1" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="proficiency">By Level</SelectItem>
                  <SelectItem value="alphabetical">A-Z</SelectItem>
                  <SelectItem value="none">All</SelectItem>
                </SelectContent>
              </Select>
            )}

            {/* Actions dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" data-testid="button-skills-actions">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsManageModalOpen(true)}>
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Skills
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setGridSize('sm')}>
                  Small View
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setGridSize('md')}>
                  Medium View
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setGridSize('lg')}>
                  Large View
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Skills input */}
        <SkillInput
          orgId={orgId}
          config={config}
          onAddSkills={addSkills}
          disabled={isLoading}
        />

        {/* Skills grid */}
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-20" />
              ))}
            </div>
          </div>
        ) : (
          <SkillsGrid
            skills={skills}
            profMap={profMap}
            config={config}
            onRemoveSkill={removeSkill}
            onSetProficiency={setSkillProficiency}
            groupBy={groupBy}
            size={gridSize}
          />
        )}

        {/* Manage skills modal */}
        <ManageSkillsModal
          isOpen={isManageModalOpen}
          onClose={() => setIsManageModalOpen(false)}
          skills={skills}
          profMap={profMap}
          config={config}
          onAddSkills={addSkills}
          onRemoveSkill={removeSkill}
          onClearAll={handleClearAll}
        />
      </CardContent>
    </Card>
  )
}