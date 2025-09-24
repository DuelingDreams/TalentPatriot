import { useState } from 'react'
import { useLocation } from 'wouter'
import { useAuth } from '@/contexts/AuthContext'
import { useCreateOrganization } from '@/features/organization/hooks/useOrganizations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Building2, Users, ArrowRight } from 'lucide-react'
import { useToast } from '@/shared/hooks/use-toast'
import { useDemoFlag } from '@/lib/demoFlag'
import { supabase } from '@/lib/supabase'

export default function OrganizationSetup() {
  const { user, userRole, setCurrentOrgId } = useAuth()
  const [, setLocation] = useLocation()
  const { toast } = useToast()
  const createOrganization = useCreateOrganization()
  const { isDemoUser } = useDemoFlag()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [companySize, setCompanySize] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!companyName.trim()) {
      setError('Please enter your company name')
      return
    }
    
    if (!companySize) {
      setError('Please select your company size')
      return
    }

    setLoading(true)
    setError('')

    // Demo protection: prevent server writes in demo mode
    if (isDemoUser) {
      toast({
        title: "Demo Mode",
        description: "Organization creation is disabled in demo mode. Explore the existing features to see how TalentPatriot works.",
      })
      setLoading(false)
      return
    }

    try {
      // Create organization
      const orgResponse = await fetch('/api/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: companyName.trim(),
          ownerId: user?.id,
          slug: companyName.toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .substring(0, 50),
          metadata: {
            companySize,
            ownerRole: userRole,
          }
        }),
      })

      if (orgResponse.ok) {
        const organization = await orgResponse.json()
        
        // Add user to organization as owner
        await fetch('/api/user-organizations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user?.id,
            orgId: organization.id,
            role: 'owner',
          }),
        })

        // Update user metadata with organization info
        const { error: updateError } = await supabase.auth.updateUser({
          data: {
            currentOrgId: organization.id,
            companyName: companyName.trim(),
            companySize: companySize,
          }
        })
        
        if (updateError) {
          console.warn('Failed to update user metadata:', updateError)
        }
        
        // Set the current org ID in context
        await setCurrentOrgId(organization.id)

        toast({
          title: "Organization created!",
          description: `${companyName} has been set up successfully.`,
        })
        
        // Reload to refresh all data with new org context
        window.location.reload()
      } else {
        const errorData = await orgResponse.json()
        setError(errorData.error || 'Failed to create organization')
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F9FC] px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-6 h-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Set Up Your Organization</CardTitle>
          <CardDescription>
            Let's get your company set up in TalentPatriot
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                type="text"
                placeholder="Acme Corporation"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="companySize">Company Size</Label>
              <Select value={companySize} onValueChange={setCompanySize} disabled={loading}>
                <SelectTrigger id="companySize">
                  <SelectValue placeholder="Select team size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-10">1-10 employees</SelectItem>
                  <SelectItem value="11-50">11-50 employees</SelectItem>
                  <SelectItem value="51-200">51-200 employees</SelectItem>
                  <SelectItem value="201-500">201-500 employees</SelectItem>
                  <SelectItem value="500+">500+ employees</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-[#1F3A5F] hover:bg-[#264C99] text-white"
              disabled={loading}
            >
              {loading ? (
                "Creating organization..."
              ) : (
                <>
                  Create Organization
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}