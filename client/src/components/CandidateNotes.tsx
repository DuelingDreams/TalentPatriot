import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Plus, MessageSquare, Lock, Globe, X, Check } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useCandidateNotes, useCreateCandidateNote } from '@/hooks/useCandidateNotes'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface CandidateNotesProps {
  candidateId: string
  jobCandidateId?: string
  className?: string
}

export function CandidateNotes({ candidateId, jobCandidateId, className }: CandidateNotesProps) {
  const { user, currentOrgId } = useAuth()
  const { toast } = useToast()
  const { data: notes = [], isLoading, error } = useCandidateNotes(jobCandidateId || '')
  const createNoteMutation = useCreateCandidateNote()
  
  const [showAddForm, setShowAddForm] = useState(false)
  const [newNote, setNewNote] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)

  const handleAddNote = async () => {
    if (!newNote.trim()) {
      toast({
        title: "Error",
        description: "Please enter a note before saving.",
        variant: "destructive"
      })
      return
    }

    if (!user?.id || !currentOrgId) {
      toast({
        title: "Error",
        description: "User authentication required to add notes.",
        variant: "destructive"
      })
      return
    }

    if (!jobCandidateId) {
      toast({
        title: "Error",
        description: "No job application selected. Notes are tied to specific job applications.",
        variant: "destructive"
      })
      return
    }

    try {
      await createNoteMutation.mutateAsync({
        orgId: currentOrgId,
        jobCandidateId,
        authorId: user.id,
        content: newNote.trim(),
        isPrivate: isPrivate ? 'true' : 'false'
      })
      
      toast({
        title: "Success",
        description: "Note added successfully."
      })
      
      // Reset form
      setNewNote('')
      setIsPrivate(false)
      setShowAddForm(false)
    } catch (error) {
      console.error('Failed to add note:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add note. Please try again.",
        variant: "destructive"
      })
    }
  }

  const getUserInitials = (authorEmail?: string) => {
    if (!authorEmail) return 'U'
    return authorEmail.split('@')[0].slice(0, 2).toUpperCase()
  }

  // Guard: Show error if no jobCandidateId provided
  if (!jobCandidateId) {
    return (
      <Card className={cn("", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No Application Selected</p>
            <p className="text-sm">Notes are tied to specific job applications. Select an application to view notes.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card className={cn("", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border rounded-lg p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show error state if query failed
  if (error) {
    return (
      <Card className={cn("", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-500">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-red-300" />
            <p className="text-lg font-medium">Failed to Load Notes</p>
            <p className="text-sm">Please try refreshing the page or contact support if the issue persists.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Notes ({notes.length})
          </CardTitle>
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            size="sm"
            variant={showAddForm ? "ghost" : "default"}
          >
            {showAddForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showAddForm ? 'Cancel' : 'Add Note'}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Add Note Form */}
        {showAddForm && (
          <Card className="border-dashed border-2 border-gray-300">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <Textarea
                  placeholder="Add a note about this candidate..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="min-h-[100px]"
                />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="private"
                      checked={isPrivate}
                      onCheckedChange={(checked) => setIsPrivate(checked as boolean)}
                    />
                    <label htmlFor="private" className="text-sm font-medium">
                      Private note (only visible to you)
                    </label>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowAddForm(false)
                        setNewNote('')
                        setIsPrivate(false)
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleAddNote}
                      disabled={!newNote.trim() || createNoteMutation.isPending}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      {createNoteMutation.isPending ? 'Adding...' : 'Add Note'}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notes List */}
        {notes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No notes yet</p>
            <p className="text-sm">Add the first note about this candidate</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note: any) => (
              <div
                key={note.id}
                className="border rounded-lg p-4 bg-white hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {getUserInitials(note.authorEmail)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">
                        {note.authorEmail || 'Unknown User'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={note.isPrivate === 'true' ? 'secondary' : 'outline'}
                      className="text-xs"
                    >
                      {note.isPrivate === 'true' ? (
                        <>
                          <Lock className="h-3 w-3 mr-1" />
                          Private
                        </>
                      ) : (
                        <>
                          <Globe className="h-3 w-3 mr-1" />
                          Team
                        </>
                      )}
                    </Badge>
                  </div>
                </div>
                
                <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {note.content}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}