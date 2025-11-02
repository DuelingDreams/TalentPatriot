import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, AlertCircle, RefreshCw, Home, Mail, Clock, Copy, ChevronDown, ChevronUp } from 'lucide-react'
import { safeStorageOperation } from './errorHandler'

// Error types for categorization
type ErrorCategory = 'network' | 'authentication' | 'component' | 'permission' | 'api' | 'unknown'

interface ErrorDetails {
  category: ErrorCategory
  message: string
  stack?: string
  timestamp: string
  userAgent: string
  url: string
  userId?: string
  sessionId: string
  errorId: string
  componentStack?: string
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
  errorDetails?: ErrorDetails
  showDetails: boolean
  retryCount: number
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>
}

// Error storage utilities
const ERROR_STORAGE_KEY = 'app_error_history'
const MAX_ERROR_HISTORY = 50

const categorizeError = (error: Error, errorInfo?: React.ErrorInfo): ErrorCategory => {
  const message = error.message?.toLowerCase() || ''
  const stack = error.stack?.toLowerCase() || ''
  const componentStack = errorInfo?.componentStack?.toLowerCase() || ''

  // Network errors
  if (message.includes('failed to fetch') || 
      message.includes('network') || 
      message.includes('connection') ||
      message.includes('timeout')) {
    return 'network'
  }

  // Authentication errors
  if (message.includes('unauthorized') || 
      message.includes('auth') || 
      message.includes('token') ||
      message.includes('session') ||
      message.includes('permission denied')) {
    return 'authentication'
  }

  // Permission errors
  if (message.includes('forbidden') || 
      message.includes('access denied') ||
      message.includes('insufficient permissions')) {
    return 'permission'
  }

  // API errors
  if (message.includes('api') || 
      message.includes('server') ||
      message.includes('http') ||
      stack.includes('fetch')) {
    return 'api'
  }

  // Component errors (most React errors fall here)
  if (componentStack || 
      stack.includes('react') ||
      message.includes('render') ||
      message.includes('component')) {
    return 'component'
  }

  return 'unknown'
}

const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

const storeErrorInHistory = (errorDetails: ErrorDetails): void => {
  safeStorageOperation(() => {
    const existingHistory = JSON.parse(sessionStorage.getItem(ERROR_STORAGE_KEY) || '[]')
    const newHistory = [errorDetails, ...existingHistory].slice(0, MAX_ERROR_HISTORY)
    sessionStorage.setItem(ERROR_STORAGE_KEY, JSON.stringify(newHistory))
  })
}

const getErrorHistory = (): ErrorDetails[] => {
  try {
    return JSON.parse(sessionStorage.getItem(ERROR_STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

export class AppErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private sessionId: string
  private errorId: string

  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.sessionId = generateSessionId()
    this.errorId = ''
    this.state = { 
      hasError: false, 
      showDetails: false,
      retryCount: 0
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const category = categorizeError(error, errorInfo)
    const errorDetails: ErrorDetails = {
      category,
      message: error.message || 'Unknown error occurred',
      stack: error.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href || 'unknown',
      sessionId: this.sessionId,
      errorId: this.errorId,
      componentStack: errorInfo.componentStack || undefined
    }

    // Store error in history
    storeErrorInHistory(errorDetails)

    // Enhanced logging
    console.group(`🚨 App Error Boundary - ${category.toUpperCase()}`)
    console.error('Error:', error)
    console.error('Error Info:', errorInfo)
    console.error('Error Details:', errorDetails)
    console.groupEnd()

    this.setState({ 
      errorInfo, 
      errorDetails,
      showDetails: import.meta.env.DEV // Show details by default in development
    })
  }

  private handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorDetails: undefined,
      showDetails: false,
      retryCount: prevState.retryCount + 1
    }))
  }

  private handleReload = () => {
    // Clear session storage to reset any cached state
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        // Clear error history to prevent error loops
        sessionStorage.removeItem(ERROR_STORAGE_KEY);
        console.log('[ErrorBoundary] Cleared error history before reload');
      } catch (e) {
        console.warn('[ErrorBoundary] Could not clear session storage:', e);
      }
    }
    // Force hard reload to bypass any cached modules
    // Using href = href instead of reload() to ensure complete page refresh
    window.location.href = window.location.href;
  }

  private handleGoHome = () => {
    window.location.href = '/'
  }

  private toggleDetails = () => {
    this.setState(prevState => ({ showDetails: !prevState.showDetails }))
  }

  private copyErrorDetails = () => {
    const { errorDetails } = this.state
    if (!errorDetails) return

    const errorReport = `
Error Report - ${errorDetails.errorId}
Time: ${new Date(errorDetails.timestamp).toLocaleString()}
Category: ${errorDetails.category}
Message: ${errorDetails.message}
URL: ${errorDetails.url}
Session: ${errorDetails.sessionId}
User Agent: ${errorDetails.userAgent}
${import.meta.env.DEV ? `Stack: ${errorDetails.stack}` : ''}
${import.meta.env.DEV ? `Component Stack: ${errorDetails.componentStack}` : ''}
    `.trim()

    navigator.clipboard.writeText(errorReport).then(() => {
      console.log('Error details copied to clipboard')
    })
  }

  private handleReportIssue = () => {
    const { errorDetails } = this.state
    if (!errorDetails) return

    const emailBody = encodeURIComponent(`
Please describe what you were doing when this error occurred:

[Please fill in your description here]

Technical Details:
- Error ID: ${errorDetails.errorId}
- Time: ${new Date(errorDetails.timestamp).toLocaleString()}
- Category: ${errorDetails.category}
- Message: ${errorDetails.message}
- URL: ${errorDetails.url}
- Session: ${errorDetails.sessionId}
    `)

    const emailSubject = encodeURIComponent(`Bug Report: ${errorDetails.category} error - ${errorDetails.errorId}`)
    const mailtoLink = `mailto:support@talentpatriot.com?subject=${emailSubject}&body=${emailBody}`
    
    window.open(mailtoLink, '_blank')
  }

  private getErrorIcon = (category: ErrorCategory) => {
    switch (category) {
      case 'network':
      case 'api':
        return <AlertTriangle className="w-8 h-8 text-orange-500" />
      case 'authentication':
      case 'permission':
        return <AlertCircle className="w-8 h-8 text-red-500" />
      default:
        return <AlertTriangle className="w-8 h-8 text-red-500" />
    }
  }

  private getCategoryColor = (category: ErrorCategory): string => {
    switch (category) {
      case 'network': return 'bg-orange-100 text-orange-800'
      case 'authentication': return 'bg-red-100 text-red-800'
      case 'component': return 'bg-blue-100 text-blue-800'
      case 'permission': return 'bg-purple-100 text-purple-800'
      case 'api': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  private getRecoveryOptions = (category: ErrorCategory) => {
    const options = [
      { label: 'Try Again', action: this.handleRetry, primary: true },
      { label: 'Reload Page', action: this.handleReload, primary: false },
      { label: 'Go to Home', action: this.handleGoHome, primary: false }
    ]

    switch (category) {
      case 'network':
        return [
          { label: 'Check Connection & Retry', action: this.handleRetry, primary: true },
          ...options.slice(1)
        ]
      case 'authentication':
        return [
          { label: 'Reload & Re-login', action: this.handleReload, primary: true },
          ...options.slice(2)
        ]
      default:
        return options
    }
  }

  private getUserFriendlyMessage = (category: ErrorCategory): string => {
    switch (category) {
      case 'network':
        return 'Unable to connect to our servers. Please check your internet connection and try again.'
      case 'authentication':
        return 'Your session has expired. Please reload the page to log in again.'
      case 'permission':
        return 'You don\'t have permission to access this resource. Please contact your administrator.'
      case 'api':
        return 'Our servers are experiencing issues. Please try again in a few moments.'
      case 'component':
        return 'A component failed to load properly. Refreshing the page usually resolves this.'
      default:
        return 'An unexpected error occurred. Our team has been notified and we\'re working on a fix.'
    }
  }

  render() {
    if (this.state.hasError && this.props.fallback) {
      const FallbackComponent = this.props.fallback
      return <FallbackComponent error={this.state.error!} retry={this.handleRetry} />
    }

    if (this.state.hasError) {
      const { errorDetails, showDetails, retryCount } = this.state
      const isDev = import.meta.env.DEV
      const category = errorDetails?.category || 'unknown'
      const recoveryOptions = this.getRecoveryOptions(category)

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4" data-testid="error-boundary">
          <Card className="w-full max-w-2xl">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                {this.getErrorIcon(category)}
              </div>
              
              <div className="flex items-center justify-center gap-2 mb-2">
                <CardTitle className="text-xl font-semibold">
                  {isDev ? 'Development Error' : 'Something went wrong'}
                </CardTitle>
                <Badge className={this.getCategoryColor(category)} data-testid={`error-category-${category}`}>
                  {category}
                </Badge>
              </div>

              <CardDescription className="text-base">
                {isDev ? errorDetails?.message : this.getUserFriendlyMessage(category)}
              </CardDescription>

              {errorDetails && (
                <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground mt-2">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {new Date(errorDetails.timestamp).toLocaleString()}
                  </div>
                  {retryCount > 0 && (
                    <div className="text-orange-600">
                      Retry #{retryCount}
                    </div>
                  )}
                </div>
              )}
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Recovery Options */}
              <div className="flex flex-wrap gap-2 justify-center">
                {recoveryOptions.map((option, index) => (
                  <Button
                    key={index}
                    variant={option.primary ? 'default' : 'outline'}
                    onClick={option.action}
                    className="flex items-center gap-2"
                    data-testid={`button-${option.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {option.primary && <RefreshCw className="w-4 h-4" />}
                    {option.label}
                  </Button>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 justify-center pt-4 border-t">
                <Button
                  variant="ghost"
                  onClick={this.copyErrorDetails}
                  className="flex items-center gap-2"
                  data-testid="button-copy-details"
                >
                  <Copy className="w-4 h-4" />
                  Copy Details
                </Button>
                
                <Button
                  variant="ghost"
                  onClick={this.handleReportIssue}
                  className="flex items-center gap-2"
                  data-testid="button-report-issue"
                >
                  <Mail className="w-4 h-4" />
                  Report Issue
                </Button>

                <Button
                  variant="ghost"
                  onClick={this.toggleDetails}
                  className="flex items-center gap-2"
                  data-testid="button-toggle-details"
                >
                  {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  {showDetails ? 'Hide' : 'Show'} Details
                </Button>
              </div>

              {/* Technical Details (collapsible) */}
              {showDetails && errorDetails && (
                <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm" data-testid="error-details">
                  <div className="space-y-2">
                    <div><strong>Error ID:</strong> {errorDetails.errorId}</div>
                    <div><strong>Session:</strong> {errorDetails.sessionId}</div>
                    <div><strong>URL:</strong> {errorDetails.url}</div>
                    
                    {isDev && errorDetails.stack && (
                      <div>
                        <strong>Stack Trace:</strong>
                        <pre className="mt-1 text-xs bg-white dark:bg-gray-900 p-2 rounded overflow-auto max-h-40">
                          {errorDetails.stack}
                        </pre>
                      </div>
                    )}
                    
                    {isDev && errorDetails.componentStack && (
                      <div>
                        <strong>Component Stack:</strong>
                        <pre className="mt-1 text-xs bg-white dark:bg-gray-900 p-2 rounded overflow-auto max-h-40">
                          {errorDetails.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Error History in Development */}
              {isDev && (
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-medium mb-2">Recent Errors ({getErrorHistory().length})</h4>
                  <div className="text-xs space-y-1 max-h-32 overflow-auto">
                    {getErrorHistory().slice(0, 5).map((err, index) => (
                      <div key={err.errorId} className="flex justify-between">
                        <span>{err.category}: {err.message.substring(0, 50)}...</span>
                        <span>{new Date(err.timestamp).toLocaleTimeString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

// Utility function to get error history (for external use)
export const getAppErrorHistory = getErrorHistory