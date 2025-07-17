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

export function StatCard({ label, value, icon: Icon, trend, loading, className }: StatCardProps) {
  return (
    <Card className={cn("hover:shadow-lg transition-all duration-300 border-0 overflow-hidden", className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <div className="mt-2 flex items-baseline">
              {loading ? (
                <div className="h-8 w-24 bg-slate-200 animate-pulse rounded" />
              ) : (
                <h3 className="text-3xl font-bold tracking-tight">{value}</h3>
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
          <div className="ml-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Icon className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}