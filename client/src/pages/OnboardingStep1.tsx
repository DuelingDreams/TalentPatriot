import { useState } from 'react'
import { Link, useLocation } from 'wouter'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { Eye, EyeOff, Mail, Chrome, Github } from 'lucide-react'

export default function OnboardingStep1() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  
  const { signUp, signInWithOAuth } = useAuth()
  const [, setLocation] = useLocation()
  const { toast } = useToast()

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    // Email validation
    if (!email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    // Password validation
    if (!password) {
      newErrors.password = 'Password is required'
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number'
    }

    // Confirm password validation
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)

    try {
      const { error } = await signUp(email, password)
      
      if (error) {
        if (error.message?.includes('already registered')) {
          setErrors({ email: 'This email is already registered. Try signing in instead.' })
        } else {
          setErrors({ general: error.message || 'Failed to create account. Please try again.' })
        }
      } else {
        toast({
          title: "Account created!",
          description: "Welcome to TalentPatriot. Let's set up your company.",
        })
        
        // Redirect to Step 2 for company setup
        setLocation('/onboarding/step2')
      }
    } catch (err) {
      console.warn('Signup error:', err)
      setErrors({ general: 'Something went wrong. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const handleSSOSignup = async (provider: 'google' | 'microsoft') => {
    setLoading(true)
    setErrors({})

    try {
      // Map Microsoft to Azure for Supabase
      const supabaseProvider = provider === 'microsoft' ? 'azure' : 'google'
      const { error } = await signInWithOAuth(supabaseProvider)
      
      if (error) {
        toast({
          title: "Sign-up failed",
          description: error.message || `Failed to sign up with ${provider}. Please try again.`,
          variant: "destructive"
        })
      }
      // Note: If successful, user will be redirected to step2 by the OAuth flow
    } catch (err) {
      console.warn('OAuth signup error:', err)
      toast({
        title: "Sign-up failed", 
        description: `Something went wrong with ${provider} sign-up. Please try again.`,
        variant: "destructive"
      })
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
              src="/tp-logo.png" 
              alt="TalentPatriot Logo" 
              className="w-16 h-16 object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-[#1A1A1A] mb-2 tracking-tight">
            Create your account
          </h1>
          <p className="text-[#5C667B]">
            Join thousands of teams hiring better with TalentPatriot
          </p>
        </div>

        <Card className="shadow-lg border-0">
          <CardContent className="p-8">
            {/* SSO Options */}
            <div className="space-y-3 mb-6">
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 border-2 hover:bg-slate-50"
                onClick={() => handleSSOSignup('google')}
                disabled={loading}
              >
                <Chrome className="w-5 h-5 mr-3" />
                Continue with Google
              </Button>
              
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 border-2 hover:bg-slate-50"
                onClick={() => handleSSOSignup('microsoft')}
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

            {/* Email/Password Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {errors.general && (
                <Alert variant="destructive">
                  <AlertDescription>{errors.general}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 font-medium">
                  Work Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className={`h-12 ${errors.email ? 'border-red-500' : ''}`}
                  disabled={loading}
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700 font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a strong password"
                    className={`h-12 pr-12 ${errors.password ? 'border-red-500' : ''}`}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-slate-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-slate-400" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-600">{errors.password}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-slate-700 font-medium">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className={`h-12 pr-12 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-slate-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-slate-400" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-red-600">{errors.confirmPassword}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-[#1F3A5F] hover:bg-[#264C99] text-white font-medium"
                disabled={loading}
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-[#5C667B]">
                Already have an account?{' '}
                <Link href="/login" className="text-[#264C99] hover:underline font-medium">
                  Sign in
                </Link>
              </p>
            </div>

            <div className="mt-6 text-xs text-[#5C667B] text-center">
              By creating an account, you agree to our{' '}
              <a href="/terms" className="text-[#264C99] hover:underline">Terms of Service</a>
              {' '}and{' '}
              <a href="/privacy" className="text-[#264C99] hover:underline">Privacy Policy</a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}