import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Users, 
  Folder, 
  Clock, 
  TrendingUp,
  UserPlus,
  FolderPlus,
  FileText,
  Download,
  ChevronRight
} from 'lucide-react'

interface StatCard {
  label: string
  value: string
  icon: React.ElementType
  bgColor: string
  iconColor: string
}

interface Activity {
  id: string
  user: {
    name: string
    avatar: string
  }
  description: string
  project: string
  timestamp: string
}

interface TeamMember {
  id: string
  name: string
  role: string
  avatar: string
  status: 'Online' | 'Away' | 'Offline'
}

export default function Dashboard() {
  const [stats] = useState<StatCard[]>([
    {
      label: 'Total Users',
      value: '2,543',
      icon: Users,
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    {
      label: 'Active Projects',
      value: '12',
      icon: Folder,
      bgColor: 'bg-emerald-100',
      iconColor: 'text-emerald-600'
    },
    {
      label: 'Hours This Week',
      value: '48.5',
      icon: Clock,
      bgColor: 'bg-orange-100',
      iconColor: 'text-orange-600'
    },
    {
      label: 'Revenue',
      value: '$12,543',
      icon: TrendingUp,
      bgColor: 'bg-purple-100',
      iconColor: 'text-purple-600'
    }
  ])

  const [activities] = useState<Activity[]>([
    {
      id: '1',
      user: {
        name: 'Sarah Chen',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b9e7b565?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=64&h=64'
      },
      description: 'completed the design review for',
      project: 'Mobile App Redesign',
      timestamp: '2 hours ago'
    },
    {
      id: '2',
      user: {
        name: 'Mike Johnson',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=64&h=64'
      },
      description: 'added new features to',
      project: 'E-commerce Platform',
      timestamp: '4 hours ago'
    },
    {
      id: '3',
      user: {
        name: 'Emily Davis',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=64&h=64'
      },
      description: 'deployed',
      project: 'Marketing Website',
      timestamp: '6 hours ago'
    }
  ])

  const [teamMembers] = useState<TeamMember[]>([
    {
      id: '1',
      name: 'Alex Thompson',
      role: 'Frontend Developer',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=64&h=64',
      status: 'Online'
    },
    {
      id: '2',
      name: 'Maria Garcia',
      role: 'UI/UX Designer',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=64&h=64',
      status: 'Away'
    },
    {
      id: '3',
      name: 'David Kim',
      role: 'Backend Developer',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=64&h=64',
      status: 'Online'
    }
  ])

  const getStatusBadgeProps = (status: string) => {
    switch (status) {
      case 'Online':
        return { className: 'bg-green-100 text-green-800' }
      case 'Away':
        return { className: 'bg-yellow-100 text-yellow-800' }
      default:
        return { className: 'bg-gray-100 text-gray-800' }
    }
  }

  return (
    <DashboardLayout pageTitle="Dashboard">
      <div className="p-6">
        {/* Page Header */}
        <div className="mb-8">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Welcome back, John!</h2>
              <p className="mt-1 text-sm text-slate-600">Here's what's happening with your projects today.</p>
            </div>
            <div className="mt-4 sm:mt-0">
              <Button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.label} className="bg-white shadow-sm border border-slate-200">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className={`w-8 h-8 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${stat.iconColor}`} />
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-slate-600">{stat.label}</p>
                      <p className="text-2xl font-semibold text-slate-900">{stat.value}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <Card className="bg-white shadow-sm border border-slate-200">
              <div className="px-6 py-4 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900">Recent Activity</h3>
              </div>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={activity.user.avatar} />
                          <AvatarFallback>{activity.user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-slate-900">
                          <span className="font-medium">{activity.user.name}</span> {activity.description} <span className="font-medium">{activity.project}</span>
                        </p>
                        <p className="text-xs text-slate-500 mt-1">{activity.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions and Team Status */}
          <div className="space-y-6">
            {/* Quick Actions Card */}
            <Card className="bg-white shadow-sm border border-slate-200">
              <div className="px-6 py-4 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900">Quick Actions</h3>
              </div>
              <CardContent className="p-6 space-y-3">
                <Button variant="ghost" className="w-full flex items-center justify-between p-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50">
                  <span className="flex items-center">
                    <UserPlus className="w-4 h-4 mr-3 text-slate-500" />
                    Invite User
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </Button>
                <Button variant="ghost" className="w-full flex items-center justify-between p-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50">
                  <span className="flex items-center">
                    <FolderPlus className="w-4 h-4 mr-3 text-slate-500" />
                    Create Project
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </Button>
                <Button variant="ghost" className="w-full flex items-center justify-between p-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50">
                  <span className="flex items-center">
                    <FileText className="w-4 h-4 mr-3 text-slate-500" />
                    Generate Report
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </Button>
                <Button variant="ghost" className="w-full flex items-center justify-between p-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50">
                  <span className="flex items-center">
                    <Download className="w-4 h-4 mr-3 text-slate-500" />
                    Export Data
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </Button>
              </CardContent>
            </Card>

            {/* Team Status */}
            <Card className="bg-white shadow-sm border border-slate-200">
              <div className="px-6 py-4 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900">Team Status</h3>
              </div>
              <CardContent className="p-6 space-y-4">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{member.name}</p>
                        <p className="text-xs text-slate-500">{member.role}</p>
                      </div>
                    </div>
                    <Badge 
                      variant="secondary" 
                      {...getStatusBadgeProps(member.status)}
                    >
                      {member.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
