import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Menu, 
  Search, 
  Bell, 
  ChevronDown, 
  User, 
  Settings, 
  CreditCard, 
  LogOut 
} from 'lucide-react'

interface TopNavbarProps {
  onMobileMenuToggle: () => void
  pageTitle?: string
}

export function TopNavbar({ onMobileMenuToggle, pageTitle = "Dashboard" }: TopNavbarProps) {
  const [hasNotifications] = useState(true)

  const handleSignOut = () => {
    // TODO: Implement Supabase auth.signOut()
    console.log('Sign out clicked')
  }

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

        {/* Page Title */}
        <div className="flex-1 lg:flex-none">
          <h1 className="text-xl font-semibold text-slate-900 lg:ml-0">{pageTitle}</h1>
        </div>

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

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-3 p-2 hover:bg-slate-100">
                <Avatar className="w-8 h-8">
                  <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=64&h=64" />
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <span className="hidden sm:block text-sm font-medium text-slate-700">John Doe</span>
                <ChevronDown className="w-4 h-4 text-slate-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem>
                <User className="w-4 h-4 mr-3" />
                Your Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="w-4 h-4 mr-3" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CreditCard className="w-4 h-4 mr-3" />
                Billing
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-3" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
