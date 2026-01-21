import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/shared/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { apiRequest } from '@/lib/queryClient'
import { 
  CheckCircle, 
  XCircle, 
  Globe, 
  UserCheck, 
  Users, 
  Inbox,
  Clock,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

type ApprovalRequest = {
  id: string
  org_id: string
  request_type: string
  target_table: string
  target_id: string
  title: string
  description?: string
  requested_by: string
  requested_payload?: Record<string, unknown>
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  resolved_by?: string
  resolution_notes?: string
  requested_at: string
  resolved_at?: string
  created_at: string
  updated_at: string
}

const requestTypeConfig: Record<string, { label: string; icon: typeof Globe; color: string }> = {
  careers_publish: { label: 'Publish Request', icon: Globe, color: 'text-blue-600' },
  admin_claim: { label: 'Admin Request', icon: UserCheck, color: 'text-purple-600' },
  team_invite: { label: 'Team Invite', icon: Users, color: 'text-green-600' },
  seat_upgrade: { label: 'Seat Upgrade', icon: Users, color: 'text-orange-600' },
  onboarding_complete: { label: 'Onboarding', icon: CheckCircle, color: 'text-teal-600' },
}

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
  approved: { label: 'Approved', className: 'bg-green-100 text-green-800' },
  rejected: { label: 'Rejected', className: 'bg-red-100 text-red-800' },
  cancelled: { label: 'Cancelled', className: 'bg-gray-100 text-gray-800' },
}

export default function AdminInbox() {
  const { organizationId } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [selectedTab, setSelectedTab] = useState('all')
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null)
  const [isResolveDialogOpen, setIsResolveDialogOpen] = useState(false)
  const [resolveAction, setResolveAction] = useState<'approved' | 'rejected'>('approved')
  const [resolutionNotes, setResolutionNotes] = useState('')

  const { data: requests = [], isLoading } = useQuery<ApprovalRequest[]>({
    queryKey: ['/api/admin/inbox', organizationId],
    enabled: !!organizationId,
  })

  const resolveMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      return apiRequest(`/api/admin/inbox/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, resolutionNotes: notes }),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/inbox'] })
      setIsResolveDialogOpen(false)
      setSelectedRequest(null)
      setResolutionNotes('')
      toast({
        title: resolveAction === 'approved' ? 'Request Approved' : 'Request Rejected',
        description: `The request has been ${resolveAction} successfully.`,
      })
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to process request',
        variant: 'destructive',
      })
    },
  })

  const handleResolve = (request: ApprovalRequest, action: 'approved' | 'rejected') => {
    setSelectedRequest(request)
    setResolveAction(action)
    setResolutionNotes('')
    setIsResolveDialogOpen(true)
  }

  const submitResolve = () => {
    if (!selectedRequest) return
    
    if (resolveAction === 'rejected' && !resolutionNotes.trim()) {
      toast({
        title: 'Notes Required',
        description: 'Please provide a reason for rejecting this request.',
        variant: 'destructive',
      })
      return
    }

    resolveMutation.mutate({
      id: selectedRequest.id,
      status: resolveAction,
      notes: resolutionNotes || undefined,
    })
  }

  const filteredRequests = requests.filter((request) => {
    if (selectedTab === 'all') return request.status === 'pending'
    if (selectedTab === 'publishing') return request.request_type === 'careers_publish' && request.status === 'pending'
    if (selectedTab === 'admins') return request.request_type === 'admin_claim' && request.status === 'pending'
    if (selectedTab === 'invites') return request.request_type === 'team_invite' && request.status === 'pending'
    if (selectedTab === 'resolved') return request.status !== 'pending'
    return true
  })

  const pendingCounts = {
    all: requests.filter(r => r.status === 'pending').length,
    publishing: requests.filter(r => r.request_type === 'careers_publish' && r.status === 'pending').length,
    admins: requests.filter(r => r.request_type === 'admin_claim' && r.status === 'pending').length,
    invites: requests.filter(r => r.request_type === 'team_invite' && r.status === 'pending').length,
  }

  if (isLoading) {
    return (
      <div className="p-8 max-w-6xl mx-auto space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-12 w-full" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">Admin Inbox</h1>
        <p className="text-neutral-600">
          Review and approve pending requests from your team.
        </p>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="all" className="relative">
            All Pending
            {pendingCounts.all > 0 && (
              <Badge variant="secondary" className="ml-2 bg-yellow-100 text-yellow-800">
                {pendingCounts.all}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="publishing">
            Publish Requests
            {pendingCounts.publishing > 0 && (
              <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-800">
                {pendingCounts.publishing}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="admins">
            Admin Requests
            {pendingCounts.admins > 0 && (
              <Badge variant="secondary" className="ml-2 bg-purple-100 text-purple-800">
                {pendingCounts.admins}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="invites">
            Team Invites
            {pendingCounts.invites > 0 && (
              <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800">
                {pendingCounts.invites}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="space-y-4">
          {filteredRequests.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Inbox className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-neutral-900 mb-2">
                  {selectedTab === 'resolved' ? 'No Resolved Requests' : 'No Pending Requests'}
                </h3>
                <p className="text-neutral-600">
                  {selectedTab === 'resolved' 
                    ? 'Resolved requests will appear here.'
                    : 'New requests from your team will appear here.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredRequests.map((request) => {
              const config = requestTypeConfig[request.request_type] || {
                label: request.request_type,
                icon: AlertCircle,
                color: 'text-gray-600',
              }
              const Icon = config.icon
              const statusConf = statusConfig[request.status]

              return (
                <Card key={request.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5 flex justify-between items-center">
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-lg bg-neutral-100 ${config.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-neutral-900">{request.title}</h3>
                          <Badge variant="outline" className={statusConf.className}>
                            {statusConf.label}
                          </Badge>
                        </div>
                        {request.description && (
                          <p className="text-sm text-neutral-600 mb-2">{request.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-neutral-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(new Date(request.requested_at), { addSuffix: true })}
                          </span>
                          <span>{config.label}</span>
                        </div>
                        {request.resolution_notes && request.status !== 'pending' && (
                          <p className="text-sm text-neutral-500 mt-2 italic">
                            Note: {request.resolution_notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {request.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResolve(request, 'rejected')}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleResolve(request, 'approved')}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isResolveDialogOpen} onOpenChange={setIsResolveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {resolveAction === 'approved' ? 'Approve Request' : 'Reject Request'}
            </DialogTitle>
            <DialogDescription>
              {resolveAction === 'approved'
                ? 'Are you sure you want to approve this request?'
                : 'Please provide a reason for rejecting this request.'}
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="py-4">
              <div className="bg-neutral-50 p-4 rounded-lg mb-4">
                <p className="font-medium">{selectedRequest.title}</p>
                {selectedRequest.description && (
                  <p className="text-sm text-neutral-600 mt-1">{selectedRequest.description}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">
                  {resolveAction === 'rejected' ? 'Reason (required)' : 'Notes (optional)'}
                </Label>
                <Textarea
                  id="notes"
                  placeholder={resolveAction === 'rejected' 
                    ? 'Please explain why this request is being rejected...'
                    : 'Add any notes about this approval...'}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResolveDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={submitResolve}
              disabled={resolveMutation.isPending}
              className={resolveAction === 'approved' 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-red-600 hover:bg-red-700'}
            >
              {resolveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {resolveAction === 'approved' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
