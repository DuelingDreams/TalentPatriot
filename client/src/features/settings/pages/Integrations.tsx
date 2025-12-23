import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { SiGooglemeet } from 'react-icons/si'
import { CheckCircle2, XCircle, Loader2, ExternalLink, Settings, Mail, Calendar } from 'lucide-react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { apiRequest, queryClient } from '@/lib/queryClient'
import { useToast } from '@/shared/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'

interface ConnectionStatus {
  connected: boolean;
  email?: string;
  scopes?: string[];
  error?: string;
  needsReconnect?: boolean;
  healthStatus?: 'healthy' | 'needs_reconnect' | 'error' | 'unknown';
}

export default function Integrations() {
  const { user, currentOrgId } = useAuth()
  const { toast } = useToast()
  const [isConnecting, setIsConnecting] = useState(false)

  // Check Google Calendar connection status
  // CRITICAL: Include currentOrgId in queryKey to prevent cross-org cache pollution
  const { data: googleStatus, isLoading: isCheckingGoogle, refetch: refetchGoogle } = useQuery<ConnectionStatus>({
    queryKey: ['/api/google/connection-status', currentOrgId],
    queryFn: async () => {
      const response = await apiRequest('/api/google/connection-status')
      return response as ConnectionStatus
    },
    enabled: !!currentOrgId,
  })

  // Disconnect mutation
  const disconnectMutation = useMutation({
    mutationFn: async (provider: string) => {
      // Note: userId and orgId are extracted from authenticated session by middleware
      return await apiRequest(`/auth/${provider}/disconnect`, {
        method: 'DELETE',
      })
    },
    onSuccess: () => {
      toast({
        title: "Integration disconnected",
        description: "Your account has been successfully disconnected",
      })
      // Refetch connection status - invalidate cache with correct key including orgId
      queryClient.invalidateQueries({ queryKey: ['/api/google/connection-status', currentOrgId] })
      refetchGoogle()
    },
    onError: (error: any) => {
      toast({
        title: "Failed to disconnect",
        description: error.message || "Please try again",
        variant: "destructive",
      })
    },
  })

  const handleConnect = async (provider: string) => {
    if (!user) {
      toast({
        title: 'Not authenticated',
        description: 'Please log in again to connect your Google account.',
        variant: 'destructive',
      })
      return
    }

    setIsConnecting(true)
    try {
      const response = await apiRequest<{ redirectUrl: string }>(`/auth/${provider}/init`, {
        method: 'POST',
        body: JSON.stringify({ returnTo: '/settings/integrations' }),
      })

      if (response.redirectUrl) {
        window.location.href = response.redirectUrl
      } else {
        throw new Error('No redirect URL received')
      }
    } catch (error: any) {
      console.error('Failed to initiate OAuth:', error)
      setIsConnecting(false)
      toast({
        title: 'Connection failed',
        description: error.message || 'Failed to start Google connection. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const handleDisconnect = (provider: string) => {
    disconnectMutation.mutate(provider)
  }

  // Check for OAuth callback status in URL
  const urlParams = new URLSearchParams(window.location.search)
  const googleConnected = urlParams.get('google') === 'connected'
  const error = urlParams.get('error')

  // User-friendly error messages for common OAuth failures
  const getErrorMessage = (errorCode: string): { title: string; description: string } => {
    const errorMap: Record<string, { title: string; description: string }> = {
      'access_denied': {
        title: 'Permission Denied',
        description: 'You declined to grant access. Please try again and click "Allow" to connect your Google account.',
      },
      'oauth_access_denied': {
        title: 'Permission Denied',
        description: 'You declined to grant access. Please try again and click "Allow" to connect your Google account.',
      },
      'invalid_state': {
        title: 'Session Expired',
        description: 'Your connection session has expired. Please try connecting again.',
      },
      'session_expired': {
        title: 'Session Expired',
        description: 'Your session has expired. Please try connecting again.',
      },
      'invalid_grant': {
        title: 'Token Expired',
        description: 'Your Google authorization has expired. Please reconnect your account.',
      },
      'oauth_invalid_grant': {
        title: 'Token Expired',
        description: 'Your Google authorization has expired. Please reconnect your account.',
      },
      'missing_params': {
        title: 'Connection Error',
        description: 'Something went wrong during the connection. Please try again.',
      },
      'oauth_init_failed': {
        title: 'Connection Failed',
        description: 'Failed to start the Google connection. Please try again.',
      },
      'token_exchange_failed': {
        title: 'Connection Failed',
        description: 'Failed to complete the Google connection. Please try again.',
      },
    }
    
    return errorMap[errorCode] || {
      title: 'Connection Failed',
      description: `An error occurred: ${errorCode.replace(/_/g, ' ')}. Please try again.`,
    }
  }

  // Handle OAuth callback - invalidate cache and refetch connection status
  useEffect(() => {
    if (googleConnected) {
      // Reset connecting state after successful OAuth return
      setIsConnecting(false)
      
      // Invalidate the cache with the correct key (including orgId) and refetch to show updated connection status
      queryClient.invalidateQueries({ queryKey: ['/api/google/connection-status', currentOrgId] })
      refetchGoogle()
      
      toast({
        title: 'Google Connected',
        description: 'Your Google account has been successfully connected!',
      })
      
      // Clean up URL after 3 seconds to remove the success message
      setTimeout(() => {
        const url = new URL(window.location.href)
        url.searchParams.delete('google')
        window.history.replaceState({}, '', url.toString())
      }, 3000)
    }
  }, [googleConnected, refetchGoogle, currentOrgId, toast])

  // Show toast for OAuth errors and clean up URL
  useEffect(() => {
    if (error) {
      // Reset connecting state after OAuth error return
      setIsConnecting(false)
      
      const errorInfo = getErrorMessage(error)
      toast({
        title: errorInfo.title,
        description: errorInfo.description,
        variant: 'destructive',
      })
      
      // Clean up URL after showing the error
      setTimeout(() => {
        const url = new URL(window.location.href)
        url.searchParams.delete('error')
        window.history.replaceState({}, '', url.toString())
      }, 5000)
    }
  }, [error, toast])

  return (
    <DashboardLayout pageTitle="Integrations">
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Integrations</h1>
          <p className="text-muted-foreground">
            Connect your favorite tools and services to TalentPatriot
          </p>
        </div>

        {/* Success/Error Alerts */}
        {googleConnected && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Google Calendar has been successfully connected!
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              <span className="font-medium">{getErrorMessage(error).title}:</span>{' '}
              {getErrorMessage(error).description}
            </AlertDescription>
          </Alert>
        )}

        {/* Needs Reconnection Warning */}
        {googleStatus?.needsReconnect && (
          <Alert className="bg-amber-50 border-amber-200">
            <XCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              Your Google connection has expired. Please reconnect to continue using Gmail and Calendar features.
            </AlertDescription>
          </Alert>
        )}

        {/* Google Workspace Integration */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center">
                  <SiGooglemeet className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Google Workspace
                    {googleStatus?.connected && !googleStatus?.needsReconnect && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Connected
                      </Badge>
                    )}
                    {googleStatus?.needsReconnect && (
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                        <XCircle className="h-3 w-3 mr-1" />
                        Needs Reconnection
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Gmail, Google Calendar, and Google Meet integration
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Google Calendar & Meet</p>
                  <p className="text-sm text-muted-foreground">
                    Create calendar events with Google Meet links directly from TalentPatriot
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Gmail Integration</p>
                  <p className="text-sm text-muted-foreground">
                    Send and receive emails through your Gmail account (Coming Soon)
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Settings className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Smart Scheduling</p>
                  <p className="text-sm text-muted-foreground">
                    Check availability and propose meeting times based on your calendar
                  </p>
                </div>
              </div>
            </div>

            {googleStatus?.connected && googleStatus.email && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Connected as</p>
                <p className="font-medium">{googleStatus.email}</p>
                {googleStatus.scopes && googleStatus.scopes.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {googleStatus.scopes.map((scope) => (
                      <Badge key={scope} variant="secondary" className="text-xs">
                        {scope}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              {isCheckingGoogle ? (
                <Button disabled>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Checking connection...
                </Button>
              ) : googleStatus?.needsReconnect ? (
                <>
                  <Button
                    onClick={() => handleConnect('google')}
                    disabled={isConnecting}
                    className="bg-amber-600 hover:bg-amber-700"
                    data-testid="button-reconnect-google"
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Reconnecting...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Reconnect Google Account
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleDisconnect('google')}
                    disabled={disconnectMutation.isPending}
                    data-testid="button-disconnect-google"
                  >
                    {disconnectMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Remove'
                    )}
                  </Button>
                </>
              ) : googleStatus?.connected ? (
                <Button
                  variant="destructive"
                  onClick={() => handleDisconnect('google')}
                  disabled={disconnectMutation.isPending}
                  data-testid="button-disconnect-google"
                >
                  {disconnectMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Disconnecting...
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 mr-2" />
                      Disconnect
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={() => handleConnect('google')}
                  disabled={isConnecting}
                  data-testid="button-connect-google"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Connect Google Account
                    </>
                  )}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('https://support.google.com/accounts/answer/3466521', '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Learn More
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Coming Soon Integrations */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Coming Soon</h2>
          
          <Card className="opacity-60">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
                    <Mail className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      Microsoft 365
                      <Badge variant="secondary">Coming Soon</Badge>
                    </CardTitle>
                    <CardDescription>
                      Outlook, Teams, and OneDrive integration
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="opacity-60">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Settings className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      Slack
                      <Badge variant="secondary">Coming Soon</Badge>
                    </CardTitle>
                    <CardDescription>
                      Send notifications and updates to Slack channels
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Help Section */}
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-lg">Need Help?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Having trouble connecting your accounts? Check out our integration guides or contact support.
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => window.open('/docs', '_blank')}>
                <ExternalLink className="h-4 w-4 mr-2" />
                View Documentation
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.open('/help', '_blank')}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Contact Support
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
