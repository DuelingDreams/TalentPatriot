import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/queryClient'
import { Building2 } from 'lucide-react'

interface AddClientDialogProps {
  children: React.ReactNode
}

export function AddClientDialog({ children }: AddClientDialogProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    website: '',
    location: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    notes: ''
  })
  
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const createClientMutation = useMutation({
    mutationFn: (data: typeof formData) => apiRequest({
      method: 'POST',
      url: '/api/clients',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] })
      toast({
        title: "Success",
        description: "Client added successfully",
      })
      setOpen(false)
      setFormData({ 
        name: '', industry: '', website: '', location: '', 
        contact_name: '', contact_email: '', contact_phone: '', notes: '' 
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add client",
        variant: "destructive",
      })
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name) {
      toast({
        title: "Validation Error",
        description: "Company name is required",
        variant: "destructive",
      })
      return
    }
    createClientMutation.mutate(formData)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Add New Client
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Company Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Acme Corporation"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                placeholder="Technology"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="San Francisco, CA"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="https://company.com"
            />
          </div>
          
          <div className="space-y-3">
            <h4 className="font-medium text-slate-900">Primary Contact</h4>
            
            <div className="space-y-2">
              <Label htmlFor="contact_name">Contact Name</Label>
              <Input
                id="contact_name"
                value={formData.contact_name}
                onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                placeholder="John Smith"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_email">Contact Email</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  placeholder="john@company.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contact_phone">Contact Phone</Label>
                <Input
                  id="contact_phone"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes about the client"
              rows={3}
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createClientMutation.isPending}>
              {createClientMutation.isPending ? 'Adding...' : 'Add Client'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}