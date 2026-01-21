import { Link } from 'wouter'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useAuth } from '@/contexts/AuthContext'
import { 
  User, 
  Building2, 
  Bell, 
  Shield, 
  Puzzle,
  ChevronRight
} from 'lucide-react'

const settingsSections = [
  {
    title: 'Profile Settings',
    description: 'Update your personal information, photo, and preferences',
    href: '/profile-settings',
    icon: User,
    roles: ['hiring_manager', 'recruiter', 'admin', 'interviewer', 'demo_viewer']
  },
  {
    title: 'Account Settings',
    description: 'Manage notifications, security, and account preferences',
    href: '/account-settings',
    icon: Shield,
    roles: ['hiring_manager', 'recruiter', 'admin', 'interviewer', 'demo_viewer']
  },
  {
    title: 'Organization Settings',
    description: 'Configure organization details, branding, and team members',
    href: '/settings/organization',
    icon: Building2,
    roles: ['admin', 'owner', 'hiring_manager']
  },
  {
    title: 'Integrations',
    description: 'Connect third-party services and manage API access',
    href: '/settings/integrations',
    icon: Puzzle,
    roles: ['admin', 'owner']
  }
]

export default function Settings() {
  const { orgRole, userRole } = useAuth()

  // Use orgRole for org-level permissions, fallback to userRole for platform-level
  const effectiveRole = orgRole || userRole
  const filteredSections = settingsSections.filter(section => 
    !effectiveRole || section.roles.includes(effectiveRole)
  )

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Manage your account and organization settings</p>
        </div>

        <div className="grid gap-4">
          {filteredSections.map((section) => {
            const Icon = section.icon
            return (
              <Link key={section.href} href={section.href}>
                <Card className="cursor-pointer hover:shadow-md transition-shadow" data-testid={`settings-card-${section.title.toLowerCase().replace(/\s+/g, '-')}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{section.title}</CardTitle>
                          <CardDescription className="mt-1">{section.description}</CardDescription>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>
    </DashboardLayout>
  )
}
