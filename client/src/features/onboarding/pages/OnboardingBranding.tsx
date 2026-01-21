import { useState } from 'react'
import { useLocation } from 'wouter'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/shared/hooks/use-toast'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/queryClient'
import { Loader2, Palette, Type, Image, Globe, ArrowRight, SkipForward } from 'lucide-react'

const defaultColors = [
  { name: 'Navy', primary: '#1E3A5F', secondary: '#14B8A6' },
  { name: 'Teal', primary: '#0D9488', secondary: '#1E3A5F' },
  { name: 'Purple', primary: '#6B21A8', secondary: '#14B8A6' },
  { name: 'Blue', primary: '#1D4ED8', secondary: '#F59E0B' },
]

export default function OnboardingBranding() {
  const { user, organizationId } = useAuth()
  const [, setLocation] = useLocation()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [primaryColor, setPrimaryColor] = useState('#1E3A5F')
  const [accentColor, setAccentColor] = useState('#14B8A6')
  const [tagline, setTagline] = useState('')
  const [aboutText, setAboutText] = useState('')

  const saveBrandingMutation = useMutation({
    mutationFn: async (data: { 
      primary_color: string
      accent_color: string
      tagline?: string
      about_text?: string
    }) => {
      return apiRequest('/api/organizations/branding', {
        method: 'POST',
        body: JSON.stringify({
          channel: 'careers',
          ...data,
        }),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/organizations/branding'] })
      toast({
        title: 'Branding saved',
        description: 'Your careers portal branding has been configured.',
      })
      setLocation('/onboarding/review')
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save branding',
        variant: 'destructive',
      })
    },
  })

  if (!user) {
    setLocation('/login')
    return null
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    saveBrandingMutation.mutate({
      primary_color: primaryColor,
      accent_color: accentColor,
      tagline: tagline || undefined,
      about_text: aboutText || undefined,
    })
  }

  const handleSkip = () => {
    setLocation('/onboarding/review')
  }

  const selectPreset = (preset: typeof defaultColors[0]) => {
    setPrimaryColor(preset.primary)
    setAccentColor(preset.secondary)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-tp-page-bg px-4 font-[Inter,sans-serif]">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-16 h-16 flex items-center justify-center mx-auto mb-6">
            <img 
              src="/talentpatriot-logo.png" 
              alt="TalentPatriot Logo" 
              className="w-16 h-16 object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-neutral-900 mb-2 tracking-tight">
            Customize your careers portal
          </h1>
          <p className="text-neutral-600">
            Brand your public careers page to match your company
          </p>
        </div>

        <Card className="shadow-lg border-0">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <Label className="text-neutral-700 font-medium flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Color Presets
                </Label>
                <div className="grid grid-cols-4 gap-3">
                  {defaultColors.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => selectPreset(preset)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        primaryColor === preset.primary
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
                          style={{ backgroundColor: preset.secondary }}
                        />
                      </div>
                      <span className="text-xs text-neutral-600">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor" className="text-neutral-700 font-medium">
                    Primary Color
                  </Label>
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
                      className="flex-1 h-10 font-mono text-sm"
                      placeholder="#1E3A5F"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accentColor" className="text-neutral-700 font-medium">
                    Accent Color
                  </Label>
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
                      className="flex-1 h-10 font-mono text-sm"
                      placeholder="#14B8A6"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tagline" className="text-neutral-700 font-medium flex items-center gap-2">
                  <Type className="w-4 h-4" />
                  Tagline (optional)
                </Label>
                <Input
                  id="tagline"
                  type="text"
                  placeholder="Join our team and build the future"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="h-12 border-neutral-300"
                  maxLength={100}
                />
                <p className="text-xs text-neutral-500">Shown on your careers page header</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="aboutText" className="text-neutral-700 font-medium flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  About Your Company (optional)
                </Label>
                <Textarea
                  id="aboutText"
                  placeholder="Tell candidates about your company culture, mission, and what makes you a great place to work..."
                  value={aboutText}
                  onChange={(e) => setAboutText(e.target.value)}
                  className="min-h-[100px] border-neutral-300"
                  maxLength={500}
                />
                <p className="text-xs text-neutral-500">{aboutText.length}/500 characters</p>
              </div>

              <div 
                className="p-4 rounded-lg border border-neutral-200"
                style={{ 
                  background: `linear-gradient(135deg, ${primaryColor}10 0%, ${accentColor}10 100%)`,
                  borderColor: primaryColor + '30'
                }}
              >
                <p className="text-xs text-neutral-600 mb-2 font-medium">Preview</p>
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {user.email?.[0].toUpperCase() || 'C'}
                  </div>
                  <div>
                    <p className="font-semibold" style={{ color: primaryColor }}>
                      {tagline || 'Your Company Careers'}
                    </p>
                    <p className="text-xs" style={{ color: accentColor }}>
                      Join our team
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  type="button"
                  variant="outline"
                  onClick={handleSkip}
                  className="flex-1 h-12"
                >
                  <SkipForward className="w-4 h-4 mr-2" />
                  Skip for now
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 h-12 bg-tp-primary hover:bg-tp-accent text-white font-semibold" 
                  disabled={saveBrandingMutation.isPending}
                >
                  {saveBrandingMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4 mr-2" />
                  )}
                  {saveBrandingMutation.isPending ? 'Saving...' : 'Continue'}
                </Button>
              </div>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-neutral-500 leading-relaxed">
                Step 3 of 5 • You can update these settings anytime
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
