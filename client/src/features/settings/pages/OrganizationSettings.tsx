import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/shared/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/queryClient'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { supabase } from '@/lib/supabase'
import { 
  Building2, 
  Palette, 
  Globe,
  Save,
  Loader2,
  ArrowLeft,
  Type,
  Image,
  Upload,
  X
} from 'lucide-react'
import { Link } from 'wouter'

type OrganizationInfo = {
  id: string
  name: string
  slug?: string
  company_size?: string
}

type BrandingInfo = {
  logo_url?: string
  primary_color?: string
  accent_color?: string
  tagline?: string
  about_text?: string
}

const colorPresets = [
  { name: 'Navy & Teal', primary: '#1E3A5F', accent: '#14B8A6' },
  { name: 'Blue & Orange', primary: '#1D4ED8', accent: '#F59E0B' },
  { name: 'Purple & Teal', primary: '#6B21A8', accent: '#14B8A6' },
  { name: 'Teal & Navy', primary: '#0D9488', accent: '#1E3A5F' },
]

export default function OrganizationSettings() {
  const { organizationId, userRole, orgRole } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [primaryColor, setPrimaryColor] = useState('#1E3A5F')
  const [accentColor, setAccentColor] = useState('#14B8A6')
  const [tagline, setTagline] = useState('')
  const [aboutText, setAboutText] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)

  // Use orgRole for org-level permissions
  const effectiveRole = orgRole || userRole
  const isAdmin = effectiveRole === 'admin' || effectiveRole === 'owner' || effectiveRole === 'hiring_manager'

  const { data: orgInfo, isLoading: orgLoading } = useQuery<OrganizationInfo>({
    queryKey: [`/api/organizations/${organizationId}`],
    enabled: !!organizationId,
  })

  const { data: branding, isLoading: brandingLoading } = useQuery<BrandingInfo>({
    queryKey: ['/api/organizations/branding', 'careers'],
    enabled: !!organizationId,
  })

  useEffect(() => {
    if (branding) {
      if (branding.primary_color) setPrimaryColor(branding.primary_color)
      if (branding.accent_color) setAccentColor(branding.accent_color)
      if (branding.tagline) setTagline(branding.tagline)
      if (branding.about_text) setAboutText(branding.about_text)
      if (branding.logo_url) setLogoUrl(branding.logo_url)
    }
  }, [branding])

  const saveBrandingMutation = useMutation({
    mutationFn: async (data: BrandingInfo) => {
      return apiRequest('/api/organizations/branding', {
        method: 'POST',
        body: JSON.stringify({
          channel: 'careers',
          primary_color: data.primary_color,
          accent_color: data.accent_color,
          tagline: data.tagline,
          about_text: data.about_text,
          logo_url: data.logo_url,
        }),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/organizations/branding'] })
      toast({
        title: 'Branding saved',
        description: 'Your careers portal branding has been updated.',
      })
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save branding',
        variant: 'destructive',
      })
    },
  })

  const handleSaveBranding = () => {
    saveBrandingMutation.mutate({
      primary_color: primaryColor,
      accent_color: accentColor,
      tagline: tagline || undefined,
      about_text: aboutText || undefined,
      logo_url: logoUrl || undefined,
    })
  }

  const selectPreset = (preset: typeof colorPresets[0]) => {
    setPrimaryColor(preset.primary)
    setAccentColor(preset.accent)
  }

  const handleLogoUpload = async (file: File) => {
    if (!file) return

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp', 'image/gif']
    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a PNG, JPG, SVG, WebP, or GIF image.',
        variant: 'destructive',
      })
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Logo must be less than 5MB.',
        variant: 'destructive',
      })
      return
    }

    setIsUploadingLogo(true)

    try {
      const formData = new FormData()
      formData.append('logo', file)

      // Get auth token from Supabase session
      const { data: { session } } = await supabase.auth.getSession()
      const accessToken = session?.access_token || ''

      if (!accessToken) {
        throw new Error('Please sign in to upload a logo')
      }

      const response = await fetch('/api/upload/logo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'x-org-id': organizationId || '',
        },
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to upload logo')
      }

      const result = await response.json()
      setLogoUrl(result.logoUrl)
      
      toast({
        title: 'Logo uploaded',
        description: 'Your logo has been uploaded successfully.',
      })
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload logo',
        variant: 'destructive',
      })
    } finally {
      setIsUploadingLogo(false)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleLogoUpload(file)
    }
  }

  const clearLogo = () => {
    setLogoUrl('')
    if (logoInputRef.current) {
      logoInputRef.current.value = ''
    }
  }

  const isLoading = orgLoading || brandingLoading

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/settings">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Settings
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-neutral-900">Organization Settings</h1>
          <p className="text-neutral-600 mt-1">
            Manage your organization details and careers portal branding
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-tp-accent" />
          </div>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-tp-primary/10 rounded-lg">
                    <Building2 className="w-5 h-5 text-tp-primary" />
                  </div>
                  <div>
                    <CardTitle>Organization Info</CardTitle>
                    <CardDescription>Basic information about your organization</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-neutral-500 text-sm">Organization Name</Label>
                    <p className="font-medium text-neutral-900">{orgInfo?.name || '—'}</p>
                  </div>
                  <div>
                    <Label className="text-neutral-500 text-sm">URL Slug</Label>
                    <p className="font-medium text-neutral-900">{orgInfo?.slug || '—'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-tp-accent/10 rounded-lg">
                    <Palette className="w-5 h-5 text-tp-accent" />
                  </div>
                  <div>
                    <CardTitle>Careers Portal Branding</CardTitle>
                    <CardDescription>Customize how your public careers page looks</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-neutral-700 font-medium mb-3 block">Color Presets</Label>
                  <div className="grid grid-cols-4 gap-3">
                    {colorPresets.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => selectPreset(preset)}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          primaryColor === preset.primary && accentColor === preset.accent
                            ? 'border-tp-accent ring-2 ring-tp-accent/20'
                            : 'border-neutral-200 hover:border-neutral-300'
                        }`}
                      >
                        <div className="flex gap-1 mb-2">
                          <div 
                            className="w-6 h-6 rounded-full" 
                            style={{ backgroundColor: preset.primary }}
                          />
                          <div 
                            className="w-6 h-6 rounded-full" 
                            style={{ backgroundColor: preset.accent }}
                          />
                        </div>
                        <span className="text-xs text-neutral-600">{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primaryColor">Primary Color</Label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        id="primaryColor"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-12 h-10 rounded cursor-pointer"
                      />
                      <Input
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="flex-1 font-mono text-sm"
                        placeholder="#1E3A5F"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accentColor">Accent Color</Label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        id="accentColor"
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                        className="w-12 h-10 rounded cursor-pointer"
                      />
                      <Input
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                        className="flex-1 font-mono text-sm"
                        placeholder="#14B8A6"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Image className="w-4 h-4" />
                    Company Logo
                  </Label>
                  
                  {logoUrl ? (
                    <div className="flex items-center gap-4 p-4 bg-neutral-50 rounded-lg border">
                      <img 
                        src={logoUrl} 
                        alt="Company logo" 
                        className="w-16 h-16 object-contain rounded border bg-white"
                        onError={(e) => {
                          const img = e.currentTarget
                          img.style.display = 'none'
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-700 truncate">Logo uploaded</p>
                        <p className="text-xs text-neutral-500 truncate">{logoUrl}</p>
                      </div>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon"
                        onClick={clearLogo}
                        className="text-neutral-400 hover:text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <div 
                        className="border-2 border-dashed border-neutral-200 rounded-lg p-6 text-center hover:border-tp-accent transition-colors cursor-pointer"
                        onClick={() => logoInputRef.current?.click()}
                      >
                        {isUploadingLogo ? (
                          <div className="flex flex-col items-center gap-2">
                            <Loader2 className="w-8 h-8 animate-spin text-tp-accent" />
                            <p className="text-sm text-neutral-600">Uploading...</p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <Upload className="w-8 h-8 text-neutral-400" />
                            <p className="text-sm font-medium text-neutral-700">Click to upload logo</p>
                            <p className="text-xs text-neutral-500">PNG, JPG, SVG, WebP, or GIF (max 5MB)</p>
                          </div>
                        )}
                        <input
                          ref={logoInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp,image/gif"
                          onChange={handleFileInputChange}
                          className="hidden"
                        />
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-neutral-200" />
                        <span className="text-xs text-neutral-400">or</span>
                        <div className="flex-1 h-px bg-neutral-200" />
                      </div>

                      <Input
                        id="logoUrl"
                        type="url"
                        placeholder="https://example.com/logo.png"
                        value={logoUrl}
                        onChange={(e) => setLogoUrl(e.target.value)}
                      />
                      <p className="text-xs text-neutral-500">Enter a URL if your logo is already hosted elsewhere</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tagline" className="flex items-center gap-2">
                    <Type className="w-4 h-4" />
                    Tagline
                  </Label>
                  <Input
                    id="tagline"
                    type="text"
                    placeholder="Join our team and build the future"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    maxLength={100}
                  />
                  <p className="text-xs text-neutral-500">Shown below your company name on the careers page</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="aboutText" className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    About Your Company
                  </Label>
                  <Textarea
                    id="aboutText"
                    placeholder="Tell candidates about your company culture, mission, and what makes you a great place to work..."
                    value={aboutText}
                    onChange={(e) => setAboutText(e.target.value)}
                    className="min-h-[100px]"
                    maxLength={500}
                  />
                  <p className="text-xs text-neutral-500">{aboutText.length}/500 characters</p>
                </div>

                <Separator />

                <div 
                  className="p-4 rounded-lg border"
                  style={{ 
                    background: `linear-gradient(135deg, ${primaryColor}10 0%, ${accentColor}10 100%)`,
                    borderColor: primaryColor + '30'
                  }}
                >
                  <p className="text-xs text-neutral-600 mb-3 font-medium">Preview</p>
                  <div className="flex items-center gap-3">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="w-12 h-12 object-contain rounded" />
                    ) : (
                      <div 
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-xl"
                        style={{ backgroundColor: primaryColor }}
                      >
                        {orgInfo?.name?.charAt(0) || 'C'}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold" style={{ color: primaryColor }}>
                        Careers at {orgInfo?.name || 'Your Company'}
                      </p>
                      <p className="text-sm" style={{ color: accentColor }}>
                        {tagline || 'Your tagline here'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handleSaveBranding}
                    disabled={saveBrandingMutation.isPending}
                    className="bg-tp-primary hover:bg-tp-accent"
                  >
                    {saveBrandingMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save Branding
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
