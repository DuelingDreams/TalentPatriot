import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { useToast } from '@/shared/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/queryClient'
import { 
  Settings, 
  Shield, 
  Bell, 
  Mail,
  Users,
  Lock,
  Key,
  Trash2,
  UserPlus,
  Crown,
  AlertTriangle,
  Globe,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Loader2,
  Calendar,
  Video
} from 'lucide-react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'

interface GoogleConnectionStatus {
  connected: boolean
  email?: string
  scopes?: string[]
  connectedAt?: string
  needsReconnect?: boolean
  message?: string
}

export default function AccountSettings() {
  const { user, session, currentOrgId } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [showApiKey, setShowApiKey] = useState(false)
  
  // Fetch Google connection status for the current user
  const { data: googleStatus, isLoading: googleLoading } = useQuery<GoogleConnectionStatus>({
    queryKey: ['/api/google/connection-status', currentOrgId],
    queryFn: () => apiRequest('/api/google/connection-status', {
      headers: {
        'Authorization': `Bearer ${session?.access_token || ''}`
      }
    }),
    enabled: !!user && !!session?.access_token && !!currentOrgId,
  })

  // Connect Google account
  const handleConnectGoogle = async () => {
    try {
      if (!session?.access_token) {
        toast({
          title: 'Authentication required',
          description: 'Please log in again to connect your Google account.',
          variant: 'destructive',
        })
        return
      }

      const response = await apiRequest<{ redirectUrl: string }>('/auth/google/init', { 
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ returnTo: '/account-settings' })
      })
      
      if (response?.redirectUrl) {
        window.location.href = response.redirectUrl
      }
    } catch (error: any) {
      toast({
        title: 'Failed to connect Google account',
        description: error.message || 'Please try again later.',
        variant: 'destructive',
      })
    }
  }

  // Disconnect Google account
  const disconnectMutation = useMutation({
    mutationFn: () => apiRequest('/auth/google/disconnect', { 
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${session?.access_token || ''}`
      }
    }),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['/api/google/connection-status', currentOrgId] })
      const previousStatus = queryClient.getQueryData(['/api/google/connection-status', currentOrgId])
      queryClient.setQueryData(['/api/google/connection-status', currentOrgId], {
        connected: false,
        email: undefined,
        scopes: undefined,
      })
      return { previousStatus }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/google/connection-status'] })
      toast({
        title: 'Google account disconnected',
        description: 'Your Google account has been disconnected.',
      })
    },
    onError: (error: any, variables, context) => {
      if (context?.previousStatus) {
        queryClient.setQueryData(['/api/google/connection-status', currentOrgId], context.previousStatus)
      }
      toast({
        title: 'Failed to disconnect',
        description: error.message || 'Please try again later.',
        variant: 'destructive',
      })
    },
  })

  // Fetch settings data
  const { data: settingsData, isLoading: settingsLoading } = useQuery({
    queryKey: ['/api/user/settings'],
    queryFn: async () => {
      const response = await fetch('/api/user/settings', {
        headers: {
          'Authorization': `Bearer ${session?.access_token || ''}`
        }
      })
      if (!response.ok) throw new Error('Failed to fetch settings')
      return response.json()
    },
    enabled: !!user && !!session?.access_token,
  })

  // Settings state - initialize with data from API
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [browserNotifications, setBrowserNotifications] = useState(true)
  const [weeklyReports, setWeeklyReports] = useState(false)
  const [teamInvites, setTeamInvites] = useState(true)
  const [publicProfile, setPublicProfile] = useState(false)

  // Update settings state when data loads
  useEffect(() => {
    if (settingsData && typeof settingsData === 'object') {
      setEmailNotifications((settingsData as any).emailNotifications ?? true)
      setBrowserNotifications((settingsData as any).browserNotifications ?? true)
      setWeeklyReports((settingsData as any).weeklyReports ?? false)
      setTeamInvites((settingsData as any).teamInvites ?? true)
      setPublicProfile((settingsData as any).publicProfile ?? false)
    }
  }, [settingsData])

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (settings: any) => {
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`
        },
        body: JSON.stringify(settings)
      })
      if (!response.ok) throw new Error('Failed to update settings')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/settings'] })
      toast({
        title: "Settings saved",
        description: "Your notification preferences have been updated.",
      })
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      })
    }
  })

  const handleSaveNotifications = async () => {
    const settingsData = {
      emailNotifications,
      browserNotifications,
      weeklyReports,
      teamInvites,
      publicProfile,
    }
    updateSettingsMutation.mutate(settingsData)
  }

  const handleGenerateApiKey = async () => {
    try {
      // TODO: Implement API key generation
      toast({
        title: "API Key Generated",
        description: "Your new API key has been generated successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate API key. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteAccount = async () => {
    try {
      // TODO: Implement account deletion
      toast({
        title: "Account deletion initiated",
        description: "Your account deletion request has been submitted.",
        variant: "destructive",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete account. Please contact support.",
        variant: "destructive",
      })
    }
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-[#F7F9FC] p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-[#E6F2FF] rounded-2xl flex items-center justify-center">
            <Settings className="w-6 h-6 text-[#1F3A5F]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#1A1A1A]">Account Settings</h1>
            <p className="text-[#5C667B] mt-1">Manage your account preferences and security settings</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#264C99]" />
                Account Information
              </CardTitle>
              <CardDescription>Your account details and membership status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-[#5C667B]">Email Address</Label>
                  <p className="text-sm font-semibold">{user.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-[#5C667B]">Account Status</Label>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <Shield className="w-3 h-3 mr-1" />
                    Active
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-[#5C667B]">Member Since</Label>
                  <p className="text-sm">{new Date().getFullYear()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-[#5C667B]">Plan</Label>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    <Crown className="w-3 h-3 mr-1" />
                    Professional
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Connected Email - Google Integration */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#E6F2FF] rounded-lg flex items-center justify-center">
                    <Mail className="w-5 h-5 text-[#264C99]" />
                  </div>
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      Connected Email
                    </CardTitle>
                    <CardDescription>
                      Connect your Google account to send emails and schedule interviews
                    </CardDescription>
                  </div>
                </div>
                {googleStatus?.connected ? (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Connected
                  </Badge>
                ) : googleStatus?.needsReconnect ? (
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Expired
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                    <XCircle className="w-3 h-3 mr-1" />
                    Not Connected
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {googleLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-6 h-6 animate-spin text-[#264C99]" />
                </div>
              ) : googleStatus?.needsReconnect ? (
                <div className="space-y-4">
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-amber-900">
                          Your Google connection has expired
                        </p>
                        <p className="text-sm text-amber-700 mt-1">
                          Please reconnect your Google account to continue sending emails and scheduling interviews.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleConnectGoogle}
                    className="w-full bg-[#1F3A5F] hover:bg-[#264C99]"
                    data-testid="button-reconnect-google"
                  >
                    <Globe className="w-4 h-4 mr-2" />
                    Reconnect Google Account
                  </Button>

                  <p className="text-xs text-gray-500 text-center">
                    You'll be redirected to Google to reauthorize access.
                  </p>
                </div>
              ) : googleStatus?.connected ? (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-green-900">
                          Connected as {googleStatus.email}
                        </p>
                        <p className="text-sm text-green-700 mt-1">
                          You can send emails and schedule interviews from TalentPatriot
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Mail className="w-4 h-4 text-[#264C99]" />
                        <span className="font-medium text-sm">Gmail</span>
                      </div>
                      <p className="text-xs text-gray-600">Send emails from Messages</p>
                    </div>
                    <div className="p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-4 h-4 text-[#264C99]" />
                        <span className="font-medium text-sm">Calendar</span>
                      </div>
                      <p className="text-xs text-gray-600">Schedule interviews</p>
                    </div>
                    <div className="p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Video className="w-4 h-4 text-[#264C99]" />
                        <span className="font-medium text-sm">Google Meet</span>
                      </div>
                      <p className="text-xs text-gray-600">Auto-create video links</p>
                    </div>
                  </div>

                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Disconnect Google Account</p>
                      <p className="text-xs text-gray-500 mt-1">
                        You will no longer be able to send emails from TalentPatriot
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => disconnectMutation.mutate()}
                      disabled={disconnectMutation.isPending}
                      data-testid="button-disconnect-google"
                    >
                      {disconnectMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Disconnecting...
                        </>
                      ) : (
                        'Disconnect'
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-blue-900">
                          Connect your Google account to unlock email features
                        </p>
                        <ul className="text-sm text-blue-700 mt-2 space-y-1">
                          <li>• Send emails to candidates directly from TalentPatriot</li>
                          <li>• Schedule interviews with Google Calendar integration</li>
                          <li>• Auto-create Google Meet links for video interviews</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleConnectGoogle}
                    className="w-full bg-[#1F3A5F] hover:bg-[#264C99]"
                    data-testid="button-connect-google"
                  >
                    <Globe className="w-4 h-4 mr-2" />
                    Connect Google Account
                  </Button>

                  <p className="text-xs text-gray-500 text-center">
                    You'll be redirected to Google to authorize access. We only request permissions for Gmail and Calendar.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Team Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#264C99]" />
                Team Management
              </CardTitle>
              <CardDescription>Invite and manage team members in your organization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-[#F7F9FC] rounded-lg">
                <div className="flex items-center gap-3">
                  <UserPlus className="w-5 h-5 text-[#264C99]" />
                  <div>
                    <p className="font-medium">Invite Team Members</p>
                    <p className="text-sm text-[#5C667B]">Add new users to your organization</p>
                  </div>
                </div>
                <Button className="bg-[#1F3A5F] hover:bg-[#264C99]">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Invite Members
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-white rounded-lg border">
                  <p className="text-2xl font-bold text-[#1F3A5F]">5</p>
                  <p className="text-sm text-[#5C667B]">Active Users</p>
                </div>
                <div className="p-4 bg-white rounded-lg border">
                  <p className="text-2xl font-bold text-[#1F3A5F]">2</p>
                  <p className="text-sm text-[#5C667B]">Pending Invites</p>
                </div>
                <div className="p-4 bg-white rounded-lg border">
                  <p className="text-2xl font-bold text-[#1F3A5F]">10</p>
                  <p className="text-sm text-[#5C667B]">Available Seats</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-[#264C99]" />
                Notification Preferences
              </CardTitle>
              <CardDescription>Choose how you want to be notified about important events</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Email Notifications</Label>
                    <p className="text-sm text-[#5C667B]">Receive notifications via email</p>
                  </div>
                  <Switch 
                    checked={emailNotifications} 
                    onCheckedChange={setEmailNotifications}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Browser Notifications</Label>
                    <p className="text-sm text-[#5C667B]">Show desktop notifications</p>
                  </div>
                  <Switch 
                    checked={browserNotifications} 
                    onCheckedChange={setBrowserNotifications}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Weekly Reports</Label>
                    <p className="text-sm text-[#5C667B]">Receive weekly activity summaries</p>
                  </div>
                  <Switch 
                    checked={weeklyReports} 
                    onCheckedChange={setWeeklyReports}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Team Invitations</Label>
                    <p className="text-sm text-[#5C667B]">Notify when invited to new teams</p>
                  </div>
                  <Switch 
                    checked={teamInvites} 
                    onCheckedChange={setTeamInvites}
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button 
                  onClick={handleSaveNotifications} 
                  disabled={updateSettingsMutation.isPending || settingsLoading}
                  className="bg-[#1F3A5F] hover:bg-[#264C99]"
                >
                  {updateSettingsMutation.isPending ? 'Saving...' : 'Save Preferences'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Privacy Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-[#264C99]" />
                Privacy Settings
              </CardTitle>
              <CardDescription>Control your privacy and data sharing preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Public Profile</Label>
                  <p className="text-sm text-[#5C667B]">Make your profile visible to other users</p>
                </div>
                <Switch 
                  checked={publicProfile} 
                  onCheckedChange={setPublicProfile}
                />
              </div>
            </CardContent>
          </Card>

          {/* API Access */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5 text-[#264C99]" />
                API Access
              </CardTitle>
              <CardDescription>Manage API keys for integrations and automation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-[#F7F9FC] rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Label className="text-base font-medium">API Key</Label>
                  <Badge variant="outline" className="text-xs">Active</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Input 
                    type={showApiKey ? "text" : "password"}
                    value="sk-1234567890abcdef1234567890abcdef"
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleGenerateApiKey}
                  >
                    <Key className="w-4 h-4 mr-1" />
                    Regenerate
                  </Button>
                </div>
                <p className="text-xs text-[#5C667B] mt-2">
                  Keep your API key secure. It provides full access to your account data.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-[#264C99]" />
                Security
              </CardTitle>
              <CardDescription>Manage your account security settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="justify-start">
                  <Lock className="w-4 h-4 mr-2" />
                  Change Password
                </Button>
                <Button variant="outline" className="justify-start">
                  <Shield className="w-4 h-4 mr-2" />
                  Two-Factor Auth
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>Irreversible account actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-red-50 rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-red-800">Delete Account</h4>
                    <p className="text-sm text-red-600 mt-1">
                      Permanently delete your account and all associated data. This action cannot be undone.
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Account
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete your account
                          and remove your data from our servers.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={handleDeleteAccount}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Yes, delete my account
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}