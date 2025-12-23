import { useState } from 'react'
import { Link } from 'wouter'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/shared/hooks/use-toast'
import { useDemoFlag } from '@/lib/demoFlag'
import { Loader2, Building2, ArrowLeft, CheckCircle } from 'lucide-react'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [success, setSuccess] = useState(false)
  const { toast } = useToast()
  const { isDemoUser } = useDemoFlag()

  const validateForm = () => {
    let isValid = true
    setEmailError('')
    setError('')

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email) {
      setEmailError('Email is required')
      isValid = false
    } else if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address')
      isValid = false
    }

    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    setError('')

    // Demo protection: prevent server writes in demo mode
    if (isDemoUser) {
      toast({
        title: "Demo Mode",
        description: "Password reset is disabled in demo mode. In the real app, users would receive reset instructions via email.",
      })
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reset email')
      }

      setSuccess(true)
      toast({
        title: "Reset link sent!",
        description: "Check your inbox for password reset instructions.",
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send reset email. Please try again.'
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-tp-page px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-tp-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h1 className="heading-1 text-neutral-900">Check your email</h1>
            <p className="body-text mt-2">Reset instructions sent to your inbox</p>
          </div>

          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-sm text-neutral-600 mb-6">
                If that email is registered, you'll receive a password reset link shortly.
                Check your spam folder if you don't see it in your inbox.
              </p>
              <div className="space-y-3">
                <Button
                  onClick={() => {
                    setSuccess(false)
                    setEmail('')
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Send another email
                </Button>
                <Link href="/login">
                  <Button variant="ghost" className="w-full">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Sign In
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-tp-page px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-tp-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="heading-1 text-neutral-900">Reset your password</h1>
          <p className="body-text mt-2">Enter your email to receive reset instructions</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Forgot Password</CardTitle>
            <CardDescription>
              Enter the email address associated with your account and we'll send you a link to reset your password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (emailError) setEmailError('')
                  }}
                  disabled={loading}
                  className={emailError ? 'border-red-500 focus-visible:ring-red-500' : ''}
                />
                {emailError && (
                  <p className="text-sm text-red-600">{emailError}</p>
                )}
              </div>
              
              <Button 
                type="submit" 
                variant="default"
                size="lg"
                className="w-full" 
                disabled={loading}
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {loading ? 'Sending reset link...' : 'Send reset link'}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <Link href="/login">
                <span className="text-sm text-neutral-600 hover:text-tp-primary transition-colors">
                  <ArrowLeft className="w-3 h-3 inline mr-1" />
                  Back to Sign In
                </span>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}