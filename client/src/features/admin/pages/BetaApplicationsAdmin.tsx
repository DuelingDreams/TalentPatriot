import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
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
import { useToast } from '@/hooks/use-toast'
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
  const [reviewStatus, setReviewStatus] = useState('')
  const [reviewNotes, setReviewNotes] = useState('')

  // Fetch beta applications
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

  // Update application status mutation
  const updateApplicationMutation = useMutation({
    mutationFn: async ({ id, status, reviewNotes }: { id: string; status: string; reviewNotes: string }) => {
      const response = await fetch(`/api/beta/applications/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          reviewNotes,
          reviewedBy: 'admin', // In production, this would be the actual admin user ID
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update application')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/beta/applications'] })
      toast({
        title: "Application updated",
        description: "The application status has been updated successfully.",
      })
      setIsReviewDialogOpen(false)
      setSelectedApplication(null)
      setReviewNotes('')
      setReviewStatus('')
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  // Filter applications based on search and status
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

  const handleSubmitReview = () => {
    if (!selectedApplication || !reviewStatus) return

    updateApplicationMutation.mutate({
      id: selectedApplication.id,
      status: reviewStatus,
      reviewNotes,
    })
  }

  const getStatusIcon = (status: string) => {
    const Icon = statusIcons[status as keyof typeof statusIcons]
    return Icon ? <Icon className="w-4 h-4" /> : <Clock className="w-4 h-4" />
  }

  const getStatusCounts = () => {
    const counts = {
      total: applications.length,
      pending: applications.filter((app: BetaApplication) => app.status === 'pending').length,
      reviewing: applications.filter((app: BetaApplication) => app.status === 'reviewing').length,
      approved: applications.filter((app: BetaApplication) => app.status === 'approved').length,
      rejected: applications.filter((app: BetaApplication) => app.status === 'rejected').length,
      waitlist: applications.filter((app: BetaApplication) => app.status === 'waitlist').length,
    }
    return counts
  }

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
      {/* Header */}
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

      {/* Status Overview Cards */}
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

      {/* Filters */}
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
                  data-testid="input-search-applications"
                />
              </div>
            </div>
            <div className="md:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger data-testid="select-status-filter">
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

      {/* Applications Table */}
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
                  <TableHead>Status</TableHead>
                  <TableHead>Company Size</TableHead>
                  <TableHead>Applied Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplications.map((application: BetaApplication) => (
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
                    <TableCell>
                      <Badge 
                        className={`${statusColors[application.status]} flex items-center gap-1 w-fit`}
                      >
                        {getStatusIcon(application.status)}
                        {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>{application.companySize}</TableCell>
                    <TableCell>
                      {format(new Date(application.createdAt), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReview(application)}
                        data-testid={`button-review-${application.id}`}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
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

      {/* Review Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Beta Application</DialogTitle>
            <DialogDescription>
              Review and update the status of this beta application
            </DialogDescription>
          </DialogHeader>
          
          {selectedApplication && (
            <div className="space-y-4">
              {/* Application Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Company Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Company:</strong> {selectedApplication.companyName}</div>
                    <div><strong>Size:</strong> {selectedApplication.companySize}</div>
                    {selectedApplication.website && (
                      <div><strong>Website:</strong> {selectedApplication.website}</div>
                    )}
                    {selectedApplication.currentAts && (
                      <div><strong>Current ATS:</strong> {selectedApplication.currentAts}</div>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Contact Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Name:</strong> {selectedApplication.contactName}</div>
                    <div><strong>Email:</strong> {selectedApplication.email}</div>
                    {selectedApplication.phone && (
                      <div><strong>Phone:</strong> {selectedApplication.phone}</div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Pain Points</h4>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                  {selectedApplication.painPoints}
                </p>
              </div>

              {selectedApplication.expectations && (
                <div>
                  <h4 className="font-medium mb-2">Expectations</h4>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                    {selectedApplication.expectations}
                  </p>
                </div>
              )}

              {/* Status Update */}
              <div>
                <h4 className="font-medium mb-2">Update Status</h4>
                <Select value={reviewStatus} onValueChange={setReviewStatus}>
                  <SelectTrigger data-testid="select-review-status">
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

              {/* Review Notes */}
              <div>
                <h4 className="font-medium mb-2">Review Notes</h4>
                <Textarea
                  placeholder="Add internal notes about this application..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={3}
                  data-testid="textarea-review-notes"
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
            <Button 
              variant="outline" 
              onClick={() => setIsReviewDialogOpen(false)}
              disabled={updateApplicationMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitReview}
              disabled={!reviewStatus || updateApplicationMutation.isPending}
              data-testid="button-submit-review"
            >
              {updateApplicationMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Application'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}