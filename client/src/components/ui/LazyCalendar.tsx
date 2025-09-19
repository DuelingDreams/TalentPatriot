import { lazy, Suspense } from 'react'
import { DayPicker } from "react-day-picker"
import { cn } from "@/lib/utils"

// Lazy load the actual calendar component
const CalendarComponent = lazy(() => import('./CalendarComponent'))

export type CalendarProps = React.ComponentProps<typeof DayPicker>

// Loading skeleton for the calendar
const CalendarSkeleton = ({ className }: { className?: string }) => (
  <div className={cn("p-3", className)}>
    <div className="space-y-4">
      {/* Month header skeleton */}
      <div className="flex justify-center pt-1 relative items-center">
        <div className="h-7 w-7 bg-slate-100 animate-pulse rounded absolute left-1" />
        <div className="h-5 w-24 bg-slate-100 animate-pulse rounded" />
        <div className="h-7 w-7 bg-slate-100 animate-pulse rounded absolute right-1" />
      </div>
      
      {/* Days header skeleton */}
      <div className="flex">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="w-9 h-6 bg-slate-100 animate-pulse rounded mr-2" />
        ))}
      </div>
      
      {/* Calendar grid skeleton */}
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex">
            {Array.from({ length: 7 }).map((_, j) => (
              <div key={j} className="w-9 h-9 bg-slate-100 animate-pulse rounded mr-2" />
            ))}
          </div>
        ))}
      </div>
    </div>
  </div>
)

export function Calendar(props: CalendarProps) {
  return (
    <Suspense fallback={<CalendarSkeleton className={props.className} />}>
      <CalendarComponent {...props} />
    </Suspense>
  )
}