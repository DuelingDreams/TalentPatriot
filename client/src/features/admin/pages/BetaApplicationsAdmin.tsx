import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format, isPast, isToday } from 'date-fns'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/shared/hooks/use-toast'
import {
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Building2,
  Mail,
  Phone,
  Globe,
  RefreshCw,
  Filter,
  Calendar,
  Send,
  PhoneCall,
  Check,
  X,
} from 'lucide-react'

type BetaApplication = {
  id: string
  companyName: string
  contactName: string
  email: string
  phone?: string
  website?: string
  companySize: string
  currentAts?: string
  painPoints: string
  expectations?: string
  status: 'pending' | 'reviewing' | 'approved' | 'rejected' | 'waitlist'
  reviewNotes?: string
  reviewedAt?: string
  reviewedBy?: string
  scheduledCallAt?: string
  callCompletedAt?: string
  callNotes?: string
  magicLinkSentAt?: string
  createdAt: string
  updatedAt: string
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  reviewing: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  waitlist: 'bg-purple-100 text-purple-800',
}

const statusIcons = {
  pending: Clock,
  reviewing: AlertCircle,
  approved: CheckCircle,
  rejected: XCircle,
  waitlist: Clock,
}

export default function BetaApplicationsAdmin() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedApplication, setSelectedApplication] = useState<BetaApplication | null>(null)
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false)
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false)
  const [isCompleteCallDialogOpen, setIsCompleteCallDialogOpen] = useState(false)
  const [reviewStatus, setReviewStatus] = useState('')
  const [reviewNotes, setReviewNotes] = useState('')
  const [scheduledCallDate, setScheduledCallDate] = useState('')
  const [scheduledCallTime, setScheduledCallTime] = useState('')
  const [callNotes, setCallNotes] = useState('')

  const { data: applications = [], isLoading, error, refetch } = useQuery({
    queryKey: ['/api/beta/applications'],
    queryFn: async () => {
      const response = await fetch('/api/beta/applications')
      if (!response.ok) {
        throw new Error('Failed to fetch beta applications')
      }
      return response.json()
    },
  })

  const updateApplicationMutation = useMutation({
    mutationFn: async ({ id, status, reviewNotes }: { id: string; status: string; reviewNotes: string }) => {
      const response = await fetch(`/api/beta/applications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reviewNotes, reviewedBy: 'admin' }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update application')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/beta/applications'] })
      toast({ title: "Application updated", description: "The application status has been updated successfully." })
      setIsReviewDialogOpen(false)
      setSelectedApplication(null)
      setReviewNotes('')
      setReviewStatus('')
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    },
  })

  const scheduleCallMutation = useMutation({
    mutationFn: async ({ id, scheduledCallAt }: { id: string; scheduledCallAt: string }) => {
      const response = await fetch(`/api/beta/applications/${id}/schedule-call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledCallAt }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to schedule call')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/beta/applications'] })
      toast({ title: "Call scheduled", description: "The discovery call has been scheduled." })
      setIsScheduleDialogOpen(false)
      setSelectedApplication(null)
      setScheduledCallDate('')
      setScheduledCallTime('')
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    },
  })

  const completeCallMutation = useMutation({
    mutationFn: async ({ id, callNotes, approved }: { id: string; callNotes: string; approved: boolean }) => {
      const response = await fetch(`/api/beta/applications/${id}/complete-call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callNotes, approved }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to complete call')
      }
      return response.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/beta/applications'] })
      toast({ 
        title: variables.approved ? "Applicant approved" : "Applicant not approved", 
        description: "Call notes have been saved." 
      })
      setIsCompleteCallDialogOpen(false)
      setSelectedApplication(null)
      setCallNotes('')
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    },
  })

  const sendMagicLinkMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/beta/applications/${id}/send-magic-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send magic link')
      }
      return response.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/beta/applications'] })
      toast({ title: "Magic link sent", description: data.message })
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    },
  })

  const filteredApplications = applications.filter((app: BetaApplication) => {
    const matchesSearch = 
      app.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleReview = (application: BetaApplication) => {
    setSelectedApplication(application)
    setReviewStatus(application.status)
    setReviewNotes(application.reviewNotes || '')
    setIsReviewDialogOpen(true)
  }

  const handleScheduleCall = (application: BetaApplication) => {
    setSelectedApplication(application)
    if (application.scheduledCallAt) {
      const date = new Date(application.scheduledCallAt)
      setScheduledCallDate(format(date, 'yyyy-MM-dd'))
      setScheduledCallTime(format(date, 'HH:mm'))
    } else {
      setScheduledCallDate('')
      setScheduledCallTime('')
    }
    setIsScheduleDialogOpen(true)
  }

  const handleCompleteCall = (application: BetaApplication) => {
    setSelectedApplication(application)
    setCallNotes(application.callNotes || '')
    setIsCompleteCallDialogOpen(true)
  }

  const handleSubmitReview = () => {
    if (!selectedApplication || !reviewStatus) return
    updateApplicationMutation.mutate({
      id: selectedApplication.id,
      status: reviewStatus,
      reviewNotes,
    })
  }

  const handleSubmitSchedule = () => {
    if (!selectedApplication || !scheduledCallDate || !scheduledCallTime) return
    const scheduledCallAt = new Date(`${scheduledCallDate}T${scheduledCallTime}`).toISOString()
    scheduleCallMutation.mutate({
      id: selectedApplication.id,
      scheduledCallAt,
    })
  }

  const handleSubmitCompleteCall = (approved: boolean) => {
    if (!selectedApplication) return
    completeCallMutation.mutate({
      id: selectedApplication.id,
      callNotes,
      approved,
    })
  }

  const getStatusIcon = (status: string) => {
    const Icon = statusIcons[status as keyof typeof statusIcons]
    return Icon ? <Icon className="w-4 h-4" /> : <Clock className="w-4 h-4" />
  }

  const getWorkflowStage = (app: BetaApplication): string => {
    if (app.magicLinkSentAt) return 'invited'
    if (app.status === 'approved' && app.callCompletedAt) return 'ready_to_invite'
    if (app.callCompletedAt && app.status === 'rejected') return 'rejected'
    if (app.scheduledCallAt && !app.callCompletedAt) return 'call_scheduled'
    if (app.status === 'reviewing') return 'reviewing'
    return 'pending'
  }

  const getWorkflowBadge = (app: BetaApplication) => {
    const stage = getWorkflowStage(app)
    switch (stage) {
      case 'invited':
        return <Badge className="bg-emerald-100 text-emerald-800"><Send className="w-3 h-3 mr-1" /> Invited</Badge>
      case 'ready_to_invite':
        return <Badge className="bg-green-100 text-green-800"><Check className="w-3 h-3 mr-1" /> Ready to Invite</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><X className="w-3 h-3 mr-1" /> Not Approved</Badge>
      case 'call_scheduled':
        const callDate = new Date(app.scheduledCallAt!)
        const callSoon = isToday(callDate) || isPast(callDate)
        return (
          <Badge className={callSoon ? "bg-orange-100 text-orange-800" : "bg-blue-100 text-blue-800"}>
            <PhoneCall className="w-3 h-3 mr-1" />
            {callSoon ? 'Call Today' : format(callDate, 'MMM d')}
          </Badge>
        )
      case 'reviewing':
        return <Badge className="bg-blue-100 text-blue-800"><AlertCircle className="w-3 h-3 mr-1" /> Reviewing</Badge>
      default:
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>
    }
  }

  const getStatusCounts = () => ({
    total: applications.length,
    pending: applications.filter((app: BetaApplication) => app.status === 'pending').length,
    reviewing: applications.filter((app: BetaApplication) => app.status === 'reviewing').length,
    approved: applications.filter((app: BetaApplication) => app.status === 'approved').length,
    rejected: applications.filter((app: BetaApplication) => app.status === 'rejected').length,
    waitlist: applications.filter((app: BetaApplication) => app.status === 'waitlist').length,
  })

  const statusCounts = getStatusCounts()

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Applications</h3>
              <p className="text-gray-500 mb-4">Failed to load beta applications. Please try again.</p>
              <Button onClick={() => refetch()}>Retry</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Beta Applications</h1>
          <p className="text-gray-500 mt-1">Review and manage beta access requests</p>
        </div>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-900">{statusCounts.total}</div>
            <div className="text-sm text-gray-500">Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{statusCounts.pending}</div>
            <div className="text-sm text-gray-500">Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{statusCounts.reviewing}</div>
            <div className="text-sm text-gray-500">Reviewing</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{statusCounts.approved}</div>
            <div className="text-sm text-gray-500">Approved</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{statusCounts.rejected}</div>
            <div className="text-sm text-gray-500">Rejected</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{statusCounts.waitlist}</div>
            <div className="text-sm text-gray-500">Waitlist</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by company, contact name, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="md:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="reviewing">Reviewing</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="waitlist">Waitlist</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Applications ({filteredApplications.length})</CardTitle>
          <CardDescription>
            {filteredApplications.length === applications.length 
              ? `Showing all ${applications.length} applications`
              : `Showing ${filteredApplications.length} of ${applications.length} applications`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Workflow</TableHead>
                  <TableHead>Company Size</TableHead>
                  <TableHead>Applied Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplications.map((application: BetaApplication) => {
                  const stage = getWorkflowStage(application)
                  return (
                    <TableRow key={application.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{application.companyName}</div>
                          {application.website && (
                            <div className="text-sm text-gray-500 flex items-center mt-1">
                              <Globe className="w-3 h-3 mr-1" />
                              {application.website}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{application.contactName}</div>
                          <div className="text-sm text-gray-500 flex items-center mt-1">
                            <Mail className="w-3 h-3 mr-1" />
                            {application.email}
                          </div>
                          {application.phone && (
                            <div className="text-sm text-gray-500 flex items-center mt-1">
                              <Phone className="w-3 h-3 mr-1" />
                              {application.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getWorkflowBadge(application)}</TableCell>
                      <TableCell>{application.companySize}</TableCell>
                      <TableCell>{format(new Date(application.createdAt), 'MMM d, yyyy')}</TableCell>
                      <TableCell>
                        <div className="flex gap-2 flex-wrap">
                          <Button variant="outline" size="sm" onClick={() => handleReview(application)}>
                            <Eye className="w-4 h-4 mr-1" /> View
                          </Button>
                          {(stage === 'pending' || stage === 'reviewing') && !application.scheduledCallAt && (
                            <Button variant="outline" size="sm" onClick={() => handleScheduleCall(application)}>
                              <Calendar className="w-4 h-4 mr-1" /> Schedule
                            </Button>
                          )}
                          {stage === 'call_scheduled' && (
                            <Button variant="default" size="sm" onClick={() => handleCompleteCall(application)}>
                              <PhoneCall className="w-4 h-4 mr-1" /> Complete Call
                            </Button>
                          )}
                          {stage === 'ready_to_invite' && (
                            <Button 
                              variant="default" 
                              size="sm" 
                              onClick={() => sendMagicLinkMutation.mutate(application.id)}
                              disabled={sendMagicLinkMutation.isPending}
                            >
                              <Send className="w-4 h-4 mr-1" /> 
                              {sendMagicLinkMutation.isPending ? 'Sending...' : 'Send Invite'}
                            </Button>
                          )}
                          {stage === 'invited' && application.magicLinkSentAt && (
                            <span className="text-xs text-gray-500 py-2">
                              Sent {format(new Date(application.magicLinkSentAt), 'MMM d')}
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
          
          {filteredApplications.length === 0 && (
            <div className="text-center py-8">
              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'No beta applications have been submitted yet.'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Beta Application</DialogTitle>
            <DialogDescription>Review and update the status of this beta application</DialogDescription>
          </DialogHeader>
          
          {selectedApplication && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Company Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Company:</strong> {selectedApplication.companyName}</div>
                    <div><strong>Size:</strong> {selectedApplication.companySize}</div>
                    {selectedApplication.website && <div><strong>Website:</strong> {selectedApplication.website}</div>}
                    {selectedApplication.currentAts && <div><strong>Current ATS:</strong> {selectedApplication.currentAts}</div>}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Contact Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Name:</strong> {selectedApplication.contactName}</div>
                    <div><strong>Email:</strong> {selectedApplication.email}</div>
                    {selectedApplication.phone && <div><strong>Phone:</strong> {selectedApplication.phone}</div>}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Pain Points</h4>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedApplication.painPoints}</p>
              </div>

              {selectedApplication.expectations && (
                <div>
                  <h4 className="font-medium mb-2">Expectations</h4>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedApplication.expectations}</p>
                </div>
              )}

              {selectedApplication.callNotes && (
                <div>
                  <h4 className="font-medium mb-2">Call Notes</h4>
                  <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded-lg">{selectedApplication.callNotes}</p>
                </div>
              )}

              <div>
                <h4 className="font-medium mb-2">Update Status</h4>
                <Select value={reviewStatus} onValueChange={setReviewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="reviewing">Reviewing</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="waitlist">Waitlist</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <h4 className="font-medium mb-2">Review Notes</h4>
                <Textarea
                  placeholder="Add internal notes about this application..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={3}
                />
              </div>

              {selectedApplication.reviewedAt && (
                <div className="text-sm text-gray-500">
                  Last reviewed: {format(new Date(selectedApplication.reviewedAt), 'MMM d, yyyy h:mm a')}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReviewDialogOpen(false)} disabled={updateApplicationMutation.isPending}>Cancel</Button>
            <Button onClick={handleSubmitReview} disabled={!reviewStatus || updateApplicationMutation.isPending}>
              {updateApplicationMutation.isPending ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Updating...</> : 'Update Application'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Discovery Call</DialogTitle>
            <DialogDescription>
              Schedule a call with {selectedApplication?.contactName} from {selectedApplication?.companyName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Date</label>
              <Input
                type="date"
                value={scheduledCallDate}
                onChange={(e) => setScheduledCallDate(e.target.value)}
                min={format(new Date(), 'yyyy-MM-dd')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Time</label>
              <Input
                type="time"
                value={scheduledCallTime}
                onChange={(e) => setScheduledCallTime(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsScheduleDialogOpen(false)} disabled={scheduleCallMutation.isPending}>Cancel</Button>
            <Button onClick={handleSubmitSchedule} disabled={!scheduledCallDate || !scheduledCallTime || scheduleCallMutation.isPending}>
              {scheduleCallMutation.isPending ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Scheduling...</> : 'Schedule Call'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCompleteCallDialogOpen} onOpenChange={setIsCompleteCallDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Discovery Call</DialogTitle>
            <DialogDescription>
              Record notes and decision for {selectedApplication?.contactName} from {selectedApplication?.companyName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Call Notes</label>
              <Textarea
                placeholder="Notes from the discovery call..."
                value={callNotes}
                onChange={(e) => setCallNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setIsCompleteCallDialogOpen(false)} disabled={completeCallMutation.isPending}>Cancel</Button>
            <Button variant="destructive" onClick={() => handleSubmitCompleteCall(false)} disabled={completeCallMutation.isPending}>
              <X className="w-4 h-4 mr-1" /> Not Approved
            </Button>
            <Button onClick={() => handleSubmitCompleteCall(true)} disabled={completeCallMutation.isPending}>
              {completeCallMutation.isPending ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : <><Check className="w-4 h-4 mr-1" /> Approve</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
