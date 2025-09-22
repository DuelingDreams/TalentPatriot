import { useState } from 'react'
import { Link, useLocation } from 'wouter'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/contexts/AuthContext'
import { useCurrentOrganization } from '@/hooks/useOrganizations'
import { 
  Home, 
  Briefcase, 
  Kanban, 
  Users, 
  Calendar, 
  MessageSquare,
  HelpCircle, 
  BarChart3,
  Globe,
  Mail
} from 'lucide-react'

interface SidebarProps {
  className?: string
  isOpen?: boolean
  onClose?: () => void
}

const navigationItems = [
  { label: 'Dashboard', href: '/dashboard', icon: Home, roles: ['hiring_manager', 'recruiter', 'admin', 'interviewer', 'demo_viewer'] },
  { 
    label: 'Jobs', 
    href: '/jobs', 
    icon: Briefcase, 
    roles: ['hiring_manager', 'recruiter', 'admin', 'interviewer', 'demo_viewer'],
    subItems: [
      { label: 'Careers Page', href: '/careers', icon: Globe, external: true }
    ]
  },
  { label: 'Pipeline', href: '/pipeline', icon: Kanban, roles: ['hiring_manager', 'recruiter', 'admin', 'interviewer', 'demo_viewer'] },
  { label: 'Candidates', href: '/candidates', icon: Users, roles: ['hiring_manager', 'recruiter', 'admin', 'demo_viewer'] },
  { label: 'Messages', href: '/messages', icon: MessageSquare, roles: ['hiring_manager', 'recruiter', 'admin', 'interviewer', 'demo_viewer'] },
  { label: 'Reports', href: '/reports', icon: BarChart3, roles: ['hiring_manager', 'recruiter', 'admin', 'demo_viewer'] },
  { label: 'Email Settings', href: '/admin/email-settings', icon: Mail, roles: ['admin'] },
  { label: 'Calendar', href: '/calendar', icon: Calendar, roles: ['hiring_manager', 'recruiter', 'admin', 'interviewer', 'demo_viewer'] },
]

const secondaryItems = [
  { label: 'Help', href: '/help', icon: HelpCircle },
]

export function Sidebar({ className, isOpen, onClose }: SidebarProps) {
  const [location] = useLocation()
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(['Jobs']))
  const { user, userRole } = useAuth()
  const { data: currentOrganization } = useCurrentOrganization()

  const filteredNavigationItems = navigationItems.filter(item => 
    !userRole || item.roles.includes(userRole)
  )

  // Generate the careers page URL based on the current organization
  const getCareersUrl = () => {
    if (!currentOrganization || typeof currentOrganization !== 'object' || !('slug' in currentOrganization) || !currentOrganization.slug) {
      return '/careers' // Fallback to regular careers page
    }
    
    // Use path-based routing (no DNS required) for better scalability
    return `/org/${currentOrganization.slug}/careers`
  }

  const toggleExpanded = (itemLabel: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(itemLabel)) {
      newExpanded.delete(itemLabel)
    } else {
      newExpanded.add(itemLabel)
    }
    setExpandedItems(newExpanded)
  }

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
          <div className="flex h-16 items-center px-6 border-b border-gray-200 bg-gradient-to-r from-[#1F3A5F] to-[#264C99]">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center p-1">
                <img 
                  src="/talentpatriot-logo.png" 
                  alt="TalentPatriot Logo" 
                  className="w-8 h-8 object-contain filter brightness-0 invert"
                />
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
              const hasSubItems = item.subItems && item.subItems.length > 0
              const isExpanded = expandedItems.has(item.label)
              
              return (
                <div key={item.href}>
                  {/* Main Navigation Item */}
                  <div className="flex items-center">
                    <Link href={item.href} className="flex-1">
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-start text-sm font-medium transition-all duration-200",
                          isActive 
                            ? "bg-[#1F3A5F] text-white font-bold shadow-md hover:bg-[#264C99]" 
                            : "text-[#5C667B] hover:bg-[#F0F4F8] hover:text-[#1F3A5F]"
                        )}
                        onClick={onClose}
                      >
                        <Icon className="w-5 h-5 mr-3" />
                        {item.label}
                      </Button>
                    </Link>
                    
                    {/* Expand/Collapse Button for Items with SubItems */}
                    {hasSubItems && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-1 p-1 h-8 w-8 text-[#5C667B] hover:bg-[#F0F4F8]"
                        onClick={() => toggleExpanded(item.label)}
                      >
                        <svg 
                          className={cn("w-4 h-4 transition-transform", isExpanded ? "rotate-90" : "")}
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Button>
                    )}
                  </div>
                  
                  {/* Sub Items */}
                  {hasSubItems && isExpanded && (
                    <div className="ml-8 mt-1 space-y-1">
                      {item.subItems?.map((subItem) => {
                        const SubIcon = subItem.icon
                        const subIsActive = location === subItem.href
                        
                        if (subItem.label === 'Careers Page') {
                          const careersUrl = getCareersUrl()
                          
                          return (
                            <Link 
                              key={subItem.href} 
                              href={careersUrl}
                              className="block"
                            >
                              <Button
                                variant="ghost"
                                className={cn(
                                  "w-full justify-start text-sm pl-8",
                                  subIsActive 
                                    ? "bg-[#1F3A5F] text-white font-bold" 
                                    : "text-[#6B7280] hover:bg-[#F0F4F8] hover:text-[#1F3A5F]"
                                )}
                                onClick={onClose}
                              >
                                <SubIcon className="w-4 h-4 mr-3" />
                                {subItem.label}
                                <svg className="w-3 h-3 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </Button>
                            </Link>
                          )
                        }
                        
                        return (
                          <Link key={subItem.href} href={subItem.href}>
                            <Button
                              variant="ghost"
                              className={cn(
                                "w-full justify-start text-sm pl-8",
                                subIsActive 
                                  ? "bg-[#1F3A5F] text-white font-bold" 
                                  : "text-[#6B7280] hover:bg-[#F0F4F8] hover:text-[#1F3A5F]"
                              )}
                              onClick={onClose}
                            >
                              <SubIcon className="w-4 h-4 mr-3" />
                              {subItem.label}
                            </Button>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}

            {/* Divider */}
            <div className="border-t border-slate-200 my-4" />

            {/* Secondary Navigation */}
            {secondaryItems.map((item) => {
              const Icon = item.icon
              const isActive = location === item.href
              
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start text-sm font-medium transition-all duration-200",
                      isActive 
                        ? "bg-[#1F3A5F] text-white font-bold shadow-md hover:bg-[#264C99]" 
                        : "text-[#5C667B] hover:bg-[#F0F4F8] hover:text-[#1F3A5F]"
                    )}
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
                {userRole === 'demo_viewer' ? (
                  <>
                    <p className="text-sm font-medium text-slate-900 truncate">John Doe</p>
                    <p className="text-xs text-slate-500 truncate">john@company.com</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-slate-900 truncate">{user?.user_metadata?.name ?? user?.email ?? 'Unknown User'}</p>
                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
