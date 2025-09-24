import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MessageSquare, Clock, User, ArrowUp, ArrowDown, Archive, Eye, EyeOff } from 'lucide-react'
import { useMessages, useMarkMessageAsRead, useArchiveMessage } from '@/features/communications/hooks/useMessages'
import { useAuth } from '@/contexts/AuthContext'
import { format } from 'date-fns'
import type { Message } from '@/../../shared/schema'
import { VirtualizedMessagesList } from '@/components/performance/VirtualizedMessagesList'

interface MessagesListProps {
  selectedMessage?: Message
  onMessageSelect?: (message: Message) => void
  filterContext?: {
    clientId?: string
    jobId?: string
    candidateId?: string
  }
}

export function MessagesList({ selectedMessage, onMessageSelect, filterContext }: MessagesListProps) {
  const { user } = useAuth()
  const { data: messages = [], isLoading } = useMessages(user?.id)
  const markAsReadMutation = useMarkMessageAsRead()
  const archiveMutation = useArchiveMessage()
  
  const [sortBy, setSortBy] = useState<'date' | 'priority'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const handleMarkAsRead = (messageId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (user?.id) {
      markAsReadMutation.mutate({ messageId, userId: user.id })
    }
  }

  const handleArchive = (messageId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    archiveMutation.mutate(messageId)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'normal': return 'bg-blue-100 text-blue-800'
      case 'low': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'internal': return <MessageSquare className="h-4 w-4" />
      case 'client': return <User className="h-4 w-4" />
      case 'candidate': return <User className="h-4 w-4" />
      case 'system': return <Clock className="h-4 w-4" />
      default: return <MessageSquare className="h-4 w-4" />
    }
  }

  // Filter messages by context if provided
  const filteredMessages = messages.filter((message: any) => {
    if (!filterContext) return true
    
    if (filterContext.clientId && message.clientId !== filterContext.clientId) return false
    if (filterContext.jobId && message.jobId !== filterContext.jobId) return false
    if (filterContext.candidateId && message.candidateId !== filterContext.candidateId) return false
    
    return true
  })

  // Sort messages
  const sortedMessages = [...filteredMessages].sort((a, b) => {
    if (sortBy === 'priority') {
      const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 }
      const comparison = priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder]
      return sortOrder === 'asc' ? comparison : -comparison
    } else {
      const comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      return sortOrder === 'asc' ? comparison : -comparison
    }
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Messages</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading messages...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Messages ({sortedMessages.length})
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortBy(sortBy === 'date' ? 'priority' : 'date')}
            >
              Sort by {sortBy === 'date' ? 'Priority' : 'Date'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {sortedMessages.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            No messages found
          </div>
        ) : (
          // Use virtualization for larger datasets (>15 messages) to improve performance
          sortedMessages.length > 15 ? (
            <VirtualizedMessagesList
              messages={sortedMessages}
              selectedMessage={selectedMessage}
              onMessageSelect={onMessageSelect}
              onMarkAsRead={handleMarkAsRead}
              onArchive={handleArchive}
              containerHeight={600}
            />
          ) : (
            // Use regular scrollable list for smaller datasets
            <ScrollArea className="h-[600px]" data-testid="messages-list-regular">
              <div className="space-y-2 p-4">
                {sortedMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                      selectedMessage?.id === message.id ? 'bg-muted border-primary' : ''
                    } ${!message.isRead ? 'bg-blue-50 border-blue-200' : ''}`}
                    onClick={() => onMessageSelect?.(message)}
                    data-testid={`message-card-${message.id}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="text-muted-foreground mt-1">
                          {getTypeIcon(message.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className={`font-medium text-sm truncate ${!message.isRead ? 'font-semibold' : ''}`} data-testid={`message-subject-${message.id}`}>
                              {message.subject}
                            </h4>
                            <Badge className={`text-xs ${getPriorityColor(message.priority)}`} data-testid={`message-priority-${message.id}`}>
                              {message.priority}
                            </Badge>
                            {!message.isRead && (
                              <Badge variant="secondary" className="text-xs" data-testid={`message-unread-${message.id}`}>
                                New
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate mb-2" data-testid={`message-content-${message.id}`}>
                            {message.content}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span data-testid={`message-date-${message.id}`}>
                                {format(new Date(message.createdAt), 'MMM dd, HH:mm')}
                              </span>
                            </span>
                            <Badge variant="outline" className="text-xs" data-testid={`message-type-${message.id}`}>
                              {message.type}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {!message.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleMarkAsRead(message.id, e)}
                            className="h-8 w-8 p-0"
                            data-testid={`message-mark-read-${message.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        {!message.isArchived && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleArchive(message.id, e)}
                            className="h-8 w-8 p-0"
                            data-testid={`message-archive-${message.id}`}
                          >
                            <Archive className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )
        )}
      </CardContent>
    </Card>
  )
}