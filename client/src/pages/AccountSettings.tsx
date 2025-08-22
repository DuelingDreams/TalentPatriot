import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'
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
  EyeOff
} from 'lucide-react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'

export default function AccountSettings() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  
  // Settings state
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [browserNotifications, setBrowserNotifications] = useState(true)
  const [weeklyReports, setWeeklyReports] = useState(false)
  const [teamInvites, setTeamInvites] = useState(true)
  const [publicProfile, setPublicProfile] = useState(false)

  const handleSaveNotifications = async () => {
    setIsLoading(true)
    try {
      // TODO: Implement notification settings API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: "Settings saved",
        description: "Your notification preferences have been updated.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
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
                  disabled={isLoading}
                  className="bg-[#1F3A5F] hover:bg-[#264C99]"
                >
                  {isLoading ? 'Saving...' : 'Save Preferences'}
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