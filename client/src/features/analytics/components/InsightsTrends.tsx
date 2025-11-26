import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface InsightsTrendsProps {
  openPositions: number
  totalCandidates: number
  activeCandidates: number
  hiredThisMonth: number
  loading?: boolean
}

interface StatItem {
  label: string
  value: number
  trend: number
}

export function InsightsTrends({
  openPositions,
  totalCandidates,
  activeCandidates,
  hiredThisMonth,
  loading = false
}: InsightsTrendsProps) {
  const stats: StatItem[] = [
    { label: 'Open Positions', value: openPositions, trend: 13 },
    { label: 'Total Candidates', value: totalCandidates, trend: 8 },
    { label: 'Active Candidates', value: activeCandidates, trend: 5 },
    { label: 'Hired This Month', value: hiredThisMonth, trend: 25 },
  ]

  return (
    <Card data-testid="insights-trends-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-gray-900">Insights & Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat) => (
            <div 
              key={stat.label}
              className="p-3 rounded-lg border border-gray-100 bg-gray-50/50"
              data-testid={`stat-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
              {loading ? (
                <div className="h-8 w-12 bg-gray-200 animate-pulse rounded mb-1" />
              ) : (
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              )}
              <p className="text-xs font-medium text-green-600">+ {stat.trend}%</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
