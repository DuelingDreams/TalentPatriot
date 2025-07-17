import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useUserOrganizations, useCurrentOrganization } from '@/hooks/useOrganizations'
import { Button } from '@/components/ui/button'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Building2, ChevronDown, Users } from 'lucide-react'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function OrganizationSwitcher() {
  const { currentOrgId, setCurrentOrgId, userRole } = useAuth()
  const { data: userOrgs, isLoading: orgsLoading } = useUserOrganizations()
  const { data: currentOrg, isLoading: currentOrgLoading } = useCurrentOrganization()
  const [switching, setSwitching] = useState(false)

  // Don't show for demo users
  if (userRole === 'demo_viewer') {
    return null
  }

  if (orgsLoading || currentOrgLoading || !userOrgs || !currentOrg) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600">
        <Building2 className="w-4 h-4" />
        <span>Loading...</span>
      </div>
    )
  }

  const handleOrgSwitch = async (orgId: string) => {
    if (orgId === currentOrgId) return
    
    setSwitching(true)
    try {
      await setCurrentOrgId(orgId)
      // Page will automatically refresh with new org context
      window.location.reload()
    } catch (error) {
      console.error('Failed to switch organization:', error)
    } finally {
      setSwitching(false)
    }
  }

  // If user belongs to only one organization, just show the org name
  if (userOrgs.length === 1) {
    return (
      <div className="flex items-center gap-2 px-2 py-1 bg-slate-100 rounded-lg">
        <Building2 className="w-3 h-3 text-slate-600" />
        <span className="text-xs font-medium text-slate-900 max-w-24 truncate lg:max-w-32 lg:text-sm">
          {currentOrg.name}
        </span>
        {userOrgs[0].role === 'owner' && (
          <Badge variant="secondary" className="text-xs">
            Owner
          </Badge>
        )}
      </div>
    )
  }

  // If user belongs to multiple organizations, show switcher
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="flex items-center gap-1 px-2 py-1 h-auto lg:gap-2 lg:px-3 lg:py-2"
          disabled={switching}
        >
          <Building2 className="w-3 h-3 lg:w-4 lg:h-4" />
          <span className="text-xs font-medium max-w-20 truncate lg:max-w-32 lg:text-sm">
            {currentOrg.name}
          </span>
          <ChevronDown className="w-3 h-3 text-slate-500" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Users className="w-4 h-4" />
          Switch Organization
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {userOrgs.map((userOrg) => (
          <DropdownMenuItem
            key={userOrg.orgId}
            onSelect={() => handleOrgSwitch(userOrg.orgId)}
            className="flex items-center justify-between p-3 cursor-pointer"
          >
            <div className="flex flex-col">
              <span className="font-medium">{userOrg.organization?.name}</span>
              <span className="text-xs text-slate-500 capitalize">
                {userOrg.role} • Joined {new Date(userOrg.joinedAt).toLocaleDateString()}
              </span>
            </div>
            {userOrg.orgId === currentOrgId && (
              <Badge variant="default" className="text-xs">
                Current
              </Badge>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}