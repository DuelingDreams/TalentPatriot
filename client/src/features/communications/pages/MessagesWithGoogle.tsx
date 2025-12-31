import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { MessageSquare, Plus, Users, Bell, Archive, Send, Filter, Mail, Video, Calendar, Clock, AlertCircle } from 'lucide-react'
import { Link } from 'wouter'
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

  // Check if Google is connected - only when user is authenticated
  // CRITICAL: Include currentOrgId in queryKey to prevent cross-org cache pollution
  interface GoogleConnectionStatus {
    connected: boolean
    email?: string
    needsReconnect?: boolean
    healthStatus?: 'healthy' | 'needs_reconnect' | 'error' | 'unknown'
    message?: string
  }
  
  const { data: googleStatus, error: googleStatusError } = useQuery({
    queryKey: ['/api/google/connection-status', currentOrgId],
    queryFn: async () => {
      try {
        const response = await apiRequest('/api/google/connection-status')
        return response as GoogleConnectionStatus
      } catch (error) {
        console.warn('[Messages] Google connection status check failed:', error);
        return { connected: false, email: undefined, healthStatus: 'unknown' as const };
      }
    },
    enabled: !!user?.id && !!currentOrgId,
    retry: 2,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
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
      // Note: external_message_id stores the Gmail message ID
      // thread_id should be null since we're not linking to a message_threads record
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
          // Don't include thread_id - it's a UUID field for message_threads, not Gmail thread IDs
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
    if (!googleStatus?.connected) {
      alert('Please connect your Google account first (Settings → Integrations)')
      return
    }

    console.log('Opening availability picker...')
    
    // Fetch user's availability for the next 7 days
    const start = new Date()
    const end = new Date()
    end.setDate(end.getDate() + 7)
    
    try {
      const response = await apiRequest(
        `/api/google/freebusy?start=${start.toISOString()}&end=${end.toISOString()}`,
        { method: 'GET' }
      ) as { success: boolean; busy?: any[]; timeMin?: string; timeMax?: string }
      
      console.log('FreeBusy data:', response)
      
      // Calculate free time slots (9 AM - 5 PM on weekdays)
      const busySlots = response.busy || []
      const freeSlots: string[] = []
      
      // Generate business hours for next 5 weekdays
      for (let day = 1; day <= 5; day++) {
        const currentDay = new Date()
        currentDay.setDate(currentDay.getDate() + day)
        
        // Skip weekends
        if (currentDay.getDay() === 0 || currentDay.getDay() === 6) continue
        
        // Suggest 10 AM, 2 PM, 4 PM slots
        const slots = ['10:00', '14:00', '16:00']
        slots.forEach(time => {
          const [hour, minute] = time.split(':')
          const slotTime = new Date(currentDay)
          slotTime.setHours(parseInt(hour), parseInt(minute), 0, 0)
          
          // Check if slot is free
          const isBusy = busySlots.some((busy: any) => {
            const busyStart = new Date(busy.start)
            const busyEnd = new Date(busy.end)
            return slotTime >= busyStart && slotTime < busyEnd
          })
          
          if (!isBusy) {
            freeSlots.push(slotTime.toLocaleString('en-US', { 
              weekday: 'short', 
              month: 'short', 
              day: 'numeric', 
              hour: 'numeric', 
              minute: '2-digit' 
            }))
          }
        })
      }
      
      if (freeSlots.length > 0) {
        const proposedTimes = freeSlots.slice(0, 3).join('\n• ')
        const newMessage = emailForm.message + `\n\nI'm available at the following times:\n• ${proposedTimes}\n\nPlease let me know which time works best for you.`
        setEmailForm(prev => ({ ...prev, message: newMessage }))
        alert(`Added ${freeSlots.length} available time slots to your email!`)
      } else {
        alert('No available time slots found in the next 5 business days.')
      }
    } catch (error: any) {
      console.error('Failed to fetch availability:', error)
      alert('Failed to fetch availability. Please ensure your Google account is connected.')
    }
  }

  const handleAddCalendarInvite = async () => {
    if (!googleStatus?.connected) {
      alert('Please connect your Google account first (Settings → Integrations)')
      return
    }

    if (!emailForm.to) {
      alert('Please enter a recipient email address first')
      return
    }

    console.log('Adding calendar invite...')
    
    // Prompt user for meeting date and time
    const dateInput = prompt('Enter meeting date (YYYY-MM-DD) or leave blank for tomorrow:', '')
    const timeInput = prompt('Enter meeting time (HH:MM in 24-hour format, e.g., 14:00):', '14:00')
    
    if (timeInput === null) return // User cancelled
    
    // Parse date
    let meetingDate: Date
    if (!dateInput || dateInput.trim() === '') {
      // Default to tomorrow
      meetingDate = new Date()
      meetingDate.setDate(meetingDate.getDate() + 1)
    } else {
      meetingDate = new Date(dateInput)
      if (isNaN(meetingDate.getTime())) {
        alert('Invalid date format. Please use YYYY-MM-DD')
        return
      }
    }
    
    // Parse time
    const [hours, minutes] = (timeInput || '14:00').split(':').map(Number)
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      alert('Invalid time format. Please use HH:MM (e.g., 14:00)')
      return
    }
    
    meetingDate.setHours(hours, minutes, 0, 0)
    const oneHourLater = new Date(meetingDate.getTime() + 60 * 60 * 1000)
    
    try {
      const response = await apiRequest('/api/google/meet', {
        method: 'POST',
        body: JSON.stringify({
          summary: emailForm.subject || 'Meeting',
          description: emailForm.message || '',
          start: meetingDate.toISOString(),
          end: oneHourLater.toISOString(),
          attendees: [emailForm.to],
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      }) as { success: boolean; meetUrl?: string; eventId?: string }
      
      if (response.meetUrl) {
        // Add calendar invite info to email
        const formattedDate = meetingDate.toLocaleDateString('en-US', { 
          weekday: 'long', 
          month: 'long', 
          day: 'numeric', 
          year: 'numeric' 
        })
        const formattedTime = meetingDate.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          timeZoneName: 'short'
        })
        
        setEmailForm(prev => ({
          ...prev,
          message: prev.message + `\n\n📅 Calendar Invite: ${formattedDate} at ${formattedTime}\n🔗 Google Meet: ${response.meetUrl}`,
        }))
        
        alert(`Calendar invite created successfully!\nMeeting: ${formattedDate} at ${formattedTime}`)
        console.log('Calendar invite created:', response)
      }
    } catch (error: any) {
      console.error('Failed to create calendar invite:', error)
      alert('Failed to create calendar invite. Please ensure your Google account is connected.')
    }
  }

  const handleCreateVideo = async () => {
    if (!googleStatus?.connected) {
      alert('Please connect your Google account first (Settings → Integrations)')
      return
    }

    console.log('Creating Google Meet link...')
    
    // Create a 1-hour meeting starting in 5 minutes
    const now = new Date()
    const startTime = new Date(now.getTime() + 5 * 60 * 1000) // Start in 5 minutes
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000) // 1 hour duration
    
    try {
      const response = await apiRequest('/api/google/meet', {
        method: 'POST',
        body: JSON.stringify({
          summary: emailForm.subject || 'Quick Meeting',
          description: emailForm.message || '',
          start: startTime.toISOString(),
          end: endTime.toISOString(),
          attendees: emailForm.to ? [emailForm.to] : [],
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      }) as { success: boolean; meetUrl?: string; eventId?: string }
      
      if (response.meetUrl) {
        // Add Meet link to email body
        setEmailForm(prev => ({
          ...prev,
          message: prev.message + `\n\n🎥 Google Meet Link: ${response.meetUrl}\n\nMeeting starts in 5 minutes.`,
        }))
        alert(`Google Meet link created!\n${response.meetUrl}`)
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
                <p className="text-2xl font-bold text-error-600">{unreadCount}</p>
              </div>
              <Bell className="h-8 w-8 text-error-500" />
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
                {!googleStatus?.connected ? (
                  <div className="p-6 text-center space-y-4">
                    <div className="w-16 h-16 mx-auto bg-info-100 rounded-full flex items-center justify-center">
                      <Mail className="h-8 w-8 text-info-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold leading-tight text-neutral-900">Connect Your Email</h3>
                      <p className="text-sm text-neutral-600 mt-1 max-w-sm mx-auto">
                        Connect your Google account to send emails directly from TalentPatriot and schedule interviews with calendar integration.
                      </p>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <Link href="/account-settings">
                        <Button className="bg-tp-primary hover:bg-tp-accent" data-testid="button-connect-google-email">
                          <Mail className="h-4 w-4 mr-2" />
                          Connect Google Account
                        </Button>
                      </Link>
                      <p className="text-xs text-neutral-500">
                        Go to Account Settings to connect your Google account
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
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
                      <Label htmlFor="email-message">Message</Label>
                      <Textarea
                        id="email-message"
                        placeholder="Message..."
                        value={emailForm.message}
                        onChange={(e) => setEmailForm(prev => ({ ...prev, message: e.target.value }))}
                        rows={4}
                        data-testid="textarea-email-message"
                      />
                    </div>

                    {/* Smart Actions */}
                    <div className="flex flex-wrap gap-2 p-3 bg-neutral-50 rounded-lg">
                      <span className="text-xs text-neutral-600 font-medium">Smart Actions:</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleProposeTimes}
                        className="text-xs"
                        data-testid="button-propose-times"
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        Propose Times
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAddCalendarInvite}
                        className="text-xs"
                        data-testid="button-add-calendar"
                      >
                        <Calendar className="h-3 w-3 mr-1" />
                        Add Calendar Invite
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCreateVideo}
                        className="text-xs"
                        data-testid="button-create-video"
                      >
                        <Video className="h-3 w-3 mr-1" />
                        Create Video Link
                      </Button>
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={handleSendEmail} data-testid="button-send-email">
                        <Send className="h-4 w-4 mr-2" />
                        Send Email
                      </Button>
                      <Button variant="outline" onClick={handleSendWithInvite} data-testid="button-send-with-invite">
                        <Calendar className="h-4 w-4 mr-2" />
                        Send with Invite
                      </Button>
                    </div>
                  </>
                )}
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
                    placeholder="Message..."
                    value={portalForm.message}
                    onChange={(e) => setPortalForm(prev => ({ ...prev, message: e.target.value }))}
                    rows={4}
                    data-testid="textarea-portal-message"
                  />
                </div>

                <Button onClick={handlePostToPortal} data-testid="button-post-portal">
                  Post to Client Portal
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Messages Inbox */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Messages</CardTitle>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Tabs value={viewTab} onValueChange={(v) => setViewTab(v as any)}>
                  <TabsList>
                    <TabsTrigger value="internal" data-testid="tab-view-internal">
                      Internal ({internalMessages.length})
                    </TabsTrigger>
                    <TabsTrigger value="email" data-testid="tab-view-email">
                      Email ({emailMessages.length})
                    </TabsTrigger>
                    <TabsTrigger value="client_portal" data-testid="tab-view-portal">
                      Portal ({clientPortalMessages.length})
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Messages List */}
              <div>
                <MessagesList 
                  messages={getViewMessages()} 
                  onSelectMessage={setSelectedMessage}
                  selectedMessageId={selectedMessage?.id}
                />
              </div>
              
              {/* Thread Timeline */}
              <div>
                {selectedMessage ? (
                  <ThreadTimeline events={getTimelineEvents()} />
                ) : (
                  <div className="flex items-center justify-center h-64 text-muted-foreground">
                    <p>Select a message to view the conversation thread</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}