import { TPButton } from '@/components/TPButton'
import { TPCard } from '@/components/TPCard'
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
    <div className="min-h-screen bg-background font-[Inter,sans-serif]">
      {/* Navigation */}
      <nav className="bg-primary text-white fixed w-full z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center bg-accent">
                <span className="text-primary font-bold text-lg">TP</span>
              </div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight">
                TalentPatriot
              </h1>
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              <Link href="/login">
                <TPButton variant="secondary" className="font-medium text-sm md:text-base shadow-[0_0_15px_rgba(0,255,255,0.3)]">
                  Sign In
                </TPButton>
              </Link>
              <Link href="/onboarding/step1">
                <TPButton variant="outline" className="font-medium text-sm md:text-base whitespace-nowrap">
                  Start Free
                </TPButton>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary mb-6 tracking-tight font-[Inter,sans-serif]">
            The Simple ATS + CRM Built for Growing Teams
          </h1>
          
          <p className="text-lg md:text-xl lg:text-2xl text-primary font-medium mb-8 max-w-4xl mx-auto font-[Inter,sans-serif]">
            Stop losing track of candidates and start hiring smarter.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/onboarding/step1">
              <TPButton variant="primary" size="lg" className="font-medium shadow-lg">
                Start Free
              </TPButton>
            </Link>
            <TPButton 
              variant="secondary" 
              size="lg" 
              className="font-medium shadow-[0_0_20px_rgba(0,255,255,0.4)]"
            >
              Book a Demo
            </TPButton>
          </div>
          
          {/* Responsive Placeholder Image/Video Section */}
          <div className="mb-8 relative max-w-5xl mx-auto">
            <div className="rounded-xl shadow-xl border-2 border-accent overflow-hidden bg-gradient-to-br from-white to-accent/10 p-6 md:p-8 aspect-video flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 md:w-16 md:h-16 text-primary mx-auto mb-4" />
                <p className="text-primary text-base md:text-lg font-medium font-[Inter,sans-serif]">Product Demo Video Coming Soon</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who It's For Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
          <h2 className="text-3xl md:text-4xl font-bold text-primary text-center mb-12 font-[Inter,sans-serif]">
            Built for Busy Recruiters, Founders, and Hiring Managers
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <TPCard variant="light" className="text-center">
              <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-6">
                <UserCheck className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-primary mb-4 font-[Inter,sans-serif]">Recruiters</h3>
              <p className="text-base text-primary/80 font-[Inter,sans-serif]">
                Track candidates and communication in one place.
              </p>
            </TPCard>
            
            <TPCard variant="light" className="text-center">
              <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-6">
                <Rocket className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-primary mb-4 font-[Inter,sans-serif]">Founders</h3>
              <p className="text-base text-primary/80 font-[Inter,sans-serif]">
                Stay in the loop — even if you don't have a hiring team.
              </p>
            </TPCard>
            
            <TPCard variant="light" className="text-center">
              <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-6">
                <Target className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-primary mb-4 font-[Inter,sans-serif]">Hiring Managers</h3>
              <p className="text-base text-primary/80 font-[Inter,sans-serif]">
                Ditch the spreadsheet. See the pipeline at a glance.
              </p>
            </TPCard>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
          <h2 className="text-3xl md:text-4xl font-bold text-primary text-center mb-12 font-[Inter,sans-serif]">
            Everything You Need — Nothing You Don't
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <TPCard variant="light" className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-accent/20 to-accent/40 rounded-lg flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-primary mb-3 font-[Inter,sans-serif]">Drag-and-drop pipelines</h3>
              <p className="text-sm text-primary/80 font-[Inter,sans-serif]">
                Move candidates through stages with simple drag and drop
              </p>
            </TPCard>
            
            <TPCard variant="light" className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-accent/20 to-accent/40 rounded-lg flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-primary mb-3 font-[Inter,sans-serif]">Candidate profiles</h3>
              <p className="text-sm text-primary/80 font-[Inter,sans-serif]">
                All candidate information in one searchable place
              </p>
            </TPCard>
            
            <TPCard variant="light" className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-accent/20 to-accent/40 rounded-lg flex items-center justify-center mx-auto mb-6">
                <FileText className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-primary mb-3 font-[Inter,sans-serif]">Notes and reminders</h3>
              <p className="text-sm text-primary/80 font-[Inter,sans-serif]">
                Track every interaction and never miss follow-ups
              </p>
            </TPCard>
            
            <TPCard variant="light" className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-accent/20 to-accent/40 rounded-lg flex items-center justify-center mx-auto mb-6">
                <Building2 className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-primary mb-3 font-[Inter,sans-serif]">CRM-lite for contacts</h3>
              <p className="text-sm text-primary/80 font-[Inter,sans-serif]">
                Build talent pools for future opportunities
              </p>
            </TPCard>
          </div>
        </div>
      </section>

      {/* Screenshot/Video Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-12">
          <div className="relative">
            <div className="bg-white p-3 md:p-4 rounded-xl shadow-lg border-2 border-accent">
              <img 
                src="/job-pipeline-screenshot.png"
                alt="TalentPatriot Job Pipeline - Kanban view showing candidates moving through Applied, Phone Screen, Interview, Technical, Offer, Hired, and Rejected stages"
                className="w-full h-auto max-h-[500px] md:max-h-[600px] rounded-lg object-cover"
                loading="lazy"
              />
            </div>
            <div className="text-center mt-6">
              <p className="text-primary text-base md:text-lg font-medium font-[Inter,sans-serif]">
                See your entire hiring pipeline at a glance
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary to-primary/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-12 text-center">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-8 font-[Inter,sans-serif]">
            Start Hiring Smarter Today
          </h2>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/onboarding/step1">
              <TPButton variant="outline" size="lg" className="font-medium shadow-lg">
                Start Free
              </TPButton>
            </Link>
            <TPButton 
              variant="secondary" 
              size="lg" 
              className="font-medium shadow-[0_0_20px_rgba(0,255,255,0.4)]"
            >
              Book a Demo
            </TPButton>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                <img 
                  src="/tp-logo.png" 
                  alt="TalentPatriot Logo" 
                  className="w-8 h-8 object-contain"
                />
              </div>
              <span className="text-lg font-semibold font-[Inter,sans-serif]">TalentPatriot</span>
            </div>
            
            <nav className="flex flex-wrap justify-center gap-4 md:gap-6 text-sm text-white/80 text-center font-[Inter,sans-serif]">
              <a href="#" className="hover:text-white transition-colors px-2">About</a>
              <Link href="/privacy" className="hover:text-white transition-colors px-2">Privacy</Link>
              <Link href="/terms" className="hover:text-white transition-colors px-2">Terms</Link>
              <a href="mailto:contact@talentpatriot.com" className="hover:text-white transition-colors px-2">Contact</a>
            </nav>
            
            <p className="text-sm text-white/60 text-center font-[Inter,sans-serif]">
              © 2025 TalentPatriot
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}