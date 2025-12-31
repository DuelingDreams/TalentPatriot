import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useToast } from '@/shared/hooks/use-toast'
import { useClients, useCreateClient, useUpdateClient, useDeleteClient } from '@/features/organization/hooks/useClients'
import { useJobs } from '@/features/jobs/hooks/useJobs'
import { useAuth } from '@/contexts/AuthContext'
import { 
  Plus, Search, Building2, Users, Briefcase, DollarSign, 
  TrendingUp, TrendingDown, Percent, Target, Filter, MoreVertical,
  Mail, Phone, X, Loader2, AlertCircle, Calendar
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import { Link, useLocation } from 'wouter'

const clientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  industry: z.string().optional(),
  location: z.string().optional(),
  website: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  contactName: z.string().optional(),
  contactEmail: z.string().email('Please enter a valid email').optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  notes: z.string().optional(),
  priority: z.string().optional(),
  paymentTerms: z.string().optional(),
  status: z.enum(['active', 'archived']).optional(),
})

type ClientFormData = z.infer<typeof clientSchema>

interface ClientData {
  id: string
  name: string
  industry?: string | null
  location?: string | null
  website?: string | null
  contactName?: string | null
  contactEmail?: string | null
  contactPhone?: string | null
  notes?: string | null
  priority?: string | null
  paymentTerms?: string | null
  marginTrend?: string | null
  lastContactAt?: string | null
  status?: string | null
  createdAt: string
  updatedAt: string
}

interface ClientWithStats extends ClientData {
  openJobs: number
  placements: number
  revenue: number
  grossProfit: number
  avgMargin: number
  displayStatus: 'Active' | 'Prospect' | 'Inactive'
  logo: string
}

function getClientInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function getStatusColor(status: string) {
  switch(status) {
    case 'Active': return 'bg-success-100 text-success-800'
    case 'Prospect': return 'bg-info-100 text-info-800'
    case 'Inactive': return 'bg-neutral-100 text-neutral-800'
    default: return 'bg-neutral-100 text-neutral-800'
  }
}

function getMarginColor(margin: number) {
  if (margin >= 35) return 'text-success-600'
  if (margin >= 25) return 'text-warning-600'
  return 'text-error-600'
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

function TrendIcon({ trend }: { trend?: string | null }) {
  if (trend === 'up') return <TrendingUp size={16} className="text-success-600" />
  if (trend === 'down') return <TrendingDown size={16} className="text-error-600" />
  return <div className="w-4 h-0.5 bg-neutral-400 mx-auto" />
}

export default function Clients() {
  const [view, setView] = useState<'list' | 'kanban'>('list')
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<ClientData | null>(null)
  const [selectedClient, setSelectedClient] = useState<ClientWithStats | null>(null)
  const { userRole, currentOrgId } = useAuth()
  const { toast } = useToast()
  const [, setLocation] = useLocation()
  
  const { data: clients, isLoading } = useClients()
  const { data: jobs } = useJobs()
  const createClientMutation = useCreateClient()
  const updateClientMutation = useUpdateClient()
  const deleteClientMutation = useDeleteClient()

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: '',
      industry: '',
      location: '',
      website: '',
      contactName: '',
      contactEmail: '',
      contactPhone: '',
      notes: '',
      priority: '',
      paymentTerms: '',
      status: 'active',
    },
  })

  const clientsWithStats: ClientWithStats[] = useMemo(() => {
    // Handle different response shapes from useClients hook
    let clientsArray: ClientData[] = []
    if (Array.isArray(clients)) {
      clientsArray = clients
    } else if (clients && typeof clients === 'object' && 'data' in clients && Array.isArray((clients as any).data)) {
      clientsArray = (clients as any).data
    }
    
    if (clientsArray.length === 0) return []
    
    // Handle different response shapes from useJobs hook
    let jobsArray: any[] = []
    if (Array.isArray(jobs)) {
      jobsArray = jobs
    } else if (jobs && typeof jobs === 'object' && 'data' in jobs && Array.isArray((jobs as any).data)) {
      jobsArray = (jobs as any).data
    }
    
    return clientsArray.map((client: ClientData) => {
      const clientJobs = jobsArray.filter((job: any) => job.clientId === client.id) || []
      const openJobs = clientJobs.filter((job: any) => job.status === 'open').length
      const hasActiveJobs = openJobs > 0
      const hasRecentActivity = client.lastContactAt 
        ? new Date(client.lastContactAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        : false
      
      let displayStatus: 'Active' | 'Prospect' | 'Inactive' = 'Prospect'
      if (client.status === 'archived') {
        displayStatus = 'Inactive'
      } else if (hasActiveJobs || hasRecentActivity) {
        displayStatus = 'Active'
      }
      
      return {
        ...client,
        openJobs,
        placements: 0,
        revenue: 0,
        grossProfit: 0,
        avgMargin: 0,
        displayStatus,
        logo: getClientInitials(client.name),
      }
    })
  }, [clients, jobs])

  const filteredClients = useMemo(() => {
    return clientsWithStats.filter(client =>
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.industry?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.location?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [clientsWithStats, searchQuery])

  const stats = useMemo(() => {
    const activeClients = filteredClients.filter(c => c.displayStatus === 'Active').length
    const totalOpenJobs = filteredClients.reduce((sum, c) => sum + c.openJobs, 0)
    const totalRevenue = filteredClients.reduce((sum, c) => sum + c.revenue, 0)
    const totalGrossProfit = filteredClients.reduce((sum, c) => sum + c.grossProfit, 0)
    const clientsWithMargin = filteredClients.filter(c => c.avgMargin > 0)
    const avgMargin = clientsWithMargin.length > 0
      ? clientsWithMargin.reduce((sum, c) => sum + c.avgMargin, 0) / clientsWithMargin.length
      : 0
    return { activeClients, totalOpenJobs, totalRevenue, totalGrossProfit, avgMargin }
  }, [filteredClients])

  if (!currentOrgId && userRole !== 'demo_viewer') {
    return (
      <DashboardLayout pageTitle="Clients">
        <div className="p-6">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="pt-6 text-center">
              <div className="w-16 h-16 bg-info-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-info-600" />
              </div>
              <h2 className="text-2xl font-bold text-neutral-900 mb-2">Organization Setup Required</h2>
              <p className="text-neutral-600 mb-4">
                You need to set up your organization before you can add clients.
              </p>
              <Button onClick={() => setLocation('/settings/organization')}>
                Set Up Organization
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  const onSubmit = async (data: ClientFormData) => {
    try {
      if (editingClient) {
        await updateClientMutation.mutateAsync({ id: editingClient.id, ...data })
        toast({ title: "Client Updated", description: "Client information has been updated successfully." })
        setEditingClient(null)
      } else {
        if (!currentOrgId) {
          toast({ title: "Organization Required", description: "Please set up your organization first.", variant: "destructive" })
          return
        }
        await createClientMutation.mutateAsync({ ...data, orgId: currentOrgId })
        toast({ title: "Client Added", description: "New client has been added successfully." })
        setIsAddModalOpen(false)
      }
      form.reset()
    } catch (error) {
      toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "destructive" })
    }
  }

  const handleEdit = (client: ClientData) => {
    setEditingClient(client)
    form.reset({
      name: client.name,
      industry: client.industry || '',
      location: client.location || '',
      website: client.website || '',
      contactName: client.contactName || '',
      contactEmail: client.contactEmail || '',
      contactPhone: client.contactPhone || '',
      notes: client.notes || '',
      priority: client.priority || '',
      paymentTerms: client.paymentTerms || '',
    })
  }

  const handleDelete = async (clientId: string) => {
    if (window.confirm('Are you sure you want to delete this client?')) {
      try {
        await deleteClientMutation.mutateAsync(clientId)
        toast({ title: "Client Deleted", description: "Client has been deleted successfully." })
        setSelectedClient(null)
      } catch (error) {
        toast({ title: "Error", description: "Failed to delete client. Please try again.", variant: "destructive" })
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-neutral-900 font-medium text-sm">Company Name *</FormLabel>
              <FormControl>
                <Input placeholder="Acme Corporation" {...field} data-testid="input-client-name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          
          <FormField control={form.control} name="industry" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-neutral-900 font-medium text-sm">Industry</FormLabel>
              <FormControl>
                <Input placeholder="Technology" {...field} data-testid="input-client-industry" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          
          <FormField control={form.control} name="location" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-neutral-900 font-medium text-sm">Location</FormLabel>
              <FormControl>
                <Input placeholder="San Francisco, CA" {...field} data-testid="input-client-location" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          
          <FormField control={form.control} name="website" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-neutral-900 font-medium text-sm">Website</FormLabel>
              <FormControl>
                <Input placeholder="https://company.com" {...field} data-testid="input-client-website" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          
          <FormField control={form.control} name="contactName" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-neutral-900 font-medium text-sm">Contact Name</FormLabel>
              <FormControl>
                <Input placeholder="John Smith" {...field} data-testid="input-client-contact-name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          
          <FormField control={form.control} name="contactEmail" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-neutral-900 font-medium text-sm">Contact Email</FormLabel>
              <FormControl>
                <Input placeholder="john@company.com" {...field} data-testid="input-client-contact-email" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="contactPhone" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-neutral-900 font-medium text-sm">Contact Phone</FormLabel>
              <FormControl>
                <Input placeholder="(555) 123-4567" {...field} data-testid="input-client-contact-phone" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="priority" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-neutral-900 font-medium text-sm">Priority</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-client-priority">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="paymentTerms" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-neutral-900 font-medium text-sm">Payment Terms</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-client-payment-terms">
                    <SelectValue placeholder="Select terms" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Net 15">Net 15</SelectItem>
                  <SelectItem value="Net 30">Net 30</SelectItem>
                  <SelectItem value="Net 45">Net 45</SelectItem>
                  <SelectItem value="Net 60">Net 60</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
        </div>
        
        <FormField control={form.control} name="notes" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-neutral-900 font-medium text-sm">Notes</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Additional information about the client..."
                className="min-h-[80px] resize-none"
                {...field} 
                data-testid="textarea-client-notes"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={closeModal} data-testid="button-cancel-client">
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={createClientMutation.isPending || updateClientMutation.isPending}
            data-testid="button-save-client"
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
      <div className="space-y-0">
        {/* Header */}
        <div className="bg-white border-b border-neutral-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-neutral-900">Clients</h1>
                <p className="text-sm text-neutral-600 mt-1">{filteredClients.length} total clients</p>
              </div>
              <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-add-client">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Client
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add New Client</DialogTitle>
                    <DialogDescription>Fill in the details below to add a new client to your organization.</DialogDescription>
                  </DialogHeader>
                  <ClientForm />
                </DialogContent>
              </Dialog>
            </div>

            {/* Search and View Toggle */}
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={20} />
                <Input
                  type="text"
                  placeholder="Search clients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-clients"
                />
              </div>
              <Button variant="outline" className="gap-2" data-testid="button-filter-clients">
                <Filter size={20} />
                Filter
              </Button>
              <div className="flex gap-1 border border-neutral-200 rounded-lg p-1">
                <button 
                  onClick={() => setView('list')}
                  className={cn(
                    "px-3 py-1.5 rounded text-sm font-medium transition-colors",
                    view === 'list' ? 'bg-info-100 text-info-700' : 'text-neutral-600 hover:bg-neutral-100'
                  )}
                  data-testid="button-view-list"
                >
                  List
                </button>
                <button 
                  onClick={() => setView('kanban')}
                  className={cn(
                    "px-3 py-1.5 rounded text-sm font-medium transition-colors",
                    view === 'kanban' ? 'bg-info-100 text-info-700' : 'text-neutral-600 hover:bg-neutral-100'
                  )}
                  data-testid="button-view-kanban"
                >
                  Kanban
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="bg-white border-b border-neutral-200">
          <div className="px-6 py-4">
            <div className="grid grid-cols-5 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-success-100 rounded-lg">
                  <Users className="text-success-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-neutral-600">Active Clients</p>
                  <p className="text-xl font-bold text-neutral-900">{stats.activeClients}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-info-100 rounded-lg">
                  <Briefcase className="text-info-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-neutral-600">Open Jobs</p>
                  <p className="text-xl font-bold text-neutral-900">{stats.totalOpenJobs}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <DollarSign className="text-purple-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-neutral-600">Total Revenue</p>
                  <p className="text-xl font-bold text-neutral-900">{formatCurrency(stats.totalRevenue)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Target className="text-emerald-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-neutral-600">Gross Profit</p>
                  <p className="text-xl font-bold text-neutral-900">{formatCurrency(stats.totalGrossProfit)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-warning-100 rounded-lg">
                  <Percent className="text-warning-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-neutral-600">Avg Margin</p>
                  <p className="text-xl font-bold text-neutral-900">{stats.avgMargin.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
            </div>
          ) : filteredClients.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Building2 className="w-12 h-12 mx-auto text-neutral-400 mb-4" />
                <h3 className="text-lg font-bold text-neutral-900 mb-2">
                  {searchQuery ? 'No clients found' : 'No clients yet'}
                </h3>
                <p className="text-neutral-500 mb-4">
                  {searchQuery 
                    ? 'Try adjusting your search terms.' 
                    : 'Add your first client to start managing your recruitment pipeline.'
                  }
                </p>
                {!searchQuery && (
                  <Button onClick={() => setIsAddModalOpen(true)} data-testid="button-add-first-client">
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Client
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : view === 'list' ? (
            <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-neutral-50">
                    <TableHead className="font-semibold text-neutral-700">CLIENT</TableHead>
                    <TableHead className="font-semibold text-neutral-700">STATUS</TableHead>
                    <TableHead className="font-semibold text-neutral-700">OPEN JOBS</TableHead>
                    <TableHead className="font-semibold text-neutral-700">PLACEMENTS</TableHead>
                    <TableHead className="font-semibold text-neutral-700">REVENUE</TableHead>
                    <TableHead className="font-semibold text-neutral-700">GROSS PROFIT</TableHead>
                    <TableHead className="font-semibold text-neutral-700">AVG MARGIN</TableHead>
                    <TableHead className="font-semibold text-neutral-700">TREND</TableHead>
                    <TableHead className="text-right font-semibold text-neutral-700">ACTIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow 
                      key={client.id} 
                      className="hover:bg-neutral-50 cursor-pointer"
                      onClick={() => setSelectedClient(client)}
                      data-testid={`row-client-${client.id}`}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-info-600 text-white rounded-lg flex items-center justify-center font-bold text-sm">
                            {client.logo}
                          </div>
                          <div>
                            <p className="font-semibold text-neutral-900">{client.name}</p>
                            <p className="text-sm text-neutral-500">{client.industry || '—'}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={cn("px-2 py-1 text-xs font-medium rounded-full", getStatusColor(client.displayStatus))}>
                          {client.displayStatus}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-neutral-900">{client.openJobs}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-neutral-900">{client.placements}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-neutral-900">{formatCurrency(client.revenue)}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-emerald-600">{formatCurrency(client.grossProfit)}</span>
                      </TableCell>
                      <TableCell>
                        <span className={cn("font-bold", getMarginColor(client.avgMargin))}>
                          {client.avgMargin}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center">
                          <TrendIcon trend={client.marginTrend} />
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm" data-testid={`button-actions-${client.id}`}>
                              <MoreVertical size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(client); }}>
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDelete(client.id); }} className="text-error-600">
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
          ) : (
            /* Kanban View */
            <div className="grid grid-cols-3 gap-4">
              {['Prospect', 'Active', 'Inactive'].map((status) => {
                const statusClients = filteredClients.filter(c => c.displayStatus === status)
                const statusColors: Record<string, string> = {
                  'Prospect': 'bg-info-100 text-info-800',
                  'Active': 'bg-success-100 text-success-800',
                  'Inactive': 'bg-neutral-100 text-neutral-800'
                }
                return (
                  <div key={status}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-neutral-900">{status}</h3>
                      <span className={cn("px-2 py-1 text-xs font-medium rounded-full", statusColors[status])}>
                        {statusClients.length}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {statusClients.map(client => (
                        <Card 
                          key={client.id} 
                          className="hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => setSelectedClient(client)}
                          data-testid={`card-client-${client.id}`}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3 mb-3">
                              <div className={cn(
                                "w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm text-white",
                                status === 'Inactive' ? 'bg-neutral-400' : 'bg-info-600'
                              )}>
                                {client.logo}
                              </div>
                              <div>
                                <p className="font-semibold text-neutral-900">{client.name}</p>
                                <p className="text-xs text-neutral-500">{client.industry || '—'}</p>
                              </div>
                            </div>
                            <div className="space-y-2 text-sm">
                              {status === 'Active' ? (
                                <>
                                  <div className="flex justify-between">
                                    <span className="text-neutral-600">Open Jobs:</span>
                                    <span className="font-medium">{client.openJobs}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-neutral-600">Gross Profit:</span>
                                    <span className="font-medium text-emerald-600">{formatCurrency(client.grossProfit)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-neutral-600">Margin:</span>
                                    <span className={cn("font-bold", getMarginColor(client.avgMargin))}>{client.avgMargin}%</span>
                                  </div>
                                </>
                              ) : status === 'Inactive' ? (
                                <>
                                  <p className="text-neutral-600">{client.contactName || '—'}</p>
                                  <div className="flex justify-between">
                                    <span className="text-neutral-600">Past Revenue:</span>
                                    <span className="text-neutral-500">{formatCurrency(client.revenue)}</span>
                                  </div>
                                </>
                              ) : (
                                <p className="text-neutral-600">{client.contactName || '—'}</p>
                              )}
                              <p className="text-xs text-neutral-500">
                                Last contact: {client.lastContactAt 
                                  ? formatDistanceToNow(new Date(client.lastContactAt), { addSuffix: true })
                                  : 'Never'}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Edit Client Modal */}
      <Dialog open={!!editingClient} onOpenChange={() => setEditingClient(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
            <DialogDescription>Update the client information below.</DialogDescription>
          </DialogHeader>
          <ClientForm />
        </DialogContent>
      </Dialog>

      {/* Client Detail Sheet */}
      <Sheet open={!!selectedClient} onOpenChange={() => setSelectedClient(null)}>
        <SheetContent className="w-[500px] sm:max-w-[500px] overflow-y-auto">
          {selectedClient && (
            <>
              <SheetHeader className="pb-4 border-b">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-info-600 text-white rounded-lg flex items-center justify-center font-bold text-xl">
                    {selectedClient.logo}
                  </div>
                  <div className="flex-1">
                    <SheetTitle className="text-xl">{selectedClient.name}</SheetTitle>
                    <p className="text-neutral-600">{selectedClient.industry || '—'}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={cn("px-2 py-1 text-xs font-medium rounded-full", getStatusColor(selectedClient.displayStatus))}>
                        {selectedClient.displayStatus}
                      </span>
                      {selectedClient.paymentTerms && (
                        <span className="text-xs text-neutral-500">Payment Terms: {selectedClient.paymentTerms}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button size="sm" data-testid="button-new-job">
                    <Plus size={16} className="mr-1" />
                    New Job
                  </Button>
                  <Button variant="outline" size="sm" data-testid="button-email-client">
                    <Mail size={16} className="mr-1" />
                    Email
                  </Button>
                  <Button variant="outline" size="sm" data-testid="button-call-client">
                    <Phone size={16} className="mr-1" />
                    Call
                  </Button>
                </div>
              </SheetHeader>

              <Tabs defaultValue="overview" className="mt-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="placements">Placements (0)</TabsTrigger>
                  <TabsTrigger value="financials">Financials</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6 mt-4">
                  <div>
                    <h3 className="font-bold text-neutral-900 mb-3">Contact Information</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-neutral-500">Primary Contact</p>
                        <p className="font-medium text-neutral-900">{selectedClient.contactName || '—'}</p>
                      </div>
                      <div>
                        <p className="text-neutral-500">Email</p>
                        <p className="font-medium text-neutral-900">{selectedClient.contactEmail || '—'}</p>
                      </div>
                      <div>
                        <p className="text-neutral-500">Phone</p>
                        <p className="font-medium text-neutral-900">{selectedClient.contactPhone || '—'}</p>
                      </div>
                      <div>
                        <p className="text-neutral-500">Last Contact</p>
                        <p className="font-medium text-neutral-900">
                          {selectedClient.lastContactAt 
                            ? formatDistanceToNow(new Date(selectedClient.lastContactAt), { addSuffix: true })
                            : 'Never'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-neutral-900 mb-3">Performance Metrics</h3>
                    <div className="grid grid-cols-4 gap-3">
                      <Card>
                        <CardContent className="p-3 text-center">
                          <p className="text-xs text-neutral-500">Open Jobs</p>
                          <p className="text-xl font-bold text-neutral-900">{selectedClient.openJobs}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-3 text-center">
                          <p className="text-xs text-neutral-500">Total Placements</p>
                          <p className="text-xl font-bold text-neutral-900">{selectedClient.placements}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-3 text-center">
                          <p className="text-xs text-neutral-500">Revenue</p>
                          <p className="text-lg font-bold text-neutral-900">{formatCurrency(selectedClient.revenue)}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-3 text-center">
                          <p className="text-xs text-neutral-500">Gross Profit</p>
                          <p className="text-lg font-bold text-emerald-600">{formatCurrency(selectedClient.grossProfit)}</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-neutral-900 mb-3">Profitability</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm text-neutral-500">Average Margin</p>
                            <TrendIcon trend={selectedClient.marginTrend} />
                          </div>
                          <p className={cn("text-3xl font-bold", getMarginColor(selectedClient.avgMargin))}>
                            {selectedClient.avgMargin}%
                          </p>
                          <p className="text-xs text-neutral-500 mt-1">Industry avg: 30%</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-sm text-neutral-500 mb-1">Profit per Placement</p>
                          <p className="text-3xl font-bold text-neutral-900">
                            {selectedClient.placements > 0 
                              ? formatCurrency(selectedClient.grossProfit / selectedClient.placements)
                              : '$0'}
                          </p>
                          <p className="text-xs text-neutral-500 mt-1">Across {selectedClient.placements} placements</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="placements" className="mt-4">
                  <div className="text-center py-8 text-neutral-500">
                    <Briefcase className="w-12 h-12 mx-auto text-neutral-300 mb-3" />
                    <p>No placements yet</p>
                  </div>
                </TabsContent>

                <TabsContent value="financials" className="mt-4">
                  <div className="text-center py-8 text-neutral-500">
                    <DollarSign className="w-12 h-12 mx-auto text-neutral-300 mb-3" />
                    <p>Financial data will appear here once placements are made</p>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  )
}
