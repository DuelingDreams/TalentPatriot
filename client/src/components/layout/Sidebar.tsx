import { useState } from 'react'
import { Link, useLocation } from 'wouter'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/contexts/AuthContext'
import { 
  Home, 
  Briefcase, 
  Building2, 
  Users, 
  Calendar, 
  MessageSquare,
  HelpCircle, 
  FileText,
  Shield
} from 'lucide-react'

interface SidebarProps {
  className?: string
  isOpen?: boolean
  onClose?: () => void
}

const navigationItems = [
  { label: 'Dashboard', href: '/dashboard', icon: Home, roles: ['recruiter', 'bd', 'pm', 'demo_viewer', 'admin'] },
  { label: 'Jobs', href: '/jobs', icon: Briefcase, roles: ['recruiter', 'bd', 'pm', 'admin'] },
  { label: 'Clients', href: '/clients', icon: Building2, roles: ['recruiter', 'bd', 'admin'] },
  { label: 'Candidates', href: '/candidates', icon: Users, roles: ['recruiter', 'bd', 'admin'] },
  { label: 'Calendar', href: '/calendar', icon: Calendar, roles: ['recruiter', 'bd', 'pm', 'admin'] },
  { label: 'Messages', href: '/messages', icon: MessageSquare, roles: ['recruiter', 'bd', 'pm', 'admin'] },
]

const adminItems = [
  { label: 'Role Management', href: '/admin/roles', icon: Shield, roles: ['admin'] },
]

const secondaryItems = [
  { label: 'Help & Support', href: '/help', icon: HelpCircle },
  { label: 'Documentation', href: '/docs', icon: FileText },
]

export function Sidebar({ className, isOpen, onClose }: SidebarProps) {
  const [location] = useLocation()
  const { userRole } = useAuth()

  const filteredNavigationItems = navigationItems.filter(item => 
    !userRole || item.roles.includes(userRole)
  )

  const filteredAdminItems = adminItems.filter(item => 
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
      
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 lg:translate-x-0 lg:static lg:inset-0",
        isOpen ? "translate-x-0" : "-translate-x-full",
        className
      )}>
        <div className="flex h-full flex-col">
          {/* Logo/Brand */}
          <div className="flex h-16 items-center px-6 border-b border-slate-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-semibold text-slate-900">ATS Pro</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1">
            {filteredNavigationItems.map((item) => {
              const Icon = item.icon
              const isActive = location === item.href
              
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start text-sm font-medium",
                      isActive 
                        ? "text-blue-600 bg-blue-50 hover:bg-blue-100" 
                        : "text-slate-700 hover:bg-slate-100"
                    )}
                    onClick={onClose}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </Button>
                </Link>
              )
            })}

            {/* Admin Navigation */}
            {filteredAdminItems.length > 0 && (
              <>
                <div className="border-t border-slate-200 my-4" />
                <div className="px-2 mb-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Administration
                  </p>
                </div>
                {filteredAdminItems.map((item) => {
                  const Icon = item.icon
                  const isActive = location === item.href
                  
                  return (
                    <Link key={item.href} href={item.href}>
                      <Button
                        variant={isActive ? "secondary" : "ghost"}
                        className={cn(
                          "w-full justify-start text-sm font-medium",
                          isActive 
                            ? "text-red-600 bg-red-50 hover:bg-red-100" 
                            : "text-slate-700 hover:bg-slate-100"
                        )}
                        onClick={onClose}
                      >
                        <Icon className="w-5 h-5 mr-3" />
                        {item.label}
                      </Button>
                    </Link>
                  )
                })}
              </>
            )}

            {/* Divider */}
            <div className="border-t border-slate-200 my-4" />

            {/* Secondary Navigation */}
            {secondaryItems.map((item) => {
              const Icon = item.icon
              
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-sm font-medium text-slate-700 hover:bg-slate-100"
                    onClick={onClose}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </Button>
                </Link>
              )
            })}
          </nav>

          {/* User Profile Section */}
          <div className="border-t border-slate-200 p-4">
            <div className="flex items-center space-x-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=80&h=80" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">John Doe</p>
                <p className="text-xs text-slate-500 truncate">john@company.com</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
