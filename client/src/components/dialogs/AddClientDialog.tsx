import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/shared/hooks/use-toast'
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
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto bg-white border-0 shadow-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#1A1A1A] font-[Inter,sans-serif] font-semibold text-lg">
            <Building2 className="w-5 h-5 text-[#264C99]" />
            Add New Client
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-[#1A1A1A] font-[Inter,sans-serif] font-medium text-sm">Company Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Acme Corporation"
              className="bg-white border-gray-200 text-[#1A1A1A] placeholder:text-[#5C667B] focus:border-[#264C99] focus:ring-[#264C99]/20"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="industry" className="text-[#1A1A1A] font-[Inter,sans-serif] font-medium text-sm">Industry</Label>
              <Input
                id="industry"
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                placeholder="e.g. Technology, Healthcare, Finance"
                list="industry-suggestions"
                className="bg-white border-gray-200 text-[#1A1A1A] placeholder:text-[#5C667B] focus:border-[#264C99] focus:ring-[#264C99]/20"
              />
              <datalist id="industry-suggestions">
                <option value="Technology" />
                <option value="Healthcare" />
                <option value="Finance" />
                <option value="Manufacturing" />
                <option value="Retail" />
                <option value="Consulting" />
                <option value="Education" />
                <option value="Real Estate" />
              </datalist>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="location" className="text-[#1A1A1A] font-[Inter,sans-serif] font-medium text-sm">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="San Francisco, CA"
                className="bg-white border-gray-200 text-[#1A1A1A] placeholder:text-[#5C667B] focus:border-[#264C99] focus:ring-[#264C99]/20"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="website" className="text-[#1A1A1A] font-[Inter,sans-serif] font-medium text-sm">Website</Label>
            <Input
              id="website"
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="https://company.com"
              className="bg-white border-gray-200 text-[#1A1A1A] placeholder:text-[#5C667B] focus:border-[#264C99] focus:ring-[#264C99]/20"
            />
          </div>
          
          <div className="space-y-3">
            <h4 className="font-medium text-[#1A1A1A] font-[Inter,sans-serif] text-sm">Primary Contact</h4>
            
            <div className="space-y-2">
              <Label htmlFor="contact_name" className="text-[#1A1A1A] font-[Inter,sans-serif] font-medium text-sm">Contact Name</Label>
              <Input
                id="contact_name"
                value={formData.contact_name}
                onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                placeholder="John Smith"
                className="bg-white border-gray-200 text-[#1A1A1A] placeholder:text-[#5C667B] focus:border-[#264C99] focus:ring-[#264C99]/20"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_email" className="text-[#1A1A1A] font-[Inter,sans-serif] font-medium text-sm">Contact Email</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  placeholder="john@company.com"
                  className="bg-white border-gray-200 text-[#1A1A1A] placeholder:text-[#5C667B] focus:border-[#264C99] focus:ring-[#264C99]/20"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contact_phone" className="text-[#1A1A1A] font-[Inter,sans-serif] font-medium text-sm">Contact Phone</Label>
                <Input
                  id="contact_phone"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                  className="bg-white border-gray-200 text-[#1A1A1A] placeholder:text-[#5C667B] focus:border-[#264C99] focus:ring-[#264C99]/20"
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-[#1A1A1A] font-[Inter,sans-serif] font-medium text-sm">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes about the client"
              rows={3}
              className="bg-white border-gray-200 text-[#1A1A1A] placeholder:text-[#5C667B] focus:border-[#264C99] focus:ring-[#264C99]/20 resize-none"
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="outline" 
                    onClick={() => setOpen(false)}
                    className="btn-secondary">
              Cancel
            </Button>
            <Button type="submit" 
                    disabled={createClientMutation.isPending}
                    className="btn-primary">
              {createClientMutation.isPending ? 'Adding...' : 'Add Client'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}