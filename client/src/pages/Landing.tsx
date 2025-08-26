import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
  ChevronDown
} from 'lucide-react'
import { Link } from 'wouter'
import { flags } from '@/lib/flags'

export default function Landing() {
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
            SMB-First ATS with Built-In AI & Fair Pricing
          </h1>
          
          <p className="text-lg md:text-xl lg:text-2xl text-[#1F3A5F] font-medium mb-8 max-w-4xl mx-auto font-[Inter,sans-serif]">
            Post jobs, parse resumes automatically, and launch your branded careers page in under a day—pay only for recruiter seats, while collaborators are always free.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link href="/beta">
              <Button className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-md font-medium text-base transition-colors w-full sm:w-auto">
                Apply for Beta Access
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
            Trusted by growing SMB teams & boutique agencies. Free during private beta.
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            <Card className="group relative bg-white border border-[#D1E7FF] shadow-sm hover:shadow-xl hover:border-[#264C99] transition-all duration-300 hover:-translate-y-1 overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#264C99] to-[#1F3A5F] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardContent className="p-8 text-center relative">
                <div className="w-20 h-20 bg-gradient-to-br from-[#D1E7FF] to-[#E8F2FF] rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg border border-[#B8D4FF]">
                  <Zap className="w-10 h-10 text-[#1F3A5F]" />
                </div>
                <h3 className="text-xl font-bold text-[#0F1419] mb-4 font-[Inter,sans-serif] group-hover:text-[#264C99] transition-colors duration-300">Built-in AI for parsing & matching</h3>
                <p className="text-base text-[#3D4852] font-[Inter,sans-serif] leading-relaxed font-medium">
                  Find qualified candidates fast
                </p>
              </CardContent>
            </Card>
            
            <Card className="group relative bg-white border border-[#D1E7FF] shadow-sm hover:shadow-xl hover:border-[#1F3A5F] transition-all duration-300 hover:-translate-y-1 overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#1F3A5F] to-[#264C99] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardContent className="p-8 text-center relative">
                <div className="w-20 h-20 bg-gradient-to-br from-[#E8F2FF] to-[#D1E7FF] rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg border border-[#B8D4FF]">
                  <DollarSign className="w-10 h-10 text-[#1F3A5F]" />
                </div>
                <h3 className="text-xl font-bold text-[#0F1419] mb-4 font-[Inter,sans-serif] group-hover:text-[#1F3A5F] transition-colors duration-300">Only recruiter seats cost</h3>
                <p className="text-base text-[#3D4852] font-[Inter,sans-serif] leading-relaxed font-medium">
                  Add unlimited hiring managers & viewers for free
                </p>
              </CardContent>
            </Card>
            
            <Card className="group relative bg-white border border-[#D1E7FF] shadow-sm hover:shadow-xl hover:border-[#264C99] transition-all duration-300 hover:-translate-y-1 overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#264C99] to-[#1F3A5F] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardContent className="p-8 text-center relative">
                <div className="w-20 h-20 bg-gradient-to-br from-[#D1E7FF] to-[#E8F2FF] rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg border border-[#B8D4FF]">
                  <Building2 className="w-10 h-10 text-[#1F3A5F]" />
                </div>
                <h3 className="text-xl font-bold text-[#0F1419] mb-4 font-[Inter,sans-serif] group-hover:text-[#264C99] transition-colors duration-300">Multi-client pipelines</h3>
                <p className="text-base text-[#3D4852] font-[Inter,sans-serif] leading-relaxed font-medium">
                  Great for small staffing firms and internal HR
                </p>
              </CardContent>
            </Card>

            <Card className="group relative bg-white border border-[#D1E7FF] shadow-sm hover:shadow-xl hover:border-[#1F3A5F] transition-all duration-300 hover:-translate-y-1 overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#1F3A5F] to-[#264C99] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardContent className="p-8 text-center relative">
                <div className="w-20 h-20 bg-gradient-to-br from-[#E8F2FF] to-[#D1E7FF] rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg border border-[#B8D4FF]">
                  <Shield className="w-10 h-10 text-[#1F3A5F]" />
                </div>
                <h3 className="text-xl font-bold text-[#0F1419] mb-4 font-[Inter,sans-serif] group-hover:text-[#1F3A5F] transition-colors duration-300">Accessibility-first (WCAG-minded)</h3>
                <p className="text-base text-[#3D4852] font-[Inter,sans-serif] leading-relaxed font-medium">
                  Inclusive by design
                </p>
              </CardContent>
            </Card>

            <Card className="group relative bg-white border border-[#D1E7FF] shadow-sm hover:shadow-xl hover:border-[#264C99] transition-all duration-300 hover:-translate-y-1 overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#264C99] to-[#1F3A5F] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardContent className="p-8 text-center relative">
                <div className="w-20 h-20 bg-gradient-to-br from-[#D1E7FF] to-[#E8F2FF] rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg border border-[#B8D4FF]">
                  <Rocket className="w-10 h-10 text-[#1F3A5F]" />
                </div>
                <h3 className="text-xl font-bold text-[#0F1419] mb-4 font-[Inter,sans-serif] group-hover:text-[#264C99] transition-colors duration-300">Launch in under a day</h3>
                <p className="text-base text-[#3D4852] font-[Inter,sans-serif] leading-relaxed font-medium">
                  5-step onboarding + branded careers page
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
                <h3 className="text-lg sm:text-xl font-bold text-[#0F1419] mb-3 font-[Inter,sans-serif] group-hover:text-[#1F3A5F] transition-colors duration-300 leading-tight">CRM-lite for contacts (talent pools)</h3>
                <p className="text-sm text-[#5C667B] leading-relaxed font-[Inter,sans-serif]">Organize and nurture your talent network</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Demo Video Section */}
      <section id="demo" aria-label="Product demo" className="py-16 bg-[#F7F9FC]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] text-center mb-12 font-[Inter,sans-serif]">
            See TalentPatriot in Action
          </h2>
          
          <div className="relative w-full max-w-4xl mx-auto aspect-video rounded-2xl overflow-hidden shadow-lg">
            <video 
              controls 
              preload="metadata" 
              poster="/video-tour.jpg"
              className="w-full h-full bg-white"
              aria-describedby="video-description"
            >
              <source src="/video-tour.webm" type="video/webm" />
              <source src="/video-tour.mp4" type="video/mp4" />
              <track kind="captions" src="/video-tour.vtt" srcLang="en" label="English" default />
              Your browser does not support the video tag. Please <a href="/video-tour.mp4" className="text-[#1F3A5F] underline">download the video</a> to watch.
            </video>
          </div>
          
          <div className="text-center mt-6">
            <p id="video-description" className="text-sm text-[#5C667B] mb-2 font-[Inter,sans-serif]">
              Two-minute product tour with captions available
            </p>
            <a 
              href="/video-transcript.txt" 
              className="text-sm text-[#1F3A5F] hover:text-[#264C99] underline font-[Inter,sans-serif] focus:outline-none focus:ring-2 focus:ring-[#1F3A5F] focus:ring-offset-2 rounded"
              target="_blank" 
              rel="noopener noreferrer"
            >
              View transcript
            </a>
          </div>
          
          <p className="sr-only">Two-minute tour with captions available.</p>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <Card className="group relative bg-white border border-[#D1E7FF] shadow-sm hover:shadow-xl hover:border-[#264C99] transition-all duration-300 hover:-translate-y-1 focus-within:ring-2 focus-within:ring-[#1F3A5F] focus-within:ring-offset-2">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#264C99] to-[#1F3A5F] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardContent className="p-8 sm:p-10 relative">
                <div className="absolute top-6 left-6 w-8 h-8 bg-gradient-to-br from-[#E6F2FF] to-[#D1E7FF] rounded-full flex items-center justify-center shadow-md border border-[#B8D4FF]">
                  <span className="text-2xl text-[#1F3A5F] font-serif leading-none">"</span>
                </div>
                <blockquote className="mt-6">
                  <p className="text-lg sm:text-xl text-[#1A1A1A] mb-6 font-[Inter,sans-serif] leading-relaxed italic group-hover:text-[#0F1419] transition-colors duration-300">
                    We filled roles faster, and didn't pay for hiring manager logins.
                  </p>
                  <footer className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#D1E7FF] to-[#E6F2FF] rounded-full flex items-center justify-center border border-[#B8D4FF]">
                      <UserCheck className="w-5 h-5 text-[#1F3A5F]" />
                    </div>
                    <cite className="text-sm text-[#5C667B] font-medium not-italic font-[Inter,sans-serif]">
                      SMB Recruiter
                    </cite>
                  </footer>
                </blockquote>
              </CardContent>
            </Card>
            
            <Card className="group relative bg-white border border-[#D1E7FF] shadow-sm hover:shadow-xl hover:border-[#1F3A5F] transition-all duration-300 hover:-translate-y-1 focus-within:ring-2 focus-within:ring-[#1F3A5F] focus-within:ring-offset-2">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#1F3A5F] to-[#264C99] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardContent className="p-8 sm:p-10 relative">
                <div className="absolute top-6 left-6 w-8 h-8 bg-gradient-to-br from-[#E6F2FF] to-[#D1E7FF] rounded-full flex items-center justify-center shadow-md border border-[#B8D4FF]">
                  <span className="text-2xl text-[#1F3A5F] font-serif leading-none">"</span>
                </div>
                <blockquote className="mt-6">
                  <p className="text-lg sm:text-xl text-[#1A1A1A] mb-6 font-[Inter,sans-serif] leading-relaxed italic group-hover:text-[#0F1419] transition-colors duration-300">
                    Multi-client pipelines = less chaos for our boutique agency.
                  </p>
                  <footer className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#D1E7FF] to-[#E6F2FF] rounded-full flex items-center justify-center border border-[#B8D4FF]">
                      <Building2 className="w-5 h-5 text-[#1F3A5F]" />
                    </div>
                    <cite className="text-sm text-[#5C667B] font-medium not-italic font-[Inter,sans-serif]">
                      Agency Owner
                    </cite>
                  </footer>
                </blockquote>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Teaser Section */}
      <section className="py-16 bg-[#F7F9FC]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-6 font-[Inter,sans-serif]">
            Pricing Designed for SMBs
          </h2>
          <p className="text-lg md:text-xl text-[#5C667B] mb-8 font-[Inter,sans-serif]">
            From $129/month for 3 recruiter seats, unlimited collaborators included.
          </p>
          <Link href="/pricing">
            <Button className="bg-[#1F3A5F] hover:bg-[#264C99] text-white px-8 py-4 rounded-md font-medium text-base transition-colors">
              View Pricing
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-12 text-center">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#1A1A1A] mb-8 font-[Inter,sans-serif]">
            Ready to Hire Smarter?
          </h2>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link href="/beta">
              <Button className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-md font-medium text-base transition-colors w-full sm:w-auto">
                Apply for Beta Access
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Button 
              variant="outline" 
              className="border-[#1F3A5F] text-[#1F3A5F] hover:bg-[#1F3A5F] hover:text-white px-8 py-4 rounded-md font-medium text-base transition-colors w-full sm:w-auto"
              onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Watch a 2-min Tour
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Email Capture Section */}
      <section className="py-16 bg-gradient-to-br from-[#1F3A5F] to-[#264C99] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-12 text-center">
          <Mail className="w-12 h-12 mx-auto mb-6 opacity-90" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white font-[Inter,sans-serif]">
            Get Early Access Updates
          </h2>
          <p className="text-xl mb-8 text-white/95 max-w-2xl mx-auto font-[Inter,sans-serif] leading-relaxed">
            Not ready for the full beta application? Get notified about product updates, 
            new features, and early access opportunities.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
            <Input 
              type="email" 
              placeholder="Enter your email address"
              className="flex-1 bg-white/10 border-white/30 text-white placeholder:text-white/70 focus:bg-white/20 focus:border-white/60 focus:ring-white/20 px-4 py-3 rounded-lg"
            />
            <Button className="bg-white text-[#1F3A5F] hover:bg-white/90 px-8 py-3 font-medium whitespace-nowrap rounded-lg shadow-lg hover:shadow-xl transition-all">
              Get Updates
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
          
          <p className="text-sm text-white/90 mt-6 font-[Inter,sans-serif]">
            No spam. Unsubscribe anytime. Updates about TalentPatriot's development only.
          </p>
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