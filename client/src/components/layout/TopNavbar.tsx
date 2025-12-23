import { useState } from 'react'
import { useLocation } from 'wouter'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { UserProfile } from '@/features/auth/components/UserProfile'
import { OrganizationSwitcher } from '@/features/organization/components/OrganizationSwitcher'
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
    <header className="bg-white border-b border-neutral-200">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="sm"
          className="lg:hidden p-2 text-neutral-600 hover:text-neutral-900 hover:bg-tp-card-surface"
          onClick={onMobileMenuToggle}
        >
          <Menu className="w-6 h-6" />
        </Button>

        {/* Page Title and Organization */}
        <div className="hidden lg:flex items-center space-x-4">
          <h1 className="text-xl font-semibold text-neutral-900 font-[Inter,sans-serif]">{pageTitle}</h1>
          {!isDemoMode && (
            <div className="flex items-center">
              <span className="text-neutral-600 mx-2">|</span>
              <OrganizationSwitcher />
            </div>
          )}
        </div>

        {/* Mobile Organization Switcher */}
        <div className="flex-1 lg:hidden flex items-center justify-center">
          {!isDemoMode && (
            <div className="flex items-center justify-center">
              <OrganizationSwitcher />
            </div>
          )}
        </div>

        {/* Right side nav */}
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="hidden sm:block relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-neutral-500" />
            </div>
            <Input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 py-2 bg-neutral-100 border-0 focus:bg-white w-64"
            />
          </div>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="sm"
            className="relative p-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100"
          >
            <Bell className="w-5 h-5" />
            {hasNotifications && (
              <span className="absolute top-1 right-1 w-3 h-3 bg-error rounded-full" />
            )}
          </Button>

          {/* User Profile */}
          {!isDemoMode && <UserProfile />}
        </div>
      </div>
    </header>
  )
}
