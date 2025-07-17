import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Send, Plus, X, User, Building, Briefcase } from 'lucide-react'
import { useCreateMessage } from '@/hooks/useMessages'
import { useAuth } from '@/contexts/AuthContext'
import { useClients } from '@/hooks/useClients'
import { useJobs } from '@/hooks/useJobs'
import { useCandidates } from '@/hooks/useCandidates'
import type { InsertMessage } from '@/../../shared/schema'

interface MessageComposerProps {
  defaultContext?: {
    clientId?: string
    jobId?: string
    candidateId?: string
  }
  onMessageSent?: () => void
}

export function MessageComposer({ defaultContext, onMessageSent }: MessageComposerProps) {
  const { user } = useAuth()
  const createMessageMutation = useCreateMessage()
  const { data: clients = [] } = useClients()
  const { data: jobs = [] } = useJobs()
  const { data: candidates = [] } = useCandidates()

  const [formData, setFormData] = useState<Partial<InsertMessage>>({
    type: 'internal',
    priority: 'normal',
    subject: '',
    content: '',
    clientId: defaultContext?.clientId || null,
    jobId: defaultContext?.jobId || null,
    candidateId: defaultContext?.candidateId || null,
    tags: [],
  })

  const [newTag, setNewTag] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user?.id || !formData.subject || !formData.content) {
      return
    }

    const messageData: InsertMessage = {
      ...formData,
      senderId: user.id,
      recipientId: null, // For now, we'll handle recipients separately
    } as InsertMessage

    try {
      await createMessageMutation.mutateAsync(messageData)
      
      // Reset form
      setFormData({
        type: 'internal',
        priority: 'normal',
        subject: '',
        content: '',
        clientId: null,
        jobId: null,
        candidateId: null,
        tags: [],
      })
      
      onMessageSent?.()
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const addTag = () => {
    if (newTag.trim() && formData.tags && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()]
      }))
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }))
  }

  const getContextDisplay = () => {
    const contexts = []
    
    if (formData.clientId) {
      const client = clients.find((c: any) => c.id === formData.clientId)
      if (client) {
        contexts.push({
          type: 'client',
          label: client.name,
          icon: <Building className="h-4 w-4" />
        })
      }
    }
    
    if (formData.jobId) {
      const job = jobs.find((j: any) => j.id === formData.jobId)
      if (job) {
        contexts.push({
          type: 'job',
          label: job.title,
          icon: <Briefcase className="h-4 w-4" />
        })
      }
    }
    
    if (formData.candidateId) {
      const candidate = candidates.find((c: any) => c.id === formData.candidateId)
      if (candidate) {
        contexts.push({
          type: 'candidate',
          label: candidate.name,
          icon: <User className="h-4 w-4" />
        })
      }
    }
    
    return contexts
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Compose Message
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Message Type and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="internal">Internal Team</SelectItem>
                  <SelectItem value="client">Client Communication</SelectItem>
                  <SelectItem value="candidate">Candidate Communication</SelectItem>
                  <SelectItem value="system">System Message</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Context Selection */}
          <div className="space-y-4">
            <Label>Related Context (Optional)</Label>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Client</Label>
                <Select
                  value={formData.clientId || 'none'}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, clientId: value === 'none' ? null : value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {clients.map((client: any) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm">Job</Label>
                <Select
                  value={formData.jobId || 'none'}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, jobId: value === 'none' ? null : value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select job" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {jobs.map((job: any) => (
                      <SelectItem key={job.id} value={job.id}>
                        {job.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm">Candidate</Label>
                <Select
                  value={formData.candidateId || 'none'}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, candidateId: value === 'none' ? null : value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select candidate" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {candidates.map((candidate: any) => (
                      <SelectItem key={candidate.id} value={candidate.id}>
                        {candidate.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Context Display */}
            {getContextDisplay().length > 0 && (
              <div className="flex flex-wrap gap-2">
                {getContextDisplay().map((context, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {context.icon}
                    {context.label}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="Enter message subject"
              required
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Message</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Type your message here..."
              rows={5}
              required
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add tag"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <Button type="button" onClick={addTag} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {formData.tags && formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="flex items-center gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Send Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={!formData.subject || !formData.content || createMessageMutation.isPending}
          >
            {createMessageMutation.isPending ? 'Sending...' : 'Send Message'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}