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
  Mail
} from 'lucide-react'
import { Link } from 'wouter'

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#F7F9FC] font-[Inter,sans-serif]">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 fixed w-full z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center">
                <img 
                  src="/talentpatriot-logo.png" 
                  alt="TalentPatriot Logo" 
                  className="w-8 h-8 md:w-10 md:h-10 object-contain"
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
                <Button variant="outline" className="border-[#1F3A5F] text-[#1F3A5F] hover:bg-[#1F3A5F] hover:text-white font-medium text-sm md:text-base px-3 md:px-4 py-2 transition-colors">
                  Beta Access
                </Button>
              </Link>
              <Link href="/onboarding/step1">
                <Button className="bg-[#1F3A5F] hover:bg-[#264C99] text-white font-medium text-sm md:text-base px-4 md:px-6 py-2 whitespace-nowrap transition-colors">
                  Start Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 py-16 bg-[#F7F9FC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#1A1A1A] mb-6 tracking-tight font-[Inter,sans-serif]">
            The Simple ATS + CRM Built for Growing Teams
          </h1>
          
          <p className="text-lg md:text-xl lg:text-2xl text-[#1F3A5F] font-medium mb-8 max-w-4xl mx-auto font-[Inter,sans-serif]">
            Stop losing track of candidates and start hiring smarter.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link href="/beta">
              <Button className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-md font-medium text-base transition-colors w-full sm:w-auto">
                Apply for Beta Access
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/onboarding/step1">
              <Button variant="outline" className="border-[#1F3A5F] text-[#1F3A5F] hover:bg-[#1F3A5F] hover:text-white px-8 py-4 rounded-md font-medium text-base transition-colors w-full sm:w-auto">
                Quick Start
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>

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
          <div className="mb-8 relative max-w-5xl mx-auto">
            <div className="rounded-xl shadow-xl border overflow-hidden bg-gradient-to-br from-[#F0F4F8] to-[#E6F0FF] p-6 md:p-8 aspect-video flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 md:w-16 md:h-16 text-[#5C667B] mx-auto mb-4" />
                <p className="text-[#1A1A1A] text-base md:text-lg font-medium font-[Inter,sans-serif]">Product Demo Video Coming Soon</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who It's For Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] text-center mb-12 font-[Inter,sans-serif]">
            Built for Busy Recruiters, Founders, and Hiring Managers
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <Card className="group relative bg-white border border-[#D1E7FF] shadow-sm hover:shadow-xl hover:border-[#264C99] transition-all duration-300 hover:-translate-y-1 overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#264C99] to-[#1F3A5F] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardContent className="p-8 text-center relative">
                <div className="w-20 h-20 bg-gradient-to-br from-[#D1E7FF] to-[#E8F2FF] rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg border border-[#B8D4FF]">
                  <UserCheck className="w-10 h-10 text-[#1F3A5F]" />
                </div>
                <h3 className="text-xl font-bold text-[#0F1419] mb-4 font-[Inter,sans-serif] group-hover:text-[#264C99] transition-colors duration-300">Recruiters</h3>
                <p className="text-base text-[#3D4852] font-[Inter,sans-serif] leading-relaxed font-medium">
                  Track candidates and communication in one place.
                </p>
              </CardContent>
            </Card>
            
            <Card className="group relative bg-white border border-[#D1E7FF] shadow-sm hover:shadow-xl hover:border-[#1F3A5F] transition-all duration-300 hover:-translate-y-1 overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#1F3A5F] to-[#264C99] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardContent className="p-8 text-center relative">
                <div className="w-20 h-20 bg-gradient-to-br from-[#E8F2FF] to-[#D1E7FF] rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg border border-[#B8D4FF]">
                  <Rocket className="w-10 h-10 text-[#1F3A5F]" />
                </div>
                <h3 className="text-xl font-bold text-[#0F1419] mb-4 font-[Inter,sans-serif] group-hover:text-[#1F3A5F] transition-colors duration-300">Founders</h3>
                <p className="text-base text-[#3D4852] font-[Inter,sans-serif] leading-relaxed font-medium">
                  Stay in the loop — even if you don't have a hiring team.
                </p>
              </CardContent>
            </Card>
            
            <Card className="group relative bg-white border border-[#D1E7FF] shadow-sm hover:shadow-xl hover:border-[#264C99] transition-all duration-300 hover:-translate-y-1 overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#264C99] to-[#1F3A5F] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardContent className="p-8 text-center relative">
                <div className="w-20 h-20 bg-gradient-to-br from-[#D1E7FF] to-[#E8F2FF] rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg border border-[#B8D4FF]">
                  <Target className="w-10 h-10 text-[#1F3A5F]" />
                </div>
                <h3 className="text-xl font-bold text-[#0F1419] mb-4 font-[Inter,sans-serif] group-hover:text-[#264C99] transition-colors duration-300">Hiring Managers</h3>
                <p className="text-base text-[#3D4852] font-[Inter,sans-serif] leading-relaxed font-medium">
                  Ditch the spreadsheet. See the pipeline at a glance.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-[#F7F9FC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] text-center mb-12 font-[Inter,sans-serif]">
            Everything You Need — Nothing You Don't
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="group bg-white border border-[#D1E7FF] shadow-sm hover:shadow-lg hover:border-[#264C99] transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-[#D1E7FF] to-[#E8F2FF] rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-105 transition-transform duration-300 shadow-md border border-[#B8D4FF]">
                  <Sparkles className="w-8 h-8 text-[#1F3A5F]" />
                </div>
                <h3 className="text-lg font-bold text-[#0F1419] mb-3 font-[Inter,sans-serif] group-hover:text-[#264C99] transition-colors duration-300">Drag-and-drop pipelines</h3>
                <p className="text-sm text-[#3D4852] font-[Inter,sans-serif] leading-relaxed font-medium">
                  Move candidates through stages with simple drag and drop
                </p>
              </CardContent>
            </Card>
            
            <Card className="group bg-white border border-[#D1E7FF] shadow-sm hover:shadow-lg hover:border-[#1F3A5F] transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-[#E8F2FF] to-[#D1E7FF] rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-105 transition-transform duration-300 shadow-md border border-[#B8D4FF]">
                  <Users className="w-8 h-8 text-[#1F3A5F]" />
                </div>
                <h3 className="text-lg font-bold text-[#0F1419] mb-3 font-[Inter,sans-serif] group-hover:text-[#1F3A5F] transition-colors duration-300">Candidate profiles</h3>
                <p className="text-sm text-[#3D4852] font-[Inter,sans-serif] leading-relaxed font-medium">
                  All candidate information in one searchable place
                </p>
              </CardContent>
            </Card>
            
            <Card className="group bg-white border border-[#D1E7FF] shadow-sm hover:shadow-lg hover:border-[#264C99] transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-[#D1E7FF] to-[#E8F2FF] rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-105 transition-transform duration-300 shadow-md border border-[#B8D4FF]">
                  <FileText className="w-8 h-8 text-[#1F3A5F]" />
                </div>
                <h3 className="text-lg font-bold text-[#0F1419] mb-3 font-[Inter,sans-serif] group-hover:text-[#264C99] transition-colors duration-300">Notes and reminders</h3>
                <p className="text-sm text-[#3D4852] font-[Inter,sans-serif] leading-relaxed font-medium">
                  Track every interaction and never miss follow-ups
                </p>
              </CardContent>
            </Card>
            
            <Card className="group bg-white border border-[#D1E7FF] shadow-sm hover:shadow-lg hover:border-[#1F3A5F] transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-[#E8F2FF] to-[#D1E7FF] rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-105 transition-transform duration-300 shadow-md border border-[#B8D4FF]">
                  <Building2 className="w-8 h-8 text-[#1F3A5F]" />
                </div>
                <h3 className="text-lg font-bold text-[#0F1419] mb-3 font-[Inter,sans-serif] group-hover:text-[#1F3A5F] transition-colors duration-300">CRM-lite for contacts</h3>
                <p className="text-sm text-[#3D4852] font-[Inter,sans-serif] leading-relaxed font-medium">
                  Build talent pools for future opportunities
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Screenshot/Video Section */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-12">
          <div className="relative">
            <div className="bg-white p-3 md:p-4 rounded-xl shadow-lg border border-gray-200">
              <img 
                src="/job-pipeline-screenshot.png"
                alt="TalentPatriot Job Pipeline - Kanban view showing candidates moving through Applied, Phone Screen, Interview, Technical, Offer, Hired, and Rejected stages"
                className="w-full h-auto max-h-[500px] md:max-h-[600px] rounded-lg object-cover"
                loading="lazy"
              />
            </div>
            <div className="text-center mt-6">
              <p className="text-[#1A1A1A] text-base md:text-lg font-medium font-[Inter,sans-serif]">
                See your entire hiring pipeline at a glance
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-[#F7F9FC]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-12 text-center">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#1A1A1A] mb-8 font-[Inter,sans-serif]">
            Start Hiring Smarter Today
          </h2>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link href="/beta">
              <Button className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-md font-medium text-base transition-colors w-full sm:w-auto">
                Apply for Beta Access
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/onboarding/step1">
              <Button variant="outline" className="border-[#1F3A5F] text-[#1F3A5F] hover:bg-[#1F3A5F] hover:text-white px-8 py-4 rounded-md font-medium text-base transition-colors w-full sm:w-auto">
                Quick Start
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
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