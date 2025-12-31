import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useToast } from '@/shared/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/queryClient'
import { 
  User, 
  Mail, 
  Shield, 
  Save,
  UserCheck,
  Building2,
  Calendar,
  MapPin,
  Phone,
  ArrowLeft
} from 'lucide-react'
import { Link } from 'wouter'

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  jobTitle: z.string().optional(),
  department: z.string().optional(),
  location: z.string().optional(),
  bio: z.string().optional(),
})

type ProfileForm = z.infer<typeof profileSchema>

export default function ProfileSettings() {
  const { user, session } = useAuth()
  const { toast } = useToast()

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: user?.email || '',
      phone: '',
      jobTitle: '',
      department: '',
      location: '',
      bio: '',
    }
  })

  const getUserInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase()
  }

  // Fetch profile data
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['/api/user/profile'],
    queryFn: async () => {
      const response = await fetch('/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${session?.access_token || ''}`
        }
      })
      if (!response.ok) throw new Error('Failed to fetch profile')
      return response.json()
    },
    enabled: !!user && !!session?.access_token,
  })

  // Update profile mutation
  const queryClient = useQueryClient()
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileForm) => {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`
        },
        body: JSON.stringify(data)
      })
      if (!response.ok) throw new Error('Failed to update profile')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/profile'] })
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      })
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    }
  })

  // Update form values when profile data loads
  useEffect(() => {
    if (profileData && typeof profileData === 'object') {
      form.reset({
        firstName: (profileData as any).firstName || '',
        lastName: (profileData as any).lastName || '',
        email: (profileData as any).email || user?.email || '',
        phone: (profileData as any).phone || '',
        jobTitle: (profileData as any).jobTitle || '',
        department: (profileData as any).department || '',
        location: (profileData as any).location || '',
        bio: (profileData as any).bio || '',
      })
    }
  }, [profileData, form, user])

  const onSubmit = async (data: ProfileForm) => {
    updateProfileMutation.mutate(data)
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-tp-page-bg p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Navigation */}
        <Link href="/settings" data-testid="link-back-to-settings">
          <Button variant="ghost" className="gap-2 text-neutral-600 hover:text-tp-primary -ml-2 mb-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Settings
          </Button>
        </Link>

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-tp-primary-light rounded-2xl flex items-center justify-center">
            <User className="w-6 h-6 text-tp-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Profile Settings</h1>
            <p className="text-neutral-600 mt-1">Manage your personal information and preferences</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Profile Summary Card */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Current Profile</CardTitle>
              <CardDescription>Your profile information overview</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-20 w-20 mb-4">
                  <AvatarFallback className="bg-info-600 text-white text-xl">
                    {getUserInitials(user.email || '')}
                  </AvatarFallback>
                </Avatar>
                <h3 className="font-semibold text-lg">{user.email}</h3>
                <Badge variant="secondary" className="mt-2">
                  <Shield className="w-3 h-3 mr-1" />
                  Active User
                </Badge>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-neutral-600">
                  <Mail className="w-4 h-4" />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-neutral-600">
                  <Building2 className="w-4 h-4" />
                  <span>Current Organization</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-neutral-600">
                  <Calendar className="w-4 h-4" />
                  <span>Member since {new Date().getFullYear()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Form */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Edit Profile Information</CardTitle>
              <CardDescription>Update your personal details and contact information</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold leading-tight flex items-center gap-2">
                      <UserCheck className="w-5 h-5 text-tp-accent" />
                      Basic Information
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your first name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your last name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input 
                              type="email" 
                              placeholder="Enter your email"
                              disabled 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                          <p className="text-sm text-neutral-600">
                            Email address cannot be changed. Contact support if you need to update it.
                          </p>
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  {/* Contact Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold leading-tight flex items-center gap-2">
                      <Phone className="w-5 h-5 text-tp-accent" />
                      Contact Information
                    </h3>
                    
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
                    
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your location" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  {/* Professional Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold leading-tight flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-tp-accent" />
                      Professional Information
                    </h3>
                    
                    <FormField
                      control={form.control}
                      name="jobTitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Job Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your job title" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="department"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Department</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your department" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bio</FormLabel>
                          <FormControl>
                            <textarea
                              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              placeholder="Tell us about yourself..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end pt-4">
                    <Button 
                      type="submit" 
                      disabled={updateProfileMutation.isPending || profileLoading}
                      className="bg-tp-primary hover:bg-tp-accent"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}