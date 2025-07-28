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
              <Link href="/signup">
                <Button className="btn-primary font-medium text-base whitespace-nowrap">
                  Start Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 section-container bg-white">
        <div className="tp-container text-center md:text-left">
          <h1 className="heading-1 mb-6 tracking-tight">
            Effortless Hiring Starts Here
          </h1>
          
          <p className="text-lg md:text-xl body-text mb-8 max-w-3xl mx-auto md:mx-0">
            TalentPatriot helps small teams track jobs, move candidates through pipelines, 
            and hire faster — all in one intuitive platform.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start mb-12">
            <Link href="/signup">
              <Button variant="default" size="lg" className="w-full sm:w-auto">
                Start Free
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Book a Demo
              </Button>
            </Link>
          </div>
          
          {/* Dashboard Screenshot */}
          <div className="mb-8 relative max-w-5xl mx-auto">
            <div className="rounded-xl shadow-xl border overflow-hidden hover:scale-105 transition-transform duration-300 bg-gradient-to-br from-[#F0F4F8] to-[#E6F0FF] p-8 aspect-video flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="w-16 h-16 text-[#5C667B] mx-auto mb-4" />
                <p className="body-text text-[#1A1A1A] text-lg">TalentPatriot Dashboard</p>
              </div>
            </div>
          </div>
          
          <div className="label-text text-center md:text-left">
            Built for teams like yours • Trusted by SMB recruiters
          </div>
        </div>
      </section>

      {/* Who It's For Section */}
      <section className="section-container bg-[#F0F4F8]">
        <div className="tp-container">
          <h2 className="heading-2 text-center mb-8">
            Built for Busy Recruiters, Founders, and Hiring Managers
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-[#E6F0FF] rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserCheck className="w-6 h-6 text-[#264C99]" />
                </div>
                <h3 className="heading-3 mb-2">Recruiters</h3>
                <p className="body-text">
                  Track candidates and communicate in one place
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-[#E6F0FF] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Rocket className="w-6 h-6 text-[#1F3A5F]" />
                </div>
                <h3 className="heading-3 mb-2">Founders</h3>
                <p className="body-text">
                  Stay in the loop, even if you don't have a hiring team
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-[#E6F0FF] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-6 h-6 text-[#264C99]" />
                </div>
                <h3 className="heading-3 mb-2">Hiring Managers</h3>
                <p className="body-text">
                  See your pipeline without logging into spreadsheets
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="section-container bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="heading-2 text-center mb-8">
            Everything You Need — Nothing You Don't
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-4xl mb-4">🧩</div>
                <h3 className="heading-3 mb-3">Drag-and-drop job pipeline</h3>
                <p className="body-text">Move candidates through stages with a simple drag and drop</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-4xl mb-4">📇</div>
                <h3 className="heading-3 mb-3">Centralized candidate profiles</h3>
                <p className="body-text">All candidate information in one searchable database</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-4xl mb-4">📝</div>
                <h3 className="heading-3 mb-3">Notes, tags, and reminders</h3>
                <p className="body-text">Keep track of every interaction and never miss a follow-up</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-4xl mb-4">👥</div>
                <h3 className="heading-3 mb-3">CRM-lite for passive talent</h3>
                <p className="body-text">Build talent pools for future opportunities</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Screenshot Gallery */}
      <section className="tp-section bg-[#F0F4F8]">
        <div className="tp-container">
          <h2 className="tp-h2 text-center mb-8">
            See TalentPatriot in Action
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="tp-screenshot">
              <div className="bg-gradient-to-br from-[#F0F4F8] to-[#E6F0FF] p-6 aspect-video flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 text-[#5C667B] mx-auto mb-2" />
                  <p className="text-[#1A1A1A] tp-body font-medium">Candidate Dashboard</p>
                </div>
              </div>
            </div>
            
            <div className="tp-screenshot">
              <div className="bg-gradient-to-br from-[#E6F0FF] to-[#F0F4F8] p-6 aspect-video flex items-center justify-center">
                <div className="text-center">
                  <Target className="w-12 h-12 text-[#264C99] mx-auto mb-2" />
                  <p className="text-[#1A1A1A] tp-body font-medium">Job Pipeline View</p>
                </div>
              </div>
            </div>
            
            <div className="tp-screenshot">
              <div className="bg-gradient-to-br from-[#F0F4F8] to-[#E6F0FF] p-6 aspect-video flex items-center justify-center">
                <div className="text-center">
                  <UserCheck className="w-12 h-12 text-[#1F3A5F] mx-auto mb-2" />
                  <p className="text-[#1A1A1A] tp-body font-medium">Candidate Profile</p>
                </div>
              </div>
            </div>
            
            <div className="tp-screenshot">
              <div className="bg-gradient-to-br from-[#E6F0FF] to-[#F0F4F8] p-6 aspect-video flex items-center justify-center">
                <div className="text-center">
                  <Users className="w-12 h-12 text-[#264C99] mx-auto mb-2" />
                  <p className="text-[#1A1A1A] tp-body font-medium">Team Collaboration</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Teaser */}
      <section className="tp-section bg-[#F0F4F8]">
        <div className="tp-container text-center">
          <h2 className="tp-h2 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="tp-body text-[#5C667B] mb-8">
            No contracts. No hidden fees. Just straightforward pricing built for growing teams.
          </p>
          <Link href="/pricing">
            <Button className="btn-primary">
              View Pricing
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>



      {/* Final CTA Section */}
      <section className="tp-section bg-white">
        <div className="tp-container text-center">
          <h2 className="tp-h2 mb-8">
            Start Hiring Smarter Today
          </h2>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/signup">
              <Button className="btn-primary w-full md:w-auto">
                Start Free
              </Button>
            </Link>
            <Link href="/login">
              <Button className="btn-secondary w-full md:w-auto">
                Book a Demo
              </Button>
            </Link>
          </div>
          
          {/* Email Capture */}
          <div className="max-w-md mx-auto">
            <form className="flex gap-3">
              <Input 
                type="email" 
                placeholder="Enter your email" 
                className="flex-1 rounded-md px-4 py-2 border border-gray-300 focus:border-[#264C99] focus:ring-1 focus:ring-[#264C99]"
              />
              <Button type="submit" className="btn-primary">
                Get Started
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#F0F4F8] py-8">
        <div className="tp-container px-6 md:px-12">
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
            
            <nav className="flex flex-wrap justify-center gap-6 text-sm text-[#5C667B] text-center">
              <a href="#" className="hover:text-[#1A1A1A] transition-colors">About</a>
              <a href="#" className="hover:text-[#1A1A1A] transition-colors">Privacy</a>
              <a href="#" className="hover:text-[#1A1A1A] transition-colors">Terms</a>
              <a href="#" className="hover:text-[#1A1A1A] transition-colors">Contact</a>
            </nav>
            
            <p className="tp-label text-center">
              © 2025 TalentPatriot
            </p>
          </div>
        </div>
      </footer>


    </div>
  )
}