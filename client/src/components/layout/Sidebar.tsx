import { useState } from 'react'
import { Link, useLocation } from 'wouter'
import { cn } from '@/lib/utils'
import { TPButton } from '@/components/TPButton'
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
  BarChart3
} from 'lucide-react'

interface SidebarProps {
  className?: string
  isOpen?: boolean
  onClose?: () => void
}

const navigationItems = [
  { label: 'Dashboard', href: '/dashboard', icon: Home, roles: ['hiring_manager', 'recruiter', 'admin', 'interviewer', 'demo_viewer'] },
  { label: 'Jobs', href: '/jobs', icon: Briefcase, roles: ['hiring_manager', 'recruiter', 'admin', 'interviewer', 'demo_viewer'] },
  { label: 'Pipeline', href: '/pipeline', icon: BarChart3, roles: ['hiring_manager', 'recruiter', 'admin', 'interviewer', 'demo_viewer'] },
  { label: 'Clients', href: '/clients', icon: Building2, roles: ['hiring_manager', 'recruiter', 'admin', 'demo_viewer'] },
  { label: 'Candidates', href: '/candidates', icon: Users, roles: ['hiring_manager', 'recruiter', 'admin', 'demo_viewer'] },
  { label: 'Calendar', href: '/calendar', icon: Calendar, roles: ['hiring_manager', 'recruiter', 'admin', 'interviewer', 'demo_viewer'] },
  { label: 'Messages', href: '/messages', icon: MessageSquare, roles: ['hiring_manager', 'recruiter', 'admin', 'interviewer', 'demo_viewer'] },
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
        "fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 transform transition-transform duration-300 lg:translate-x-0 lg:static lg:inset-0 shadow-xl",
        isOpen ? "translate-x-0" : "-translate-x-full",
        className
      )}>
        <div className="flex h-full flex-col">
          {/* Logo/Brand */}
          <div className="flex h-16 items-center px-6 border-b border-gray-200 bg-gradient-to-r from-primary to-primary/80">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center p-1">
                <span className="text-primary font-bold text-lg">TP</span>
              </div>
              <div>
                <span className="text-xl font-bold text-white font-[Inter,sans-serif]">TalentPatriot</span>
                <p className="text-xs text-white/70">Professional ATS</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1">
            {filteredNavigationItems.map((item) => {
              const Icon = item.icon
              const isActive = location === item.href
              
              return (
                <Link key={item.href} href={item.href}>
                  <TPButton
                    variant={isActive ? "secondary" : "outline"}
                    className={cn(
                      "w-full justify-start text-sm font-medium",
                      isActive 
                        ? "shadow-[0_0_10px_rgba(0,255,255,0.3)]" 
                        : ""
                    )}
                    onClick={onClose}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </TPButton>
                </Link>
              )
            })}

            {/* Divider */}
            <div className="border-t border-slate-200 my-4" />

            {/* Secondary Navigation */}
            {secondaryItems.map((item) => {
              const Icon = item.icon
              
              return (
                <Link key={item.href} href={item.href}>
                  <TPButton
                    variant="outline"
                    className="w-full justify-start text-sm font-medium"
                    onClick={onClose}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </TPButton>
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
