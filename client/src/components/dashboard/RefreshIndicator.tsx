import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { RefreshCw, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

interface RefreshIndicatorProps {
  lastRefreshed: Date
  isRefreshing: boolean
  onRefresh: () => void
  className?: string
}

export function RefreshIndicator({ 
  lastRefreshed, 
  isRefreshing, 
  onRefresh, 
  className 
}: RefreshIndicatorProps) {
  return (
    <TooltipProvider>
      <div className={cn("flex items-center gap-2", className)}>
        {/* Manual Refresh Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="h-8 px-2"
            >
              <RefreshCw 
                className={cn(
                  "w-3 h-3",
                  isRefreshing && "animate-spin"
                )} 
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Refresh data</p>
          </TooltipContent>
        </Tooltip>

        {/* Last Updated Indicator */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#5C667B]" />
              <span className="text-xs text-[#5C667B]">
                {formatDistanceToNow(lastRefreshed, { addSuffix: true })}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Last updated: {lastRefreshed.toLocaleTimeString()}</p>
          </TooltipContent>
        </Tooltip>

        {/* Auto-refresh Status */}
        <Badge 
          variant="secondary" 
          className="h-5 text-xs bg-green-100 text-green-700"
        >
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1 animate-pulse" />
          Live
        </Badge>

        {/* Refreshing Indicator */}
        {isRefreshing && (
          <Badge 
            variant="secondary" 
            className="h-5 text-xs bg-blue-100 text-blue-700 animate-pulse"
          >
            Refreshing...
          </Badge>
        )}
      </div>
    </TooltipProvider>
  )
}