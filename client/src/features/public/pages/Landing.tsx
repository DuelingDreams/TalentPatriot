import { Button } from '@/components/ui/button'
import { ArrowRight, Play, ChevronDown } from 'lucide-react'
import { Link } from 'wouter'
import { useEffect, useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function Landing() {
  useEffect(() => {
    document.title = "TalentPatriot – SMB ATS with Fast Setup & Fair Pricing"
    
    let metaDescription = document.querySelector('meta[name="description"]')
    if (!metaDescription) {
      metaDescription = document.createElement('meta')
      metaDescription.setAttribute('name', 'description')
      document.head.appendChild(metaDescription)
    }
    metaDescription.setAttribute('content', 'An SMB-first ATS with fast setup, fair pricing, accessibility-first design, and AI that works. Launch your branded careers page in under a day.')
  }, [])

  return (
    <div className="min-h-screen bg-white font-[Inter,sans-serif] overflow-x-hidden">
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-6 focus:py-3 focus:bg-[#0EA5E9] focus:text-white focus:rounded-xl focus:shadow-lg focus:font-medium"
      >
        Skip to main content
      </a>

      <nav className="flex justify-between items-center px-[5%] py-6 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] sticky top-0 z-50">
        <div className="flex items-center gap-8">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center">
                <img 
                  src="/talentpatriot-logo.png" 
                  alt="TalentPatriot Logo" 
                  className="w-8 h-8 md:w-10 md:h-10 object-contain"
                  loading="eager"
                />
              </div>
              <span className="text-xl md:text-2xl font-bold text-neutral-900 tracking-tight">
                TalentPatriot
              </span>
            </div>
          </Link>
          
          <div className="hidden md:flex items-center gap-6">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 text-neutral-700 font-medium hover:text-[#0EA5E9] transition-colors">
                Solutions
                <ChevronDown className="w-4 h-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <Link href="/recruiters">
                  <DropdownMenuItem className="cursor-pointer">
                    <span className="mr-2">👔</span>
                    For Recruiters
                  </DropdownMenuItem>
                </Link>
                <Link href="/small-business">
                  <DropdownMenuItem className="cursor-pointer">
                    <span className="mr-2">🏢</span>
                    For Small Businesses
                  </DropdownMenuItem>
                </Link>
                <Link href="/agencies">
                  <DropdownMenuItem className="cursor-pointer">
                    <span className="mr-2">🎯</span>
                    For Staffing Agencies
                  </DropdownMenuItem>
                </Link>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Link href="/pricing" className="text-neutral-700 font-medium hover:text-[#0EA5E9] transition-colors">
              Pricing
            </Link>
            <Link href="/about" className="text-neutral-700 font-medium hover:text-[#0EA5E9] transition-colors">
              About
            </Link>
          </div>
        </div>
        
        <div className="flex gap-3 md:gap-4">
          <Link href="/login">
            <Button 
              variant="ghost" 
              className="text-[#0EA5E9] font-semibold hover:bg-transparent hover:text-[#0284C7] px-4 py-2"
              data-testid="btn-sign-in"
            >
              Sign In
            </Button>
          </Link>
          <Link href="/beta">
            <Button 
              className="btn-gradient btn-ripple text-white font-semibold px-4 md:px-6 py-2 rounded-xl"
              data-testid="btn-beta-access"
            >
              Beta Access
            </Button>
          </Link>
        </div>
      </nav>

      <main id="main-content">
        <section className="relative py-24 px-[5%] bg-gradient-to-br from-[#EFF6FF] to-[#F0FDF4] overflow-hidden">
          <div className="absolute -top-1/2 -right-[20%] w-[800px] h-[800px] bg-[radial-gradient(circle,rgba(14,165,233,0.1)_0%,transparent_70%)] animate-float pointer-events-none" />
          
          <div className="max-w-[1200px] mx-auto text-center relative z-10">
            <h1 className="text-4xl md:text-5xl lg:text-[4rem] font-extrabold text-neutral-900 mb-6 tracking-[-0.02em] leading-[1.1]">
              Stop Losing Great Candidates to<br className="hidden md:block" />
              Companies With <span className="gradient-text animate-shimmer">Better Hiring Systems</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-neutral-500 mb-4">
              The simple, affordable ATS built for growing businesses who can't afford enterprise complexity or enterprise mistakes.
            </p>
            
            <div className="flex items-center justify-center gap-3 my-8 text-neutral-500 text-base">
              <span>🎯 Built specifically for</span>
              <span className="font-semibold text-[#10B981]">small businesses & boutique agencies</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center my-12">
              <Link href="/beta">
                <Button 
                  className="btn-gradient btn-ripple text-white font-semibold px-8 md:px-10 py-5 md:py-6 rounded-xl text-lg"
                  data-testid="btn-hero-beta"
                >
                  Start Free Beta
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Button 
                variant="outline"
                className="bg-white text-neutral-900 border-2 border-[#0EA5E9] hover:bg-[#0EA5E9] hover:text-white px-8 md:px-10 py-5 md:py-6 rounded-xl font-semibold text-lg transition-all duration-300 hover:-translate-y-0.5"
                onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
                data-testid="btn-hero-demo"
              >
                Watch 2-Min Demo
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-neutral-500 mb-12">
              <span>✓ No credit card required</span>
              <span className="hidden sm:inline">|</span>
              <span>✓ 14-day free trial</span>
              <span className="hidden sm:inline">|</span>
              <span>✓ Setup in under 1 hour</span>
            </div>

            <div className="max-w-[1000px] mx-auto mt-12 rounded-3xl overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.15)] bg-white">
              <div 
                id="demo"
                className="relative pb-[56.25%] bg-gradient-to-br from-[#667EEA] to-[#764BA2] cursor-pointer group"
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-[0_8px_32px_rgba(0,0,0,0.2)] group-hover:scale-110 transition-transform duration-300">
                    <Play className="w-8 h-8 text-[#0EA5E9] ml-1" />
                  </div>
                </div>
                <div className="absolute bottom-6 left-0 right-0 text-center text-white/90">
                  <p className="text-lg font-medium">Product Demo Video Coming Soon</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 px-[5%] bg-white border-b border-neutral-200">
          <div className="max-w-[1200px] mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { value: '40%', label: 'Faster Time-to-Fill' },
                { value: '10+', label: 'Hours Saved Weekly' },
                { value: '50+', label: 'Teams Using Beta' },
                { value: '<1hr', label: 'Average Setup Time' },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-[#0EA5E9] mb-2">{stat.value}</div>
                  <div className="text-sm md:text-base text-neutral-500">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24 px-[5%] bg-gradient-to-br from-[#EFF6FF] to-[#F0FDF4]">
          <div className="max-w-[1200px] mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-neutral-900 mb-4 tracking-[-0.02em]">
                Find Your Solution
              </h2>
              <p className="text-xl text-neutral-500">See how TalentPatriot solves your specific hiring challenges</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { 
                  icon: '👔', 
                  title: 'For Recruiters', 
                  desc: 'Stop fighting your ATS. Manage your pipeline faster with tools built for talent pros.',
                  href: '/recruiters'
                },
                { 
                  icon: '🏢', 
                  title: 'For Small Businesses', 
                  desc: 'Hire without enterprise complexity. Get up and running in under an hour.',
                  href: '/small-business'
                },
                { 
                  icon: '🎯', 
                  title: 'For Staffing Agencies', 
                  desc: 'Compete with larger firms. Multi-client pipelines that scale with you.',
                  href: '/agencies'
                },
              ].map((solution, i) => (
                <Link key={i} href={solution.href}>
                  <div 
                    className="group relative bg-white rounded-2xl p-8 border-2 border-neutral-100 hover:border-[#0EA5E9] hover:-translate-y-2 hover:shadow-[0_16px_48px_rgba(0,0,0,0.12)] transition-all duration-300 overflow-hidden cursor-pointer h-full"
                    data-testid={`solution-card-${i}`}
                  >
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[rgba(14,165,233,0.1)] to-[rgba(16,185,129,0.1)] flex items-center justify-center mb-6 text-3xl group-hover:scale-110 group-hover:rotate-[5deg] transition-transform duration-300">
                      {solution.icon}
                    </div>
                    <h3 className="text-2xl font-bold text-neutral-900 mb-3">{solution.title}</h3>
                    <p className="text-neutral-500 text-base leading-relaxed mb-4">{solution.desc}</p>
                    <span className="text-[#0EA5E9] font-semibold hover:text-[#0284C7] flex items-center gap-2 group-hover:gap-3 transition-all duration-300">
                      Learn More
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24 px-[5%] bg-white">
          <div className="max-w-[1200px] mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-neutral-900 mb-4 tracking-[-0.02em]">
                Why TalentPatriot
              </h2>
              <p className="text-xl text-neutral-500">Enterprise Power. Small Business Simplicity.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                { icon: '💰', title: 'Fair Pricing', desc: 'Only recruiter seats cost. Unlimited collaborators are always free. No hidden fees, no surprises.' },
                { icon: '🚀', title: 'Go Live in Under a Day', desc: '5-step onboarding + branded careers page. Start hiring in hours, not weeks.' },
                { icon: '🏢', title: 'Multi-client Pipelines', desc: 'Ideal for boutique staffing firms. Manage multiple clients seamlessly from one dashboard.' },
                { icon: '💡', title: 'No Training Required', desc: 'If your team can use email, they can use TalentPatriot. Intuitive from day one.' },
              ].map((benefit, i) => (
                <div 
                  key={i}
                  className="group relative bg-white rounded-2xl p-8 border-2 border-neutral-100 hover:border-[#0EA5E9] hover:-translate-y-2 hover:shadow-[0_16px_48px_rgba(0,0,0,0.12)] transition-all duration-300 overflow-hidden card-accent-left"
                  data-testid={`benefit-card-${i}`}
                >
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[rgba(14,165,233,0.1)] to-[rgba(16,185,129,0.1)] flex items-center justify-center mb-6 text-3xl group-hover:scale-110 group-hover:rotate-[5deg] transition-transform duration-300">
                    {benefit.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-neutral-900 mb-3">{benefit.title}</h3>
                  <p className="text-neutral-500 text-base leading-relaxed">{benefit.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24 px-[5%] bg-neutral-100">
          <div className="max-w-[1200px] mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-neutral-900 mb-4 tracking-[-0.02em]">
                How It Works
              </h2>
              <p className="text-xl text-neutral-500">From job post to hire in three simple steps</p>
            </div>
            
            <div className="relative">
              <div className="hidden md:block absolute top-[50px] left-0 right-0 h-1 bg-gradient-to-r from-[#0EA5E9] to-[#10B981] opacity-20 z-0" />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
                {[
                  { num: '1', title: 'Post a job on your branded page', desc: 'Create job listings and publish them on your custom careers page with full branding control' },
                  { num: '2', title: 'AI auto-parses resumes & surfaces strong fits', desc: 'Our AI automatically extracts key information and highlights top candidates for faster screening' },
                  { num: '3', title: 'Drag-and-drop candidates through your pipeline', desc: 'Move candidates through stages and collaborate with your team seamlessly' },
                ].map((step, i) => (
                  <div key={i} className="text-center group" data-testid={`step-${i}`}>
                    <div className="w-24 h-24 md:w-[100px] md:h-[100px] bg-gradient-to-br from-[#0EA5E9] to-[#10B981] text-white rounded-3xl flex items-center justify-center text-4xl md:text-5xl font-bold mx-auto mb-6 shadow-[0_8px_24px_rgba(14,165,233,0.3)] group-hover:scale-110 group-hover:rotate-[5deg] group-hover:shadow-[0_12px_32px_rgba(14,165,233,0.4)] transition-all duration-300">
                      {step.num}
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold text-neutral-900 mb-4">{step.title}</h3>
                    <p className="text-neutral-500">{step.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 px-[5%] bg-white">
          <div className="max-w-[1200px] mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-neutral-900 mb-4 tracking-[-0.02em]">
                Features
              </h2>
              <p className="text-xl text-neutral-500">Everything you need to hire smarter</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { icon: '✨', title: 'Drag-and-drop pipelines', desc: 'Visual Kanban boards for seamless candidate management' },
                { icon: '👥', title: 'Candidate profiles & search', desc: 'Comprehensive profiles with powerful filtering' },
                { icon: '📝', title: 'Notes, mentions, reminders', desc: 'Team collaboration with smart notifications' },
                { icon: '🔔', title: 'Interview scheduling', desc: 'Automated workflows with calendar integration' },
                { icon: '📊', title: 'Analytics & reporting', desc: 'Data-driven insights for better hiring decisions' },
                { icon: '🗂️', title: 'CRM-lite Talent Pools', desc: 'Organize and nurture your candidate network' },
              ].map((feature, i) => (
                <div 
                  key={i}
                  className="group relative bg-white rounded-[20px] p-8 md:p-10 border-2 border-neutral-100 hover:border-transparent hover:-translate-y-3 hover:shadow-[0_20px_60px_rgba(0,0,0,0.15)] transition-all duration-400 overflow-hidden"
                  data-testid={`feature-card-${i}`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-[rgba(14,165,233,0.05)] to-[rgba(16,185,129,0.05)] opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none" />
                  
                  <div className="relative z-10">
                    <div className="w-[72px] h-[72px] rounded-[18px] bg-gradient-to-br from-[rgba(14,165,233,0.1)] to-[rgba(16,185,129,0.1)] flex items-center justify-center mb-6 text-4xl">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold text-neutral-900 mb-3">{feature.title}</h3>
                    <p className="text-neutral-500">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative py-24 px-[5%] bg-gradient-to-br from-[#0EA5E9] to-[#10B981] text-white text-center overflow-hidden">
          <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-[radial-gradient(circle,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:50px_50px] animate-move-bg pointer-events-none" />
          
          <div className="max-w-[800px] mx-auto relative z-10">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              Stop Wrestling with Clunky ATSs.<br className="hidden md:block" />
              Start Hiring Smarter.
            </h2>
            <p className="text-xl opacity-95 mb-8">
              Join the SMB teams already simplifying their hiring with TalentPatriot.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/beta">
                <Button 
                  className="bg-white text-[#0EA5E9] hover:bg-neutral-100 font-bold px-8 md:px-10 py-5 md:py-6 rounded-xl text-lg transition-all duration-300 hover:-translate-y-0.5"
                  data-testid="btn-cta-beta"
                >
                  Start Free in Beta
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Button 
                variant="outline"
                className="bg-transparent text-white border-2 border-white hover:bg-white/10 px-8 md:px-10 py-5 md:py-6 rounded-xl font-bold text-lg transition-all duration-300"
                onClick={() => window.location.href = 'mailto:demo@talentpatriot.com?subject=Demo Request'}
                data-testid="btn-cta-demo"
              >
                Request a Demo
              </Button>
            </div>
          </div>
        </section>
      </main>

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
                    loading="lazy"
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
