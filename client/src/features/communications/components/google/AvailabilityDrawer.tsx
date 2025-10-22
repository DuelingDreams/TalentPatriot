import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Calendar, Clock, Loader2 } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format, addDays, startOfDay, endOfDay } from "date-fns";

interface FreeBusySlot {
  start: string;
  end: string;
}

interface AvailabilityDrawerProps {
  onTimeSelected?: (start: Date, end: Date) => void;
}

export function AvailabilityDrawer({ onTimeSelected }: AvailabilityDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Fetch free/busy data for the selected week
  const { data: freeBusyData, isLoading } = useQuery({
    queryKey: ['/api/google/freebusy', selectedDate.toISOString()],
    queryFn: async () => {
      const startDate = startOfDay(selectedDate);
      const endDate = endOfDay(addDays(selectedDate, 7));

      const response = await apiRequest(
        `/api/google/freebusy?start=${startDate.toISOString()}&end=${endDate.toISOString()}`
      );
      return response as { busy: FreeBusySlot[] };
    },
    enabled: isOpen,
  });

  const generateTimeSlots = () => {
    // Generate 30-minute time slots for the week
    const slots: { start: Date; end: Date; available: boolean }[] = [];
    const now = new Date();
    
    for (let day = 0; day < 7; day++) {
      const currentDay = addDays(startOfDay(selectedDate), day);
      
      // Business hours: 9 AM to 5 PM
      for (let hour = 9; hour < 17; hour++) {
        const slotStart = new Date(currentDay);
        slotStart.setHours(hour, 0, 0, 0);
        
        const slotEnd = new Date(slotStart);
        slotEnd.setMinutes(30);

        // Skip past time slots
        if (slotStart < now) continue;

        // Check if slot is busy
        const isBusy = freeBusyData?.busy.some((busy) => {
          const busyStart = new Date(busy.start);
          const busyEnd = new Date(busy.end);
          return slotStart >= busyStart && slotStart < busyEnd;
        });

        slots.push({
          start: slotStart,
          end: slotEnd,
          available: !isBusy,
        });
      }
    }

    return slots;
  };

  const handleSelectSlot = (start: Date, end: Date) => {
    onTimeSelected?.(start, end);
    setIsOpen(false);
  };

  const timeSlots = isOpen ? generateTimeSlots() : [];

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" data-testid="button-propose-times">
          <Calendar className="h-4 w-4 mr-2" />
          Propose Times
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Check Availability</SheetTitle>
          <SheetDescription>
            View your calendar availability and propose meeting times
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !freeBusyData ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                Connect your Google Calendar in Settings to view availability
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Array.from({ length: 7 }, (_, day) => {
                const currentDay = addDays(selectedDate, day);
                const daySlots = timeSlots.filter(
                  (slot) => format(slot.start, 'yyyy-MM-dd') === format(currentDay, 'yyyy-MM-dd')
                );

                if (daySlots.length === 0) return null;

                return (
                  <div key={day} className="space-y-2">
                    <h3 className="text-sm font-semibold">
                      {format(currentDay, 'EEEE, MMMM d')}
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {daySlots.map((slot, index) => (
                        <Button
                          key={index}
                          variant={slot.available ? "outline" : "ghost"}
                          size="sm"
                          disabled={!slot.available}
                          onClick={() => handleSelectSlot(slot.start, slot.end)}
                          className={slot.available ? "justify-start" : "justify-start opacity-50"}
                          data-testid={`slot-${format(slot.start, 'yyyy-MM-dd-HH-mm')}`}
                        >
                          <Clock className="h-3 w-3 mr-2" />
                          {format(slot.start, 'h:mm a')} - {format(slot.end, 'h:mm a')}
                        </Button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <p className="text-xs text-muted-foreground">
            <strong>Tip:</strong> Available time slots are shown in your local timezone. 
            Busy times are automatically hidden based on your Google Calendar.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
