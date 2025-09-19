import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { PieChart as PieChartIcon } from 'lucide-react'

interface JobData {
  name: string
  value: number
  color: string
}

interface JobsChartProps {
  data?: JobData[]
  loading?: boolean
}

const defaultData: JobData[] = [
  { name: 'Open', value: 15, color: '#22c55e' },
  { name: 'In Progress', value: 8, color: '#3b82f6' },
  { name: 'On Hold', value: 3, color: '#f59e0b' },
  { name: 'Filled', value: 12, color: '#8b5cf6' },
]

export default function JobsChartComponent({ data = defaultData, loading }: JobsChartProps) {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 shadow-lg rounded-lg border border-slate-200">
          <p className="text-sm font-medium">{payload[0].name}</p>
          <p className="text-sm text-slate-600">
            Jobs: <span className="font-semibold">{payload[0].value}</span>
          </p>
        </div>
      )
    }
    return null
  }

  const total = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-lg font-semibold">Jobs by Status</CardTitle>
        <PieChartIcon className="w-4 h-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[300px] bg-slate-100 animate-pulse rounded" />
        ) : (
          <div>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ value, percent }) => `${value} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={800}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Total Jobs</span>
                <span className="font-bold text-lg">{total}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3">
                {data.map((item) => (
                  <div key={item.name} className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-slate-600">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}