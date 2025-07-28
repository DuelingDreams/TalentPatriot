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
        <div className="tp-container px-6 md:px-12">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center">
                <img 
                  src="/tp-logo.png" 
                  alt="TalentPatriot Logo" 
                  className="w-10 h-10 object-contain"
                />
              </div>
              <h1 className="text-2xl font-bold text-[#1A1A1A] tracking-tight">
                TalentPatriot
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" className="text-[#5C667B] hover:text-[#1A1A1A] font-medium text-base px-4 py-2 transition">
                  Sign In
                </Button>
              </Link>
              <Link href="/onboarding/step1">
                <Button className="btn-primary font-medium text-base whitespace-nowrap">
                  Start Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 py-12 bg-[#F7F9FC]">
        <div className="max-w-7xl mx-auto px-6 md:px-12 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#1A1A1A] mb-6 tracking-tight font-[Inter,sans-serif]">
            The Simple ATS + CRM Built for Growing Teams
          </h1>
          
          <p className="text-xl md:text-2xl text-[#1F3A5F] font-medium mb-8 max-w-4xl mx-auto font-[Inter,sans-serif]">
            Stop losing track of candidates and start hiring smarter.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/onboarding/step1">
              <Button className="bg-[#1F3A5F] hover:bg-[#264C99] text-white px-6 py-3 rounded-md font-medium text-base transition-colors">
                Start Free
              </Button>
            </Link>
            <Button 
              variant="outline" 
              className="px-6 py-3 font-medium text-base"
            >
              Book a Demo
            </Button>
          </div>
          
          {/* Responsive Placeholder Image/Video Section */}
          <div className="mb-8 relative max-w-5xl mx-auto">
            <div className="rounded-xl shadow-xl border overflow-hidden bg-gradient-to-br from-[#F0F4F8] to-[#E6F0FF] p-8 aspect-video flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="w-16 h-16 text-[#5C667B] mx-auto mb-4" />
                <p className="text-[#1A1A1A] text-lg font-medium font-[Inter,sans-serif]">Product Demo Video Coming Soon</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who It's For Section */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] text-center mb-12 font-[Inter,sans-serif]">
            Built for Busy Recruiters, Founders, and Hiring Managers
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#E6F0FF] rounded-full flex items-center justify-center mx-auto mb-6">
                <UserCheck className="w-8 h-8 text-[#264C99]" />
              </div>
              <h3 className="text-xl font-semibold text-[#1A1A1A] mb-4 font-[Inter,sans-serif]">Recruiters</h3>
              <p className="text-base text-[#5C667B] font-[Inter,sans-serif]">
                Track candidates and communication in one place.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-[#E6F0FF] rounded-full flex items-center justify-center mx-auto mb-6">
                <Rocket className="w-8 h-8 text-[#1F3A5F]" />
              </div>
              <h3 className="text-xl font-semibold text-[#1A1A1A] mb-4 font-[Inter,sans-serif]">Founders</h3>
              <p className="text-base text-[#5C667B] font-[Inter,sans-serif]">
                Stay in the loop — even if you don't have a hiring team.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-[#E6F0FF] rounded-full flex items-center justify-center mx-auto mb-6">
                <Target className="w-8 h-8 text-[#264C99]" />
              </div>
              <h3 className="text-xl font-semibold text-[#1A1A1A] mb-4 font-[Inter,sans-serif]">Hiring Managers</h3>
              <p className="text-base text-[#5C667B] font-[Inter,sans-serif]">
                Ditch the spreadsheet. See the pipeline at a glance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 bg-[#F7F9FC]">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] text-center mb-12 font-[Inter,sans-serif]">
            Everything You Need — Nothing You Don't
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center mx-auto mb-6 shadow-sm">
                <Sparkles className="w-8 h-8 text-[#264C99]" />
              </div>
              <h3 className="text-lg font-semibold text-[#1A1A1A] mb-3 font-[Inter,sans-serif]">Drag-and-drop pipelines</h3>
              <p className="text-base text-[#5C667B] font-[Inter,sans-serif]">
                Move candidates through stages with simple drag and drop
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center mx-auto mb-6 shadow-sm">
                <Users className="w-8 h-8 text-[#1F3A5F]" />
              </div>
              <h3 className="text-lg font-semibold text-[#1A1A1A] mb-3 font-[Inter,sans-serif]">Candidate profiles</h3>
              <p className="text-base text-[#5C667B] font-[Inter,sans-serif]">
                All candidate information in one searchable place
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center mx-auto mb-6 shadow-sm">
                <FileText className="w-8 h-8 text-[#264C99]" />
              </div>
              <h3 className="text-lg font-semibold text-[#1A1A1A] mb-3 font-[Inter,sans-serif]">Notes and reminders</h3>
              <p className="text-base text-[#5C667B] font-[Inter,sans-serif]">
                Track every interaction and never miss follow-ups
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center mx-auto mb-6 shadow-sm">
                <Building2 className="w-8 h-8 text-[#1F3A5F]" />
              </div>
              <h3 className="text-lg font-semibold text-[#1A1A1A] mb-3 font-[Inter,sans-serif]">CRM-lite for contacts</h3>
              <p className="text-base text-[#5C667B] font-[Inter,sans-serif]">
                Build talent pools for future opportunities
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Screenshot/Video Section */}
      <section className="py-12 bg-white">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <div className="relative">
            <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200">
              <img 
                src="/job-pipeline-screenshot.png"
                alt="TalentPatriot Job Pipeline - Kanban view showing candidates moving through Applied, Phone Screen, Interview, Technical, Offer, Hired, and Rejected stages"
                className="w-full h-auto rounded-lg object-cover"
                loading="lazy"
              />
            </div>
            <div className="text-center mt-6">
              <p className="text-[#1A1A1A] text-lg font-medium font-[Inter,sans-serif]">
                See your entire hiring pipeline at a glance
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 bg-[#F7F9FC]">
        <div className="max-w-4xl mx-auto px-6 md:px-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-8 font-[Inter,sans-serif]">
            Start Hiring Smarter Today
          </h2>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/onboarding/step1">
              <Button className="bg-[#1F3A5F] hover:bg-[#264C99] text-white px-6 py-3 rounded-md font-medium text-base transition-colors">
                Start Free
              </Button>
            </Link>
            <Button 
              variant="outline" 
              className="px-6 py-3 font-medium text-base"
            >
              Book a Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-8 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                <img 
                  src="/tp-logo.png" 
                  alt="TalentPatriot Logo" 
                  className="w-8 h-8 object-contain"
                />
              </div>
              <span className="text-lg font-semibold text-[#1A1A1A] font-[Inter,sans-serif]">TalentPatriot</span>
            </div>
            
            <nav className="flex flex-wrap justify-center gap-6 text-sm text-[#5C667B] text-center font-[Inter,sans-serif]">
              <a href="#" className="hover:text-[#1A1A1A] transition-colors">About</a>
              <a href="#" className="hover:text-[#1A1A1A] transition-colors">Privacy</a>
              <a href="#" className="hover:text-[#1A1A1A] transition-colors">Terms</a>
              <a href="#" className="hover:text-[#1A1A1A] transition-colors">Contact</a>
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