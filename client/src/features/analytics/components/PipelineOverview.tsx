import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { BarChart3 } from 'lucide-react'

interface PipelineData {
  stage: string
  count: number
  percentage: number
}

interface PipelineOverviewProps {
  data?: PipelineData[]
  loading?: boolean
}

const defaultData: PipelineData[] = [
  { stage: 'Applied', count: 120, percentage: 30 },
  { stage: 'Screening', count: 85, percentage: 21 },
  { stage: 'Interview', count: 60, percentage: 15 },
  { stage: 'Technical', count: 45, percentage: 11 },
  { stage: 'Reference', count: 30, percentage: 8 },
  { stage: 'Offer', count: 20, percentage: 5 },
  { stage: 'Hired', count: 15, percentage: 4 },
  { stage: 'Rejected', count: 25, percentage: 6 },
]

export function PipelineOverview({ data = defaultData, loading }: PipelineOverviewProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 shadow-lg rounded-lg border border-slate-200">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-sm text-slate-600">
            Count: <span className="font-semibold">{payload[0].value}</span>
          </p>
          <p className="text-sm text-slate-600">
            {payload[0].payload.percentage}% of total
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-lg font-semibold">Pipeline Overview</CardTitle>
        <BarChart3 className="w-4 h-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[300px] bg-slate-100 animate-pulse rounded" />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                dataKey="stage" 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="count" 
                fill="#2563eb"
                radius={[8, 8, 0, 0]}
                animationDuration={1000}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}