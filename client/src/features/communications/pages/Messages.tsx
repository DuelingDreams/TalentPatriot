import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, Plus, Users, Bell, Archive, Send, Filter } from 'lucide-react'
import { MessagesList } from '@/components/messages/MessagesList'
import { MessageComposer } from '@/components/messages/MessageComposer'
import { useMessages, useUnreadMessageCount } from '@/features/communications/hooks/useMessages'
import { useAuth } from '@/contexts/AuthContext'
import { format } from 'date-fns'
import type { Message } from '@/../../shared/schema'
import { DemoMessages } from '@/components/demo/DemoMessages'

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
  const [activeTab, setActiveTab] = useState('all')
  const [showComposer, setShowComposer] = useState(false)

  // Filter messages by type
  const internalMessages = allMessages.filter(m => m.type === 'internal')
  const clientMessages = allMessages.filter(m => m.type === 'client')
  const candidateMessages = allMessages.filter(m => m.type === 'candidate')
  const unreadMessages = allMessages.filter(m => !m.isRead)

  const getTabMessages = () => {
    switch (activeTab) {
      case 'internal': return internalMessages
      case 'clients': return clientMessages
      case 'candidates': return candidateMessages
      case 'unread': return unreadMessages
      default: return allMessages
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
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount} unread
                </Badge>
              )}
            </div>
          </div>
          <Button onClick={() => setShowComposer(!showComposer)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Message
          </Button>
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
                <p className="text-sm font-medium text-muted-foreground">Team Messages</p>
                <p className="text-2xl font-bold">{internalMessages.length}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Client Messages</p>
                <p className="text-2xl font-bold">{clientMessages.length}</p>
              </div>
              <Send className="h-8 w-8 text-muted-foreground" />
            </CardContent>
          </Card>
        </div>

        {/* Message Composer */}
        {showComposer && (
          <MessageComposer onMessageSent={handleMessageSent} />
        )}

        {/* Message Tabs and List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Messages List */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-5">
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
          <div className="lg:col-span-1">
            {selectedMessage ? (
              <Card className="h-full">
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