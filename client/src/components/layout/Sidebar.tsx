import { Link, useLocation } from 'wouter'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { 
  LayoutDashboard, 
  Briefcase, 
  Kanban, 
  Users, 
  MessageSquare,
  BarChart3,
  Settings
} from 'lucide-react'

interface SidebarProps {
  className?: string
  isOpen?: boolean
  onClose?: () => void
}

const navigationItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['hiring_manager', 'recruiter', 'admin', 'interviewer', 'demo_viewer'] },
  { label: 'Jobs', href: '/jobs', icon: Briefcase, roles: ['hiring_manager', 'recruiter', 'admin', 'interviewer', 'demo_viewer'] },
  { label: 'Pipeline', href: '/pipeline', icon: Kanban, roles: ['hiring_manager', 'recruiter', 'admin', 'interviewer', 'demo_viewer'] },
  { label: 'Candidates', href: '/candidates', icon: Users, roles: ['hiring_manager', 'recruiter', 'admin', 'demo_viewer'] },
  { label: 'Messages', href: '/messages', icon: MessageSquare, roles: ['hiring_manager', 'recruiter', 'admin', 'interviewer', 'demo_viewer'] },
  { label: 'Reports', href: '/reports', icon: BarChart3, roles: ['hiring_manager', 'recruiter', 'admin', 'demo_viewer'] },
  { label: 'Settings', href: '/settings', icon: Settings, roles: ['hiring_manager', 'recruiter', 'admin', 'demo_viewer'] },
]

export function Sidebar({ className, isOpen, onClose }: SidebarProps) {
  const [location] = useLocation()
  const { userRole } = useAuth()

  const filteredNavigationItems = navigationItems.filter(item => 
    !userRole || item.roles.includes(userRole)
  )

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar - Dark Navy Design */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-56 bg-[#1F2937] transform transition-transform duration-300 lg:translate-x-0 lg:static lg:inset-0",
        isOpen ? "translate-x-0" : "-translate-x-full",
        className
      )}>
        <div className="flex h-full flex-col">
          {/* Logo/Brand */}
          <div className="flex h-16 items-center px-5">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">T</span>
              </div>
              <span className="text-lg font-semibold text-white">TalentPatriot</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {filteredNavigationItems.map((item) => {
              const Icon = item.icon
              const isActive = location === item.href || location.startsWith(item.href + '/')
              
              return (
                <Link 
                  key={item.href} 
                  href={item.href}
                  onClick={onClose}
                >
                  <div
                    className={cn(
                      "flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer",
                      isActive 
                        ? "bg-[#3B5068] text-white" 
                        : "text-gray-300 hover:bg-[#2D3B4E] hover:text-white"
                    )}
                    data-testid={`nav-item-${item.label.toLowerCase()}`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </div>
                </Link>
              )
            })}
          </nav>
        </div>
      </aside>
    </>
  )
}
