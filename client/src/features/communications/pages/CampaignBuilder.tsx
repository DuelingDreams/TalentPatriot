import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useLocation } from 'wouter'
import { format } from 'date-fns'
import { apiRequest, queryClient } from '@/lib/queryClient'
import { useAuth } from '@/contexts/AuthContext'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/shared/hooks/use-toast'
import { 
  Plus, 
  Mail, 
  Edit, 
  Trash2, 
  ArrowLeft,
  Calendar,
  Settings,
  Users,
  Zap,
  GripVertical,
  ChevronRight,
  Play,
  Pause,
  MoreVertical
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { DripCampaign, CampaignEmail } from '@shared/schema'

interface CampaignWithEmails extends DripCampaign {
  emails?: CampaignEmail[]
  enrollmentCount?: number
}

function CampaignList({ onSelectCampaign, onCreateNew }: { 
  onSelectCampaign: (id: string) => void
  onCreateNew: () => void 
}) {
  const { currentOrgId } = useAuth()
  
  const { data: campaigns, isLoading } = useQuery<DripCampaign[]>({
    queryKey: ['/api/campaigns'],
    enabled: !!currentOrgId,
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case 'paused':
        return <Badge className="bg-yellow-100 text-yellow-800">Paused</Badge>
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-800">Draft</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
            <div className="h-5 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-100 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email Campaigns</h1>
          <p className="text-gray-500 mt-1">Create and manage drip campaigns for candidate engagement</p>
        </div>
        <Button onClick={onCreateNew} data-testid="create-campaign-button">
          <Plus className="w-4 h-4 mr-2" />
          New Campaign
        </Button>
      </div>

      {!campaigns || campaigns.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Mail className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns yet</h3>
            <p className="text-gray-500 text-center mb-4">
              Create your first drip campaign to automate candidate engagement
            </p>
            <Button onClick={onCreateNew}>
              <Plus className="w-4 h-4 mr-2" />
              Create Campaign
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {campaigns.map((campaign) => (
            <Card 
              key={campaign.id} 
              className="cursor-pointer hover:border-blue-300 transition-colors"
              onClick={() => onSelectCampaign(campaign.id)}
              data-testid={`campaign-card-${campaign.id}`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{campaign.name}</h3>
                      {getStatusBadge(campaign.status)}
                    </div>
                    <p className="text-gray-500 text-sm mb-3">
                      {campaign.description || 'No description'}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Created {campaign.createdAt ? format(new Date(campaign.createdAt), 'MMM d, yyyy') : 'Recently'}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function CampaignDetail({ campaignId, onBack }: { campaignId: string; onBack: () => void }) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('emails')
  const [showEmailDialog, setShowEmailDialog] = useState(false)
  const [editingEmail, setEditingEmail] = useState<CampaignEmail | null>(null)

  const { data: campaign, isLoading: campaignLoading } = useQuery<DripCampaign>({
    queryKey: ['/api/campaigns', campaignId],
    queryFn: async () => {
      const campaigns = await fetch(`/api/campaigns`).then(r => r.json())
      return campaigns.find((c: DripCampaign) => c.id === campaignId)
    },
  })

  const { data: emails, isLoading: emailsLoading } = useQuery<CampaignEmail[]>({
    queryKey: ['/api/campaigns', campaignId, 'emails'],
    queryFn: async () => {
      const response = await fetch(`/api/campaigns/${campaignId}/emails`)
      if (!response.ok) throw new Error('Failed to fetch emails')
      return response.json()
    },
    enabled: !!campaignId,
  })

  const updateCampaignMutation = useMutation({
    mutationFn: async (data: Partial<DripCampaign>) => {
      return apiRequest(`/api/campaigns/${campaignId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] })
      toast({ title: 'Campaign updated', description: 'Your changes have been saved.' })
    },
  })

  const deleteEmailMutation = useMutation({
    mutationFn: async (emailId: string) => {
      return apiRequest(`/api/campaigns/${campaignId}/emails/${emailId}`, {
        method: 'DELETE',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns', campaignId, 'emails'] })
      toast({ title: 'Email deleted' })
    },
  })

  const toggleStatus = () => {
    const newStatus = campaign?.status === 'active' ? 'paused' : 'active'
    updateCampaignMutation.mutate({ status: newStatus })
  }

  const handleEditEmail = (email: CampaignEmail) => {
    setEditingEmail(email)
    setShowEmailDialog(true)
  }

  const handleAddEmail = () => {
    setEditingEmail(null)
    setShowEmailDialog(true)
  }

  if (campaignLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="h-4 bg-gray-100 rounded w-1/2"></div>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Campaign not found</p>
        <Button variant="outline" onClick={onBack} className="mt-4">
          Go Back
        </Button>
      </div>
    )
  }

  const sortedEmails = emails?.sort((a, b) => 
    (a.sequenceOrder || 0) - (b.sequenceOrder || 0)
  ) || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{campaign.name}</h1>
            <p className="text-gray-500">{campaign.description || 'No description'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant={campaign.status === 'active' ? 'outline' : 'default'}
            onClick={toggleStatus}
            data-testid="toggle-campaign-status"
          >
            {campaign.status === 'active' ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Pause Campaign
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Activate Campaign
              </>
            )}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Edit className="w-4 h-4 mr-2" />
                Edit Details
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Campaign
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="emails" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Email Sequence
          </TabsTrigger>
          <TabsTrigger value="triggers" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Triggers & Rules
          </TabsTrigger>
          <TabsTrigger value="enrollments" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Enrollments
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="emails" className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Email Sequence</h2>
            <Button onClick={handleAddEmail} data-testid="add-sequence-email">
              <Plus className="w-4 h-4 mr-2" />
              Add Email
            </Button>
          </div>

          {emailsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-lg border p-4 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-gray-100 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : sortedEmails.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Mail className="w-10 h-10 text-gray-400 mb-3" />
                <h3 className="font-medium text-gray-900 mb-1">No emails in sequence</h3>
                <p className="text-gray-500 text-sm mb-4">Add your first email to start building the sequence</p>
                <Button onClick={handleAddEmail} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Email
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {sortedEmails.map((email, index) => (
                <Card key={email.id} className="relative" data-testid={`sequence-email-${email.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex items-center gap-2 text-gray-400 cursor-move">
                        <GripVertical className="w-4 h-4" />
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-medium text-sm">
                          {index + 1}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            Day {email.delayDays}
                          </Badge>
                          <h3 className="font-medium text-gray-900 truncate">{email.subject}</h3>
                        </div>
                        <p className="text-sm text-gray-500 line-clamp-2">
                          {email.body?.substring(0, 150) || 'No content'}...
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleEditEmail(email)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => deleteEmailMutation.mutate(email.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="triggers" className="mt-6">
          <TriggerRulesEditor campaign={campaign} onUpdate={(data) => updateCampaignMutation.mutate(data)} />
        </TabsContent>

        <TabsContent value="enrollments" className="mt-6">
          <EnrollmentsList campaignId={campaignId} />
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <CampaignSettings campaign={campaign} onUpdate={(data) => updateCampaignMutation.mutate(data)} />
        </TabsContent>
      </Tabs>

      <EmailEditorDialog
        open={showEmailDialog}
        onOpenChange={setShowEmailDialog}
        campaignId={campaignId}
        email={editingEmail}
        nextSequenceOrder={sortedEmails.length}
      />
    </div>
  )
}

interface TriggerConditions {
  targetStage?: string
  daysAfter?: number
  event?: string
  stopOnReply?: boolean
  skipWeekends?: boolean
  businessHoursOnly?: boolean
}

function TriggerRulesEditor({ campaign, onUpdate }: { campaign: DripCampaign; onUpdate: (data: Partial<DripCampaign>) => void }) {
  const campaignConditions = (campaign.triggerConditions as TriggerConditions) || {}
  const [triggerType, setTriggerType] = useState(campaign.triggerType || 'manual')
  const [triggerConditions, setTriggerConditions] = useState<TriggerConditions>({
    targetStage: campaignConditions.targetStage || '',
    daysAfter: campaignConditions.daysAfter || 0,
    event: campaignConditions.event || '',
    stopOnReply: campaignConditions.stopOnReply || false,
    skipWeekends: campaignConditions.skipWeekends || false,
    businessHoursOnly: campaignConditions.businessHoursOnly || false,
  })

  const handleSave = () => {
    onUpdate({ triggerType, triggerConditions })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Trigger Conditions</CardTitle>
          <CardDescription>Define when candidates should be automatically enrolled in this campaign</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Trigger Type</Label>
            <Select value={triggerType} onValueChange={setTriggerType}>
              <SelectTrigger data-testid="trigger-type-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual Enrollment Only</SelectItem>
                <SelectItem value="stage_change">When Candidate Stage Changes</SelectItem>
                <SelectItem value="application_received">When Application Received</SelectItem>
                <SelectItem value="tag_added">When Tag Added</SelectItem>
                <SelectItem value="time_based">Time-Based (Days Since Event)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {triggerType === 'stage_change' && (
            <div>
              <Label>Target Stage</Label>
              <Select 
                value={triggerConditions.targetStage || ''} 
                onValueChange={(v) => setTriggerConditions({ ...triggerConditions, targetStage: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="applied">Applied</SelectItem>
                  <SelectItem value="screening">Screening</SelectItem>
                  <SelectItem value="interview">Interview</SelectItem>
                  <SelectItem value="offer">Offer</SelectItem>
                  <SelectItem value="hired">Hired</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {triggerType === 'time_based' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Days After</Label>
                <Input 
                  type="number" 
                  min="0"
                  value={triggerConditions.daysAfter || 0}
                  onChange={(e) => setTriggerConditions({ ...triggerConditions, daysAfter: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <Label>Event</Label>
                <Select 
                  value={triggerConditions.event || ''} 
                  onValueChange={(v) => setTriggerConditions({ ...triggerConditions, event: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select event" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="application_date">Application Date</SelectItem>
                    <SelectItem value="last_contact">Last Contact</SelectItem>
                    <SelectItem value="interview_date">Interview Date</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <Button onClick={handleSave} className="mt-4" data-testid="save-triggers">
            Save Trigger Settings
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Campaign Rules</CardTitle>
          <CardDescription>Additional conditions for running the campaign</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Stop on Reply</p>
              <p className="text-sm text-gray-500">Pause campaign when candidate replies</p>
            </div>
            <input 
              type="checkbox" 
              className="w-5 h-5 rounded"
              checked={triggerConditions.stopOnReply || false}
              onChange={(e) => setTriggerConditions({ ...triggerConditions, stopOnReply: e.target.checked })}
            />
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Skip Weekends</p>
              <p className="text-sm text-gray-500">Don't send emails on Saturday/Sunday</p>
            </div>
            <input 
              type="checkbox" 
              className="w-5 h-5 rounded"
              checked={triggerConditions.skipWeekends || false}
              onChange={(e) => setTriggerConditions({ ...triggerConditions, skipWeekends: e.target.checked })}
            />
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Business Hours Only</p>
              <p className="text-sm text-gray-500">Send between 9 AM - 5 PM recipient time</p>
            </div>
            <input 
              type="checkbox" 
              className="w-5 h-5 rounded"
              checked={triggerConditions.businessHoursOnly || false}
              onChange={(e) => setTriggerConditions({ ...triggerConditions, businessHoursOnly: e.target.checked })}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function EnrollmentsList({ campaignId }: { campaignId: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Enrolled Candidates</CardTitle>
        <CardDescription>Candidates currently enrolled in this campaign</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-gray-500">
          <Users className="w-10 h-10 mx-auto mb-3 text-gray-400" />
          <p>No candidates enrolled yet</p>
          <p className="text-sm">Enroll candidates from their profile page</p>
        </div>
      </CardContent>
    </Card>
  )
}

function CampaignSettings({ campaign, onUpdate }: { campaign: DripCampaign; onUpdate: (data: Partial<DripCampaign>) => void }) {
  const [name, setName] = useState(campaign.name)
  const [description, setDescription] = useState(campaign.description || '')

  const handleSave = () => {
    onUpdate({ name, description })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Campaign Settings</CardTitle>
        <CardDescription>Basic campaign configuration</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Campaign Name</Label>
          <Input 
            value={name} 
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter campaign name"
            data-testid="campaign-name-input"
          />
        </div>
        <div>
          <Label>Description</Label>
          <Textarea 
            value={description} 
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the purpose of this campaign"
            rows={3}
            data-testid="campaign-description-input"
          />
        </div>
        <Button onClick={handleSave} data-testid="save-campaign-settings">
          Save Changes
        </Button>
      </CardContent>
    </Card>
  )
}

function EmailEditorDialog({ 
  open, 
  onOpenChange, 
  campaignId, 
  email,
  nextSequenceOrder 
}: { 
  open: boolean
  onOpenChange: (open: boolean) => void
  campaignId: string
  email: CampaignEmail | null
  nextSequenceOrder: number
}) {
  const { toast } = useToast()
  const [subject, setSubject] = useState(email?.subject || '')
  const [body, setBody] = useState(email?.body || '')
  const [delayDays, setDelayDays] = useState(email?.delayDays ?? (nextSequenceOrder === 0 ? 0 : 3))

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`/api/campaigns/${campaignId}/emails`, {
        method: 'POST',
        body: JSON.stringify(data),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns', campaignId, 'emails'] })
      toast({ title: 'Email added', description: 'The email has been added to the sequence.' })
      onOpenChange(false)
      resetForm()
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to save email', variant: 'destructive' })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`/api/campaigns/${campaignId}/emails/${email?.id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns', campaignId, 'emails'] })
      toast({ title: 'Email updated' })
      onOpenChange(false)
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to update email', variant: 'destructive' })
    },
  })

  const resetForm = () => {
    setSubject('')
    setBody('')
    setDelayDays(3)
  }

  const handleSubmit = () => {
    if (!subject.trim()) {
      toast({ title: 'Error', description: 'Please enter a subject line', variant: 'destructive' })
      return
    }

    const data = {
      subject,
      body,
      delayDays,
      sequenceOrder: email?.sequenceOrder ?? nextSequenceOrder,
    }

    if (email) {
      updateMutation.mutate(data)
    } else {
      createMutation.mutate(data)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{email ? 'Edit Email' : 'Add Email to Sequence'}</DialogTitle>
          <DialogDescription>
            {email ? 'Update the email content and timing' : 'Create a new email in your campaign sequence'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label>Send Delay (Days after enrollment)</Label>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-gray-500">Day</span>
              <Input 
                type="number" 
                min="0"
                value={delayDays}
                onChange={(e) => setDelayDays(parseInt(e.target.value) || 0)}
                className="w-20"
                data-testid="email-delay-input"
              />
              <span className="text-sm text-gray-500">after enrollment</span>
            </div>
          </div>

          <div>
            <Label>Subject Line</Label>
            <Input 
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter email subject"
              data-testid="email-subject-input"
            />
            <p className="text-xs text-gray-500 mt-1">
              Available variables: {'{candidateName}'}, {'{jobTitle}'}, {'{companyName}'}
            </p>
          </div>

          <div>
            <Label>Email Body</Label>
            <Textarea 
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your email content here..."
              rows={10}
              data-testid="email-body-input"
            />
            <p className="text-xs text-gray-500 mt-1">
              Use variables to personalize: {'{candidateName}'}, {'{jobTitle}'}, {'{companyName}'}, {'{recruiterName}'}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={createMutation.isPending || updateMutation.isPending}
            data-testid="save-email-button"
          >
            {email ? 'Update Email' : 'Add Email'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function CreateCampaignDialog({ open, onOpenChange, onCreated }: { 
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (id: string) => void 
}) {
  const { toast } = useToast()
  const { currentOrgId } = useAuth()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/campaigns', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] })
      toast({ title: 'Campaign created', description: 'Start adding emails to your new campaign.' })
      onOpenChange(false)
      setName('')
      setDescription('')
      if (data?.id) {
        onCreated(data.id)
      }
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to create campaign', variant: 'destructive' })
    },
  })

  const handleSubmit = () => {
    if (!name.trim()) {
      toast({ title: 'Error', description: 'Please enter a campaign name', variant: 'destructive' })
      return
    }

    createMutation.mutate({
      name,
      description,
      status: 'draft',
      orgId: currentOrgId,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Campaign</DialogTitle>
          <DialogDescription>
            Set up a new drip campaign for candidate engagement
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label>Campaign Name</Label>
            <Input 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., New Applicant Welcome Series"
              data-testid="new-campaign-name"
            />
          </div>
          <div>
            <Label>Description (Optional)</Label>
            <Textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the purpose of this campaign"
              rows={3}
              data-testid="new-campaign-description"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={createMutation.isPending}
            data-testid="create-campaign-submit"
          >
            Create Campaign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function CampaignBuilder() {
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  const handleCampaignCreated = (id: string) => {
    setSelectedCampaignId(id)
  }

  return (
    <DashboardLayout pageTitle="Email Campaigns">
      <div className="p-6 max-w-6xl mx-auto">
        {selectedCampaignId ? (
          <CampaignDetail 
            campaignId={selectedCampaignId} 
            onBack={() => setSelectedCampaignId(null)} 
          />
        ) : (
          <CampaignList 
            onSelectCampaign={setSelectedCampaignId}
            onCreateNew={() => setShowCreateDialog(true)}
          />
        )}

        <CreateCampaignDialog 
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onCreated={handleCampaignCreated}
        />
      </div>
    </DashboardLayout>
  )
}
