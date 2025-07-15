import { useState } from 'react'
import { useLocation } from 'wouter'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { UserProfile } from '@/components/auth/UserProfile'
import { 
  Menu, 
  Search, 
  Bell, 
  Briefcase 
} from 'lucide-react'

interface TopNavbarProps {
  onMobileMenuToggle: () => void
  pageTitle?: string
}

export function TopNavbar({ onMobileMenuToggle, pageTitle = "Dashboard" }: TopNavbarProps) {
  const [hasNotifications] = useState(true)
  const [location] = useLocation()
  const isDemoMode = location.startsWith('/demo')



  return (
    <header className="bg-white border-b border-slate-200">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="sm"
          className="lg:hidden p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100"
          onClick={onMobileMenuToggle}
        >
          <Menu className="w-6 h-6" />
        </Button>

        {/* Logo for desktop */}
        <div className="hidden lg:flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-semibold text-slate-900">ATS Pro</span>
        </div>

        {/* Spacer for mobile */}
        <div className="flex-1 lg:hidden"></div>

        {/* Right side nav */}
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="hidden sm:block relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-slate-400" />
            </div>
            <Input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 py-2 bg-slate-100 border-0 focus:bg-white w-64"
            />
          </div>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="sm"
            className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100"
          >
            <Bell className="w-5 h-5" />
            {hasNotifications && (
              <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full" />
            )}
          </Button>

          {/* User Profile */}
          {!isDemoMode && <UserProfile />}
        </div>
      </div>
    </header>
  )
}
