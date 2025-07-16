import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/queryClient'
import { UserPlus } from 'lucide-react'

interface AddCandidateDialogProps {
  children: React.ReactNode
}

export function AddCandidateDialog({ children }: AddCandidateDialogProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    skills: '',
    notes: ''
  })
  
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const createCandidateMutation = useMutation({
    mutationFn: (data: typeof formData) => apiRequest({
      method: 'POST',
      url: '/api/candidates',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/candidates'] })
      toast({
        title: "Success",
        description: "Candidate added successfully",
      })
      setOpen(false)
      setFormData({ name: '', email: '', phone: '', skills: '', notes: '' })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add candidate",
        variant: "destructive",
      })
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.email) {
      toast({
        title: "Validation Error",
        description: "Name and email are required",
        variant: "destructive",
      })
      return
    }
    createCandidateMutation.mutate(formData)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Add New Candidate
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter candidate's full name"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="candidate@example.com"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+1 (555) 123-4567"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="skills">Skills</Label>
            <Input
              id="skills"
              value={formData.skills}
              onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
              placeholder="React, TypeScript, Node.js"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes about the candidate"
              rows={3}
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createCandidateMutation.isPending}>
              {createCandidateMutation.isPending ? 'Adding...' : 'Add Candidate'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}