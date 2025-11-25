import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, FunnelChart, Funnel, LabelList } from 'recharts'
import { CalendarDays, Users, TrendingUp, Clock, Download, FileSpreadsheet, BarChart3, Award, Target, Zap, Building2, AlertTriangle, Star, Brain, TrendingDown } from 'lucide-react'
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
  sourceOfHire: Array<{ 
    source: string; 
    count: number; 
    percentage: number;
    hireRate: number;
    qualityRate: number;
  }>
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
  topSkills: Array<{
    skill: string
    count: number
    hireRate: number
    avgTimeToHire: number
  }>
  clientPerformance: Array<{
    clientName: string
    industry: string
    totalJobs: number
    activeJobs: number
    fillRate: number
    avgTimeToFill: number
    agingJobs30: number
    agingJobs60: number
  }>
  summary: {
    totalApplications: number
    totalHires: number
    overallConversionRate: number
    avgTimeToHire: number
    topPerformingSource: string
    topRecruiter: string
  }
}

const COLORS = ['#1F3A5F', '#264C99', '#5C667B', '#8B9DC3', '#A8B5D1']

export default function Reports() {
  const { currentOrgId } = useAuth()
  const [selectedPeriod, setSelectedPeriod] = useState('3months')
  const [generatingReport, setGeneratingReport] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

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
    metrics.summary?.totalApplications > 0 || 
    metrics.timeToHire.average > 0 || 
    metrics.sourceOfHire.length > 0 ||
    metrics.recruiterPerformance.length > 0 ||
    metrics.topSkills?.length > 0 ||
    metrics.clientPerformance?.length > 0
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
        
        <div className="flex flex-col lg:flex-row gap-4 w-full lg:w-auto">
          {/* Tab Navigation */}
          <div className="flex gap-2 flex-wrap">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'pipeline', label: 'Pipeline', icon: TrendingUp },
              { id: 'sources', label: 'Sources', icon: Users },
              { id: 'skills', label: 'Skills', icon: Brain },
              { id: 'team', label: 'Team', icon: Award },
              { id: 'clients', label: 'Clients', icon: Building2 }
            ].map(tab => {
              const IconComponent = tab.icon
              return (
                <Button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  variant={activeTab === tab.id ? 'default' : 'outline'}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <IconComponent className="h-4 w-4" />
                  {tab.label}
                </Button>
              )
            })}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
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
                data-testid="button-export-excel"
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Excel
              </Button>
              <Button 
                onClick={() => generateReport('pdf')} 
                disabled={generatingReport}
                size="sm"
                className="flex-1 sm:flex-initial"
                data-testid="button-export-pdf"
              >
                <Download className="h-4 w-4 mr-2" />
                PDF Report
              </Button>
            </div>
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
              <Button 
                onClick={() => window.location.href = '/jobs'} 
                className="bg-blue-600 hover:bg-blue-700"
                data-testid="button-create-job"
              >
                Create Your First Job
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/clients'}
                data-testid="button-add-client"
              >
                Add a Client
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics Overview Cards - Only show if there's data */}
      {hasData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <Card data-testid="card-time-to-hire">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Time to Hire</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-avg-time-to-hire">
              {metrics?.summary?.avgTimeToHire || metrics?.timeToHire.average || 0} days
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics?.timeToHire.trend && metrics.timeToHire.trend > 0 ? '+' : ''}
              {metrics?.timeToHire.trend || 0}% from last period
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-total-applications">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-applications">
              {metrics?.summary?.totalApplications || metrics?.pipelineConversion?.applied || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all open positions
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-conversion-rate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-conversion-rate">
              {metrics?.summary?.overallConversionRate?.toFixed(1) || 
               ((metrics?.pipelineConversion?.applied || 0) > 0 
                ? (((metrics?.pipelineConversion?.hired || 0) / (metrics?.pipelineConversion?.applied || 1)) * 100).toFixed(1)
                : 0)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Application to hire rate
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-total-hires">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hires</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-hires">
              {metrics?.summary?.totalHires || metrics?.pipelineConversion?.hired || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Successfully placed candidates
            </p>
          </CardContent>
        </Card>
      </div>
      )}

      {/* Tab-based Analytics Content - Only show if there's data */}
      {hasData && (
        <>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Trends */}
              <Card data-testid="card-monthly-trends">
                <CardHeader>
                  <CardTitle>Monthly Activity Trends</CardTitle>
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

              {/* Top Performing Source */}
              <Card data-testid="card-top-sources">
                <CardHeader>
                  <CardTitle>Source Performance</CardTitle>
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

              {/* Quick Insights */}
              <Card className="lg:col-span-2" data-testid="card-quick-insights">
                <CardHeader>
                  <CardTitle>Key Insights</CardTitle>
                  <CardDescription>Performance highlights from your recruitment data</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <Target className="h-8 w-8 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-green-800 dark:text-green-200">Top Source</p>
                        <p className="text-lg font-bold text-green-900 dark:text-green-100">
                          {metrics?.summary?.topPerformingSource || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <Award className="h-8 w-8 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Top Recruiter</p>
                        <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
                          {metrics?.summary?.topRecruiter || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <Clock className="h-8 w-8 text-orange-600" />
                      <div>
                        <p className="text-sm font-medium text-orange-800 dark:text-orange-200">Avg. Time</p>
                        <p className="text-lg font-bold text-orange-900 dark:text-orange-100">
                          {metrics?.summary?.avgTimeToHire || 0} days
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Pipeline Tab */}
          {activeTab === 'pipeline' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pipeline Conversion Funnel */}
              <Card className="lg:col-span-2" data-testid="card-pipeline-funnel">
                <CardHeader>
                  <CardTitle>Pipeline Conversion Funnel</CardTitle>
                  <CardDescription>Visual representation of candidate flow through stages</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-5 gap-4 mb-6">
                    {[
                      { label: 'Applied', count: metrics?.pipelineConversion?.applied || 0, color: 'bg-blue-500' },
                      { label: 'Screened', count: metrics?.pipelineConversion?.screened || 0, color: 'bg-indigo-500' },
                      { label: 'Interviewed', count: metrics?.pipelineConversion?.interviewed || 0, color: 'bg-purple-500' },
                      { label: 'Offered', count: metrics?.pipelineConversion?.offered || 0, color: 'bg-green-500' },
                      { label: 'Hired', count: metrics?.pipelineConversion?.hired || 0, color: 'bg-emerald-500' }
                    ].map((stage, index) => (
                      <div key={stage.label} className="text-center">
                        <div className={`${stage.color} text-white rounded-lg p-4 mb-2`}>
                          <div className="text-2xl font-bold">{stage.count}</div>
                        </div>
                        <p className="text-sm font-medium">{stage.label}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Conversion Rates */}
              <Card data-testid="card-conversion-rates">
                <CardHeader>
                  <CardTitle>Stage Conversion Rates</CardTitle>
                  <CardDescription>Conversion percentage between pipeline stages</CardDescription>
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

              {/* Time to Hire Trend */}
              <Card data-testid="card-time-to-hire-trend">
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
            </div>
          )}

          {/* Sources Tab */}
          {activeTab === 'sources' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Source Performance Table */}
              <Card className="lg:col-span-2" data-testid="card-source-performance">
                <CardHeader>
                  <CardTitle>Candidate Source Analysis</CardTitle>
                  <CardDescription>Detailed performance metrics by candidate source</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Source</th>
                          <th className="text-left p-2">Applications</th>
                          <th className="text-left p-2">Hire Rate</th>
                          <th className="text-left p-2">Quality Rate</th>
                          <th className="text-left p-2">Performance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(metrics?.sourceOfHire || []).map((source, index) => (
                          <tr key={index} className="border-b" data-testid={`row-source-${index}`}>
                            <td className="p-2 font-medium">{source.source}</td>
                            <td className="p-2">{source.count}</td>
                            <td className="p-2">{source.hireRate?.toFixed(1) || 0}%</td>
                            <td className="p-2">{source.qualityRate?.toFixed(1) || 0}%</td>
                            <td className="p-2">
                              <Badge variant={source.hireRate > 10 ? "default" : "secondary"}>
                                {source.hireRate > 15 ? 'Excellent' : source.hireRate > 10 ? 'Good' : source.hireRate > 5 ? 'Average' : 'Needs Improvement'}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Skills Tab */}
          {activeTab === 'skills' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Skills in Demand */}
              <Card data-testid="card-top-skills">
                <CardHeader>
                  <CardTitle>Top Skills in Demand</CardTitle>
                  <CardDescription>Most requested skills across your job postings</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(metrics?.topSkills || []).slice(0, 10).map((skill, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div>
                          <p className="font-medium">{skill.skill}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {skill.count} candidates • {skill.hireRate}% hire rate
                          </p>
                        </div>
                        <Badge variant="outline">{skill.avgTimeToHire} days avg</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Skills Performance Chart */}
              <Card data-testid="card-skills-performance">
                <CardHeader>
                  <CardTitle>Skills Performance</CardTitle>
                  <CardDescription>Hire rate by skill category</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 lg:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={(metrics?.topSkills || []).slice(0, 8)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="skill" />
                        <YAxis />
                        <Tooltip formatter={(value) => `${value}%`} />
                        <Bar dataKey="hireRate" fill="#8B5CF6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Team Tab */}
          {activeTab === 'team' && (
            <div className="grid grid-cols-1 gap-6">
              {/* Recruiter Performance */}
              <Card data-testid="card-recruiter-performance">
                <CardHeader>
                  <CardTitle>Team Performance</CardTitle>
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
                          <th className="text-left p-2">Performance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(metrics?.recruiterPerformance || []).map((recruiter, index) => (
                          <tr key={index} className="border-b" data-testid={`row-recruiter-${index}`}>
                            <td className="p-2 font-medium">{recruiter.recruiter}</td>
                            <td className="p-2">{recruiter.jobsPosted}</td>
                            <td className="p-2">{recruiter.candidatesHired}</td>
                            <td className="p-2">{recruiter.avgTimeToHire} days</td>
                            <td className="p-2">{recruiter.conversionRate.toFixed(1)}%</td>
                            <td className="p-2">
                              <Badge variant={recruiter.conversionRate > 15 ? "default" : "secondary"}>
                                {recruiter.conversionRate > 20 ? 'Excellent' : recruiter.conversionRate > 15 ? 'Good' : 'Average'}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Clients Tab */}
          {activeTab === 'clients' && (
            <div className="grid grid-cols-1 gap-6">
              {/* Client Performance */}
              <Card data-testid="card-client-performance">
                <CardHeader>
                  <CardTitle>Client Performance</CardTitle>
                  <CardDescription>Performance metrics by client</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Client</th>
                          <th className="text-left p-2">Industry</th>
                          <th className="text-left p-2">Total Jobs</th>
                          <th className="text-left p-2">Active Jobs</th>
                          <th className="text-left p-2">Fill Rate</th>
                          <th className="text-left p-2">Avg Time to Fill</th>
                          <th className="text-left p-2">Aging Jobs</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(metrics?.clientPerformance || []).map((client, index) => (
                          <tr key={index} className="border-b" data-testid={`row-client-${index}`}>
                            <td className="p-2 font-medium">{client.clientName}</td>
                            <td className="p-2">{client.industry || 'N/A'}</td>
                            <td className="p-2">{client.totalJobs}</td>
                            <td className="p-2">{client.activeJobs}</td>
                            <td className="p-2">{client.fillRate}%</td>
                            <td className="p-2">{client.avgTimeToFill} days</td>
                            <td className="p-2">
                              {client.agingJobs30 > 0 && (
                                <Badge variant={client.agingJobs60 > 0 ? "destructive" : "secondary"}>
                                  {client.agingJobs30} jobs (30d+)
                                </Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
      </div>
    </DashboardLayout>
  )
}