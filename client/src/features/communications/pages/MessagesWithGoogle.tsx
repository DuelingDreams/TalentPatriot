import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, Plus, Users, Bell, Archive, Send, Filter, Mail } from 'lucide-react'
import { MessagesList } from '@/features/communications/components/MessagesList'
import { MessageComposer } from '@/features/communications/components/MessageComposer'
import { EmailComposer } from '@/features/communications/components/google/EmailComposer'
import { VideoDropdown } from '@/features/communications/components/google/VideoDropdown'
import { AvailabilityDrawer } from '@/features/communications/components/google/AvailabilityDrawer'
import { ThreadTimeline } from '@/features/communications/components/google/ThreadTimeline'
import { useMessages, useUnreadMessageCount } from '@/features/communications/hooks/useMessages'
import { useAuth } from '@/contexts/AuthContext'
import { format } from 'date-fns'
import type { Message } from '@/../../shared/schema'
import { DemoMessages } from '@/components/demo/DemoMessages'

// Google integration is always enabled in this component
// (This is the enhanced Messages page with email/calendar features)
const ENABLE_GOOGLE_INTEGRATION = true

export default function Messages() {
  const { user, userRole } = useAuth()
  
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

  const [selectedMessage, setSelectedMessage] = useState<Message | undefined>(undefined)
  const [activeTab, setActiveTab] = useState(ENABLE_GOOGLE_INTEGRATION ? 'internal' : 'all')
  const [showComposer, setShowComposer] = useState(false)
  const [showEmailComposer, setShowEmailComposer] = useState(false)

  // Filter messages by type (existing logic - preserved for backward compatibility)
  const internalMessages = allMessages.filter(m => m.type === 'internal')
  const clientMessages = allMessages.filter(m => m.type === 'client')
  const candidateMessages = allMessages.filter(m => m.type === 'candidate')
  const unreadMessages = allMessages.filter(m => !m.isRead)

  // New: Filter messages by channel type (for Google integration)
  const emailMessages = allMessages.filter(m => m.channelType === 'email')
  const clientPortalMessages = allMessages.filter(m => m.channelType === 'client_portal')

  const getTabMessages = () => {
    if (ENABLE_GOOGLE_INTEGRATION) {
      // New tab structure
      switch (activeTab) {
        case 'internal': return internalMessages
        case 'email': return emailMessages
        case 'client_portal': return clientPortalMessages
        default: return internalMessages
      }
    } else {
      // Original tab structure
      switch (activeTab) {
        case 'internal': return internalMessages
        case 'clients': return clientMessages
        case 'candidates': return candidateMessages
        case 'unread': return unreadMessages
        default: return allMessages
      }
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'normal': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const handleMessageSent = () => {
    setShowComposer(false)
    setShowEmailComposer(false)
  }

  const handleMeetCreated = (meetUrl: string, eventId: string) => {
    console.log('Google Meet created:', { meetUrl, eventId })
    // TODO: Optionally add Meet link to message or thread
  }

  const handleTimeSelected = (start: Date, end: Date) => {
    console.log('Time selected:', { start, end })
    // TODO: Create calendar invitation
  }

  // Mock timeline data for demonstration
  const mockTimelineEvents = selectedMessage ? [
    {
      id: '1',
      type: 'email' as const,
      title: 'Email sent',
      timestamp: new Date(selectedMessage.createdAt),
      metadata: {
        to: 'candidate@example.com',
        subject: selectedMessage.subject,
      },
    },
  ] : []

  return (
    <DashboardLayout pageTitle="Messages & Communication">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-6 w-6" />
              <h1 className="text-2xl font-bold">Messages</h1>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount} unread
                </Badge>
              )}
              {ENABLE_GOOGLE_INTEGRATION && (
                <Badge variant="outline" className="ml-2 text-xs">
                  Google Integration Enabled
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {ENABLE_GOOGLE_INTEGRATION && activeTab === 'email' ? (
              <>
                <VideoDropdown onMeetCreated={handleMeetCreated} />
                <AvailabilityDrawer onTimeSelected={handleTimeSelected} />
                <Button onClick={() => setShowEmailComposer(!showEmailComposer)} className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Compose Email
                </Button>
              </>
            ) : (
              <Button onClick={() => setShowComposer(!showComposer)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                New Message
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Messages</p>
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
                <p className="text-sm font-medium text-muted-foreground">
                  {ENABLE_GOOGLE_INTEGRATION ? 'Internal' : 'Team Messages'}
                </p>
                <p className="text-2xl font-bold">{internalMessages.length}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {ENABLE_GOOGLE_INTEGRATION ? 'Emails' : 'Client Messages'}
                </p>
                <p className="text-2xl font-bold">
                  {ENABLE_GOOGLE_INTEGRATION ? emailMessages.length : clientMessages.length}
                </p>
              </div>
              {ENABLE_GOOGLE_INTEGRATION ? (
                <Mail className="h-8 w-8 text-muted-foreground" />
              ) : (
                <Send className="h-8 w-8 text-muted-foreground" />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Message Composer - Original */}
        {!ENABLE_GOOGLE_INTEGRATION && showComposer && (
          <MessageComposer onMessageSent={handleMessageSent} />
        )}

        {/* Email Composer - Google Integration */}
        {ENABLE_GOOGLE_INTEGRATION && showEmailComposer && (
          <EmailComposer onSent={handleMessageSent} />
        )}

        {/* Message Tabs and List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Messages List */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className={`grid w-full ${ENABLE_GOOGLE_INTEGRATION ? 'grid-cols-3' : 'grid-cols-5'}`}>
                {ENABLE_GOOGLE_INTEGRATION ? (
                  // New tab structure for Google integration
                  <>
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
                  </>
                ) : (
                  // Original tab structure
                  <>
                    <TabsTrigger value="all" className="flex items-center gap-2">
                      All
                      <Badge variant="secondary" className="text-xs">
                        {allMessages.length}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="unread" className="flex items-center gap-2">
                      Unread
                      {unreadCount > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {unreadCount}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="internal" className="flex items-center gap-2">
                      Team
                      <Badge variant="secondary" className="text-xs">
                        {internalMessages.length}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="clients" className="flex items-center gap-2">
                      Clients
                      <Badge variant="secondary" className="text-xs">
                        {clientMessages.length}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="candidates" className="flex items-center gap-2">
                      Candidates
                      <Badge variant="secondary" className="text-xs">
                        {candidateMessages.length}
                      </Badge>
                    </TabsTrigger>
                  </>
                )}
              </TabsList>

              <TabsContent value={activeTab} className="mt-4">
                <MessagesList
                  selectedMessage={selectedMessage}
                  onMessageSelect={setSelectedMessage}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Message Detail */}
          <div className="lg:col-span-1 space-y-4">
            {selectedMessage ? (
              <>
                <Card className="h-auto">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{selectedMessage.subject}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge className={`text-xs ${getPriorityColor(selectedMessage.priority)}`}>
                            {selectedMessage.priority}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {selectedMessage.type}
                          </Badge>
                          {!selectedMessage.isRead && (
                            <Badge variant="secondary" className="text-xs">
                              Unread
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium mb-2">Sent {format(new Date(selectedMessage.createdAt), 'PPp')}</p>
                    </div>
                    
                    <div className="prose prose-sm max-w-none">
                      <p className="whitespace-pre-wrap">{selectedMessage.content}</p>
                    </div>

                    {selectedMessage.tags && selectedMessage.tags.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Tags</p>
                        <div className="flex flex-wrap gap-1">
                          {selectedMessage.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Context Information */}
                    {(selectedMessage.clientId || selectedMessage.jobId || selectedMessage.candidateId) && (
                      <div className="space-y-2 pt-4 border-t">
                        <p className="text-sm font-medium text-muted-foreground">Related To</p>
                        <div className="space-y-1 text-sm">
                          {selectedMessage.clientId && (
                            <p className="text-muted-foreground">Client: ID {selectedMessage.clientId}</p>
                          )}
                          {selectedMessage.jobId && (
                            <p className="text-muted-foreground">Job: ID {selectedMessage.jobId}</p>
                          )}
                          {selectedMessage.candidateId && (
                            <p className="text-muted-foreground">Candidate: ID {selectedMessage.candidateId}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Timeline - Google Integration Only */}
                {ENABLE_GOOGLE_INTEGRATION && activeTab === 'email' && (
                  <ThreadTimeline events={mockTimelineEvents} />
                )}
              </>
            ) : (
              <Card className="h-full">
                <CardContent className="flex items-center justify-center h-full text-center">
                  <div className="space-y-2">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto" />
                    <p className="text-muted-foreground">Select a message to view details</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
