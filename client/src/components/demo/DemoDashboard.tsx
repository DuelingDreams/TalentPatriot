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
    <div className="tp-container space-y-6">
      {/* Welcome Banner */}
      <Card className="card bg-gradient-to-r from-[#F7F9FC] to-[#F0F4F8] border-[#264C99]/20">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="tp-h1 text-[#1A1A1A] mb-2">
                Welcome to TalentPatriot Demo
              </h2>
              <p className="tp-body text-[#5C667B] mb-4">
                Explore our modern ATS with interactive features. Try dragging candidates in the pipeline!
              </p>
              <Link href="/pipeline">
                <Button className="btn-primary gap-2">
                  <PlayCircle className="w-4 h-4" />
                  Try Interactive Pipeline
                </Button>
              </Link>
            </div>
            <Badge variant="secondary" className="bg-[#264C99]/10 text-[#264C99] border-[#264C99]/20">
              Demo Mode
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card">
          <CardHeader className="pb-3">
            <CardTitle className="tp-label text-[#5C667B]">Open Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1A1A1A]">{demoStats.openJobs}</div>
            <p className="text-xs text-[#5C667B] mt-1">Active positions</p>
          </CardContent>
        </Card>
        
        <Card className="card">
          <CardHeader className="pb-3">
            <CardTitle className="tp-label text-[#5C667B]">Total Candidates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1A1A1A]">{demoStats.totalCandidates}</div>
            <p className="text-xs text-[#5C667B] mt-1">In pipeline</p>
          </CardContent>
        </Card>
        
        <Card className="card">
          <CardHeader className="pb-3">
            <CardTitle className="tp-label text-[#5C667B]">Active Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1A1A1A]">{demoStats.activeClients}</div>
            <p className="text-xs text-[#5C667B] mt-1">Current partnerships</p>
          </CardContent>
        </Card>
        
        <Card className="card">
          <CardHeader className="pb-3">
            <CardTitle className="tp-label text-[#5C667B]">Scheduled Interviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1A1A1A]">{demoStats.scheduledInterviews}</div>
            <p className="text-xs text-[#5C667B] mt-1">This week</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="card lg:col-span-2">
          <CardHeader>
            <CardTitle className="tp-h2 text-[#1A1A1A]">Performance Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-[#F7F9FC] rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-[#264C99]" />
                  <span className="tp-label text-[#5C667B]">Pipeline Conversion</span>
                </div>
                <div className="text-xl font-bold text-[#1A1A1A]">{demoStats.pipelineConversion}%</div>
              </div>
              <div className="p-4 bg-[#F7F9FC] rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-[#264C99]" />
                  <span className="tp-label text-[#5C667B]">Avg. Time to Hire</span>
                </div>
                <div className="text-xl font-bold text-[#1A1A1A]">{demoStats.avgTimeToHire} days</div>
              </div>
            </div>
            <div className="p-4 bg-[#F7F9FC] rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-4 h-4 text-[#264C99]" />
                <span className="tp-label text-[#5C667B]">Placements This Month</span>
              </div>
              <div className="text-xl font-bold text-[#1A1A1A]">{demoStats.placementsThisMonth}</div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="card">
          <CardHeader>
            <CardTitle className="tp-h2 text-[#1A1A1A]">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 bg-[#F7F9FC] rounded-lg">
                <div className={`p-2 rounded-lg ${activity.color}`}>
                  <activity.icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="tp-label text-[#1A1A1A] font-medium">{activity.action}</p>
                  <p className="tp-body text-[#5C667B] text-sm">{activity.description}</p>
                  <p className="text-xs text-[#5C667B] mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Feature Highlights */}
      <Card className="card">
        <CardHeader>
          <CardTitle className="tp-h2 text-[#1A1A1A]">Explore Demo Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {demoFeatures.map((feature, index) => (
              <Link key={index} href={feature.link}>
                <div className="p-4 border border-[#F0F4F8] rounded-lg hover:border-[#264C99]/30 hover:bg-[#F7F9FC] transition-all duration-200 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${feature.color} text-white`}>
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="tp-label text-[#1A1A1A] font-medium">{feature.title}</h3>
                      <p className="tp-body text-[#5C667B] text-sm">{feature.description}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#5C667B] ml-auto" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}