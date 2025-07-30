import { useState, useEffect } from 'react'
import { Link, useLocation } from 'wouter'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Building2, Eye, EyeOff, Chrome, Mail } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [showDemoOption, setShowDemoOption] = useState(false)
  
  const { signIn, signInWithOAuth, user } = useAuth()
  const [, setLocation] = useLocation()
  const { toast } = useToast()

  // Check for demo query parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    setShowDemoOption(urlParams.get('demo') === 'true')
  }, [])

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      setLocation('/dashboard')
    }
  }, [user, setLocation])

  const validateForm = () => {
    let isValid = true
    setEmailError('')
    setPasswordError('')
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

    // Password validation
    if (!password) {
      setPasswordError('Password is required')
      isValid = false
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters')
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

    try {
      const { error } = await signIn(email, password)
      
      if (error) {
        // Handle specific Supabase errors
        if (error.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please check your credentials and try again.')
        } else if (error.message.includes('Email not confirmed')) {
          setError('Please check your email and click the confirmation link before signing in.')
        } else if (error.message.includes('Too many requests')) {
          setError('Too many login attempts. Please wait a moment before trying again.')
        } else {
          setError(error.message)
        }
      } else {
        // Save remember me preference
        try {
          if (rememberMe) {
            localStorage.setItem('rememberMe', 'true')
            localStorage.setItem('savedEmail', email)
          } else {
            localStorage.removeItem('rememberMe')
            localStorage.removeItem('savedEmail')
          }
        } catch (err) {
          console.warn('Failed to save preferences to localStorage:', err)
        }
        
        toast({
          title: "Welcome back!",
          description: "You have been successfully logged in.",
        })
        setLocation('/dashboard')
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  // Load saved email if remember me was checked
  useEffect(() => {
    try {
      const savedRememberMe = localStorage.getItem('rememberMe')
      const savedEmail = localStorage.getItem('savedEmail')
      
      if (savedRememberMe === 'true' && savedEmail) {
        setEmail(savedEmail)
        setRememberMe(true)
      }
    } catch (err) {
      console.warn('Failed to load preferences from localStorage:', err)
    }
  }, [])

  const handleOAuthSignIn = async (provider: 'google' | 'microsoft') => {
    setLoading(true)
    setError('')

    try {
      // Map Microsoft to Azure for Supabase
      const supabaseProvider = provider === 'microsoft' ? 'azure' : 'google'
      const { error } = await signInWithOAuth(supabaseProvider)
      
      if (error) {
        setError(error.message || `Failed to sign in with ${provider}. Please try again.`)
      }
      // Note: If successful, user will be redirected to dashboard by the OAuth flow
    } catch (err) {
      console.warn('OAuth signin error:', err)
      setError(`Something went wrong with ${provider} sign-in. Please try again.`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F9FC] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#1F3A5F] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="heading-1 text-[#1A1A1A]">Welcome back</h1>
          <p className="body-text mt-2">Sign in to your ATS account</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your email and password to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* OAuth Options */}
            <div className="space-y-3 mb-6">
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 border-2 hover:bg-slate-50"
                onClick={() => handleOAuthSignIn('google')}
                disabled={loading}
              >
                <Chrome className="w-5 h-5 mr-3" />
                Continue with Google
              </Button>
              
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 border-2 hover:bg-slate-50"
                onClick={() => handleOAuthSignIn('microsoft')}
                disabled={loading}
              >
                <Mail className="w-5 h-5 mr-3" />
                Continue with Microsoft
              </Button>
            </div>

            <div className="relative mb-6">
              <Separator />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="bg-white px-4 text-sm text-[#5C667B]">or</span>
              </div>
            </div>

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
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      if (passwordError) setPasswordError('')
                    }}
                    disabled={loading}
                    className={passwordError ? 'border-red-500 focus-visible:ring-red-500 pr-10' : 'pr-10'}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-slate-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-slate-500" />
                    )}
                  </Button>
                </div>
                {passwordError && (
                  <p className="text-sm text-red-600">{passwordError}</p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  disabled={loading}
                />
                <Label htmlFor="remember" className="text-sm text-[#5C667B]">
                  Remember me for 30 days
                </Label>
              </div>
              
              <Button 
                type="submit" 
                variant="default"
                size="lg"
                className="w-full" 
                disabled={loading}
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-[#5C667B]">
                Don't have an account?{' '}
                <Link href="/signup">
                  <span className="link-primary font-medium">
                    Sign up
                  </span>
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {showDemoOption && (
          <div className="mt-8 text-center">
            <p className="text-sm text-[#5C667B] mb-3">
              Developer Demo Access
            </p>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={async () => {
                setLoading(true)
                setError('')
                try {
                  const { error } = await signIn('demo@yourapp.com', 'Demo1234!')
                  if (error) {
                    setError('Demo login failed. Please try again.')
                  } else {
                    toast({
                      title: "Demo mode activated!",
                      description: "You're now logged in as a demo user.",
                    })
                    setLocation('/dashboard')
                  }
                } catch (err) {
                  setError('Demo login failed. Please try again.')
                } finally {
                  setLoading(false)
                }
              }}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <span className="mr-2">🔓</span>
              )}
              Try Demo Account
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}