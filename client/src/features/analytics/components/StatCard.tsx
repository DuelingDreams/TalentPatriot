import { memo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  trend?: {
    value: number
    label: string
  }
  loading?: boolean
  className?: string
}

export const StatCard = memo(function StatCard({ label, value, icon: Icon, trend, loading, className }: StatCardProps) {
  return (
    <Card className={cn("hover:shadow-lg transition-all duration-300 border-0 overflow-hidden min-w-0", className)}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground truncate">{label}</p>
            <div className="mt-2 flex items-baseline">
              {loading ? (
                <div className="h-8 w-24 bg-slate-200 animate-pulse rounded" />
              ) : (
                <h3 className="text-2xl sm:text-3xl font-bold tracking-tight">{value}</h3>
              )}
              {trend && !loading && (
                <span className={cn(
                  "ml-2 text-sm font-medium",
                  trend.value > 0 ? "text-green-600" : "text-red-600"
                )}>
                  {trend.value > 0 ? '+' : ''}{trend.value}%
                </span>
              )}
            </div>
            {trend && !loading && (
              <p className="mt-1 text-xs text-muted-foreground">{trend.label}</p>
            )}
          </div>
          <div className="flex-shrink-0">
            <div className="p-2 sm:p-3 bg-primary/10 rounded-lg">
              <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
})