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

export default function SmallBusinessLanding() {
  useEffect(() => {
    document.title = "TalentPatriot for Small Businesses – Hire Like a Big Company"
    
    let metaDescription = document.querySelector('meta[name="description"]')
    if (!metaDescription) {
      metaDescription = document.createElement('meta')
      metaDescription.setAttribute('name', 'description')
      document.head.appendChild(metaDescription)
    }
    metaDescription.setAttribute('content', 'A simple, affordable ATS that helps small businesses find great people fast—without a learning curve. Setup in under an hour, starting at $49/month.')
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
                  <DropdownMenuItem className="cursor-pointer bg-[#0EA5E9]/5">
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
                <div className="inline-block bg-[#10B981]/10 text-[#10B981] px-4 py-2 rounded-full text-sm font-semibold mb-6">
                  🏢 FOR SMALL BUSINESSES
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-neutral-900 mb-6 tracking-tight leading-[1.1]">
                  Hire Like a Big Company.<br/>
                  <span className="gradient-text">Without the Complexity.</span>
                </h1>
                <p className="text-xl text-neutral-600 mb-8 leading-relaxed">
                  You don't need enterprise software. You need a simple, affordable ATS that helps you find great people fast—without a learning curve.
                </p>
                
                <div className="bg-white rounded-2xl p-6 shadow-lg mb-8 border-2 border-neutral-100">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">⚡</div>
                      <div>
                        <div className="font-bold text-neutral-900">Under 1 Hour</div>
                        <div className="text-sm text-neutral-500">Setup Time</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">💰</div>
                      <div>
                        <div className="font-bold text-neutral-900">$49/month</div>
                        <div className="text-sm text-neutral-500">Starting Price</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">👥</div>
                      <div>
                        <div className="font-bold text-neutral-900">Free</div>
                        <div className="text-sm text-neutral-500">Team Members</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">📚</div>
                      <div>
                        <div className="font-bold text-neutral-900">Zero</div>
                        <div className="text-sm text-neutral-500">Training Needed</div>
                      </div>
                    </div>
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
                    onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    See How It Works
                  </Button>
                </div>
                
                <p className="text-sm text-neutral-500 mt-4">✓ No credit card • ✓ No training required • ✓ Cancel anytime</p>
              </div>
              
              <div className="relative">
                <div className="bg-white rounded-3xl shadow-2xl p-6 border-2 border-neutral-100">
                  <div className="mb-4">
                    <div className="text-xs font-semibold text-neutral-500 mb-2">YOUR BRANDED CAREERS PAGE</div>
                    <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-neutral-800 rounded-lg"></div>
                        <div>
                          <div className="font-bold text-lg">Your Company</div>
                          <div className="text-sm text-neutral-600">We're Hiring!</div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <div className="font-semibold text-neutral-900 mb-1">Sales Manager</div>
                          <div className="text-sm text-neutral-500">Full-time • $80k-$100k</div>
                        </div>
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <div className="font-semibold text-neutral-900 mb-1">Marketing Coordinator</div>
                          <div className="text-sm text-neutral-500">Full-time • $55k-$70k</div>
                        </div>
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <div className="font-semibold text-neutral-900 mb-1">Customer Success Rep</div>
                          <div className="text-sm text-neutral-500">Full-time • $50k-$65k</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-center text-sm text-neutral-500">
                    ✨ Live in under 1 hour with your branding
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 px-[5%] bg-white">
          <div className="max-w-[1200px] mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-4">Hiring Shouldn't Feel This Hard</h2>
              <p className="text-xl text-neutral-500">Most small businesses struggle with the same hiring challenges</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 text-center">
                <div className="text-4xl mb-4">📧</div>
                <h3 className="text-xl font-bold text-neutral-900 mb-3">Overwhelmed by Applications</h3>
                <p className="text-neutral-600">Resumes scattered across email, LinkedIn, and job boards. No way to track who applied where or when.</p>
              </div>
              
              <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-8 text-center">
                <div className="text-4xl mb-4">💸</div>
                <h3 className="text-xl font-bold text-neutral-900 mb-3">Enterprise Tools Too Expensive</h3>
                <p className="text-neutral-600">$300-500/month for features you'll never use. Built for 500-person companies, not 20-person teams.</p>
              </div>
              
              <div className="bg-purple-50 border-2 border-purple-200 rounded-2xl p-8 text-center">
                <div className="text-4xl mb-4">⏰</div>
                <h3 className="text-xl font-bold text-neutral-900 mb-3">Hiring Takes Too Long</h3>
                <p className="text-neutral-600">Manual screening, spreadsheet tracking, endless back-and-forth. By the time you decide, candidates are gone.</p>
              </div>
            </div>
            
            <div className="text-center mt-12">
              <div className="inline-flex items-center gap-3 bg-gradient-to-r from-[#0EA5E9] to-[#10B981] text-white px-8 py-4 rounded-2xl text-lg font-semibold">
                <span>✨</span>
                <span>TalentPatriot solves all three problems—for $49/month</span>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="py-24 px-[5%] bg-gradient-to-br from-[#EFF6FF] to-[#F0FDF4]">
          <div className="max-w-[1200px] mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-4">Simple as 1-2-3</h2>
              <p className="text-xl text-neutral-500">From setup to your first hire in days, not months</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-12">
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-[#0EA5E9] to-[#10B981] text-white rounded-3xl flex items-center justify-center text-5xl font-bold mx-auto mb-6 shadow-lg">
                  1
                </div>
                <h3 className="text-2xl font-bold text-neutral-900 mb-4">Set Up Your Careers Page</h3>
                <p className="text-neutral-600">Add your logo, company info, and job listings. Get a professional careers page with your own domain in under an hour. No coding required.</p>
              </div>
              
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-[#0EA5E9] to-[#10B981] text-white rounded-3xl flex items-center justify-center text-5xl font-bold mx-auto mb-6 shadow-lg">
                  2
                </div>
                <h3 className="text-2xl font-bold text-neutral-900 mb-4">Applications Flow In Automatically</h3>
                <p className="text-neutral-600">Candidates apply through your careers page. AI instantly parses resumes, extracts skills, and ranks candidates by fit. You focus on the top 10%.</p>
              </div>
              
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-[#0EA5E9] to-[#10B981] text-white rounded-3xl flex items-center justify-center text-5xl font-bold mx-auto mb-6 shadow-lg">
                  3
                </div>
                <h3 className="text-2xl font-bold text-neutral-900 mb-4">Collaborate & Hire Fast</h3>
                <p className="text-neutral-600">Your whole team can review candidates, leave feedback, and schedule interviews—all in one place. Make offers before your competitors do.</p>
              </div>
            </div>
            
            <div className="text-center mt-12">
              <Link href="/beta">
                <Button className="btn-gradient text-white font-semibold px-10 py-4 rounded-xl text-lg hover:shadow-lg transition-shadow">
                  Try It Free for 14 Days
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="py-24 px-[5%] bg-white">
          <div className="max-w-[1200px] mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-4">Everything You Need, Nothing You Don't</h2>
              <p className="text-xl text-neutral-500">Built for small business simplicity</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              {[
                {
                  icon: '🎨',
                  title: 'Branded Careers Page',
                  desc: 'Launch your professional careers site with your logo, colors, and custom domain. Show candidates you\'re legit—even if you\'re a 10-person team.'
                },
                {
                  icon: '🤖',
                  title: 'AI Resume Screening',
                  desc: 'Automatically parse resumes and rank candidates by fit. Stop manually reading through hundreds of applications.'
                },
                {
                  icon: '📋',
                  title: 'Simple Pipeline Management',
                  desc: 'Drag and drop candidates through your hiring stages. See everyone\'s status at a glance.'
                },
                {
                  icon: '👥',
                  title: 'Free Team Collaboration',
                  desc: 'Invite your whole team at no extra cost. Everyone can review candidates and leave feedback.'
                },
                {
                  icon: '📅',
                  title: 'Interview Scheduling',
                  desc: 'Send calendar invites directly from TalentPatriot. Sync with Google Calendar or Outlook.'
                },
                {
                  icon: '📧',
                  title: 'Email Templates',
                  desc: 'Send professional emails with one click. Templates for every stage of the hiring process.'
                },
              ].map((feature, i) => (
                <div key={i} className="flex gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl flex items-center justify-center text-3xl">
                      {feature.icon}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-neutral-900 mb-2">{feature.title}</h3>
                    <p className="text-neutral-600">{feature.desc}</p>
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
              Ready to Simplify Your Hiring?
            </h2>
            <p className="text-xl opacity-95 mb-8">
              Join small businesses who've cut their time-to-hire in half with TalentPatriot.
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
                onClick={() => window.location.href = 'mailto:demo@talentpatriot.com?subject=Demo Request - Small Business'}
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
