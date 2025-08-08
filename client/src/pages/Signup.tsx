import { useState, useEffect } from 'react'
import { Link, useLocation } from 'wouter'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Eye, EyeOff, Mail, Chrome } from 'lucide-react'

// Simplified signup - just collect essential info for Step 1

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  
  const { signUp, user } = useAuth()
  const [, setLocation] = useLocation()
  const { toast } = useToast()

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

  // SSO handlers (placeholder for now)
  const handleGoogleSignup = () => {
    // TODO: Implement Google SSO
    setError('Google signup coming soon!')
  }

  const handleMicrosoftSignup = () => {
    // TODO: Implement Microsoft SSO
    setError('Microsoft signup coming soon!')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    setError('')

    try {
      // Use default role 'recruiter' for Step 1 signup
      const { error } = await signUp(email, password, 'recruiter')
      
      if (error) {
        // Handle specific Supabase errors
        if (error.message.includes('already registered')) {
          setError('An account with this email already exists. Please sign in instead.')
        } else if (error.message.includes('Password should be')) {
          setError('Password does not meet security requirements')
        } else if (error.message.includes('Email address')) {
          setError('Please enter a valid email address')
        } else {
          setError(error.message)
        }
      } else {
        toast({
          title: "Account created successfully!",
          description: "Let's set up your organization next.",
        })
        // Redirect to Step 2 of onboarding
        setLocation('/onboarding/step2')
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F9FC] px-4 font-[Inter,sans-serif]">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 flex items-center justify-center mx-auto mb-6">
            <img 
              src="/talentpatriot-logo.png" 
              alt="TalentPatriot Logo" 
              className="w-16 h-16 object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-[#1A1A1A] mb-2 tracking-tight">
            Create your free TalentPatriot account
          </h1>
          <p className="text-[#5C667B]">
            Start hiring better candidates in minutes
          </p>
        </div>

        <Card className="shadow-lg border-0">
          <CardContent className="p-8">
            {/* SSO Options */}
            <div className="space-y-3 mb-6">
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 border-2 hover:bg-[#F0F4F8] transition-colors"
                onClick={handleGoogleSignup}
                disabled={loading}
              >
                <div className="flex items-center justify-center gap-3">
                  <Chrome className="w-5 h-5 text-blue-600" />
                  <span className="font-medium">Continue with Google</span>
                </div>
              </Button>
              
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 border-2 hover:bg-[#F0F4F8] transition-colors"
                onClick={handleMicrosoftSignup}
                disabled={loading}
              >
                <div className="flex items-center justify-center gap-3">
                  <svg className="w-5 h-5" viewBox="0 0 21 21" fill="none">
                    <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
                    <rect x="12" y="1" width="9" height="9" fill="#7FBA00"/>
                    <rect x="1" y="12" width="9" height="9" fill="#00A4EF"/>
                    <rect x="12" y="12" width="9" height="9" fill="#FFB900"/>
                  </svg>
                  <span className="font-medium">Continue with Microsoft</span>
                </div>
              </Button>
            </div>

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-[#5C667B]">or continue with email</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <Alert variant="destructive" className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 font-medium">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
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
                    className={`pl-10 h-12 ${emailError ? 'border-red-500 focus-visible:ring-red-500' : 'border-slate-300 focus-visible:ring-indigo-500'}`}
                  />
                </div>
                {emailError && (
                  <p className="text-sm text-red-600 mt-1">{emailError}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700 font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a secure password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      if (passwordError) setPasswordError('')
                    }}
                    disabled={loading}
                    className={`pr-10 h-12 ${passwordError ? 'border-red-500 focus-visible:ring-red-500' : 'border-slate-300 focus-visible:ring-indigo-500'}`}
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
                  <p className="text-sm text-red-600 mt-1">{passwordError}</p>
                )}
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-base transition-colors" 
                disabled={loading}
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {loading ? 'Creating account...' : 'Start Free'}
              </Button>
            </form>
            
            <div className="mt-8 text-center">
              <p className="text-sm text-slate-600">
                Already have an account?{' '}
                <Link href="/login">
                  <span className="text-indigo-600 hover:underline font-medium">
                    Sign in
                  </span>
                </Link>
              </p>
              
              <p className="text-xs text-slate-500 mt-4 leading-relaxed">
                By creating an account, you agree to TalentPatriot's{' '}
                <a href="#" className="text-indigo-600 hover:underline">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="text-indigo-600 hover:underline">Privacy Policy</a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}