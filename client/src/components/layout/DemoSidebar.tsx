import { useState } from 'react'
import { Link, useLocation } from 'wouter'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useDemo } from '@/contexts/DemoContext'
import { 
  Home, 
  Briefcase, 
  Building2, 
  Users, 
  Calendar, 
  MessageSquare,
  HelpCircle, 
  FileText,
  Eye
} from 'lucide-react'

interface DemoSidebarProps {
  className?: string
  isOpen?: boolean
  onClose?: () => void
}

const navigationItems = [
  { label: 'Demo Dashboard', href: '/demo', icon: Home },
  { label: 'Jobs (Demo)', href: '/demo/jobs', icon: Briefcase },
  { label: 'Clients (Demo)', href: '/demo/clients', icon: Building2 },
  { label: 'Candidates (Demo)', href: '/demo/candidates', icon: Users },
]

const secondaryItems = [
  { label: 'Help & Support', href: '/help', icon: HelpCircle },
  { label: 'Documentation', href: '/docs', icon: FileText },
]

export function DemoSidebar({ className, isOpen, onClose }: DemoSidebarProps) {
  const [location] = useLocation()
  const { demoUser } = useDemo()

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
        isOpen ? "translate-x-0" : "-translate-x-full",
        className
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-slate-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Eye className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-semibold text-slate-900">ATS Demo</span>
            </div>
          </div>

          {/* Demo Mode Banner */}
          <div className="p-4 bg-blue-50 border-b border-blue-200">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-blue-600">🔓</span>
              <span className="text-blue-800 font-medium">Demo Mode</span>
            </div>
            <p className="text-xs text-blue-600 mt-1">Read-only preview with sample data</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = location === item.href

              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start px-3 py-2 h-auto text-left",
                      isActive 
                        ? "bg-slate-100 text-slate-900 font-medium" 
                        : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                    )}
                    onClick={onClose}
                  >
                    <Icon className="w-4 h-4 mr-3" />
                    {item.label}
                  </Button>
                </Link>
              )
            })}
          </nav>

          {/* Secondary Navigation */}
          <div className="border-t border-slate-200 px-4 py-4 space-y-1">
            {secondaryItems.map((item) => {
              const Icon = item.icon
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    className="w-full justify-start px-3 py-2 h-auto text-left text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    onClick={onClose}
                  >
                    <Icon className="w-4 h-4 mr-3" />
                    {item.label}
                  </Button>
                </Link>
              )
            })}
          </div>

          {/* User Info */}
          <div className="border-t border-slate-200 p-4">
            <div className="flex items-center space-x-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src="" />
                <AvatarFallback className="bg-blue-100 text-blue-600">
                  {demoUser.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {demoUser.name}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {demoUser.email}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    Demo Viewer
                  </span>
                </div>
              </div>
            </div>
            
            <div className="mt-3 pt-3 border-t border-slate-100">
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href="/login">Exit Demo</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}