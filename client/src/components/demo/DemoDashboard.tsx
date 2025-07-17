import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { 
  Users, Briefcase, Building2, Calendar, TrendingUp, 
  FileText, UserPlus, ChevronRight, Info, PlayCircle,
  BarChart3, Clock, Target, Award
} from 'lucide-react'
import { Link } from 'wouter'

// Demo statistics
const demoStats = {
  openJobs: 5,
  totalCandidates: 12,
  activeClients: 3,
  scheduledInterviews: 8,
  offersPending: 2,
  placementsThisMonth: 3,
  pipelineConversion: 25,
  avgTimeToHire: 21
}

const recentActivities = [
  {
    id: 1,
    action: "New candidate applied",
    description: "Sarah Chen applied for Senior Frontend Developer",
    time: "2 hours ago",
    icon: UserPlus,
    color: "text-blue-600 bg-blue-50"
  },
  {
    id: 2,
    action: "Interview scheduled",
    description: "Technical interview with Michael Park tomorrow",
    time: "3 hours ago",
    icon: Calendar,
    color: "text-green-600 bg-green-50"
  },
  {
    id: 3,
    action: "Client feedback",
    description: "TechCorp approved offer for Alex Rodriguez",
    time: "5 hours ago",
    icon: Building2,
    color: "text-purple-600 bg-purple-50"
  }
]

const demoFeatures = [
  {
    title: "Interactive Pipeline",
    description: "Drag and drop candidates between stages",
    icon: <BarChart3 className="w-5 h-5" />,
    link: "/pipeline",
    color: "bg-blue-500"
  },
  {
    title: "Client Management",
    description: "View and filter client information",
    icon: <Building2 className="w-5 h-5" />,
    link: "/clients",
    color: "bg-green-500"
  },
  {
    title: "Candidate Database",
    description: "Search and view candidate profiles",
    icon: <Users className="w-5 h-5" />,
    link: "/candidates",
    color: "bg-purple-500"
  },
  {
    title: "Job Listings",
    description: "Browse open positions and requirements",
    icon: <Briefcase className="w-5 h-5" />,
    link: "/jobs",
    color: "bg-orange-500"
  }
]

export function DemoDashboard() {
  const { toast } = useToast()

  const handleDemoAction = (action: string) => {
    toast({
      title: "Demo Mode",
      description: `${action} would be available in the full version`,
    })
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Welcome to TalentPatriot Demo
              </h2>
              <p className="text-slate-600 mb-4">
                Explore our modern ATS with interactive features. Try dragging candidates in the pipeline!
              </p>
              <Link href="/pipeline">
                <Button className="gap-2">
                  <PlayCircle className="w-4 h-4" />
                  Try Interactive Pipeline
                </Button>
              </Link>
            </div>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              Demo Mode
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-600">Open Jobs</CardTitle>
              <Briefcase className="w-4 h-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{demoStats.openJobs}</div>
            <p className="text-xs text-slate-500 mt-1">2 urgent positions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-600">Total Candidates</CardTitle>
              <Users className="w-4 h-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{demoStats.totalCandidates}</div>
            <p className="text-xs text-slate-500 mt-1">4 new this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-600">Interviews</CardTitle>
              <Calendar className="w-4 h-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{demoStats.scheduledInterviews}</div>
            <p className="text-xs text-slate-500 mt-1">3 today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-600">Placements</CardTitle>
              <Award className="w-4 h-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{demoStats.placementsThisMonth}</div>
            <p className="text-xs text-green-600 mt-1">+50% vs last month</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Demo Features */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Explore Demo Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {demoFeatures.map((feature) => (
                  <Link key={feature.title} href={feature.link}>
                    <div className="p-4 border rounded-lg hover:shadow-md transition-all cursor-pointer group">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg ${feature.color} text-white flex items-center justify-center group-hover:scale-110 transition-transform`}>
                          {feature.icon}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-900 group-hover:text-blue-600">
                            {feature.title}
                          </h4>
                          <p className="text-sm text-slate-600 mt-1">
                            {feature.description}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 mt-1" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Pipeline Conversion</span>
                  <span className="text-sm text-slate-600">{demoStats.pipelineConversion}%</span>
                </div>
                <Progress value={demoStats.pipelineConversion} className="h-2" />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Avg Time to Hire</span>
                  <span className="text-sm text-slate-600">{demoStats.avgTimeToHire} days</span>
                </div>
                <Progress value={70} className="h-2" />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Client Satisfaction</span>
                  <span className="text-sm text-slate-600">92%</span>
                </div>
                <Progress value={92} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Side Panel */}
        <div className="space-y-6">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full ${activity.color} flex items-center justify-center`}>
                      <activity.icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">{activity.action}</p>
                      <p className="text-xs text-slate-600">{activity.description}</p>
                      <p className="text-xs text-slate-500 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Demo Limitations */}
          <Alert>
            <Info className="w-4 h-4" />
            <AlertDescription>
              <strong className="block mb-1">Demo Limitations</strong>
              <ul className="text-sm space-y-1">
                <li>• Read-only access to data</li>
                <li>• No email notifications</li>
                <li>• Limited to sample data</li>
                <li>• Interactive drag & drop enabled</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Quick Actions (Disabled) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                onClick={() => handleDemoAction("Create new job")}
                disabled
              >
                <Briefcase className="w-4 h-4 mr-2" />
                Post New Job
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                onClick={() => handleDemoAction("Add candidate")}
                disabled
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Add Candidate
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                onClick={() => handleDemoAction("Schedule interview")}
                disabled
              >
                <Calendar className="w-4 h-4 mr-2" />
                Schedule Interview
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}