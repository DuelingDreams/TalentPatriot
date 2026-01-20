import { Button } from '@/components/ui/button'
import { ArrowRight, ChevronDown } from 'lucide-react'
import { Link } from 'wouter'
import { useEffect } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function RecruitersLanding() {
  useEffect(() => {
    document.title = "TalentPatriot for Recruiters – Stop Fighting Your ATS"
    
    let metaDescription = document.querySelector('meta[name="description"]')
    if (!metaDescription) {
      metaDescription = document.createElement('meta')
      metaDescription.setAttribute('name', 'description')
      document.head.appendChild(metaDescription)
    }
    metaDescription.setAttribute('content', 'Built by recruiters, for recruiters. Manage your pipeline faster with AI-powered resume parsing, visual pipelines, and tools that make your job easier.')
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
                  <DropdownMenuItem className="cursor-pointer bg-[#0EA5E9]/5">
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
            >
              Sign In
            </Button>
          </Link>
          <Link href="/beta">
            <Button className="btn-gradient btn-ripple text-white font-semibold px-4 md:px-6 py-2 rounded-xl">
              Start Free Trial
            </Button>
          </Link>
        </div>
      </nav>

      <main id="main-content">
        <section className="relative py-24 px-[5%] bg-gradient-to-br from-[#EFF6FF] to-[#F0FDF4] overflow-hidden">
          <div className="absolute -top-1/2 -right-[20%] w-[800px] h-[800px] bg-[radial-gradient(circle,rgba(14,165,233,0.1)_0%,transparent_70%)] animate-float pointer-events-none" />
          
          <div className="max-w-[1200px] mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-block bg-[#0EA5E9]/10 text-[#0EA5E9] px-4 py-2 rounded-full text-sm font-semibold mb-6">
                  👔 FOR RECRUITERS
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-neutral-900 mb-6 tracking-tight leading-[1.1]">
                  Stop Fighting Your <span className="gradient-text">ATS</span>
                </h1>
                <p className="text-xl text-neutral-600 mb-8 leading-relaxed">
                  Built by recruiters, for recruiters. Manage your pipeline faster with tools that actually make your job easier—not harder.
                </p>
                
                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div>
                    <div className="text-3xl font-bold text-[#0EA5E9]">10+</div>
                    <div className="text-sm text-neutral-500">Hours Saved<br/>Per Week</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-[#0EA5E9]">40%</div>
                    <div className="text-sm text-neutral-500">Faster<br/>Time-to-Fill</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-[#0EA5E9]">3x</div>
                    <div className="text-sm text-neutral-500">More Candidate<br/>Engagement</div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/beta">
                    <Button className="btn-gradient text-white font-semibold px-8 py-4 rounded-xl text-lg hover:shadow-lg transition-shadow">
                      Start Free Trial
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                  <Button 
                    variant="outline"
                    className="bg-white text-neutral-900 border-2 border-[#0EA5E9] hover:bg-[#0EA5E9] hover:text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all"
                    onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    Watch Demo
                  </Button>
                </div>
                
                <p className="text-sm text-neutral-500 mt-4">✓ No credit card required • ✓ 14-day free trial • ✓ Cancel anytime</p>
              </div>
              
              <div className="relative">
                <div className="bg-white rounded-3xl shadow-2xl p-8 border-2 border-neutral-100">
                  <div className="space-y-4">
                    <div className="text-sm font-semibold text-neutral-700 mb-4">Your Pipeline, Simplified</div>
                    <div className="grid grid-cols-4 gap-2">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 text-center">
                        <div className="text-xs font-semibold text-blue-700 mb-1">Applied</div>
                        <div className="text-2xl font-bold text-blue-900">24</div>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3 text-center">
                        <div className="text-xs font-semibold text-purple-700 mb-1">Screening</div>
                        <div className="text-2xl font-bold text-purple-900">12</div>
                      </div>
                      <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-3 text-center">
                        <div className="text-xs font-semibold text-amber-700 mb-1">Interview</div>
                        <div className="text-2xl font-bold text-amber-900">8</div>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3 text-center">
                        <div className="text-xs font-semibold text-green-700 mb-1">Offer</div>
                        <div className="text-2xl font-bold text-green-900">3</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mt-6">
                      <div className="bg-gradient-to-r from-blue-50 to-transparent rounded-lg p-4 border-l-4 border-blue-500">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-neutral-900">Sarah Chen</div>
                            <div className="text-sm text-neutral-500">Senior Software Engineer • 95% Match</div>
                          </div>
                          <div className="text-2xl">⭐</div>
                        </div>
                      </div>
                      <div className="bg-gradient-to-r from-green-50 to-transparent rounded-lg p-4 border-l-4 border-green-500">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-neutral-900">Marcus Johnson</div>
                            <div className="text-sm text-neutral-500">Product Manager • 92% Match</div>
                          </div>
                          <div className="text-2xl">⭐</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 px-[5%] bg-white">
          <div className="max-w-[1200px] mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-4">Sound Familiar?</h2>
              <p className="text-xl text-neutral-500">We built TalentPatriot to solve the problems recruiters face every day</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 mb-12">
              <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8">
                <div className="text-3xl mb-4">😤</div>
                <h3 className="text-xl font-bold text-neutral-900 mb-3">Your ATS is slowing you down</h3>
                <p className="text-neutral-600">Clunky interfaces, endless clicks, and features you'll never use. You spend more time fighting the tool than filling roles.</p>
              </div>
              <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-8">
                <div className="text-3xl mb-4">📧</div>
                <h3 className="text-xl font-bold text-neutral-900 mb-3">Great candidates slip through the cracks</h3>
                <p className="text-neutral-600">Manual resume screening means you miss qualified people buried in your inbox. By the time you find them, they've accepted elsewhere.</p>
              </div>
              <div className="bg-purple-50 border-2 border-purple-200 rounded-2xl p-8">
                <div className="text-3xl mb-4">💰</div>
                <h3 className="text-xl font-bold text-neutral-900 mb-3">Overpriced enterprise tools</h3>
                <p className="text-neutral-600">You're paying for features built for 500-person HR teams. All you need is a fast, simple pipeline—not a bloated system.</p>
              </div>
              <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-8">
                <div className="text-3xl mb-4">🔄</div>
                <h3 className="text-xl font-bold text-neutral-900 mb-3">Disconnected workflow</h3>
                <p className="text-neutral-600">Switching between spreadsheets, email, calendar, and your ATS. No single source of truth for candidate status.</p>
              </div>
            </div>
            
            <div className="text-center">
              <div className="inline-block bg-gradient-to-r from-[#0EA5E9] to-[#10B981] text-white px-8 py-4 rounded-2xl text-lg font-semibold">
                ✨ TalentPatriot fixes all of this—and more
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="py-24 px-[5%] bg-gradient-to-br from-[#EFF6FF] to-[#F0FDF4]">
          <div className="max-w-[1200px] mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-4">Built for Speed & Simplicity</h2>
              <p className="text-xl text-neutral-500">Everything you need to recruit faster. Nothing you don't.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: '🎯',
                  title: 'AI-Powered Resume Parsing',
                  desc: 'Upload 50 resumes, get instant parsing with skills extraction, experience matching, and fit scoring. Find your top 5 candidates in seconds.',
                  features: ['Automatic skills & experience extraction', 'Match score based on job requirements', 'Highlight qualified candidates instantly']
                },
                {
                  icon: '📊',
                  title: 'Visual Pipeline Management',
                  desc: 'Drag-and-drop Kanban boards that actually work. See your entire pipeline at a glance and move candidates through stages effortlessly.',
                  features: ['Customizable pipeline stages', 'Bulk actions for efficiency', 'Filter by skills, location, salary']
                },
                {
                  icon: '📧',
                  title: 'Built-in Email & Scheduling',
                  desc: 'Send personalized emails and schedule interviews without leaving the platform. Gmail integration keeps everything in sync.',
                  features: ['Email templates for every stage', 'Calendar integration (Google/Outlook)', 'Automated follow-ups & reminders']
                },
                {
                  icon: '🗂️',
                  title: 'Talent Pools (CRM-Lite)',
                  desc: "Save great candidates who aren't right for this role. Build your talent network for future positions.",
                  features: ['Tag and organize candidates', 'Quick search across all pools', 'Re-engage past candidates']
                },
                {
                  icon: '👥',
                  title: 'Team Collaboration',
                  desc: 'Share candidates, leave feedback, and coordinate with hiring managers—all in one place.',
                  features: ['@mentions and comments', 'Role-based permissions', 'Activity timeline']
                },
                {
                  icon: '📈',
                  title: 'Analytics & Reporting',
                  desc: 'Track your performance with beautiful dashboards. Time-to-fill, source effectiveness, pipeline velocity.',
                  features: ['Real-time dashboards', 'Export reports', 'Identify bottlenecks']
                },
              ].map((feature, i) => (
                <div key={i} className="bg-white rounded-2xl p-8 hover:-translate-y-2 hover:shadow-[0_16px_48px_rgba(0,0,0,0.12)] transition-all duration-300 border-2 border-neutral-100">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#0EA5E9]/10 to-[#10B981]/10 rounded-2xl flex items-center justify-center text-3xl mb-6">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-neutral-900 mb-3">{feature.title}</h3>
                  <p className="text-neutral-600 mb-4">{feature.desc}</p>
                  <ul className="space-y-2 text-sm text-neutral-600">
                    {feature.features.map((f, j) => (
                      <li key={j}>• {f}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative py-24 px-[5%] bg-gradient-to-br from-[#0EA5E9] to-[#10B981] text-white text-center overflow-hidden">
          <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-[radial-gradient(circle,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:50px_50px] animate-move-bg pointer-events-none" />
          
          <div className="max-w-[800px] mx-auto relative z-10">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              Ready to Recruit Faster?
            </h2>
            <p className="text-xl opacity-95 mb-8">
              Join recruiters who've cut their time-to-fill by 40% with TalentPatriot.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/beta">
                <Button className="bg-white text-[#0EA5E9] hover:bg-neutral-100 font-bold px-8 md:px-10 py-5 md:py-6 rounded-xl text-lg transition-all duration-300 hover:-translate-y-0.5">
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Button 
                variant="outline"
                className="bg-transparent text-white border-2 border-white hover:bg-white/10 px-8 md:px-10 py-5 md:py-6 rounded-xl font-bold text-lg transition-all duration-300"
                onClick={() => window.location.href = 'mailto:demo@talentpatriot.com?subject=Demo Request - Recruiter'}
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
              <Link href="/">
                <div className="flex items-center gap-3 mb-4 cursor-pointer">
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
              </Link>
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
