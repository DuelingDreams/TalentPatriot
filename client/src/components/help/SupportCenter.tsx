import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  MessageCircle, 
  FileText, 
  Users, 
  Zap, 
  ExternalLink,
  Clock,
  CheckCircle,
  AlertCircle,
  Mail,
  Phone
} from 'lucide-react'

const supportOptions = [
  {
    title: "Live Chat Support",
    description: "Get instant help from our support team",
    icon: MessageCircle,
    availability: "Monday-Friday, 9 AM - 6 PM EST",
    response: "Immediate",
    action: "Start Chat",
    type: "primary",
    status: "online"
  },
  {
    title: "Email Support", 
    description: "Detailed support for complex issues",
    icon: Mail,
    availability: "24/7 submission",
    response: "Within 24 hours",
    action: "Send Email",
    type: "secondary",
    status: "available"
  },
  {
    title: "Community Forum",
    description: "Connect with other TalentPatriot users",
    icon: Users,
    availability: "24/7 community access",
    response: "Community-driven",
    action: "Visit Forum",
    type: "outline",
    status: "active"
  },
  {
    title: "Feature Requests",
    description: "Suggest new features or improvements", 
    icon: Zap,
    availability: "Always accepting feedback",
    response: "Review within 1 week",
    action: "Submit Request",
    type: "outline",
    status: "available"
  }
]

const commonIssues = [
  {
    issue: "Can't access my organization",
    solution: "Check your organization permissions or contact your admin",
    category: "Access",
    frequency: "common"
  },
  {
    issue: "AI resume parsing not working",
    solution: "Ensure PDF format and try re-uploading the resume",
    category: "AI Features",
    frequency: "common"
  },
  {
    issue: "Pipeline stages not saving",
    solution: "Check your internet connection and try refreshing the page",
    category: "Pipeline",
    frequency: "occasional"
  },
  {
    issue: "Email notifications not received",
    solution: "Check spam folder and verify email settings in your profile",
    category: "Notifications",
    frequency: "common"
  },
  {
    issue: "Cannot upload candidate resume",
    solution: "File must be under 10MB and in PDF, DOC, or DOCX format",
    category: "File Upload",
    frequency: "occasional"
  }
]

const quickFixes = [
  "Clear browser cache and cookies",
  "Try using a different browser",
  "Check your internet connection",
  "Refresh the page and try again",
  "Log out and log back in",
  "Contact your organization admin"
]

export function SupportCenter() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-100 text-green-800'
      case 'active': return 'bg-blue-100 text-blue-800'
      case 'available': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircle className="w-4 h-4" />
      case 'active': return <CheckCircle className="w-4 h-4" />
      case 'available': return <Clock className="w-4 h-4" />
      default: return <AlertCircle className="w-4 h-4" />
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Support Center</h1>
          <p className="text-lg text-slate-600">Get help, report issues, and connect with our support team</p>
        </div>

        {/* Support Options */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Contact Support</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {supportOptions.map((option, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <option.icon className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{option.title}</CardTitle>
                        <Badge className={`${getStatusColor(option.status)} mt-1`}>
                          {getStatusIcon(option.status)}
                          <span className="ml-1 capitalize">{option.status}</span>
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <CardDescription className="mt-2">{option.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Clock className="w-4 h-4" />
                      {option.availability}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle className="w-4 h-4" />
                      Response: {option.response}
                    </div>
                  </div>
                  <Button 
                    variant={option.type as any} 
                    className="w-full"
                  >
                    {option.action}
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Common Issues */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Common Issues & Solutions</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {commonIssues.map((item, index) => (
              <Card key={index} className="hover:shadow-sm transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{item.issue}</CardTitle>
                    <Badge variant="outline" className="text-xs">
                      {item.category}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600">{item.solution}</p>
                  <Badge 
                    variant="secondary" 
                    className={`mt-2 text-xs ${
                      item.frequency === 'common' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {item.frequency}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Fixes */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Quick Troubleshooting Steps</h2>
          <Card>
            <CardHeader>
              <CardTitle>Before contacting support, try these steps:</CardTitle>
              <CardDescription>These simple fixes resolve most common issues</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {quickFixes.map((fix, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm text-slate-700">{fix}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Emergency Contact */}
        <div className="mb-8">
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-800">
                <AlertCircle className="w-5 h-5" />
                Emergency Support
              </CardTitle>
              <CardDescription className="text-red-700">
                For critical system outages or security issues affecting your organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button variant="destructive" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Emergency Line
                </Button>
                <Button variant="outline" className="flex items-center gap-2 border-red-200 text-red-700">
                  <Mail className="w-4 h-4" />
                  Critical Issues Email
                </Button>
              </div>
              <p className="text-xs text-red-600 mt-3">
                Emergency support is available 24/7 for critical issues only
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Additional Resources */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Documentation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-4">
                Complete guides, tutorials, and API reference
              </p>
              <Button variant="outline" className="w-full">
                View Documentation
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Video Tutorials
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-4">
                Step-by-step video guides for all features
              </p>
              <Button variant="outline" className="w-full">
                <ExternalLink className="w-4 h-4 mr-2" />
                Watch Videos
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-4">
                Check current system status and planned maintenance
              </p>
              <Button variant="outline" className="w-full">
                <ExternalLink className="w-4 h-4 mr-2" />
                Status Page
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}