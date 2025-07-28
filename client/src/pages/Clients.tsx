import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { useClients, useCreateClient, useUpdateClient, useDeleteClient } from '@/hooks/useClients'
import { useJobs } from '@/hooks/useJobs'
import { useAuth } from '@/contexts/AuthContext'
import { getDemoClientStats } from '@/lib/demo-data'
import { DemoClients } from '@/components/demo/DemoClients'
import { Plus, Search, Building2, MapPin, Globe, User, Mail, Phone, Calendar, Briefcase, MoreHorizontal, Edit, Trash2, Loader2, AlertCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Link } from 'wouter'

// Form schema for client data
const clientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  industry: z.string().optional(),
  location: z.string().optional(),
  website: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  contactName: z.string().optional(),
  contactEmail: z.string().email('Please enter a valid email').optional().or(z.literal('')),
  notes: z.string().optional(),
})

type ClientFormData = z.infer<typeof clientSchema>

interface Client {
  id: string
  name: string
  industry?: string | null
  location?: string | null
  website?: string | null
  contactName?: string | null
  contactEmail?: string | null
  notes?: string | null
  createdAt: string
  updatedAt: string
  _count?: {
    jobs: number
  }
}

export default function Clients() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const { userRole, currentOrgId } = useAuth()
  const { toast } = useToast()
  
  // Show demo clients view for demo viewers
  if (userRole === 'demo_viewer') {
    return (
      <DashboardLayout pageTitle="Demo Clients">
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[#1A1A1A] font-[Inter,sans-serif]">Client Directory</h1>
            <p className="text-[#5C667B] mt-1">Explore our demo client database</p>
          </div>
          <DemoClients />
        </div>
      </DashboardLayout>
    )
  }

  const { data: clients, isLoading } = useClients()
  const { data: jobs } = useJobs()
  
  // Calculate client statistics
  const totalClients = clients?.length || 0
  const activeClients = clients?.filter((client: Client) => 
    jobs?.some((job: any) => job.clientId === client.id && job.status === 'open')
  ).length || 0
  const industries = Array.from(new Set(clients?.map((c: Client) => c.industry).filter(Boolean))).length || 0
  const totalOpenPositions = jobs?.filter((job: any) => job.status === 'open').length || 0
  const createClientMutation = useCreateClient()
  const updateClientMutation = useUpdateClient()
  const deleteClientMutation = useDeleteClient()
  
  // Use demo data for demo users
  const displayClients = userRole === 'demo_viewer' ? getDemoClientStats() : clients || []
  const isDemoMode = userRole === 'demo_viewer'

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: '',
      industry: '',
      location: '',
      website: '',
      contactName: '',
      contactEmail: '',
      notes: '',
    },
  })

  const filteredClients = displayClients?.filter((client: Client) =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.industry?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.location?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  const onSubmit = async (data: ClientFormData) => {
    if (isDemoMode) {
      toast({
        title: "Demo Mode",
        description: "Adding/editing clients is disabled in demo mode.",
        variant: "destructive",
      })
      return
    }
    
    try {
      if (editingClient) {
        await updateClientMutation.mutateAsync({ id: editingClient.id, ...data })
        toast({
          title: "Client Updated",
          description: "Client information has been updated successfully.",
        })
        setEditingClient(null)
      } else {
        await createClientMutation.mutateAsync({
          ...data,
          orgId: currentOrgId || ''
        })
        toast({
          title: "Client Added",
          description: "New client has been added successfully.",
        })
        setIsAddModalOpen(false)
      }
      
      form.reset()
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (client: Client) => {
    if (isDemoMode) {
      toast({
        title: "Demo Mode",
        description: "Editing clients is disabled in demo mode.",
        variant: "destructive",
      })
      return
    }
    
    setEditingClient(client)
    form.reset({
      name: client.name,
      industry: client.industry || '',
      location: client.location || '',
      website: client.website || '',
      contactName: client.contactName || '',
      contactEmail: client.contactEmail || '',

      notes: client.notes || '',
    })
  }

  const handleDelete = async (clientId: string) => {
    if (isDemoMode) {
      toast({
        title: "Demo Mode",
        description: "Deleting clients is disabled in demo mode.",
        variant: "destructive",
      })
      return
    }
    
    if (window.confirm('Are you sure you want to delete this client?')) {
      try {
        await deleteClientMutation.mutateAsync(clientId)
        toast({
          title: "Client Deleted",
          description: "Client has been deleted successfully.",
        })
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete client. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  const closeModal = () => {
    setIsAddModalOpen(false)
    setEditingClient(null)
    form.reset()
  }

  const ClientForm = () => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 mt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[#1A1A1A] font-[Inter,sans-serif] font-medium text-sm">Company Name *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Acme Corporation" 
                    className="bg-white border-gray-200 text-[#1A1A1A] placeholder:text-[#5C667B] focus:border-[#264C99] focus:ring-[#264C99]/20"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="industry"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[#1A1A1A] font-[Inter,sans-serif] font-medium text-sm">Industry</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Technology" 
                    className="bg-white border-gray-200 text-[#1A1A1A] placeholder:text-[#5C667B] focus:border-[#264C99] focus:ring-[#264C99]/20"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[#1A1A1A] font-[Inter,sans-serif] font-medium text-sm">Location</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="San Francisco, CA" 
                    className="bg-white border-gray-200 text-[#1A1A1A] placeholder:text-[#5C667B] focus:border-[#264C99] focus:ring-[#264C99]/20"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="website"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[#1A1A1A] font-[Inter,sans-serif] font-medium text-sm">Website</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="https://company.com" 
                    className="bg-white border-gray-200 text-[#1A1A1A] placeholder:text-[#5C667B] focus:border-[#264C99] focus:ring-[#264C99]/20"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="contactName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[#1A1A1A] font-[Inter,sans-serif] font-medium text-sm">Contact Name</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="John Smith" 
                    className="bg-white border-gray-200 text-[#1A1A1A] placeholder:text-[#5C667B] focus:border-[#264C99] focus:ring-[#264C99]/20"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="contactEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[#1A1A1A] font-[Inter,sans-serif] font-medium text-sm">Contact Email</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="john@company.com" 
                    className="bg-white border-gray-200 text-[#1A1A1A] placeholder:text-[#5C667B] focus:border-[#264C99] focus:ring-[#264C99]/20"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[#1A1A1A] font-[Inter,sans-serif] font-medium text-sm">Notes</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Additional information about the client..."
                  className="min-h-[80px] bg-white border-gray-200 text-[#1A1A1A] placeholder:text-[#5C667B] focus:border-[#264C99] focus:ring-[#264C99]/20 resize-none"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <Button 
            type="button" 
            variant="outline" 
            onClick={closeModal}
            className="btn-secondary"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={createClientMutation.isPending || updateClientMutation.isPending}
            className="btn-primary"
          >
            {(createClientMutation.isPending || updateClientMutation.isPending) && (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            )}
            {editingClient ? 'Update Client' : 'Add Client'}
          </Button>
        </div>
      </form>
    </Form>
  )

  return (
    <DashboardLayout pageTitle="Clients">
      <div className="space-y-6">
        {/* Demo Mode Banner */}
        {isDemoMode && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              <span className="text-blue-800 font-medium">Demo Mode - Read Only</span>
            </div>
            <p className="text-sm text-blue-600 mt-1">
              You're viewing sample client data. All editing features are disabled in demo mode.
            </p>
          </div>
        )}
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Client Directory</h1>
            <p className="text-slate-600 mt-1">Manage your client organizations</p>
          </div>
          
          <div className="flex gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
              <DialogTrigger asChild>
                <Button disabled={isDemoMode}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Client
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white border-0 shadow-xl">
                <DialogHeader>
                  <DialogTitle className="text-[#1A1A1A] font-[Inter,sans-serif] font-semibold text-lg">Add New Client</DialogTitle>
                </DialogHeader>
                <ClientForm />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Client Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600">Total Clients</CardTitle>
                <Building2 className="w-4 h-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{totalClients}</div>
              <p className="text-xs text-slate-500 mt-1">Active partnerships</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600">Industries</CardTitle>
                <Globe className="w-4 h-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{industries}</div>
              <p className="text-xs text-slate-500 mt-1">Diverse sectors</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600">Open Positions</CardTitle>
                <Briefcase className="w-4 h-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{totalOpenPositions}</div>
              <p className="text-xs text-slate-500 mt-1">Across all clients</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              All Clients ({filteredClients.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  {searchQuery ? 'No clients found' : 'No clients yet'}
                </h3>
                <p className="text-slate-500 mb-4">
                  {searchQuery 
                    ? 'Try adjusting your search terms.' 
                    : 'Add your first client to start managing your recruitment pipeline.'
                  }
                </p>
                {!searchQuery && (
                  <Button onClick={() => setIsAddModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Client
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Industry</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Active Jobs</TableHead>
                      <TableHead>Last Activity</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClients.map((client: Client) => (
                      <TableRow key={client.id} className="hover:bg-slate-50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Building2 className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <Link href={`/clients/${client.id}`}>
                                <button className="font-medium text-slate-900 hover:text-blue-600 text-left">
                                  {client.name}
                                </button>
                              </Link>
                              {client.website && (
                                <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                                  <Globe className="w-3 h-3" />
                                  <a 
                                    href={client.website} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="hover:text-blue-600"
                                  >
                                    {client.website.replace(/^https?:\/\//, '')}
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          {client.industry ? (
                            <Badge variant="outline">{client.industry}</Badge>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </TableCell>
                        
                        <TableCell>
                          {client.location ? (
                            <div className="flex items-center gap-1 text-sm">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {client.location}
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </TableCell>
                        
                        <TableCell>
                          {client.contactName || client.contactEmail ? (
                            <div className="space-y-1">
                              {client.contactName && (
                                <div className="flex items-center gap-1 text-sm">
                                  <User className="w-3 h-3 text-slate-400" />
                                  {client.contactName}
                                </div>
                              )}
                              {client.contactEmail && (
                                <div className="flex items-center gap-1 text-sm">
                                  <Mail className="w-3 h-3 text-slate-400" />
                                  <a 
                                    href={`mailto:${client.contactEmail}`}
                                    className="text-blue-600 hover:underline"
                                  >
                                    {client.contactEmail}
                                  </a>
                                </div>
                              )}

                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Briefcase className="w-4 h-4 text-slate-400" />
                            <span className="font-medium">
                              {client._count?.jobs || 0}
                            </span>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-slate-500">
                            <Calendar className="w-3 h-3" />
                            {client.updatedAt 
                              ? formatDistanceToNow(new Date(client.updatedAt), { addSuffix: true })
                              : 'Unknown'
                            }
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(client)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDelete(client.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Client Modal */}
        <Dialog open={!!editingClient} onOpenChange={closeModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white border-0 shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-[#1A1A1A] font-[Inter,sans-serif] font-semibold text-lg">Edit Client</DialogTitle>
            </DialogHeader>
            <ClientForm />
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}