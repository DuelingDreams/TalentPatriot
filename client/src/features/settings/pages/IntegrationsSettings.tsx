import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { apiRequest } from '@/lib/queryClient'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/shared/hooks/use-toast'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Calendar,
  Mail,
  Video,
  Globe,
  AlertCircle
} from 'lucide-react'

interface GoogleConnectionStatus {
  connected: boolean
  email?: string
  scopes?: string[]
  connectedAt?: string
}

export default function IntegrationsSettings() {
  const { user, session, currentOrgId } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch Google connection status
  // CRITICAL: Include currentOrgId in queryKey to prevent cross-org cache pollution
  const { data: googleStatus, isLoading } = useQuery<GoogleConnectionStatus>({
    queryKey: ['/api/google/connection-status', currentOrgId],
    queryFn: () => apiRequest('/api/google/connection-status', {
      headers: {
        'Authorization': `Bearer ${session?.access_token || ''}`
      }
    }),
    enabled: !!user && !!session?.access_token && !!currentOrgId,
  })

  // Connect Google mutation
  const handleConnectGoogle = async () => {
    try {
      // Ensure we have a valid session token
      if (!session?.access_token) {
        toast({
          title: 'Authentication required',
          description: 'Please log in again to connect your Google account.',
          variant: 'destructive',
        });
        return;
      }

      // Step 1: Call /init endpoint to set session cookie with Bearer token
      const response = await apiRequest<{ redirectUrl: string }>('/auth/google/init', { 
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      // Step 2: Redirect to Google OAuth flow using the returned URL
      if (response?.redirectUrl) {
        window.location.href = response.redirectUrl;
      }
    } catch (error: any) {
      toast({
        title: 'Failed to initialize Google authentication',
        description: error.message || 'Please try again later.',
        variant: 'destructive',
      });
    }
  }

  // Disconnect Google mutation
  const disconnectMutation = useMutation({
    mutationFn: () => apiRequest('/auth/google/disconnect', { 
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${session?.access_token || ''}`
      }
    }),
    onSuccess: () => {
      // Invalidate all connection status queries (for all orgs)
      queryClient.invalidateQueries({ queryKey: ['/api/google/connection-status'] })
      toast({
        title: 'Google account disconnected',
        description: 'Your Google account has been successfully disconnected.',
      })
    },
    onError: (error: any) => {
      // Parse error response for better user feedback
      const errorMessage = error.error || error.message || 'An error occurred while disconnecting your Google account.'
      const errorDetails = error.details || ''
      
      toast({
        title: 'Failed to disconnect',
        description: errorDetails ? `${errorMessage}. ${errorDetails}` : errorMessage,
        variant: 'destructive',
      })
    },
  })

  return (
    <DashboardLayout pageTitle="Integrations">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Integrations</h1>
          <p className="text-slate-600 mt-2">
            Connect external services to enhance your recruitment workflow
          </p>
        </div>

        {/* Google Workspace */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Globe className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle>Google Workspace</CardTitle>
                  <CardDescription>
                    Connect your Google account for Gmail, Calendar, and Meet integration
                  </CardDescription>
                </div>
              </div>
              {googleStatus?.connected ? (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Connected
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">
                  <XCircle className="w-3 h-3 mr-1" />
                  Not Connected
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Connection Status */}
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
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
                        Connected on {googleStatus.connectedAt ? new Date(googleStatus.connectedAt).toLocaleDateString() : 'Unknown'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div>
                  <h3 className="font-medium text-slate-900 mb-3">Available Features</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3 border border-slate-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Mail className="w-4 h-4 text-slate-600" />
                        <span className="font-medium text-sm text-slate-900">Gmail</span>
                      </div>
                      <p className="text-xs text-slate-600">Send emails directly</p>
                    </div>
                    <div className="p-3 border border-slate-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-4 h-4 text-slate-600" />
                        <span className="font-medium text-sm text-slate-900">Calendar</span>
                      </div>
                      <p className="text-xs text-slate-600">Schedule interviews</p>
                    </div>
                    <div className="p-3 border border-slate-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Video className="w-4 h-4 text-slate-600" />
                        <span className="font-medium text-sm text-slate-900">Google Meet</span>
                      </div>
                      <p className="text-xs text-slate-600">Create video calls</p>
                    </div>
                  </div>
                </div>

                {/* Disconnect */}
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-900">Disconnect Google Account</p>
                    <p className="text-xs text-slate-600 mt-1">
                      This will remove access to Gmail, Calendar, and Meet features
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
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-blue-900">
                        Connect your Google account to unlock powerful features
                      </p>
                      <ul className="text-sm text-blue-700 mt-2 space-y-1">
                        <li>• Send emails directly from TalentPatriot</li>
                        <li>• Create Google Calendar events with Meet links</li>
                        <li>• Check availability and propose interview times</li>
                        <li>• Streamline candidate communication</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleConnectGoogle}
                  className="w-full"
                  data-testid="button-connect-google"
                >
                  <Globe className="w-4 h-4 mr-2" />
                  Connect Google Account
                </Button>

                <p className="text-xs text-slate-500 text-center">
                  You'll be redirected to Google to authorize access. We only request permissions for Calendar and Gmail.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Coming Soon Integrations */}
        <Card>
          <CardHeader>
            <CardTitle>Coming Soon</CardTitle>
            <CardDescription>
              More integrations to supercharge your recruitment workflow
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg opacity-60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <p className="font-medium text-slate-700">Microsoft 365</p>
                  <p className="text-xs text-slate-500">Outlook, Teams, and OneDrive</p>
                </div>
              </div>
              <Badge variant="outline">Coming Soon</Badge>
            </div>
            <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg opacity-60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Video className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <p className="font-medium text-slate-700">Zoom</p>
                  <p className="text-xs text-slate-500">Video interviews and recordings</p>
                </div>
              </div>
              <Badge variant="outline">Coming Soon</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
