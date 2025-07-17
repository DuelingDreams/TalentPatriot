import { useState, useEffect } from 'react'
import { Link, useLocation } from 'wouter'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Building2, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react'

const roles = [
  { value: 'recruiter', label: 'Recruiter', description: 'Full access to manage jobs and candidates' },
  { value: 'bd', label: 'Business Development', description: 'Read-only access to clients and jobs' },
  { value: 'pm', label: 'Project Manager', description: 'Access to contract jobs only' },
  { value: 'demo_viewer', label: 'Demo Viewer', description: 'Limited access to demo data only' },
]

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [orgName, setOrgName] = useState('')
  const [role, setRole] = useState('recruiter')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [confirmPasswordError, setConfirmPasswordError] = useState('')
  
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
    setConfirmPasswordError('')
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
    } else if (password.length > 72) {
      setPasswordError('Password must be less than 72 characters')
      isValid = false
    }

    // Confirm password validation
    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password')
      isValid = false
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match')
      isValid = false
    }

    return isValid
  }

  const getPasswordStrength = (password: string) => {
    let strength = 0
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    }
    
    strength = Object.values(checks).filter(Boolean).length
    return { strength, checks }
  }

  const passwordStrength = getPasswordStrength(password)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    setError('')

    try {
      const { error } = await signUp(email, password, role, orgName || undefined)
      
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
          description: "Please check your email and click the confirmation link to activate your account.",
        })
        setLocation('/login')
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Create account</h1>
          <p className="text-slate-600 mt-2">Join your team's ATS platform</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign Up</CardTitle>
            <CardDescription>
              Create your account to get started
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
              
              <div className="space-y-2">
                <Label htmlFor="orgName">Organization Name (Optional)</Label>
                <Input
                  id="orgName"
                  type="text"
                  placeholder="Your Company Name"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  disabled={loading || role === 'demo_viewer'}
                />
                <p className="text-xs text-slate-500">
                  {role === 'demo_viewer' 
                    ? 'Demo viewers don\'t need an organization' 
                    : 'We\'ll create an organization for you. Leave blank to use your email prefix.'
                  }
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">Account Role</Label>
                <Select value={role} onValueChange={setRole} disabled={loading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((roleOption) => (
                      <SelectItem key={roleOption.value} value={roleOption.value}>
                        <div>
                          <div className="font-medium">{roleOption.label}</div>
                          <div className="text-xs text-slate-500">{roleOption.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
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
                
                {password && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className={`h-1 w-full rounded ${
                        passwordStrength.strength < 2 ? 'bg-red-200' :
                        passwordStrength.strength < 4 ? 'bg-yellow-200' : 'bg-green-200'
                      }`}>
                        <div className={`h-full rounded transition-all ${
                          passwordStrength.strength < 2 ? 'bg-red-500' :
                          passwordStrength.strength < 4 ? 'bg-yellow-500' : 'bg-green-500'
                        }`} style={{ width: `${(passwordStrength.strength / 5) * 100}%` }} />
                      </div>
                      <span className={`text-xs ${
                        passwordStrength.strength < 2 ? 'text-red-600' :
                        passwordStrength.strength < 4 ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {passwordStrength.strength < 2 ? 'Weak' :
                         passwordStrength.strength < 4 ? 'Medium' : 'Strong'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      <div className={`flex items-center gap-1 ${passwordStrength.checks.length ? 'text-green-600' : 'text-slate-400'}`}>
                        {passwordStrength.checks.length ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        8+ characters
                      </div>
                      <div className={`flex items-center gap-1 ${passwordStrength.checks.uppercase ? 'text-green-600' : 'text-slate-400'}`}>
                        {passwordStrength.checks.uppercase ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        Uppercase
                      </div>
                      <div className={`flex items-center gap-1 ${passwordStrength.checks.lowercase ? 'text-green-600' : 'text-slate-400'}`}>
                        {passwordStrength.checks.lowercase ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        Lowercase
                      </div>
                      <div className={`flex items-center gap-1 ${passwordStrength.checks.number ? 'text-green-600' : 'text-slate-400'}`}>
                        {passwordStrength.checks.number ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        Number
                      </div>
                    </div>
                  </div>
                )}
                
                {passwordError && (
                  <p className="text-sm text-red-600">{passwordError}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value)
                      if (confirmPasswordError) setConfirmPasswordError('')
                    }}
                    disabled={loading}
                    className={confirmPasswordError ? 'border-red-500 focus-visible:ring-red-500 pr-10' : 'pr-10'}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={loading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-slate-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-slate-500" />
                    )}
                  </Button>
                </div>
                
                {confirmPassword && password && (
                  <div className={`flex items-center gap-1 text-xs ${
                    password === confirmPassword ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {password === confirmPassword ? 
                      <CheckCircle className="w-3 h-3" /> : 
                      <XCircle className="w-3 h-3" />
                    }
                    {password === confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                  </div>
                )}
                
                {confirmPasswordError && (
                  <p className="text-sm text-red-600">{confirmPasswordError}</p>
                )}
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {loading ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-slate-600">
                Already have an account?{' '}
                <Link href="/login">
                  <span className="text-blue-600 hover:underline font-medium">
                    Sign in
                  </span>
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}