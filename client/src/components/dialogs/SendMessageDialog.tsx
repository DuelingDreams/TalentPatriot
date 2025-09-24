import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/shared/hooks/use-toast'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/queryClient'
import { useAuth } from '@/contexts/AuthContext'
import { MessageSquare, X } from 'lucide-react'

interface SendMessageDialogProps {
  children: React.ReactNode
}

const TEAM_MEMBERS = [
  { id: 'alex', name: 'Alex Thompson', role: 'HR Recruiter' },
  { id: 'maria', name: 'Maria Garcia', role: 'Talent Specialist' },
  { id: 'sarah', name: 'Sarah Kim', role: 'Recruitment Manager' },
  { id: 'david', name: 'David Chen', role: 'BD Manager' }
]

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'high', label: 'High', color: 'bg-red-100 text-red-800' }
]

export function SendMessageDialog({ children }: SendMessageDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([])
  const [formData, setFormData] = useState({
    subject: '',
    content: '',
    priority: 'medium',
    context_type: '',
    context_id: ''
  })
  
  const { toast } = useToast()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const sendMessageMutation = useMutation({
    mutationFn: (data: any) => apiRequest({
      method: 'POST',
      url: '/api/messages',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] })
      toast({
        title: "Success",
        description: "Message sent successfully",
      })
      setOpen(false)
      resetForm()
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      })
    }
  })

  const resetForm = () => {
    setFormData({
      subject: '',
      content: '',
      priority: 'medium',
      context_type: '',
      context_id: ''
    })
    setSelectedRecipients([])
  }

  const handleAddRecipient = (memberId: string) => {
    if (!selectedRecipients.includes(memberId)) {
      setSelectedRecipients([...selectedRecipients, memberId])
    }
  }

  const handleRemoveRecipient = (memberId: string) => {
    setSelectedRecipients(selectedRecipients.filter(id => id !== memberId))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.subject || !formData.content || selectedRecipients.length === 0) {
      toast({
        title: "Validation Error",
        description: "Subject, content, and at least one recipient are required",
        variant: "destructive",
      })
      return
    }

    const messageData = {
      ...formData,
      sender_id: user?.id || 'current-user',
      recipients: selectedRecipients
    }

    sendMessageMutation.mutate(messageData)
  }

  const getSelectedMemberNames = () => {
    return selectedRecipients.map(id => 
      TEAM_MEMBERS.find(member => member.id === id)?.name
    ).filter(Boolean).join(', ')
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Send Message
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipients">Recipients *</Label>
            <Select onValueChange={handleAddRecipient}>
              <SelectTrigger>
                <SelectValue placeholder="Select team members" />
              </SelectTrigger>
              <SelectContent>
                {TEAM_MEMBERS.filter(member => !selectedRecipients.includes(member.id)).map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    <div>
                      <div className="font-medium">{member.name}</div>
                      <div className="text-sm text-slate-500">{member.role}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedRecipients.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedRecipients.map((memberId) => {
                  const member = TEAM_MEMBERS.find(m => m.id === memberId)
                  return (
                    <Badge key={memberId} variant="secondary" className="flex items-center gap-1">
                      {member?.name}
                      <button
                        type="button"
                        onClick={() => handleRemoveRecipient(memberId)}
                        className="ml-1 hover:bg-slate-200 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  )
                })}
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Enter message subject"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${option.color}`}>
                        {option.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="content">Message *</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Type your message here..."
              rows={6}
              required
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={sendMessageMutation.isPending}>
              {sendMessageMutation.isPending ? 'Sending...' : 'Send Message'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}