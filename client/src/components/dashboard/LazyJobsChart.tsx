import { lazy, Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChart as PieChartIcon } from 'lucide-react'

// Lazy load the actual chart component
const JobsChartComponent = lazy(() => import('./JobsChartComponent'))

interface JobData {
  name: string
  value: number
  color: string
}

interface JobsChartProps {
  data?: JobData[]
  loading?: boolean
}

// Loading skeleton for the chart
const ChartSkeleton = () => (
  <Card className="h-full">
    <CardHeader className="flex flex-row items-center justify-between pb-3">
      <CardTitle className="text-lg font-semibold">Jobs by Status</CardTitle>
      <PieChartIcon className="w-4 h-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        <div className="h-[250px] bg-slate-100 animate-pulse rounded" />
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="h-4 bg-slate-100 animate-pulse rounded w-20" />
            <div className="h-6 bg-slate-100 animate-pulse rounded w-8" />
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-slate-100 animate-pulse rounded-full" />
                <div className="h-3 bg-slate-100 animate-pulse rounded w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
)

export function JobsChart({ data, loading }: JobsChartProps) {
  if (loading) {
    return <ChartSkeleton />
  }

  return (
    <Suspense fallback={<ChartSkeleton />}>
      <JobsChartComponent data={data} loading={loading} />
    </Suspense>
  )
}