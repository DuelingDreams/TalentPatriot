import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatDistanceToNow } from 'date-fns'
import { MessageSquare, Plus, User } from 'lucide-react'

interface CandidateNote {
  id: string
  content: string
  authorId: string
  authorName?: string
  isPrivate: boolean
  createdAt: string
  updatedAt: string
}

interface CandidateNotesProps {
  candidateId: string
  jobCandidateId: string
  notes?: CandidateNote[]
  onAddNote?: (content: string, isPrivate: boolean) => void
  className?: string
}

export function CandidateNotes({ 
  candidateId, 
  jobCandidateId, 
  notes = [], 
  onAddNote,
  className = "" 
}: CandidateNotesProps) {
  const [newNote, setNewNote] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [isAddingNote, setIsAddingNote] = useState(false)

  const handleAddNote = async () => {
    if (!newNote.trim() || !onAddNote) return
    
    try {
      await onAddNote(newNote.trim(), isPrivate)
      setNewNote('')
      setIsPrivate(false)
      setIsAddingNote(false)
    } catch (error) {
      console.error('Failed to add note:', error)
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Notes ({notes.length})
          </CardTitle>
          <Button
            size="sm"
            onClick={() => setIsAddingNote(!isAddingNote)}
            variant="outline"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Note
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAddingNote && (
          <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
            <Textarea
              placeholder="Add a note about this candidate..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="min-h-[100px]"
            />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="rounded"
                />
                Private note (only visible to you)
              </label>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setIsAddingNote(false)}
                >
                  Cancel
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleAddNote}
                  disabled={!newNote.trim()}
                >
                  Add Note
                </Button>
              </div>
            </div>
          </div>
        )}

        {notes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No notes yet</p>
            <p className="text-sm">Add the first note to track candidate progress</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <div 
                key={note.id} 
                className="border rounded-lg p-4 space-y-3 bg-card hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        <User className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">
                        {note.authorName || 'Unknown User'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  {note.isPrivate && (
                    <Badge variant="secondary" className="text-xs">
                      Private
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-foreground whitespace-pre-wrap pl-11">
                  {note.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}