import { useState, useCallback } from 'react'
import { Trash2, Download, Upload, Settings, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/shared/hooks/use-toast'
import { normalizeSkills } from '@/lib/skills/normalize'
import type { Proficiency, SkillsConfig } from '@/lib/skills/types'

interface ManageSkillsModalProps {
  isOpen: boolean
  onClose: () => void
  skills: string[]
  profMap: Record<string, Proficiency> | null
  config: SkillsConfig
  onAddSkills: (skills: string[], proficiency?: Proficiency) => Promise<void>
  onRemoveSkill: (skill: string) => Promise<void>
  onClearAll: () => Promise<void>
}

/**
 * Modal for bulk skills management operations
 */
export function ManageSkillsModal({
  isOpen,
  onClose,
  skills,
  profMap,
  config,
  onAddSkills,
  onRemoveSkill,
  onClearAll
}: ManageSkillsModalProps) {
  const [bulkText, setBulkText] = useState('')
  const [bulkProficiency, setBulkProficiency] = useState<Proficiency | ''>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState<'import' | 'export' | 'clear'>('import')
  const { toast } = useToast()

  // Parse bulk skills from text
  const parsedSkills = normalizeSkills(bulkText)
  const newSkillsCount = parsedSkills.filter(skill => !skills.includes(skill)).length
  const duplicatesCount = parsedSkills.length - newSkillsCount

  // Export skills as text
  const exportText = skills.join(', ')

  // Handle bulk import
  const handleBulkImport = useCallback(async () => {
    if (!bulkText.trim() || isSubmitting) return

    try {
      setIsSubmitting(true)
      
      const skillsToAdd = parsedSkills.filter(skill => !skills.includes(skill))
      
      if (skillsToAdd.length === 0) {
        toast({
          title: 'No New Skills',
          description: 'All skills in the list already exist.',
          variant: 'default'
        })
        return
      }

      await onAddSkills(
        skillsToAdd,
        config.enableProficiencyUI && bulkProficiency ? bulkProficiency as Proficiency : undefined
      )

      toast({
        title: 'Skills Imported',
        description: `Successfully imported ${skillsToAdd.length} new skills.`
      })

      setBulkText('')
      setBulkProficiency('')
      onClose()
    } catch (error) {
      console.error('Error importing skills:', error)
      toast({
        title: 'Import Failed',
        description: 'Failed to import skills. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [bulkText, parsedSkills, skills, config.enableProficiencyUI, bulkProficiency, onAddSkills, toast, onClose, isSubmitting])

  // Handle export to clipboard
  const handleExportToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(exportText)
      toast({
        title: 'Copied to Clipboard',
        description: `Copied ${skills.length} skills to clipboard.`
      })
    } catch (error) {
      console.error('Error copying to clipboard:', error)
      toast({
        title: 'Copy Failed',
        description: 'Failed to copy skills to clipboard.',
        variant: 'destructive'
      })
    }
  }, [exportText, skills.length, toast])

  // Handle clear all
  const handleClearAll = useCallback(async () => {
    if (isSubmitting) return

    try {
      setIsSubmitting(true)
      await onClearAll()
      toast({
        title: 'All Skills Removed',
        description: 'Successfully removed all skills.'
      })
      onClose()
    } catch (error) {
      console.error('Error clearing skills:', error)
      toast({
        title: 'Clear Failed',
        description: 'Failed to clear skills. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [onClearAll, toast, onClose, isSubmitting])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Manage Skills
          </DialogTitle>
          <DialogDescription>
            Import, export, or clear candidate skills in bulk.
          </DialogDescription>
        </DialogHeader>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200">
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'import'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('import')}
            data-testid="tab-import"
          >
            <Upload className="h-4 w-4 mr-2 inline" />
            Import
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'export'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('export')}
            data-testid="tab-export"
          >
            <Download className="h-4 w-4 mr-2 inline" />
            Export
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'clear'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('clear')}
            data-testid="tab-clear"
          >
            <Trash2 className="h-4 w-4 mr-2 inline" />
            Clear
          </button>
        </div>

        <div className="space-y-4 mt-4">
          {/* Import Tab */}
          {activeTab === 'import' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bulk-skills">Skills to Import</Label>
                <Textarea
                  id="bulk-skills"
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder="Paste skills separated by commas, newlines, or semicolons&#10;Example: JavaScript, React, Node.js, TypeScript, Python"
                  rows={6}
                  className="resize-none"
                  data-testid="textarea-bulk-import"
                />
                <p className="text-xs text-gray-500">
                  Skills will be automatically normalized and deduplicated.
                </p>
              </div>

              {config.enableProficiencyUI && (
                <div className="space-y-2">
                  <Label htmlFor="bulk-proficiency">Default Proficiency Level</Label>
                  <Select value={bulkProficiency} onValueChange={setBulkProficiency}>
                    <SelectTrigger data-testid="select-bulk-proficiency">
                      <SelectValue placeholder="Select proficiency level (optional)" />
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

              {/* Preview */}
              {bulkText.trim() && (
                <div className="space-y-2">
                  <Label>Import Preview</Label>
                  <div className="border rounded-lg p-3 bg-gray-50 max-h-32 overflow-y-auto">
                    <div className="flex flex-wrap gap-1">
                      {parsedSkills.slice(0, 20).map((skill, index) => (
                        <Badge
                          key={index}
                          variant={skills.includes(skill) ? "outline" : "default"}
                          className="text-xs"
                        >
                          {skill}
                        </Badge>
                      ))}
                      {parsedSkills.length > 20 && (
                        <Badge variant="outline" className="text-xs">
                          +{parsedSkills.length - 20} more
                        </Badge>
                      )}
                    </div>
                    {parsedSkills.length > 0 && (
                      <div className="mt-2 text-xs text-gray-600">
                        {newSkillsCount} new skills, {duplicatesCount} duplicates
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Export Tab */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Current Skills ({skills.length})</Label>
                <Textarea
                  value={exportText}
                  readOnly
                  rows={8}
                  className="resize-none bg-gray-50"
                  data-testid="textarea-export"
                />
              </div>
              <Button
                onClick={handleExportToClipboard}
                variant="outline"
                className="w-full"
                data-testid="button-copy-to-clipboard"
              >
                <Download className="h-4 w-4 mr-2" />
                Copy to Clipboard
              </Button>
            </div>
          )}

          {/* Clear Tab */}
          {activeTab === 'clear' && (
            <div className="space-y-4">
              <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                <div className="flex items-start gap-3">
                  <Trash2 className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-red-900">Clear All Skills</h4>
                    <p className="text-sm text-red-700 mt-1">
                      This will permanently remove all {skills.length} skills from this candidate.
                      This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Skills to be removed:</Label>
                <div className="border rounded-lg p-3 bg-gray-50 max-h-32 overflow-y-auto">
                  <div className="flex flex-wrap gap-1">
                    {skills.slice(0, 20).map((skill) => (
                      <Badge key={skill} variant="destructive" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {skills.length > 20 && (
                      <Badge variant="outline" className="text-xs">
                        +{skills.length - 20} more
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          
          {activeTab === 'import' && (
            <Button
              onClick={handleBulkImport}
              disabled={!bulkText.trim() || newSkillsCount === 0 || isSubmitting}
              data-testid="button-import-skills"
            >
              Import {newSkillsCount} Skills
            </Button>
          )}
          
          {activeTab === 'clear' && (
            <Button
              onClick={handleClearAll}
              variant="destructive"
              disabled={skills.length === 0 || isSubmitting}
              data-testid="button-clear-all-skills"
            >
              Clear All Skills
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}