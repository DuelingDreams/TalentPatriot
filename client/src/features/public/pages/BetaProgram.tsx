import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useToast } from '@/shared/hooks/use-toast'
import { 
  Users, 
  Target, 
  Sparkles,
  ArrowRight,
  Heart,
  CheckCircle,
  Star,
  MessageSquare,
  Gift,
  UserCheck,
  Building2,
  Mail,
  Phone,
  Globe
} from 'lucide-react'
import { Link, useLocation } from 'wouter'

const betaApplicationSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  contactName: z.string().min(1, 'Contact name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  website: z.string().optional(),
  companySize: z.string().min(1, 'Company size is required'),
  currentATS: z.string().optional(),
  painPoints: z.string().min(10, 'Please describe your main challenges (minimum 10 characters)'),
  expectations: z.string().optional(),
})

type BetaApplicationForm = z.infer<typeof betaApplicationSchema>

export default function BetaProgram() {
  const { toast } = useToast()
  const [, setLocation] = useLocation()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const form = useForm<BetaApplicationForm>({
    resolver: zodResolver(betaApplicationSchema),
    defaultValues: {
      companyName: '',
      contactName: '',
      email: '',
      phone: '',
      website: '',
      companySize: '',
      currentATS: '',
      painPoints: '',
      expectations: '',
    }
  })

  const onSubmit = async (data: BetaApplicationForm) => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/beta/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyName: data.companyName,
          contactName: data.contactName,
          email: data.email,
          phone: data.phone,
          website: data.website,
          companySize: data.companySize,
          currentAts: data.currentATS,
          painPoints: data.painPoints,
          expectations: data.expectations,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit application')
      }

      const result = await response.json()
      
      setSubmitted(true)
      toast({
        title: "Application submitted!",
        description: result.message || "We'll review your application and get back to you soon.",
      })
      
      setTimeout(() => {
        setLocation('/onboarding/step1')
      }, 2000)
      
    } catch (error) {
      console.error('Beta application submission error:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit application. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-tp-page-bg p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-success-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-success-600" />
            </div>
            <h1 className="text-4xl font-bold text-neutral-900 mb-4">Application Submitted!</h1>
            <p className="text-lg text-neutral-600 mb-8 max-w-2xl mx-auto">
              Thank you for your interest in our beta program. You're being redirected to create your account and 
              complete the setup process.
            </p>
            <div className="flex items-center justify-center gap-2 text-neutral-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-tp-primary"></div>
              <span>Redirecting to account setup...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-tp-page-bg font-[Inter,sans-serif]">
      {/* Navigation */}
      <nav className="bg-white border-b border-neutral-200 fixed w-full z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center">
                <img 
                  src="/talentpatriot-logo.png" 
                  alt="TalentPatriot Logo" 
                  className="w-8 h-8 md:w-10 md:h-10 object-contain"
                />
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-neutral-900 tracking-tight">
                TalentPatriot
              </h1>
            </Link>
            <div className="flex items-center gap-2 md:gap-3">
              <Link href="/">
                <Button variant="ghost" className="text-neutral-600 hover:text-tp-primary font-medium">
                  Home
                </Button>
              </Link>
              <Link href="/about">
                <Button variant="ghost" className="text-neutral-600 hover:text-tp-primary font-medium">
                  About
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-tp-page-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
          <div className="text-center mb-16">
            <Badge className="bg-success-100 text-success-700 mb-6">
              <Gift className="w-4 h-4 mr-2" />
              Free Beta Program
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-neutral-900 mb-6 tracking-tight">
              Join Our Free Beta Program
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl text-tp-primary font-medium mb-8 max-w-4xl mx-auto">
              Help shape the future of recruitment technology while getting full access to all features at no cost.
            </p>
          </div>

          {/* Beta Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <Card className="bg-white hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-8 text-center">
                <div className="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Gift className="w-6 h-6 text-success-600" />
                </div>
                <h3 className="text-xl font-bold text-neutral-900 mb-3">Completely Free</h3>
                <p className="text-neutral-600 leading-relaxed">
                  Full access to all premium features, AI resume parsing, and advanced analytics at no cost during the beta period.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-8 text-center">
                <div className="w-12 h-12 bg-info-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-6 h-6 text-tp-accent" />
                </div>
                <h3 className="text-xl font-bold text-neutral-900 mb-3">Direct Impact</h3>
                <p className="text-neutral-600 leading-relaxed">
                  Your feedback directly influences product development. Help us build the ATS that growing teams actually need.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-8 text-center">
                <div className="w-12 h-12 bg-warning-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Star className="w-6 h-6 text-warning-600" />
                </div>
                <h3 className="text-xl font-bold text-neutral-900 mb-3">Exclusive Access</h3>
                <p className="text-neutral-600 leading-relaxed">
                  Be among the first to experience next-generation recruitment technology with priority support and early feature access.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">Apply for Beta Access</h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Tell us about your company and recruitment challenges. We're looking for engaged partners 
              who can provide meaningful feedback.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Beta Application</CardTitle>
              <CardDescription>
                Complete this form to apply for free access to TalentPatriot's beta program.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Company Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold leading-tight flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-tp-accent" />
                      Company Information
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="companyName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your company name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="companySize"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company Size *</FormLabel>
                            <FormControl>
                              <select 
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                {...field}
                              >
                                <option value="">Select company size</option>
                                <option value="1-10">1-10 employees</option>
                                <option value="11-50">11-50 employees</option>
                                <option value="51-200">51-200 employees</option>
                                <option value="201-500">201-500 employees</option>
                                <option value="500+">500+ employees</option>
                              </select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Website</FormLabel>
                          <FormControl>
                            <Input placeholder="https://yourcompany.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  {/* Contact Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold leading-tight flex items-center gap-2">
                      <UserCheck className="w-5 h-5 text-tp-accent" />
                      Contact Information
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="contactName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contact Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your full name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address *</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="Enter your email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your phone number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  {/* Current State & Expectations */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold leading-tight flex items-center gap-2">
                      <Target className="w-5 h-5 text-tp-accent" />
                      Current State & Goals
                    </h3>
                    
                    <FormField
                      control={form.control}
                      name="currentATS"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current ATS/Recruitment Tool</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Workday, BambooHR, spreadsheets, etc." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="painPoints"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Main Recruitment Challenges *</FormLabel>
                          <FormControl>
                            <textarea
                              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              placeholder="Describe your biggest recruitment challenges and pain points..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="expectations"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>What are you hoping to achieve with TalentPatriot?</FormLabel>
                          <FormControl>
                            <textarea
                              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              placeholder="Share your goals and expectations for the platform..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end pt-4">
                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="bg-tp-primary hover:bg-tp-accent px-8 py-3"
                    >
                      {isSubmitting ? 'Submitting...' : 'Apply for Beta Access'}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* What Happens Next */}
      <section className="py-16 bg-tp-page-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">What Happens Next?</h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Here's what you can expect after submitting your beta application
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-tp-primary-light rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-tp-accent">1</span>
              </div>
              <h3 className="text-lg font-bold text-neutral-900 mb-2">Review & Approval</h3>
              <p className="text-neutral-600">
                We'll review your application within 24 hours and send you an approval email with next steps.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-tp-primary-light rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-tp-accent">2</span>
              </div>
              <h3 className="text-lg font-bold text-neutral-900 mb-2">Onboarding Call</h3>
              <p className="text-neutral-600">
                We'll schedule a brief onboarding call to set up your account and walk through key features.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-tp-primary-light rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-tp-accent">3</span>
              </div>
              <h3 className="text-lg font-bold text-neutral-900 mb-2">Start Recruiting</h3>
              <p className="text-neutral-600">
                Begin using TalentPatriot with full access to all features and priority support from our team.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-neutral-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                <img 
                  src="/talentpatriot-logo.png" 
                  alt="TalentPatriot Logo" 
                  className="w-8 h-8 object-contain"
                />
              </div>
              <h3 className="text-xl font-bold text-neutral-900">TalentPatriot</h3>
            </div>
            <p className="text-neutral-600 mb-4">
              Building the future of recruitment technology for growing teams.
            </p>
            <p className="text-sm text-neutral-600">
              © 2024 TalentPatriot. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
