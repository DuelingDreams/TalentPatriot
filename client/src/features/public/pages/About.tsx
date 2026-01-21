import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Users, 
  Target, 
  Sparkles,
  ArrowRight,
  Heart,
  Zap,
  Shield,
  TrendingUp,
  CheckCircle,
  Building2,
  UserCheck,
  Mail,
  Linkedin,
  Github
} from 'lucide-react'
import { Link } from 'wouter'

export default function About() {
  return (
    <div className="min-h-screen bg-white font-[Inter,sans-serif] overflow-x-hidden">
      {/* Navigation */}
      <nav className="flex justify-between items-center px-[5%] py-6 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] sticky top-0 z-50">
        <div className="flex items-center gap-8">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center">
                <img 
                  src="/talentpatriot-logo.png" 
                  alt="TalentPatriot Logo" 
                  className="w-8 h-8 md:w-10 md:h-10 object-contain"
                />
              </div>
              <span className="text-xl md:text-2xl font-bold text-neutral-900 tracking-tight">
                TalentPatriot
              </span>
            </div>
          </Link>
          
          <div className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-neutral-700 font-medium hover:text-[#0EA5E9] transition-colors">
              Home
            </Link>
            <Link href="/pricing" className="text-neutral-700 font-medium hover:text-[#0EA5E9] transition-colors">
              Pricing
            </Link>
          </div>
        </div>
        
        <div className="flex gap-3 md:gap-4">
          <Link href="/login">
            <Button 
              variant="ghost" 
              className="text-[#0EA5E9] font-semibold hover:bg-transparent hover:text-[#0284C7] px-4 py-2"
            >
              Sign In
            </Button>
          </Link>
          <Link href="/beta">
            <Button 
              className="btn-gradient btn-ripple text-white font-semibold px-4 md:px-6 py-2 rounded-xl"
            >
              Beta Access
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-24 px-[5%] bg-gradient-to-br from-[#EFF6FF] to-[#F0FDF4] overflow-hidden">
        <div className="absolute -top-1/2 -right-[20%] w-[800px] h-[800px] bg-[radial-gradient(circle,rgba(14,165,233,0.1)_0%,transparent_70%)] animate-float pointer-events-none" />
        
        <div className="max-w-[1200px] mx-auto text-center relative z-10">
          <h1 className="text-4xl md:text-5xl lg:text-[4rem] font-extrabold text-neutral-900 mb-6 tracking-[-0.02em] leading-[1.1]">
            Hiring shouldn't be this hard.
          </h1>
          <p className="text-xl md:text-2xl text-neutral-500 mb-8 max-w-4xl mx-auto leading-relaxed">
            Yet for small businesses and boutique staffing firms, most recruiting software creates more 
            problems than it solves—bloated workflows, enterprise pricing, and systems built for companies 
            ten times your size.
          </p>
          <p className="text-xl md:text-2xl text-[#0EA5E9] font-semibold">
            TalentPatriot was built to change that.
          </p>
        </div>
      </section>

      {/* Core Message */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-12">
          <p className="text-lg md:text-xl text-neutral-600 leading-relaxed text-center">
            We believe great hiring is still about people, relationships, and timing—not endless configuration 
            and rigid processes. TalentPatriot is an ATS/CRM designed for teams who care deeply about 
            candidate experience and want software that actually supports how they recruit.
          </p>
        </div>
      </section>

      {/* Our Philosophy */}
      <section className="py-24 px-[5%] bg-gradient-to-br from-[#EFF6FF] to-[#F0FDF4]">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-neutral-900 mb-4 tracking-[-0.02em]">
              Our Philosophy
            </h2>
            <p className="text-xl text-[#0EA5E9] font-semibold">
              A TalentPatriot is someone who stands up for better hiring.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="group relative bg-white rounded-2xl p-8 border-2 border-neutral-100 hover:border-[#0EA5E9] hover:-translate-y-2 hover:shadow-[0_16px_48px_rgba(0,0,0,0.12)] transition-all duration-300 overflow-hidden">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[rgba(14,165,233,0.1)] to-[rgba(16,185,129,0.1)] flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-[5deg] transition-transform duration-300">
                <Heart className="w-8 h-8 text-[#0EA5E9]" />
              </div>
              <h3 className="text-2xl font-bold text-neutral-900 mb-3">Candidates Before Checkboxes</h3>
              <p className="text-neutral-500 leading-relaxed">
                We put the human experience first, treating every candidate with the dignity and respect they deserve.
              </p>
            </div>

            <div className="group relative bg-white rounded-2xl p-8 border-2 border-neutral-100 hover:border-[#0EA5E9] hover:-translate-y-2 hover:shadow-[0_16px_48px_rgba(0,0,0,0.12)] transition-all duration-300 overflow-hidden">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[rgba(14,165,233,0.1)] to-[rgba(16,185,129,0.1)] flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-[5deg] transition-transform duration-300">
                <Users className="w-8 h-8 text-[#0EA5E9]" />
              </div>
              <h3 className="text-2xl font-bold text-neutral-900 mb-3">Relationships Over Volume</h3>
              <p className="text-neutral-500 leading-relaxed">
                Quality connections matter more than quantity. We help you build and maintain meaningful relationships.
              </p>
            </div>

            <div className="group relative bg-white rounded-2xl p-8 border-2 border-neutral-100 hover:border-[#0EA5E9] hover:-translate-y-2 hover:shadow-[0_16px_48px_rgba(0,0,0,0.12)] transition-all duration-300 overflow-hidden">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[rgba(14,165,233,0.1)] to-[rgba(16,185,129,0.1)] flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-[5deg] transition-transform duration-300">
                <Zap className="w-8 h-8 text-[#0EA5E9]" />
              </div>
              <h3 className="text-2xl font-bold text-neutral-900 mb-3">Small Teams, Big Impact</h3>
              <p className="text-neutral-500 leading-relaxed">
                We empower small, focused teams to compete with anyone through better tools and smarter workflows.
              </p>
            </div>
          </div>

          <div className="text-center max-w-3xl mx-auto">
            <p className="text-lg text-neutral-500 leading-relaxed">
              We believe recruiting is a craft. It deserves tools that are fast, intuitive, and built for real-world 
              workflows—not enterprise HR theory.
            </p>
          </div>
        </div>
      </section>

      {/* Who We're Built For */}
      <section className="py-24 px-[5%] bg-white">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-neutral-900 mb-4 tracking-[-0.02em]">
              Who We're Built For
            </h2>
            <p className="text-xl text-neutral-500">
              TalentPatriot is purpose-built for teams who win on relationships, speed, and trust.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="group relative bg-white rounded-2xl p-8 border-2 border-neutral-100 hover:border-[#0EA5E9] hover:-translate-y-2 hover:shadow-[0_16px_48px_rgba(0,0,0,0.12)] transition-all duration-300 overflow-hidden">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[rgba(14,165,233,0.1)] to-[rgba(16,185,129,0.1)] flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-[5deg] transition-transform duration-300">
                <Building2 className="w-8 h-8 text-[#0EA5E9]" />
              </div>
              <h3 className="text-2xl font-bold text-neutral-900 mb-4">Small Businesses</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-[#10B981] mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-neutral-500">Hiring without enterprise complexity</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-[#10B981] mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-neutral-500">Getting up and running in under an hour</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-[#10B981] mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-neutral-500">Keeping hiring organized without a dedicated HR department</span>
                </li>
              </ul>
            </div>

            <div className="group relative bg-white rounded-2xl p-8 border-2 border-neutral-100 hover:border-[#0EA5E9] hover:-translate-y-2 hover:shadow-[0_16px_48px_rgba(0,0,0,0.12)] transition-all duration-300 overflow-hidden">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[rgba(14,165,233,0.1)] to-[rgba(16,185,129,0.1)] flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-[5deg] transition-transform duration-300">
                <UserCheck className="w-8 h-8 text-[#0EA5E9]" />
              </div>
              <h3 className="text-2xl font-bold text-neutral-900 mb-4">Boutique Staffing & Recruiting Firms</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-[#10B981] mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-neutral-500">Managing pipelines without fighting your ATS</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-[#10B981] mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-neutral-500">Tracking relationships like a CRM—not a spreadsheet</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-[#10B981] mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-neutral-500">Collaborating with clients and teammates effortlessly</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Why We Built TalentPatriot */}
      <section className="py-24 px-[5%] bg-neutral-100">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-neutral-900 mb-6 tracking-[-0.02em]">
                Why We Built TalentPatriot
              </h2>
              <p className="text-lg text-neutral-500 leading-relaxed mb-6">
                TalentPatriot was born out of high-trust hiring environments where accuracy, discretion, and 
                relationships mattered. We brought those same principles to small businesses and boutique 
                firms who deserve better tools—but don't want enterprise overhead.
              </p>
              <p className="text-lg text-neutral-500 leading-relaxed">
                The result is a clean, candidate-first ATS/CRM that helps you move faster, stay organized, 
                and stop losing great candidates to better systems.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div className="group bg-white rounded-2xl p-6 border-2 border-neutral-100 hover:border-[#0EA5E9] hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)] transition-all duration-300">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[rgba(14,165,233,0.1)] to-[rgba(16,185,129,0.1)] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <Zap className="w-7 h-7 text-[#0EA5E9]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-neutral-900 mb-1">Move Faster</h3>
                    <p className="text-sm text-neutral-500">Speed matters in competitive hiring markets</p>
                  </div>
                </div>
              </div>
              <div className="group bg-white rounded-2xl p-6 border-2 border-neutral-100 hover:border-[#0EA5E9] hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)] transition-all duration-300">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[rgba(14,165,233,0.1)] to-[rgba(16,185,129,0.1)] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <Target className="w-7 h-7 text-[#0EA5E9]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-neutral-900 mb-1">Stay Organized</h3>
                    <p className="text-sm text-neutral-500">Keep every candidate and conversation tracked</p>
                  </div>
                </div>
              </div>
              <div className="group bg-white rounded-2xl p-6 border-2 border-neutral-100 hover:border-[#0EA5E9] hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)] transition-all duration-300">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[rgba(14,165,233,0.1)] to-[rgba(16,185,129,0.1)] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <TrendingUp className="w-7 h-7 text-[#0EA5E9]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-neutral-900 mb-1">Win Top Talent</h3>
                    <p className="text-sm text-neutral-500">Stop losing candidates to better systems</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Promise */}
      <section className="py-24 px-[5%] bg-white">
        <div className="max-w-[800px] mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-neutral-900 mb-6 tracking-[-0.02em]">
              Our Promise
            </h2>
          </div>
          <div className="bg-gradient-to-br from-[#EFF6FF] to-[#F0FDF4] rounded-3xl p-8 md:p-12 shadow-[0_16px_48px_rgba(0,0,0,0.08)]">
            <div className="space-y-6 text-center">
              <div className="flex items-center justify-center gap-3">
                <Shield className="w-8 h-8 text-[#0EA5E9] flex-shrink-0" />
                <p className="text-lg md:text-xl text-neutral-700 font-medium">
                  No bloated features you don't need.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3">
                <Shield className="w-8 h-8 text-[#0EA5E9] flex-shrink-0" />
                <p className="text-lg md:text-xl text-neutral-700 font-medium">
                  No enterprise mistakes you can't afford.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3">
                <Sparkles className="w-8 h-8 text-[#10B981] flex-shrink-0" />
                <p className="text-lg md:text-xl text-[#0EA5E9] font-bold">
                  Just hiring software that works the way you do.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 px-[5%] bg-gradient-to-br from-[#0EA5E9] to-[#10B981] text-white text-center overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-[radial-gradient(circle,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:50px_50px] animate-move-bg pointer-events-none" />
        
        <div className="max-w-[800px] mx-auto relative z-10">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            Ready to Hire Better?
          </h2>
          <p className="text-xl opacity-95 mb-8">
            Join forward-thinking teams who are building better hiring processes with TalentPatriot.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/beta">
              <Button 
                className="bg-white text-[#0EA5E9] hover:bg-neutral-100 font-bold px-8 md:px-10 py-5 md:py-6 rounded-xl text-lg transition-all duration-300 hover:-translate-y-0.5"
              >
                Start Free in Beta
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Button 
              variant="outline"
              className="bg-transparent text-white border-2 border-white hover:bg-white/10 px-8 md:px-10 py-5 md:py-6 rounded-xl font-bold text-lg transition-all duration-300"
              onClick={() => window.location.href = 'mailto:demo@talentpatriot.com?subject=Demo Request'}
            >
              Request a Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-12 border-t border-neutral-200">
        <div className="max-w-[1200px] mx-auto px-[5%]">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                  <img 
                    src="/talentpatriot-logo.png" 
                    alt="TalentPatriot Logo" 
                    className="w-8 h-8 object-contain"
                  />
                </div>
                <span className="text-lg font-bold leading-tight text-neutral-900">TalentPatriot</span>
              </div>
              <p className="text-sm text-neutral-500">
                The simple, affordable ATS built for growing businesses.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-neutral-900 mb-4">Solutions</h4>
              <nav className="flex flex-col gap-2 text-sm text-neutral-500">
                <Link href="/recruiters" className="hover:text-neutral-900 transition-colors">For Recruiters</Link>
                <Link href="/small-business" className="hover:text-neutral-900 transition-colors">For Small Businesses</Link>
                <Link href="/agencies" className="hover:text-neutral-900 transition-colors">For Staffing Agencies</Link>
              </nav>
            </div>
            
            <div>
              <h4 className="font-semibold text-neutral-900 mb-4">Company</h4>
              <nav className="flex flex-col gap-2 text-sm text-neutral-500">
                <Link href="/about" className="hover:text-neutral-900 transition-colors">About</Link>
                <Link href="/beta" className="hover:text-neutral-900 transition-colors">Beta Access</Link>
                <a href="mailto:contact@talentpatriot.com" className="hover:text-neutral-900 transition-colors">Contact</a>
              </nav>
            </div>
            
            <div>
              <h4 className="font-semibold text-neutral-900 mb-4">Legal</h4>
              <nav className="flex flex-col gap-2 text-sm text-neutral-500">
                <Link href="/privacy" className="hover:text-neutral-900 transition-colors">Privacy Policy</Link>
                <Link href="/terms" className="hover:text-neutral-900 transition-colors">Terms of Service</Link>
              </nav>
            </div>
          </div>
          
          <div className="pt-8 border-t border-neutral-200 text-center text-sm text-neutral-500">
            © 2025 TalentPatriot. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
