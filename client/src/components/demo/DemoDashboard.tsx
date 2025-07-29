import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { StatCard } from '@/components/dashboard/StatCard'
import { RecentActivity } from '@/components/dashboard/RecentActivity'
import { PipelineOverview } from '@/components/dashboard/PipelineOverview'
import { JobsChart } from '@/components/dashboard/JobsChart'
import { SmartAlerts } from '@/components/dashboard/SmartAlerts'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { RefreshIndicator } from '@/components/dashboard/RefreshIndicator'
import { PostJobDialog } from '@/components/dialogs/PostJobDialog'
import { 
  Users, Briefcase, Calendar, TrendingUp, 
  FileText, ChevronRight, PlayCircle,
  UserCheck
} from 'lucide-react'
import { Link } from 'wouter'

// Demo statistics - matching real app structure
const demoStats = {
  openJobs: 5,
  totalCandidates: 12,
  activeCandidates: 8,
  hiredThisMonth: 3,
  pipelineConversion: 25,
  avgTimeToHire: 21,
  clientSatisfaction: 92
}

// Demo pipeline data
const demoPipelineData = [
  { stage: 'Applied', count: 15, percentage: 25 },
  { stage: 'Screening', count: 8, percentage: 13 },
  { stage: 'Interview', count: 6, percentage: 10 },
  { stage: 'Technical', count: 4, percentage: 7 },
  { stage: 'Reference', count: 2, percentage: 3 },
  { stage: 'Offer', count: 3, percentage: 5 },
  { stage: 'Hired', count: 12, percentage: 20 },
  { stage: 'Rejected', count: 10, percentage: 17 }
]

// Demo job status data
const demoJobStatusData = [
  { name: 'Open', value: 5, color: '#22c55e' },
  { name: 'In Progress', value: 3, color: '#3b82f6' },
  { name: 'On Hold', value: 1, color: '#f59e0b' },
  { name: 'Filled', value: 2, color: '#8b5cf6' }
]



export function DemoDashboard() {
  const { toast } = useToast()
  const [lastRefreshed, setLastRefreshed] = useState(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleDemoAction = (action: string) => {
    toast({
      title: "Demo Mode",
      description: `${action} feature available in demo - explore freely!`,
    })
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => {
      setIsRefreshing(false)
      setLastRefreshed(new Date())
      toast({
        title: "Demo Data Refreshed",
        description: "Dashboard updated with latest demo information",
      })
    }, 1000)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Welcome to TalentPatriot Demo! Here's an overview of your recruitment pipeline.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center gap-3">
          <RefreshIndicator 
            lastRefreshed={lastRefreshed}
            isRefreshing={isRefreshing}
            onRefresh={handleRefresh}
          />
          <Button 
            onClick={() => handleDemoAction("Post Job")}
            className="bg-[#1F3A5F] hover:bg-[#264C99] text-white"
          >
            <Briefcase className="w-4 h-4 mr-2" />
            Post New Job
          </Button>
        </div>
      </div>

      {/* Smart Alerts */}
      <SmartAlerts />

      {/* Quick Actions */}
      <QuickActions />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Open Positions"
          value={demoStats.openJobs}
          icon={Briefcase}
          trend={{ value: 12, label: "from last month" }}
          loading={false}
        />
        <StatCard
          label="Total Candidates"
          value={demoStats.totalCandidates}
          icon={Users}
          trend={{ value: 8, label: "from last month" }}
          loading={false}
        />
        <StatCard
          label="Active Candidates"
          value={demoStats.activeCandidates}
          icon={UserCheck}
          loading={false}
        />
        <StatCard
          label="Hired This Month"
          value={demoStats.hiredThisMonth}
          icon={TrendingUp}
          trend={{ value: 25, label: "increase" }}
          loading={false}
        />
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PipelineOverview data={demoPipelineData} loading={false} />
        <JobsChart data={demoJobStatusData} loading={false} />
      </div>

      {/* Performance Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Performance Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Pipeline Conversion</span>
              <span className="text-sm font-semibold text-gray-900">{demoStats.pipelineConversion}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${demoStats.pipelineConversion}%` }}
              ></div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Avg Time to Hire</span>
              <span className="text-sm font-semibold text-gray-900">{demoStats.avgTimeToHire} days</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full transition-all duration-300" style={{ width: '70%' }}></div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Client Satisfaction</span>
              <span className="text-sm font-semibold text-gray-900">{demoStats.clientSatisfaction}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full transition-all duration-300" style={{ width: `${demoStats.clientSatisfaction}%` }}></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity and Actions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentActivity loading={false} />
        </div>
        
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <button
                onClick={() => handleDemoAction("View Jobs")}
                className="w-full p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                      <Briefcase className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">View Jobs</p>
                      <p className="text-sm text-gray-500">Browse open positions</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </button>
              
              <button
                onClick={() => handleDemoAction("Review Applications")}
                className="w-full p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center group-hover:bg-green-100 transition-colors">
                      <FileText className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Review Applications</p>
                      <p className="text-sm text-gray-500">8 pending reviews</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </button>
              
              <button
                onClick={() => handleDemoAction("Schedule Interview")}
                className="w-full p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                      <Calendar className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Schedule Interview</p>
                      <p className="text-sm text-gray-500">Book time slots</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Demo Welcome Banner */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                🎯 Demo Mode Active
              </h3>
              <p className="text-blue-700 mb-4">
                You're viewing a fully interactive demo with sample data. All features are available to explore!
              </p>
              <Link href="/pipeline">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <PlayCircle className="w-4 h-4 mr-2" />
                  Try Interactive Pipeline
                </Button>
              </Link>
            </div>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
              Demo
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}