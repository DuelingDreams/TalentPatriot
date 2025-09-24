import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { CalendarDays, Users, TrendingUp, Clock, Download, FileSpreadsheet, BarChart3 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from '@/shared/hooks/use-toast'
import { DashboardLayout } from '@/components/layout/DashboardLayout'

interface ReportMetrics {
  timeToHire: {
    average: number
    median: number
    trend: number
    byMonth: Array<{ month: string; average: number; count: number }>
  }
  sourceOfHire: Array<{ source: string; count: number; percentage: number }>
  pipelineConversion: {
    applied: number
    screened: number
    interviewed: number
    offered: number
    hired: number
    conversionRates: Array<{ stage: string; rate: number }>
  }
  recruiterPerformance: Array<{
    recruiter: string
    jobsPosted: number
    candidatesHired: number
    avgTimeToHire: number
    conversionRate: number
  }>
  monthlyTrends: Array<{ month: string; applications: number; hires: number }>
}

const COLORS = ['#1F3A5F', '#264C99', '#5C667B', '#8B9DC3', '#A8B5D1']

export default function Reports() {
  const { currentOrgId } = useAuth()
  const [selectedPeriod, setSelectedPeriod] = useState('3months')
  const [generatingReport, setGeneratingReport] = useState(false)

  const { data: metrics, isLoading } = useQuery<ReportMetrics>({
    queryKey: ['/api/reports/metrics', currentOrgId, selectedPeriod],
    queryFn: () => fetch(`/api/reports/metrics?orgId=${currentOrgId}&period=${selectedPeriod}`).then(res => res.json()),
    enabled: !!currentOrgId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const generateReport = async (format: 'pdf' | 'excel') => {
    if (!currentOrgId) return

    setGeneratingReport(true)
    try {
      const response = await fetch(`/api/reports/generate?orgId=${currentOrgId}&period=${selectedPeriod}&format=${format}`, {
        method: 'POST',
      })

      if (!response.ok) throw new Error('Failed to generate report')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `talent-patriot-report-${selectedPeriod}.${format === 'pdf' ? 'pdf' : 'xlsx'}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Report Generated",
        description: `Your ${format.toUpperCase()} report has been downloaded successfully.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      })
    } finally {
      setGeneratingReport(false)
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout pageTitle="Reports & Analytics">
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h1>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // Check if this is a new organization with no data
  const hasData = metrics && (
    metrics.pipelineConversion.applied > 0 || 
    metrics.timeToHire.average > 0 || 
    metrics.sourceOfHire.length > 0 ||
    metrics.recruiterPerformance.length > 0
  )

  return (
    <DashboardLayout pageTitle="Reports & Analytics">
      <div className="container mx-auto p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Track hiring performance and metrics</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">Last Month</SelectItem>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="1year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex gap-2">
            <Button 
              onClick={() => generateReport('excel')} 
              disabled={generatingReport}
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-initial"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Excel
            </Button>
            <Button 
              onClick={() => generateReport('pdf')} 
              disabled={generatingReport}
              size="sm"
              className="flex-1 sm:flex-initial"
            >
              <Download className="h-4 w-4 mr-2" />
              PDF Report
            </Button>
          </div>
        </div>
      </div>

      {/* Show empty state for new organizations */}
      {!hasData && (
        <Card className="p-8">
          <CardContent className="text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No Data Available
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              Start creating jobs and receiving applications to see your analytics and reports here. 
              Your recruitment metrics will appear as you build your hiring pipeline.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => window.location.href = '/jobs'} className="bg-blue-600 hover:bg-blue-700">
                Create Your First Job
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/clients'}>
                Add a Client
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics Cards - Only show if there's data */}
      {hasData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Time to Hire</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.timeToHire.average || 0} days</div>
            <p className="text-xs text-muted-foreground">
              {metrics?.timeToHire.trend && metrics.timeToHire.trend > 0 ? '+' : ''}
              {metrics?.timeToHire.trend || 0}% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.pipelineConversion?.applied || 0}</div>
            <p className="text-xs text-muted-foreground">
              Across all open positions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(metrics?.pipelineConversion?.applied || 0) > 0 
                ? (((metrics?.pipelineConversion?.hired || 0) / (metrics?.pipelineConversion?.applied || 1)) * 100).toFixed(1)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Application to hire rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.recruiterPerformance.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Currently recruiting
            </p>
          </CardContent>
        </Card>
      </div>
      )}

      {/* Charts - Only show if there's data */}
      {hasData && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Time to Hire Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Time to Hire Trend</CardTitle>
            <CardDescription>Average days to hire by month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 lg:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics?.timeToHire.byMonth || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="average" 
                    stroke="#1F3A5F" 
                    strokeWidth={2}
                    dot={{ fill: '#1F3A5F' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Source of Hire */}
        <Card>
          <CardHeader>
            <CardTitle>Source of Hire</CardTitle>
            <CardDescription>Where your best candidates come from</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 lg:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={metrics?.sourceOfHire || []}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    label={({ source, percentage }) => `${source} (${percentage}%)`}
                  >
                    {(metrics?.sourceOfHire || []).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pipeline Conversion */}
        <Card>
          <CardHeader>
            <CardTitle>Pipeline Conversion Rates</CardTitle>
            <CardDescription>Conversion between pipeline stages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 lg:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics?.pipelineConversion.conversionRates || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="stage" />
                  <YAxis />
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Bar dataKey="rate" fill="#264C99" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Activity</CardTitle>
            <CardDescription>Applications vs Hires over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 lg:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics?.monthlyTrends || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="applications" fill="#5C667B" name="Applications" />
                  <Bar dataKey="hires" fill="#1F3A5F" name="Hires" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      )}

      {/* Recruiter Performance - Only show if there's data */}
      {hasData && (
      <Card>
        <CardHeader>
          <CardTitle>Recruiter Performance</CardTitle>
          <CardDescription>Performance metrics by team member</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Recruiter</th>
                  <th className="text-left p-2">Jobs Posted</th>
                  <th className="text-left p-2">Candidates Hired</th>
                  <th className="text-left p-2">Avg Time to Hire</th>
                  <th className="text-left p-2">Conversion Rate</th>
                </tr>
              </thead>
              <tbody>
                {(metrics?.recruiterPerformance || []).map((recruiter, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-2 font-medium">{recruiter.recruiter}</td>
                    <td className="p-2">{recruiter.jobsPosted}</td>
                    <td className="p-2">{recruiter.candidatesHired}</td>
                    <td className="p-2">{recruiter.avgTimeToHire} days</td>
                    <td className="p-2">
                      <Badge variant={recruiter.conversionRate > 15 ? "default" : "secondary"}>
                        {recruiter.conversionRate.toFixed(1)}%
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      )}
      </div>
    </DashboardLayout>
  )
}