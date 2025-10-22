import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Video, Loader2, Users } from "lucide-react";
import { SiGooglemeet, SiZoom } from "react-icons/si";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/shared/hooks/use-toast";

interface VideoDropdownProps {
  onMeetCreated?: (meetUrl: string, eventId: string) => void;
  disabled?: boolean;
}

export function VideoDropdown({ onMeetCreated, disabled }: VideoDropdownProps) {
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const handleCreateGoogleMeet = async () => {
    setIsCreating(true);
    try {
      // Create a Google Meet event
      // Default to a 30-minute meeting starting now
      const start = new Date();
      const end = new Date(start.getTime() + 30 * 60 * 1000);

      const data = await apiRequest('/api/google/meet', {
        method: 'POST',
        body: JSON.stringify({
          summary: 'Quick Meeting',
          description: 'Created from TalentPatriot Messages',
          start: start.toISOString(),
          end: end.toISOString(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      }) as { meetUrl: string; eventId: string };

      if (data.meetUrl) {
        toast({
          title: "Google Meet created",
          description: "Meeting link has been generated",
        });
        onMeetCreated?.(data.meetUrl, data.eventId);
      } else {
        throw new Error('No Meet URL returned');
      }

      // Invalidate calendar events cache
      queryClient.invalidateQueries({ queryKey: ['/api/google/calendar-events'] });
    } catch (error: any) {
      console.error('Error creating Google Meet:', error);
      
      // Check if user needs to connect Google account
      if (error.message?.includes('not connected') || error.status === 403) {
        toast({
          title: "Google Calendar not connected",
          description: "Please connect your Google account in Settings > Integrations",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Failed to create meeting",
          description: error.message || "Please try again",
          variant: "destructive",
        });
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handlePlaceholder = (platform: string) => {
    toast({
      title: `${platform} integration coming soon`,
      description: "This feature is currently in development",
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || isCreating}
          data-testid="button-video-dropdown"
        >
          {isCreating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Video className="h-4 w-4 mr-2" />
              Add Video Call
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Video Conference</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleCreateGoogleMeet}
          disabled={isCreating}
          data-testid="menu-item-google-meet"
        >
          <SiGooglemeet className="h-4 w-4 mr-2 text-green-600" />
          <span>Google Meet</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handlePlaceholder('Zoom')}
          data-testid="menu-item-zoom"
        >
          <SiZoom className="h-4 w-4 mr-2 text-blue-500" />
          <span>Zoom</span>
          <span className="ml-auto text-xs text-muted-foreground">Soon</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handlePlaceholder('Microsoft Teams')}
          data-testid="menu-item-teams"
        >
          <Users className="h-4 w-4 mr-2 text-purple-600" />
          <span>Teams</span>
          <span className="ml-auto text-xs text-muted-foreground">Soon</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
