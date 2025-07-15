import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import { useCandidateNotes, useCreateCandidateNote } from '@/hooks/useJobs'
import { useIsMobile } from '@/hooks/use-mobile'
import { MessageSquare, Send, Loader2, Plus, Calendar } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface CandidateNotesProps {
  jobCandidateId: string
  candidateName: string
  children?: React.ReactNode
}

export function CandidateNotes({ jobCandidateId, candidateName, children }: CandidateNotesProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [newNote, setNewNote] = useState('')
  const isMobile = useIsMobile()
  const { toast } = useToast()
  
  const { data: notes, isLoading } = useCandidateNotes(jobCandidateId)
  const createNoteMutation = useCreateCandidateNote()

  const handleAddNote = async () => {
    if (!newNote.trim()) return
    
    try {
      await createNoteMutation.mutateAsync({
        jobCandidateId,
        content: newNote.trim()
      })
      
      setNewNote('')
      toast({
        title: "Note Added",
        description: "Your note has been saved successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add note. Please try again.",
        variant: "destructive",
      })
    }
  }

  const formatAuthorId = (authorId: string) => {
    // For now, show a user-friendly name based on the author ID
    // In a real app, you'd fetch user profiles from auth
    if (authorId.startsWith('recruiter-user-')) {
      return 'Recruiter'
    }
    return authorId.slice(0, 8) + '...'
  }

  const NotesContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="space-y-4 p-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : notes && notes.length > 0 ? (
              notes.map((note) => (
                <Card key={note.id} className="border-slate-200">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                          {formatAuthorId(note.author_id).slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            {formatAuthorId(note.author_id)}
                          </Badge>
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                            <Calendar className="w-3 h-3" />
                            {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                          </div>
                        </div>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{note.content}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No notes yet for this candidate.</p>
                <p className="text-sm mt-1">Add the first note below.</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
      
      <div className="border-t border-slate-200 p-4">
        <div className="space-y-3">
          <Textarea
            placeholder="Add a note about this candidate..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            className="min-h-[80px] resize-none"
          />
          <div className="flex justify-end">
            <Button
              onClick={handleAddNote}
              disabled={!newNote.trim() || createNoteMutation.isPending}
              size="sm"
            >
              {createNoteMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Add Note
            </Button>
          </div>
        </div>
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerTrigger asChild>
          {children || (
            <Button size="sm" variant="outline">
              <MessageSquare className="w-4 h-4 mr-2" />
              Notes
            </Button>
          )}
        </DrawerTrigger>
        <DrawerContent className="h-[85vh]">
          <DrawerHeader>
            <DrawerTitle>Notes for {candidateName}</DrawerTitle>
          </DrawerHeader>
          <NotesContent />
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button size="sm" variant="outline">
            <MessageSquare className="w-4 h-4 mr-2" />
            Notes
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Notes for {candidateName}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          <NotesContent />
        </div>
      </DialogContent>
    </Dialog>
  )
}