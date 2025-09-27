import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { 
  Users, 
  Building2, 
  Target, 
  Sparkles,
  ArrowRight,
  UserCheck,
  Rocket,
  BarChart3,
  Tags,
  Bell,
  UserPlus,
  FileText,
  Zap,
  TrendingUp,
  Shield,
  ChevronRight,
  DollarSign,
  Mail,
  ChevronDown,
  Play,
  Search,
  Calendar,
  Archive
} from 'lucide-react'
import { Link } from 'wouter'
import { useEffect } from 'react'

export default function Landing() {
  // Set SEO meta tags
  useEffect(() => {
    document.title = "TalentPatriot — SMB ATS with Fast Setup & Fair Pricing"
    
    // Set or update meta description
    let metaDescription = document.querySelector('meta[name="description"]')
    if (!metaDescription) {
      metaDescription = document.createElement('meta')
      metaDescription.setAttribute('name', 'description')
      document.head.appendChild(metaDescription)
    }
    metaDescription.setAttribute('content', 'An SMB-first ATS with fast setup, fair pricing, accessibility-first design, and AI that works. Launch your branded careers page in under a day.')
  }, [])

  return (
    <div className="min-h-screen bg-[#F7F9FC] font-[Inter,sans-serif]">
      {/* Skip to Content Link */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-6 focus:py-3 focus:bg-[#1F3A5F] focus:text-white focus:rounded-md focus:shadow-lg focus:font-medium"
      >
        Skip to main content
      </a>

      {/* Navigation */}
      <header>
        <nav className="bg-white border-b border-gray-200 fixed w-full z-50 shadow-sm" role="banner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center">
                <img 
                  src="/talentpatriot-logo.png" 
                  alt="TalentPatriot Logo" 
                  className="w-8 h-8 md:w-10 md:h-10 object-contain"
                  loading="eager"
                />
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-[#1A1A1A] tracking-tight">
                TalentPatriot
              </h1>
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              <Link href="/login">
                <Button className="bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm md:text-base px-3 md:px-4 py-2 transition-colors">
                  Sign In
                </Button>
              </Link>
              <Link href="/beta">
                <Button className="bg-[#1F3A5F] hover:bg-[#264C99] text-white font-medium text-sm md:text-base px-4 md:px-6 py-2 whitespace-nowrap transition-colors">
                  Beta Access
                </Button>
              </Link>
            </div>
          </div>
        </div>
        </nav>
      </header>

      {/* Main Content */}
      <main id="main-content">
        {/* Hero Section */}
        <section className="pt-32 py-16 bg-[#F7F9FC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#1A1A1A] mb-6 tracking-tight font-[Inter,sans-serif]">
            An ATS Built for SMBs: Fast Setup, Fair Pricing, AI That Works.
          </h1>
          
          <p className="text-lg md:text-xl lg:text-2xl text-[#1F3A5F] font-medium mb-8 max-w-4xl mx-auto font-[Inter,sans-serif]">
            Hire Faster. Spend Less. Stay Simple.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link href="/beta">
              <Button className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-md font-medium text-base transition-colors w-full sm:w-auto">
                Start Free in Beta
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Button 
              variant="outline" 
              className="border-[#1F3A5F] text-[#1F3A5F] hover:bg-[#1F3A5F] hover:text-white px-8 py-4 rounded-md font-medium text-base transition-colors w-full sm:w-auto"
              onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
            >
              See It in Action
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>

          {/* Trust Note */}
          <p className="text-sm text-[#5C667B] mb-8 font-[Inter,sans-serif]">
            Trusted by growing SMB teams & boutique staffing agencies.
          </p>

          {/* Clarification Text */}
          <div className="mb-12 max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 text-sm text-[#5C667B]">
              <div className="text-center p-5 bg-green-50 rounded-xl border border-green-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="font-semibold text-green-800 mb-2 text-base">Beta Access</div>
                <div className="leading-relaxed">Application required. Free forever during beta. Direct feedback shapes the product.</div>
              </div>
              <div className="text-center p-5 bg-[#EBF4FF] rounded-xl border border-[#1F3A5F]/20 shadow-sm hover:shadow-md transition-shadow">
                <div className="font-semibold text-[#1F3A5F] mb-2 text-base">Quick Start</div>
                <div className="leading-relaxed">Immediate access. Self-service setup. Standard pricing applies after beta period.</div>
              </div>
            </div>
          </div>
          
          {/* Responsive Placeholder Image/Video Section */}
          <div className="mb-12 relative max-w-5xl mx-auto">
            <div className="rounded-xl shadow-xl border overflow-hidden bg-gradient-to-br from-[#F0F4F8] to-[#E6F0FF] p-6 md:p-8 aspect-video flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 md:w-16 md:h-16 text-[#5C667B] mx-auto mb-4" />
                <p className="text-[#1A1A1A] text-base md:text-lg font-medium font-[Inter,sans-serif]">Product Demo Video Coming Soon</p>
              </div>
            </div>
          </div>

          {/* Scroll Affordance */}
          <div className="flex flex-col items-center">
            <p className="text-sm text-[#5C667B] mb-2 font-[Inter,sans-serif]">Discover more</p>
            <button 
              onClick={() => document.querySelector('#why-talentpatriot')?.scrollIntoView({ behavior: 'smooth' })}
              className="animate-bounce p-2 rounded-full hover:bg-white/50 transition-colors focus:outline-none focus:ring-2 focus:ring-[#1F3A5F] focus:ring-offset-2"
              aria-label="Scroll to learn more about TalentPatriot"
            >
              <ChevronDown className="w-6 h-6 text-[#5C667B]" />
            </button>
          </div>
        </div>
      </section>

      {/* Why TalentPatriot Section */}
      <section id="why-talentpatriot" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] text-center mb-12 font-[Inter,sans-serif]">
            Why TalentPatriot
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <Card className="group relative bg-white border border-[#D1E7FF] shadow-sm hover:shadow-xl hover:border-[#264C99] transition-all duration-300 hover:-translate-y-1 overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#264C99] to-[#1F3A5F] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardContent className="p-8 text-center relative">
                <div className="w-20 h-20 bg-gradient-to-br from-[#D1E7FF] to-[#E8F2FF] rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg border border-[#B8D4FF]">
                  <DollarSign className="w-10 h-10 text-[#1F3A5F]" />
                </div>
                <h3 className="text-xl font-bold text-[#0F1419] mb-4 font-[Inter,sans-serif] group-hover:text-[#264C99] transition-colors duration-300">Fair Pricing</h3>
                <p className="text-base text-[#3D4852] font-[Inter,sans-serif] leading-relaxed font-medium">
                  Only recruiter seats cost. Unlimited collaborators are always free.
                </p>
              </CardContent>
            </Card>
            
            <Card className="group relative bg-white border border-[#D1E7FF] shadow-sm hover:shadow-xl hover:border-[#1F3A5F] transition-all duration-300 hover:-translate-y-1 overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#1F3A5F] to-[#264C99] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardContent className="p-8 text-center relative">
                <div className="w-20 h-20 bg-gradient-to-br from-[#E8F2FF] to-[#D1E7FF] rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg border border-[#B8D4FF]">
                  <Shield className="w-10 h-10 text-[#1F3A5F]" />
                </div>
                <h3 className="text-xl font-bold text-[#0F1419] mb-4 font-[Inter,sans-serif] group-hover:text-[#1F3A5F] transition-colors duration-300">Accessibility-First</h3>
                <p className="text-base text-[#3D4852] font-[Inter,sans-serif] leading-relaxed font-medium">
                  WCAG-minded, inclusive by design.
                </p>
              </CardContent>
            </Card>
            
            <Card className="group relative bg-white border border-[#D1E7FF] shadow-sm hover:shadow-xl hover:border-[#264C99] transition-all duration-300 hover:-translate-y-1 overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#264C99] to-[#1F3A5F] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardContent className="p-8 text-center relative">
                <div className="w-20 h-20 bg-gradient-to-br from-[#D1E7FF] to-[#E8F2FF] rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg border border-[#B8D4FF]">
                  <Building2 className="w-10 h-10 text-[#1F3A5F]" />
                </div>
                <h3 className="text-xl font-bold text-[#0F1419] mb-4 font-[Inter,sans-serif] group-hover:text-[#264C99] transition-colors duration-300">Multi-client Pipelines</h3>
                <p className="text-base text-[#3D4852] font-[Inter,sans-serif] leading-relaxed font-medium">
                  Ideal for boutique staffing firms and consultants.
                </p>
              </CardContent>
            </Card>

            <Card className="group relative bg-white border border-[#D1E7FF] shadow-sm hover:shadow-xl hover:border-[#1F3A5F] transition-all duration-300 hover:-translate-y-1 overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#1F3A5F] to-[#264C99] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardContent className="p-8 text-center relative">
                <div className="w-20 h-20 bg-gradient-to-br from-[#E8F2FF] to-[#D1E7FF] rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg border border-[#B8D4FF]">
                  <Rocket className="w-10 h-10 text-[#1F3A5F]" />
                </div>
                <h3 className="text-xl font-bold text-[#0F1419] mb-4 font-[Inter,sans-serif] group-hover:text-[#1F3A5F] transition-colors duration-300">Go Live in Under a Day</h3>
                <p className="text-base text-[#3D4852] font-[Inter,sans-serif] leading-relaxed font-medium">
                  5-step onboarding + branded careers page.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-[#F7F9FC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] text-center mb-12 font-[Inter,sans-serif]">
            How It Works
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <Card className="group relative bg-white border border-[#D1E7FF] shadow-sm hover:shadow-lg hover:border-[#264C99] transition-all duration-300 hover:-translate-y-1 min-h-[280px] sm:min-h-[320px]">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#264C99] to-[#1F3A5F] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardContent className="p-6 sm:p-8 text-center h-full flex flex-col">
                <div className="w-20 h-20 bg-gradient-to-br from-[#E6F2FF] to-[#D1E7FF] rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-105 transition-transform duration-300 shadow-md border border-[#B8D4FF]">
                  <span className="text-3xl font-bold text-[#1F3A5F] font-[Inter,sans-serif]">1</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-[#1A1A1A] mb-4 font-[Inter,sans-serif] group-hover:text-[#264C99] transition-colors duration-300 leading-tight">
                  Post a job on your branded page
                </h3>
                <p className="text-base text-[#5C667B] leading-relaxed font-[Inter,sans-serif] flex-grow">
                  Create job listings and publish them on your custom careers page with full branding control
                </p>
              </CardContent>
            </Card>
            
            <Card className="group relative bg-white border border-[#D1E7FF] shadow-sm hover:shadow-lg hover:border-[#1F3A5F] transition-all duration-300 hover:-translate-y-1 min-h-[280px] sm:min-h-[320px]">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#1F3A5F] to-[#264C99] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardContent className="p-6 sm:p-8 text-center h-full flex flex-col">
                <div className="w-20 h-20 bg-gradient-to-br from-[#D1E7FF] to-[#E6F2FF] rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-105 transition-transform duration-300 shadow-md border border-[#B8D4FF]">
                  <span className="text-3xl font-bold text-[#1F3A5F] font-[Inter,sans-serif]">2</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-[#1A1A1A] mb-4 font-[Inter,sans-serif] group-hover:text-[#1F3A5F] transition-colors duration-300 leading-tight">
                  AI auto-parses resumes & surfaces strong fits
                </h3>
                <p className="text-base text-[#5C667B] leading-relaxed font-[Inter,sans-serif] flex-grow">
                  Our AI automatically extracts key information and highlights top candidates for faster screening
                </p>
              </CardContent>
            </Card>
            
            <Card className="group relative bg-white border border-[#D1E7FF] shadow-sm hover:shadow-lg hover:border-[#264C99] transition-all duration-300 hover:-translate-y-1 min-h-[280px] sm:min-h-[320px] md:col-span-1">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#264C99] to-[#1F3A5F] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardContent className="p-6 sm:p-8 text-center h-full flex flex-col">
                <div className="w-20 h-20 bg-gradient-to-br from-[#E6F2FF] to-[#D1E7FF] rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-105 transition-transform duration-300 shadow-md border border-[#B8D4FF]">
                  <span className="text-3xl font-bold text-[#1F3A5F] font-[Inter,sans-serif]">3</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-[#1A1A1A] mb-4 font-[Inter,sans-serif] group-hover:text-[#264C99] transition-colors duration-300 leading-tight">
                  Drag-and-drop candidates through your pipeline
                </h3>
                <p className="text-base text-[#5C667B] leading-relaxed font-[Inter,sans-serif] flex-grow">
                  Move candidates through stages and collaborate with your team seamlessly
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] text-center mb-12 font-[Inter,sans-serif]">
            Features
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            <Card className="group relative bg-white border border-[#D1E7FF] shadow-sm hover:shadow-xl hover:border-[#264C99] transition-all duration-300 hover:-translate-y-1 min-h-[200px] focus-within:ring-2 focus-within:ring-[#1F3A5F] focus-within:ring-offset-2">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#264C99] to-[#1F3A5F] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardContent className="p-6 sm:p-8 text-center h-full flex flex-col justify-center">
                <div className="w-20 h-20 bg-gradient-to-br from-[#D1E7FF] to-[#E8F2FF] rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg border border-[#B8D4FF]">
                  <Sparkles className="w-10 h-10 text-[#1F3A5F]" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-[#0F1419] mb-3 font-[Inter,sans-serif] group-hover:text-[#264C99] transition-colors duration-300 leading-tight">Drag-and-drop pipelines</h3>
                <p className="text-sm text-[#5C667B] leading-relaxed font-[Inter,sans-serif]">Visual Kanban boards for seamless candidate management</p>
              </CardContent>
            </Card>
            
            <Card className="group relative bg-white border border-[#D1E7FF] shadow-sm hover:shadow-xl hover:border-[#1F3A5F] transition-all duration-300 hover:-translate-y-1 min-h-[200px] focus-within:ring-2 focus-within:ring-[#1F3A5F] focus-within:ring-offset-2">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#1F3A5F] to-[#264C99] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardContent className="p-6 sm:p-8 text-center h-full flex flex-col justify-center">
                <div className="w-20 h-20 bg-gradient-to-br from-[#E8F2FF] to-[#D1E7FF] rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg border border-[#B8D4FF]">
                  <Users className="w-10 h-10 text-[#1F3A5F]" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-[#0F1419] mb-3 font-[Inter,sans-serif] group-hover:text-[#1F3A5F] transition-colors duration-300 leading-tight">Candidate profiles & advanced search</h3>
                <p className="text-sm text-[#5C667B] leading-relaxed font-[Inter,sans-serif]">Comprehensive profiles with powerful filtering</p>
              </CardContent>
            </Card>
            
            <Card className="group relative bg-white border border-[#D1E7FF] shadow-sm hover:shadow-xl hover:border-[#264C99] transition-all duration-300 hover:-translate-y-1 min-h-[200px] focus-within:ring-2 focus-within:ring-[#1F3A5F] focus-within:ring-offset-2">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#264C99] to-[#1F3A5F] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardContent className="p-6 sm:p-8 text-center h-full flex flex-col justify-center">
                <div className="w-20 h-20 bg-gradient-to-br from-[#D1E7FF] to-[#E8F2FF] rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg border border-[#B8D4FF]">
                  <FileText className="w-10 h-10 text-[#1F3A5F]" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-[#0F1419] mb-3 font-[Inter,sans-serif] group-hover:text-[#264C99] transition-colors duration-300 leading-tight">Notes, mentions, reminders</h3>
                <p className="text-sm text-[#5C667B] leading-relaxed font-[Inter,sans-serif]">Team collaboration with smart notifications</p>
              </CardContent>
            </Card>
            
            <Card className="group relative bg-white border border-[#D1E7FF] shadow-sm hover:shadow-xl hover:border-[#1F3A5F] transition-all duration-300 hover:-translate-y-1 min-h-[200px] focus-within:ring-2 focus-within:ring-[#1F3A5F] focus-within:ring-offset-2">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#1F3A5F] to-[#264C99] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardContent className="p-6 sm:p-8 text-center h-full flex flex-col justify-center">
                <div className="w-20 h-20 bg-gradient-to-br from-[#E8F2FF] to-[#D1E7FF] rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg border border-[#B8D4FF]">
                  <Bell className="w-10 h-10 text-[#1F3A5F]" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-[#0F1419] mb-3 font-[Inter,sans-serif] group-hover:text-[#1F3A5F] transition-colors duration-300 leading-tight">Interview scheduling & email notifications</h3>
                <p className="text-sm text-[#5C667B] leading-relaxed font-[Inter,sans-serif]">Automated workflows for seamless coordination</p>
              </CardContent>
            </Card>

            <Card className="group relative bg-white border border-[#D1E7FF] shadow-sm hover:shadow-xl hover:border-[#264C99] transition-all duration-300 hover:-translate-y-1 min-h-[200px] focus-within:ring-2 focus-within:ring-[#1F3A5F] focus-within:ring-offset-2">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#264C99] to-[#1F3A5F] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardContent className="p-6 sm:p-8 text-center h-full flex flex-col justify-center">
                <div className="w-20 h-20 bg-gradient-to-br from-[#D1E7FF] to-[#E8F2FF] rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg border border-[#B8D4FF]">
                  <BarChart3 className="w-10 h-10 text-[#1F3A5F]" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-[#0F1419] mb-3 font-[Inter,sans-serif] group-hover:text-[#264C99] transition-colors duration-300 leading-tight">Dashboards & job performance analytics</h3>
                <p className="text-sm text-[#5C667B] leading-relaxed font-[Inter,sans-serif]">Data-driven insights for better hiring decisions</p>
              </CardContent>
            </Card>

            <Card className="group relative bg-white border border-[#D1E7FF] shadow-sm hover:shadow-xl hover:border-[#1F3A5F] transition-all duration-300 hover:-translate-y-1 min-h-[200px] focus-within:ring-2 focus-within:ring-[#1F3A5F] focus-within:ring-offset-2">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#1F3A5F] to-[#264C99] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardContent className="p-6 sm:p-8 text-center h-full flex flex-col justify-center">
                <div className="w-20 h-20 bg-gradient-to-br from-[#E8F2FF] to-[#D1E7FF] rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg border border-[#B8D4FF]">
                  <Building2 className="w-10 h-10 text-[#1F3A5F]" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-[#0F1419] mb-3 font-[Inter,sans-serif] group-hover:text-[#1F3A5F] transition-colors duration-300 leading-tight">CRM-lite Talent Pools</h3>
                <p className="text-sm text-[#5C667B] leading-relaxed font-[Inter,sans-serif]">Organize and nurture your candidate network.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Demo Video Section */}
      <section id="demo" className="py-16 bg-[#F7F9FC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] text-center mb-12 font-[Inter,sans-serif]">
            See TalentPatriot in Action
          </h2>
          
          <div className="max-w-4xl mx-auto">
            <Card className="overflow-hidden border border-[#D1E7FF] shadow-xl">
              <CardContent className="p-0">
                <AspectRatio ratio={16 / 9}>
                  <div className="w-full h-full bg-gradient-to-br from-[#F0F4F8] to-[#E6F0FF] flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <Play className="w-8 h-8 text-[#1F3A5F] ml-1" />
                      </div>
                      <p className="text-[#1A1A1A] text-lg font-medium font-[Inter,sans-serif] mb-2">Product Demo Video</p>
                      <p className="text-[#5C667B] text-sm font-[Inter,sans-serif]">Coming Soon</p>
                    </div>
                  </div>
                </AspectRatio>
              </CardContent>
            </Card>
            
            <div className="text-center mt-4">
              <p className="text-sm text-[#5C667B] font-[Inter,sans-serif] mb-2">Two-minute product tour with captions available</p>
              <Link href="/demo-transcript">
                <Button variant="outline" size="sm" className="text-[#1F3A5F] border-[#1F3A5F] hover:bg-[#1F3A5F] hover:text-white">
                  View transcript
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Strip */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] text-center mb-12 font-[Inter,sans-serif]">
            Enterprise Power. SMB Simplicity.
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <Card className="group relative bg-white border border-[#D1E7FF] shadow-sm hover:shadow-xl hover:border-[#264C99] transition-all duration-300 hover:-translate-y-1">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#264C99] to-[#1F3A5F] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-[#D1E7FF] to-[#E8F2FF] rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg border border-[#B8D4FF]">
                  <DollarSign className="w-10 h-10 text-[#1F3A5F]" />
                </div>
                <h3 className="text-xl font-bold text-[#0F1419] mb-4 font-[Inter,sans-serif] group-hover:text-[#264C99] transition-colors duration-300">Fair Pricing</h3>
                <p className="text-base text-[#3D4852] font-[Inter,sans-serif] leading-relaxed">
                  Only recruiter seats pay — unlimited collaborators free
                </p>
              </CardContent>
            </Card>
            
            <Card className="group relative bg-white border border-[#D1E7FF] shadow-sm hover:shadow-xl hover:border-[#1F3A5F] transition-all duration-300 hover:-translate-y-1">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#1F3A5F] to-[#264C99] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-[#E8F2FF] to-[#D1E7FF] rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg border border-[#B8D4FF]">
                  <Shield className="w-10 h-10 text-[#1F3A5F]" />
                </div>
                <h3 className="text-xl font-bold text-[#0F1419] mb-4 font-[Inter,sans-serif] group-hover:text-[#1F3A5F] transition-colors duration-300">Accessibility-First</h3>
                <p className="text-base text-[#3D4852] font-[Inter,sans-serif] leading-relaxed">
                  Accessibility-first (WCAG-minded)
                </p>
              </CardContent>
            </Card>
            
            <Card className="group relative bg-white border border-[#D1E7FF] shadow-sm hover:shadow-xl hover:border-[#264C99] transition-all duration-300 hover:-translate-y-1">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#264C99] to-[#1F3A5F] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-[#D1E7FF] to-[#E8F2FF] rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg border border-[#B8D4FF]">
                  <Rocket className="w-10 h-10 text-[#1F3A5F]" />
                </div>
                <h3 className="text-xl font-bold text-[#0F1419] mb-4 font-[Inter,sans-serif] group-hover:text-[#264C99] transition-colors duration-300">Quick Launch</h3>
                <p className="text-base text-[#3D4852] font-[Inter,sans-serif] leading-relaxed">
                  Launch in under a day
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Bottom CTA Section */}
      <section className="py-16 bg-[#F7F9FC]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-12 text-center">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#1A1A1A] mb-8 font-[Inter,sans-serif]">
            Stop Wrestling with Clunky ATSs. Start Hiring Smarter.
          </h2>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/beta">
              <Button className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-md font-medium text-base transition-colors w-full sm:w-auto">
                Start Free in Beta
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Button 
              variant="outline" 
              className="border-[#1F3A5F] text-[#1F3A5F] hover:bg-[#1F3A5F] hover:text-white px-8 py-4 rounded-md font-medium text-base transition-colors w-full sm:w-auto"
              onClick={() => {
                // Simple demo request logic - could integrate with calendly or similar
                window.location.href = 'mailto:demo@talentpatriot.com?subject=Demo Request&body=I would like to request a demo of TalentPatriot.'
              }}
            >
              Request a Demo
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>
      </main>

      {/* Footer */}
      <footer className="bg-white py-12 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                <img 
                  src="/talentpatriot-logo.png" 
                  alt="TalentPatriot Logo" 
                  className="w-8 h-8 object-contain"
                  loading="lazy"
                />
              </div>
              <span className="text-lg font-semibold text-[#1A1A1A] font-[Inter,sans-serif]">TalentPatriot</span>
            </div>
            
            <nav className="flex flex-wrap justify-center gap-4 md:gap-6 text-sm text-[#5C667B] text-center font-[Inter,sans-serif]">
              <Link href="/about" className="hover:text-[#1A1A1A] transition-colors px-2">About</Link>
              <Link href="/privacy" className="hover:text-[#1A1A1A] transition-colors px-2">Privacy</Link>
              <Link href="/terms" className="hover:text-[#1A1A1A] transition-colors px-2">Terms</Link>
              <a href="mailto:contact@talentpatriot.com" className="hover:text-[#1A1A1A] transition-colors px-2">Contact</a>
            </nav>
            
            <p className="text-sm text-[#5C667B] text-center font-[Inter,sans-serif]">
              © 2025 TalentPatriot
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}