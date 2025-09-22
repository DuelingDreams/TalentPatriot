import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { AppModal } from '@/components/ui/AppModal'
import { formatDistanceToNow } from 'date-fns'
import { MessageSquare, Plus, User, Lock, Eye } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useCandidateNotes, useCreateCandidateNote } from '@/hooks/useCandidateNotes'

interface CandidateNotesDialogProps {
  open: boolean
  onClose: () => void
  candidateId: string
  jobCandidateId: string
  candidateName?: string
}

export function CandidateNotesDialog({ 
  open, 
  onClose, 
  candidateId, 
  jobCandidateId, 
  candidateName = 'Candidate'
}: CandidateNotesDialogProps) {
  const [newNote, setNewNote] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [isAddingNote, setIsAddingNote] = useState(false)

  const { user, currentOrgId } = useAuth()
  const currentUserId = user?.id
  const { data: notes = [], isLoading } = useCandidateNotes(jobCandidateId)
  const createNoteMutation = useCreateCandidateNote()

  const handleAddNote = async () => {
    if (!newNote.trim() || !currentUserId || !currentOrgId) return
    
    try {
      await createNoteMutation.mutateAsync({
        orgId: currentOrgId,
        jobCandidateId,
        authorId: currentUserId,
        content: newNote.trim(),
        isPrivate: isPrivate
      })
      setNewNote('')
      setIsPrivate(false)
      setIsAddingNote(false)
    } catch (error) {
      console.error('Failed to add note:', error)
    }
  }

  const handleCancel = () => {
    setNewNote('')
    setIsPrivate(false)
    setIsAddingNote(false)
  }

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={`Notes - ${candidateName}`}
      className="max-w-2xl"
    >
      <div className="space-y-6">
        {/* Add Note Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-slate-900">Add New Note</h3>
            <Button
              size="sm"
              onClick={() => setIsAddingNote(!isAddingNote)}
              variant={isAddingNote ? "secondary" : "outline"}
            >
              <Plus className="w-4 h-4 mr-2" />
              {isAddingNote ? 'Cancel' : 'Add Note'}
            </Button>
          </div>

          {isAddingNote && (
            <div className="space-y-4 p-4 bg-slate-50 rounded-lg border">
              <Textarea
                placeholder="Add a note about this candidate..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                rows={3}
                className="resize-none"
              />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="private-note"
                    checked={isPrivate}
                    onCheckedChange={setIsPrivate}
                  />
                  <Label htmlFor="private-note" className="text-sm">
                    <Lock className="w-3 h-3 inline mr-1" />
                    Private note (only visible to you)
                  </Label>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancel}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAddNote}
                    disabled={!newNote.trim() || createNoteMutation.isPending}
                  >
                    {createNoteMutation.isPending ? 'Adding...' : 'Add Note'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Notes List */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-slate-600" />
            <h3 className="font-medium text-slate-900">All Notes ({notes.length})</h3>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-slate-500">
              Loading notes...
            </div>
          ) : notes.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p>No notes yet</p>
              <p className="text-sm">Add the first note about this candidate</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {notes.map((note: any) => (
                <div 
                  key={note.id} 
                  className="bg-white border border-slate-200 rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                          <User className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {note.authorId === currentUserId ? 'You' : 'Team Member'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatDistanceToNow(new Date(note.createdAt))} ago
                        </p>
                      </div>
                    </div>
                    
                    {note.isPrivate === 'true' && (
                      <Badge variant="secondary" className="text-xs">
                        <Lock className="w-3 h-3 mr-1" />
                        Private
                      </Badge>
                    )}
                  </div>
                  
                  <div className="text-sm text-slate-700 leading-relaxed">
                    {note.content}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppModal>
  )
}