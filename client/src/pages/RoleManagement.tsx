import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { 
  Users, 
  UserPlus, 
  Shield, 
  Search, 
  Edit,
  Loader2,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

interface User {
  id: string
  email: string
  created_at: string
  last_sign_in_at: string | null
  raw_user_meta_data: {
    role?: string
    name?: string
  }
}

const AVAILABLE_ROLES = [
  { value: 'admin', label: 'Admin', description: 'Full system access and user management' },
  { value: 'recruiter', label: 'Recruiter', description: 'Manage jobs, candidates, and pipeline' },
  { value: 'bd', label: 'Business Development', description: 'Client management and business relationships' },
  { value: 'pm', label: 'Project Manager', description: 'Project oversight and coordination' },
  { value: 'demo_viewer', label: 'Demo Viewer', description: 'Read-only access to demo data' }
]

function getRoleBadgeVariant(role: string) {
  switch (role) {
    case 'admin':
      return 'bg-red-100 text-red-800 border-red-200'
    case 'recruiter':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'bd':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'pm':
      return 'bg-purple-100 text-purple-800 border-purple-200'
    case 'demo_viewer':
      return 'bg-gray-100 text-gray-800 border-gray-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

export default function RoleManagement() {
  const { userRole } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState<string>('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Only admins can access this page
  if (userRole !== 'admin') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Alert className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You don't have permission to access role management. Only administrators can manage user roles.
            </AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    )
  }

  // Fetch all users
  const { data: users, isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase.auth.admin.listUsers()
      
      if (error) {
        throw new Error('Failed to fetch users: ' + error.message)
      }

      return data.users as User[]
    }
  })

  // Update user role mutation
  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string, role: string }) => {
      const { data, error } = await supabase.auth.admin.updateUserById(userId, {
        user_metadata: { role }
      })

      if (error) {
        throw new Error('Failed to update user role: ' + error.message)
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      toast({
        title: 'Role Updated',
        description: 'User role has been successfully updated.',
      })
      setIsDialogOpen(false)
      setSelectedUserId(null)
      setSelectedRole('')
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    }
  })

  const handleRoleUpdate = () => {
    if (!selectedUserId || !selectedRole) return
    
    updateUserRoleMutation.mutate({
      userId: selectedUserId,
      role: selectedRole
    })
  }

  const openRoleDialog = (user: User) => {
    setSelectedUserId(user.id)
    setSelectedRole(user.raw_user_meta_data?.role || '')
    setIsDialogOpen(true)
  }

  const filteredUsers = users?.filter(user =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.raw_user_meta_data?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.raw_user_meta_data?.role?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Role Management</h1>
            <p className="text-muted-foreground">
              Manage user roles and permissions across the system
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Shield className="w-3 h-3" />
              Admin Access
            </Badge>
          </div>
        </div>

        {/* Search and Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{users?.length || 0}</p>
                </div>
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Admins</p>
                  <p className="text-2xl font-bold">
                    {users?.filter(u => u.raw_user_meta_data?.role === 'admin').length || 0}
                  </p>
                </div>
                <Shield className="h-4 w-4 text-red-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Recruiters</p>
                  <p className="text-2xl font-bold">
                    {users?.filter(u => u.raw_user_meta_data?.role === 'recruiter').length || 0}
                  </p>
                </div>
                <UserPlus className="h-4 w-4 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Demo Users</p>
                  <p className="text-2xl font-bold">
                    {users?.filter(u => u.raw_user_meta_data?.role === 'demo_viewer').length || 0}
                  </p>
                </div>
                <Users className="h-4 w-4 text-gray-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users by email, name, or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {usersLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2 text-slate-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              Loading users...
            </div>
          </div>
        )}

        {/* Error State */}
        {usersError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load users: {usersError.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Users List */}
        {filteredUsers.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Users ({filteredUsers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {user.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-medium">{user.email}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
                            {user.last_sign_in_at && (
                              <>
                                <span>•</span>
                                <span>Last active {new Date(user.last_sign_in_at).toLocaleDateString()}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={getRoleBadgeVariant(user.raw_user_meta_data?.role || 'none')}>
                        {user.raw_user_meta_data?.role || 'No Role'}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openRoleDialog(user)}
                        className="flex items-center gap-1"
                      >
                        <Edit className="w-3 h-3" />
                        Edit Role
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : users && !usersLoading ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">No users found</h3>
                <p className="text-muted-foreground">
                  {searchQuery ? 'Try adjusting your search criteria.' : 'No users are registered yet.'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Role Assignment Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update User Role</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>User Email</Label>
                <Input
                  value={users?.find(u => u.id === selectedUserId)?.email || ''}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div>
                <Label>Role</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_ROLES.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        <div>
                          <div className="font-medium">{role.label}</div>
                          <div className="text-sm text-muted-foreground">{role.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleRoleUpdate}
                  disabled={updateUserRoleMutation.isPending || !selectedRole}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {updateUserRoleMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Update Role
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}