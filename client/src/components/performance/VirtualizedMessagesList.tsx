import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  MessageSquare, 
  Clock, 
  User, 
  Archive, 
  Eye, 
  EyeOff,
  AlertCircle,
  Star
} from 'lucide-react'
import { format, isValid } from 'date-fns'
import { VirtualizedList } from './VirtualizedList'
import type { Message } from '@/../../shared/schema'

// Helper function to safely format dates
function safeFormatDate(dateValue: any, formatStr: string = 'MMM d, HH:mm'): string {
  if (!dateValue) return 'Date unavailable'
  
  const date = new Date(dateValue)
  if (!isValid(date)) return 'Date unavailable'
  
  try {
    return format(date, formatStr)
  } catch (error) {
    return 'Date unavailable'
  }
}

interface VirtualizedMessagesListProps {
  messages: Message[]
  selectedMessage?: Message
  onMessageSelect?: (message: Message) => void
  onMarkAsRead?: (messageId: string, e: React.MouseEvent) => void
  onArchive?: (messageId: string, e: React.MouseEvent) => void
  containerHeight?: number
}

export function VirtualizedMessagesList({
  messages,
  selectedMessage,
  onMessageSelect,
  onMarkAsRead,
  onArchive,
  containerHeight = 500
}: VirtualizedMessagesListProps) {
  const getPriorityColor = React.useCallback((priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'normal': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }, [])

  const getTypeIcon = React.useCallback((type: string) => {
    switch (type) {
      case 'internal': return <MessageSquare className="h-4 w-4" />
      case 'client': return <User className="h-4 w-4" />
      case 'candidate': return <User className="h-4 w-4" />
      case 'system': return <Clock className="h-4 w-4" />
      default: return <MessageSquare className="h-4 w-4" />
    }
  }, [])

  const getPriorityIcon = React.useCallback((priority: string) => {
    switch (priority) {
      case 'urgent': return <AlertCircle className="h-4 w-4 text-red-600" />
      case 'high': return <Star className="h-4 w-4 text-orange-600" />
      default: return null
    }
  }, [])

  const estimateSize = React.useCallback(() => {
    // Estimate based on typical message card height
    // Base height: ~120px for content + padding + margins
    return 140
  }, [])

  const renderMessageCard = React.useCallback((message: any, index: number) => {
    const isSelected = selectedMessage?.id === message.id
    
    return (
      <div className="px-4 pb-3" data-testid={`message-card-${message.id}`}>
        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${
            isSelected ? 'ring-2 ring-blue-500 shadow-md' : ''
          } ${!message.isRead ? 'border-l-4 border-l-blue-500' : ''}`}
          onClick={() => onMessageSelect?.(message)}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    {getTypeIcon(message.type)}
                    <span className="capitalize" data-testid={`message-type-${message.id}`}>
                      {message.type}
                    </span>
                  </div>
                  
                  {getPriorityIcon(message.priority)}
                  
                  <Badge 
                    className={`text-xs ${getPriorityColor(message.priority)}`}
                    data-testid={`message-priority-${message.id}`}
                  >
                    {message.priority}
                  </Badge>
                  
                  {!message.isRead && (
                    <Badge variant="secondary" className="text-xs" data-testid={`message-unread-${message.id}`}>
                      Unread
                    </Badge>
                  )}
                </div>
                
                <h3 
                  className="font-medium text-sm text-gray-900 truncate mb-1"
                  data-testid={`message-subject-${message.id}`}
                >
                  {message.subject}
                </h3>
                
                <p 
                  className="text-sm text-gray-600 line-clamp-2 mb-2"
                  data-testid={`message-content-${message.id}`}
                >
                  {message.content}
                </p>
                
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span data-testid={`message-date-${message.id}`}>
                    {safeFormatDate(message.createdAt)}
                  </span>
                  
                  {message.tags && message.tags.length > 0 && (
                    <div className="flex items-center gap-1 ml-2">
                      {message.tags.slice(0, 2).map((tag: string, tagIndex: number) => (
                        <Badge 
                          key={tagIndex} 
                          variant="outline" 
                          className="text-xs px-1 py-0"
                          data-testid={`message-tag-${message.id}-${tagIndex}`}
                        >
                          {tag}
                        </Badge>
                      ))}
                      {message.tags.length > 2 && (
                        <span className="text-xs text-muted-foreground">+{message.tags.length - 2}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-1 ml-2">
                {onMarkAsRead && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      onMarkAsRead(message.id, e)
                    }}
                    data-testid={`message-mark-read-${message.id}`}
                  >
                    {message.isRead ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                )}
                
                {onArchive && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      onArchive(message.id, e)
                    }}
                    data-testid={`message-archive-${message.id}`}
                  >
                    <Archive className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }, [selectedMessage, onMessageSelect, onMarkAsRead, onArchive, getPriorityColor, getTypeIcon, getPriorityIcon])

  const getMessageKey = React.useCallback((message: any, index: number) => {
    // Always use stable entity ID - messages must have valid IDs
    if (!message.id) {
      console.warn('VirtualizedMessagesList: Message missing ID, this will cause rendering issues', message)
      return `message-fallback-${index}` // Temporary fallback with warning
    }
    return message.id
  }, [])

  if (messages.length === 0) {
    return null // Empty state handled by parent component
  }

  return (
    <VirtualizedList
      items={messages}
      estimateSize={estimateSize}
      renderItem={renderMessageCard}
      containerHeight={containerHeight}
      containerClassName="w-full"
      overscan={3}
      getItemKey={getMessageKey}
      measurementEnabled={true}
      itemSpacing={3}
    />
  )
}