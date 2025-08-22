import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { User, Settings, LogOut, Shield } from 'lucide-react'
import { Link } from 'wouter'

export function UserProfile() {
  const { user, userRole, signOut } = useAuth()
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    } finally {
      setIsSigningOut(false)
    }
  }

  const getUserInitials = (email: string) => {
    return email.charAt(0).toUpperCase()
  }

  const getRoleColor = (role: string | null) => {
    switch (role) {
      case 'hiring_manager':
        return 'bg-blue-100 text-blue-800'
      case 'recruiter':
        return 'bg-green-100 text-green-800'
      case 'admin':
        return 'bg-purple-100 text-purple-800'
      case 'interviewer':
        return 'bg-orange-100 text-orange-800'
      case 'demo_viewer':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-slate-100 text-slate-800'
    }
  }

  const getRoleLabel = (role: string | null) => {
    switch (role) {
      case 'hiring_manager':
        return 'Hiring Manager'
      case 'recruiter':
        return 'Recruiter'
      case 'admin':
        return 'Admin'
      case 'interviewer':
        return 'Interviewer'
      case 'demo_viewer':
        return 'Demo Viewer'
      default:
        return 'User'
    }
  }

  if (!user) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-auto p-2 hover:bg-slate-100">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-blue-600 text-white text-sm">
                {getUserInitials(user.email || '')}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:block text-left">
              <div className="text-sm font-medium text-slate-900 truncate max-w-32">
                {user.email}
              </div>
              <div className="text-xs text-slate-500">
                <Badge variant="secondary" className={`text-xs ${getRoleColor(userRole)}`}>
                  {getRoleLabel(userRole)}
                </Badge>
              </div>
            </div>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 bg-white border border-slate-200 shadow-lg">
        <DropdownMenuLabel className="px-4 py-3 bg-slate-50">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none text-slate-900">{user.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <Shield className="w-3 h-3 text-slate-500" />
              <Badge variant="secondary" className={`text-xs ${getRoleColor(userRole)}`}>
                {getRoleLabel(userRole)}
              </Badge>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-slate-200" />
        <Link href="/profile-settings">
          <DropdownMenuItem className="px-4 py-3 hover:bg-slate-50 cursor-pointer">
            <User className="w-4 h-4 mr-3 text-slate-600" />
            <span className="text-slate-900 font-medium">Profile Settings</span>
          </DropdownMenuItem>
        </Link>
        <Link href="/account-settings">
          <DropdownMenuItem className="px-4 py-3 hover:bg-slate-50 cursor-pointer">
            <Settings className="w-4 h-4 mr-3 text-slate-600" />
            <span className="text-slate-900 font-medium">Account Settings</span>
          </DropdownMenuItem>
        </Link>
        <DropdownMenuSeparator className="bg-slate-200" />
        <DropdownMenuItem 
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="px-4 py-3 text-red-600 hover:bg-red-50 hover:text-red-700 cursor-pointer"
        >
          <LogOut className="w-4 h-4 mr-3" />
          <span className="font-medium">{isSigningOut ? 'Signing out...' : 'Sign out'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}