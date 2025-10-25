import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { MessageSquare, Plus, Users, Bell, Archive, Send, Filter, Mail, Video, Calendar, Clock } from 'lucide-react'
import { MessagesList } from '@/features/communications/components/MessagesList'
import { ThreadTimeline } from '@/features/communications/components/google/ThreadTimeline'
import { useMessages, useUnreadMessageCount } from '@/features/communications/hooks/useMessages'
import { useAuth } from '@/contexts/AuthContext'
import { format } from 'date-fns'
import type { Message } from '@/../../shared/schema'
import { DemoMessages } from '@/components/demo/DemoMessages'
import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '@/lib/queryClient'

export default function Messages() {
  const { user, userRole, currentOrgId } = useAuth()
  
  // Show demo messages for demo viewers
  if (userRole === 'demo_viewer') {
    return (
      <DashboardLayout pageTitle="Demo Messages">
        <div className="p-6">
          <DemoMessages />
        </div>
      </DashboardLayout>
    )
  }

  const { data: allMessages = [] } = useMessages(user?.id)
  const { data: unreadData } = useUnreadMessageCount(user?.id)
  const unreadCount = unreadData?.count || 0

  // Check if Google is connected
  const { data: googleStatus } = useQuery({
    queryKey: ['/api/google/connection-status'],
    queryFn: async () => {
      const response = await apiRequest('/api/google/connection-status')
      return response as { connected: boolean; email?: string }
    },
  })

  const [composeTab, setComposeTab] = useState<'internal' | 'email' | 'client_portal'>('internal')
  const [selectedMessage, setSelectedMessage] = useState<Message | undefined>(undefined)
  const [viewTab, setViewTab] = useState<'internal' | 'email' | 'client_portal'>('internal')

  // Separate compose form state for each tab
  const [internalForm, setInternalForm] = useState({ subject: '', message: '' })
  const [emailForm, setEmailForm] = useState({ to: '', subject: '', message: '' })
  const [portalForm, setPortalForm] = useState({ subject: '', message: '' })

  // Update email "from" when Google status changes
  const [emailFrom, setEmailFrom] = useState('me@talentpatriot.com')
  useEffect(() => {
    if (googleStatus?.email) {
      setEmailFrom(googleStatus.email)
    }
  }, [googleStatus?.email])

  // Filter messages by type
  const internalMessages = allMessages.filter(m => m.channelType === 'internal' || m.type === 'internal')
  const emailMessages = allMessages.filter(m => m.channelType === 'email')
  const clientPortalMessages = allMessages.filter(m => m.channelType === 'client_portal')

  // Get messages for current view tab
  const getViewMessages = () => {
    switch (viewTab) {
      case 'internal': return internalMessages
      case 'email': return emailMessages
      case 'client_portal': return clientPortalMessages
      default: return internalMessages
    }
  }

  // Generate timeline events from selected message
  const getTimelineEvents = () => {
    if (!selectedMessage) return []
    
    // Convert message to timeline event
    return [{
      id: selectedMessage.id,
      type: 'email' as const, // ThreadTimeline accepts: 'email' | 'invite' | 'meet'
      title: selectedMessage.subject || 'Message',
      subtitle: selectedMessage.channelType || selectedMessage.type,
      timestamp: new Date(selectedMessage.createdAt),
      metadata: {
        to: selectedMessage.recipientId || '',
        subject: selectedMessage.subject || '',
      },
    }]
  }

  const handleSendInternal = async () => {
    if (!internalForm.subject || !internalForm.message) {
      alert('Please fill in subject and message')
      return
    }

    try {
      await apiRequest('/api/messages', {
        method: 'POST',
        body: JSON.stringify({
          org_id: currentOrgId,
          sender_id: user?.id,
          type: 'internal',
          channel_type: 'internal',
          priority: 'normal',
          subject: internalForm.subject,
          content: internalForm.message,
          is_read: false,
          is_archived: false,
        }),
      })

      setInternalForm({ subject: '', message: '' })
      alert('Internal message sent successfully!')
    } catch (error: any) {
      console.error('Failed to send internal message:', error)
      alert('Failed to send message. Please try again.')
    }
  }

  const handleSendEmail = async () => {
    if (!emailForm.to || !emailForm.subject || !emailForm.message) {
      alert('Please fill in all email fields')
      return
    }

    if (!googleStatus?.connected) {
      alert('Please connect your Google account first (Settings → Integrations)')
      return
    }

    try {
      // Send email via Gmail API
      const response = await apiRequest('/api/google/send-email', {
        method: 'POST',
        body: JSON.stringify({
          to: emailForm.to,
          subject: emailForm.subject,
          body: emailForm.message,
        }),
      }) as { success: boolean; messageId: string; threadId: string; from: string }

      console.log('✅ Email sent successfully:', response)

      // Create message record in database for tracking
      await apiRequest('/api/messages', {
        method: 'POST',
        body: JSON.stringify({
          org_id: currentOrgId,
          sender_id: user?.id,
          type: 'client',
          channel_type: 'email',
          priority: 'normal',
          subject: emailForm.subject,
          content: emailForm.message,
          is_read: true, // Sent emails are already "read"
          is_archived: false,
          external_message_id: response.messageId, // Store Gmail message ID
          thread_id: response.threadId, // Store Gmail thread ID for conversation tracking
        }),
      })
      
      setEmailForm({ to: '', subject: '', message: '' })
      alert(`Email sent successfully from ${response.from} to ${emailForm.to}!`)
    } catch (error: any) {
      console.error('Failed to send email:', error)
      const errorMessage = error.message || 'Failed to send email. Please try again.'
      alert(errorMessage)
    }
  }

  const handleSendWithInvite = () => {
    console.log('Sending email with calendar invite:', { from: emailFrom, ...emailForm })
    // TODO: Implement send with invite logic via API
    setEmailForm({ to: '', subject: '', message: '' })
  }

  const handlePostToPortal = async () => {
    if (!portalForm.subject || !portalForm.message) {
      alert('Please fill in subject and message')
      return
    }

    try {
      await apiRequest('/api/messages', {
        method: 'POST',
        body: JSON.stringify({
          org_id: currentOrgId,
          sender_id: user?.id,
          type: 'client',
          channel_type: 'client_portal',
          priority: 'normal',
          subject: portalForm.subject,
          content: portalForm.message,
          is_read: false,
          is_archived: false,
        }),
      })

      setPortalForm({ subject: '', message: '' })
      alert('Posted to client portal successfully!')
    } catch (error: any) {
      console.error('Failed to post to client portal:', error)
      alert('Failed to post. Please try again.')
    }
  }

  const handleProposeTimes = async () => {
    console.log('Opening availability picker...')
    
    // Fetch user's availability for the next 7 days
    const start = new Date()
    const end = new Date()
    end.setDate(end.getDate() + 7)
    
    try {
      const response = await apiRequest(
        `/api/google/freebusy?start=${start.toISOString()}&end=${end.toISOString()}`,
        { method: 'GET' }
      ) as { success: boolean; busy?: any[] }
      
      console.log('FreeBusy data:', response)
      // TODO: Open AvailabilityDrawer component with this data
      alert(`Found ${response.busy?.length || 0} busy time slots. Availability picker UI coming soon!`)
    } catch (error: any) {
      console.error('Failed to fetch availability:', error)
      alert('Failed to fetch availability. Please ensure your Google account is connected.')
    }
  }

  const handleAddCalendarInvite = async () => {
    console.log('Adding calendar invite...')
    
    // Prompt user for meeting time (for now, create tomorrow at 2 PM)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(14, 0, 0, 0)
    const oneHourLater = new Date(tomorrow.getTime() + 60 * 60 * 1000)
    
    try {
      const response = await apiRequest('/api/google/meet', {
        method: 'POST',
        body: JSON.stringify({
          summary: emailForm.subject || 'Calendar Event',
          description: emailForm.message || '',
          start: tomorrow.toISOString(),
          end: oneHourLater.toISOString(),
          attendees: emailForm.to ? [emailForm.to] : [],
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      }) as { success: boolean; meetUrl?: string; eventId?: string }
      
      if (response.meetUrl) {
        // Add calendar invite info to email
        setEmailForm(prev => ({
          ...prev,
          message: prev.message + `\n\nCalendar invite sent for ${tomorrow.toLocaleDateString()} at 2:00 PM\nJoin meeting: ${response.meetUrl}`,
        }))
        console.log('Calendar invite created:', response)
      }
    } catch (error: any) {
      console.error('Failed to create calendar invite:', error)
      alert('Failed to create calendar invite. Please ensure your Google account is connected.')
    }
  }

  const handleCreateVideo = async () => {
    console.log('Creating Google Meet link...')
    
    // Create a 1-hour meeting starting now
    const now = new Date()
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000)
    
    try {
      const response = await apiRequest('/api/google/meet', {
        method: 'POST',
        body: JSON.stringify({
          summary: emailForm.subject || 'Meeting',
          description: emailForm.message || '',
          start: now.toISOString(),
          end: oneHourLater.toISOString(),
          attendees: emailForm.to ? [emailForm.to] : [],
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      }) as { success: boolean; meetUrl?: string; eventId?: string }
      
      if (response.meetUrl) {
        // Add Meet link to email body
        setEmailForm(prev => ({
          ...prev,
          message: prev.message + `\n\nJoin meeting: ${response.meetUrl}`,
        }))
        console.log('Google Meet created:', response.meetUrl)
      }
    } catch (error: any) {
      console.error('Failed to create Google Meet:', error)
      alert('Failed to create Google Meet. Please ensure your Google account is connected.')
    }
  }

  return (
    <DashboardLayout pageTitle="Messages & Communication">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-6 w-6" />
              <h1 className="text-2xl font-bold">Messages</h1>
            </div>
          </div>
          <Button className="flex items-center gap-2" data-testid="button-new-message">
            <Plus className="h-4 w-4" />
            New Message
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{allMessages.length}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Unread</p>
                <p className="text-2xl font-bold text-red-600">{unreadCount}</p>
              </div>
              <Bell className="h-8 w-8 text-red-500" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Team</p>
                <p className="text-2xl font-bold">{internalMessages.length}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Client</p>
                <p className="text-2xl font-bold">{clientPortalMessages.length}</p>
              </div>
              <Archive className="h-8 w-8 text-muted-foreground" />
            </CardContent>
          </Card>
        </div>

        {/* Compose Message Section - Always Visible */}
        <Card>
          <CardHeader>
            <CardTitle>Compose Message</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={composeTab} onValueChange={(v) => setComposeTab(v as any)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="internal" data-testid="tab-internal">Internal</TabsTrigger>
                <TabsTrigger value="email" data-testid="tab-email">Email</TabsTrigger>
                <TabsTrigger value="client_portal" data-testid="tab-client-portal">Client Portal</TabsTrigger>
              </TabsList>

              {/* Internal Tab */}
              <TabsContent value="internal" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="internal-subject">Subject</Label>
                  <Input
                    id="internal-subject"
                    placeholder="Subject"
                    value={internalForm.subject}
                    onChange={(e) => setInternalForm(prev => ({ ...prev, subject: e.target.value }))}
                    data-testid="input-subject"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="internal-message">Message</Label>
                  <Textarea
                    id="internal-message"
                    placeholder="Message..."
                    value={internalForm.message}
                    onChange={(e) => setInternalForm(prev => ({ ...prev, message: e.target.value }))}
                    rows={4}
                    data-testid="textarea-message"
                  />
                </div>

                <Button onClick={handleSendInternal} data-testid="button-send-internal">
                  Send Internal Note
                </Button>
              </TabsContent>

              {/* Email Tab */}
              <TabsContent value="email" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="email-from">From</Label>
                  <Input
                    id="email-from"
                    value={emailFrom}
                    disabled
                    data-testid="input-email-from"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email-to">To (candidate/client)</Label>
                  <Input
                    id="email-to"
                    placeholder="To (candidate/client)"
                    value={emailForm.to}
                    onChange={(e) => setEmailForm(prev => ({ ...prev, to: e.target.value }))}
                    data-testid="input-email-to"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email-subject">Subject</Label>
                  <Input
                    id="email-subject"
                    placeholder="Subject"
                    value={emailForm.subject}
                    onChange={(e) => setEmailForm(prev => ({ ...prev, subject: e.target.value }))}
                    data-testid="input-email-subject"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email-body">Message</Label>
                  <Textarea
                    id="email-body"
                    placeholder="Write your email..."
                    value={emailForm.message}
                    onChange={(e) => setEmailForm(prev => ({ ...prev, message: e.target.value }))}
                    rows={6}
                    data-testid="textarea-email-body"
                  />
                </div>

                {/* Google Integration Buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleProposeTimes}
                    className="flex items-center gap-2"
                    data-testid="button-propose-times"
                  >
                    <Clock className="h-4 w-4" />
                    Propose Times
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddCalendarInvite}
                    className="flex items-center gap-2"
                    data-testid="button-add-calendar-invite"
                  >
                    <Calendar className="h-4 w-4" />
                    Add Calendar Invite
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCreateVideo}
                    className="flex items-center gap-2"
                    data-testid="button-create-video"
                  >
                    <Video className="h-4 w-4" />
                    Create Video
                  </Button>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <Button onClick={handleSendEmail} data-testid="button-send-email">
                    Send Email
                  </Button>
                  <Button onClick={handleSendWithInvite} variant="outline" data-testid="button-send-invite">
                    Send + Invite
                  </Button>
                </div>
              </TabsContent>

              {/* Client Portal Tab */}
              <TabsContent value="client_portal" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="portal-subject">Subject</Label>
                  <Input
                    id="portal-subject"
                    placeholder="Subject"
                    value={portalForm.subject}
                    onChange={(e) => setPortalForm(prev => ({ ...prev, subject: e.target.value }))}
                    data-testid="input-portal-subject"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="portal-message">Message</Label>
                  <Textarea
                    id="portal-message"
                    placeholder="Message to client portal..."
                    value={portalForm.message}
                    onChange={(e) => setPortalForm(prev => ({ ...prev, message: e.target.value }))}
                    rows={4}
                    data-testid="textarea-portal-message"
                  />
                </div>

                <Button onClick={handlePostToPortal} data-testid="button-post-portal">
                  Post to Portal
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Quick Filters */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Has Open Invite
          </Button>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            Needs Reply
          </Button>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            Upcoming Meetings
          </Button>
        </div>

        {/* Thread Timeline Section */}
        {selectedMessage && (
          <Card>
            <CardHeader>
              <CardTitle>Thread Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <ThreadTimeline events={getTimelineEvents()} />
            </CardContent>
          </Card>
        )}

        {/* Messages List Section */}
        <Card>
          <CardHeader>
            <CardTitle>Conversations</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={viewTab} onValueChange={(v) => setViewTab(v as any)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="internal" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Internal
                  <Badge variant="secondary" className="text-xs">
                    {internalMessages.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                  <Badge variant="secondary" className="text-xs">
                    {emailMessages.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="client_portal" className="flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  Client Portal
                  <Badge variant="secondary" className="text-xs">
                    {clientPortalMessages.length}
                  </Badge>
                </TabsTrigger>
              </TabsList>

              <TabsContent value={viewTab} className="mt-4">
                <MessagesList
                  messages={getViewMessages()}
                  selectedMessage={selectedMessage}
                  onMessageSelect={setSelectedMessage}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
