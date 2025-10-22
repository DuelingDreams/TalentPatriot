import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Mail, Calendar, Video } from "lucide-react";
import { format } from "date-fns";

interface TimelineEvent {
  id: string;
  type: 'email' | 'invite' | 'meet';
  title: string;
  timestamp: Date;
  metadata?: {
    to?: string;
    subject?: string;
    meetUrl?: string;
    eventId?: string;
  };
}

interface ThreadTimelineProps {
  events: TimelineEvent[];
  className?: string;
}

export function ThreadTimeline({ events, className }: ThreadTimelineProps) {
  if (!events || events.length === 0) {
    return null;
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'invite':
        return <Calendar className="h-4 w-4" />;
      case 'meet':
        return <Video className="h-4 w-4" />;
      default:
        return <Mail className="h-4 w-4" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'email':
        return 'bg-blue-500';
      case 'invite':
        return 'bg-purple-500';
      case 'meet':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getEventBadgeVariant = (type: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (type) {
      case 'email':
        return 'default';
      case 'invite':
        return 'secondary';
      case 'meet':
        return 'outline';
      default:
        return 'default';
    }
  };

  return (
    <Card className={`p-4 ${className || ''}`}>
      <h3 className="text-sm font-semibold mb-4">Activity Timeline</h3>
      <div className="space-y-4">
        {events.map((event, index) => (
          <div
            key={event.id}
            className="flex gap-3"
            data-testid={`timeline-event-${event.type}-${index}`}
          >
            {/* Timeline connector */}
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full ${getEventColor(event.type)} flex items-center justify-center text-white`}>
                {getEventIcon(event.type)}
              </div>
              {index < events.length - 1 && (
                <div className="w-0.5 h-full bg-border mt-2" />
              )}
            </div>

            {/* Event content */}
            <div className="flex-1 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium">{event.title}</span>
                <Badge variant={getEventBadgeVariant(event.type)} className="text-xs">
                  {event.type}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                {format(event.timestamp, 'MMM d, yyyy - h:mm a')}
              </p>

              {/* Event metadata */}
              {event.metadata && (
                <div className="text-xs text-muted-foreground space-y-1">
                  {event.metadata.to && (
                    <p>To: {event.metadata.to}</p>
                  )}
                  {event.metadata.subject && (
                    <p className="font-medium">{event.metadata.subject}</p>
                  )}
                  {event.metadata.meetUrl && (
                    <a
                      href={event.metadata.meetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                      data-testid={`link-meet-${event.id}`}
                    >
                      <Video className="h-3 w-3" />
                      Join Meeting
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
