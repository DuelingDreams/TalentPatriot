import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { 
  MessageSquare, 
  Plus, 
  Bell, 
  Users, 
  Send, 
  Search,
  Filter,
  ChevronDown,
  PinIcon,
  Archive
} from 'lucide-react'

interface Message {
  id: string
  subject: string
  sender: string
  preview: string
  timestamp: string
  priority: 'high' | 'medium' | 'low'
  category: 'team' | 'client' | 'candidate'
  unread: boolean
  pinned?: boolean
}

const demoMessages: Message[] = [
  {
    id: '1',
    subject: 'Interview Feedback - Sarah Chen',
    sender: 'Mike Johnson',
    preview: 'Great technical skills, strong problem-solving abilities. Recommended for next round.',
    timestamp: '2 hours ago',
    priority: 'high',
    category: 'team',
    unread: true
  },
  {
    id: '2',
    subject: 'Client Meeting Follow-up - TechCorp',
    sender: 'Emily Davis',
    preview: 'Meeting went well. They want to proceed with 3 additional positions.',
    timestamp: '4 hours ago',
    priority: 'medium',
    category: 'client',
    unread: true,
    pinned: true
  },
  {
    id: '3',
    subject: 'Candidate Availability Update',
    sender: 'Alex Rodriguez',
    preview: 'Available for final interview next Tuesday afternoon.',
    timestamp: '6 hours ago',
    priority: 'medium',
    category: 'candidate',
    unread: false
  },
  {
    id: '4',
    subject: 'Weekly Pipeline Review',
    sender: 'Lisa Wang',
    preview: 'Please review attached pipeline metrics for this week.',
    timestamp: '1 day ago',
    priority: 'low',
    category: 'team',
    unread: false
  }
]

export function DemoMessages() {
  const [selectedTab, setSelectedTab] = useState('all')
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)

  const getPriorityColor = (priority: Message['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
    }
  }

  const getCategoryIcon = (category: Message['category']) => {
    switch (category) {
      case 'team': return <Users className="w-4 h-4" />
      case 'client': return <Send className="w-4 h-4" />
      case 'candidate': return <MessageSquare className="w-4 h-4" />
    }
  }

  const filterMessages = (messages: Message[], tab: string) => {
    switch (tab) {
      case 'unread': return messages.filter(m => m.unread)
      case 'team': return messages.filter(m => m.category === 'team')
      case 'clients': return messages.filter(m => m.category === 'client')
      case 'candidates': return messages.filter(m => m.category === 'candidate')
      default: return messages
    }
  }

  const filteredMessages = filterMessages(demoMessages, selectedTab)
  const unreadCount = demoMessages.filter(m => m.unread).length
  const teamCount = demoMessages.filter(m => m.category === 'team').length
  const clientCount = demoMessages.filter(m => m.category === 'client').length
  const candidateCount = demoMessages.filter(m => m.category === 'candidate').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
          <p className="mt-1 text-sm text-slate-600">
            Team communication and notifications
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" />
            New Message
          </Button>
        </div>
      </div>

      {/* Message Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-600">Total Messages</CardTitle>
              <MessageSquare className="w-4 h-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{demoMessages.length}</div>
            <p className="text-sm text-slate-500 mt-1">All conversations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-600">Unread</CardTitle>
              <Bell className="w-4 h-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{unreadCount}</div>
            <p className="text-sm text-slate-500 mt-1">Need attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-600">Team Messages</CardTitle>
              <Users className="w-4 h-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{teamCount}</div>
            <p className="text-sm text-slate-500 mt-1">Internal discussions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-600">Client Messages</CardTitle>
              <Send className="w-4 h-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{clientCount}</div>
            <p className="text-sm text-slate-500 mt-1">External communications</p>
          </CardContent>
        </Card>
      </div>

      {/* Messages Interface */}
      <Card>
        <CardContent className="p-0">
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <div className="border-b p-4">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="all" className="text-sm">
                  All <Badge variant="secondary" className="ml-2">{demoMessages.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="unread" className="text-sm">
                  Unread <Badge variant="secondary" className="ml-2">{unreadCount}</Badge>
                </TabsTrigger>
                <TabsTrigger value="team" className="text-sm">
                  Team <Badge variant="secondary" className="ml-2">{teamCount}</Badge>
                </TabsTrigger>
                <TabsTrigger value="clients" className="text-sm">
                  Clients <Badge variant="secondary" className="ml-2">{clientCount}</Badge>
                </TabsTrigger>
                <TabsTrigger value="candidates" className="text-sm">
                  Candidates <Badge variant="secondary" className="ml-2">{candidateCount}</Badge>
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold leading-tight flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Messages ({filteredMessages.length})
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500">Sort by Priority</span>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </div>
              </div>

              {filteredMessages.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No messages found</h3>
                  <p className="text-slate-500">
                    {selectedTab === 'unread' 
                      ? 'All caught up! No unread messages.' 
                      : 'Try selecting a different category.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredMessages.map(message => (
                    <div
                      key={message.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                        message.unread ? 'bg-blue-50 border-blue-200' : 'bg-white'
                      } ${selectedMessage?.id === message.id ? 'ring-2 ring-blue-500' : ''}`}
                      onClick={() => setSelectedMessage(message)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(message.category)}
                          <span className="font-medium text-sm">{message.subject}</span>
                          {message.pinned && <PinIcon className="w-3 h-3 text-yellow-500" />}
                          {message.unread && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getPriorityColor(message.priority)}>
                            {message.priority}
                          </Badge>
                          <span className="text-xs text-slate-500">{message.timestamp}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-sm text-slate-600">From: {message.sender}</p>
                        <p className="text-sm text-slate-700">{message.preview}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}