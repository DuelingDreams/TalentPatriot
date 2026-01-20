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

export default function AgenciesLanding() {
  useEffect(() => {
    document.title = "TalentPatriot for Staffing Agencies – Compete With the Big Agencies"
    
    let metaDescription = document.querySelector('meta[name="description"]')
    if (!metaDescription) {
      metaDescription = document.createElement('meta')
      metaDescription.setAttribute('name', 'description')
      document.head.appendChild(metaDescription)
    }
    metaDescription.setAttribute('content', 'Multi-client pipelines, white-label careers pages, and enterprise features—at a price boutique agencies can actually afford. $89/recruiter/month.')
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
                  <DropdownMenuItem className="cursor-pointer bg-[#0EA5E9]/5">
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
                  🎯 FOR STAFFING AGENCIES
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-neutral-900 mb-6 tracking-tight leading-[1.1]">
                  Compete With the <span className="gradient-text">Big Agencies</span>
                </h1>
                <p className="text-xl text-neutral-600 mb-8 leading-relaxed">
                  Multi-client pipelines, white-label careers pages, and enterprise features—at a price boutique agencies can actually afford.
                </p>
                
                <div className="bg-white rounded-2xl p-6 shadow-lg mb-8 border-2 border-neutral-100">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-[#0EA5E9] to-[#10B981] rounded-lg flex items-center justify-center text-white font-bold text-sm">✓</div>
                      <span className="font-semibold text-neutral-900">Manage unlimited clients from one dashboard</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-[#0EA5E9] to-[#10B981] rounded-lg flex items-center justify-center text-white font-bold text-sm">✓</div>
                      <span className="font-semibold text-neutral-900">White-label careers pages for each client</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-[#0EA5E9] to-[#10B981] rounded-lg flex items-center justify-center text-white font-bold text-sm">✓</div>
                      <span className="font-semibold text-neutral-900">Per-recruiter pricing (not per-client)</span>
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
                    onClick={() => window.location.href = 'mailto:demo@talentpatriot.com?subject=Demo Request - Agency'}
                  >
                    Request Demo
                  </Button>
                </div>
                
                <p className="text-sm text-neutral-500 mt-4">✓ 14-day free trial • ✓ No setup fees • ✓ Cancel anytime</p>
              </div>
              
              <div className="relative">
                <div className="bg-white rounded-3xl shadow-2xl p-6 border-2 border-neutral-100">
                  <div className="text-xs font-semibold text-neutral-500 mb-4">MULTI-CLIENT DASHBOARD</div>
                  <div className="space-y-3">
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 border-l-4 border-blue-500">
                      <div className="flex justify-between items-center mb-2">
                        <div className="font-bold text-neutral-900">Tech Startup Inc.</div>
                        <div className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">12 Active Jobs</div>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-center text-xs">
                        <div>
                          <div className="font-bold text-blue-900">24</div>
                          <div className="text-blue-700">Applied</div>
                        </div>
                        <div>
                          <div className="font-bold text-blue-900">8</div>
                          <div className="text-blue-700">Screen</div>
                        </div>
                        <div>
                          <div className="font-bold text-blue-900">5</div>
                          <div className="text-blue-700">Interview</div>
                        </div>
                        <div>
                          <div className="font-bold text-blue-900">2</div>
                          <div className="text-blue-700">Offer</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 border-l-4 border-green-500">
                      <div className="flex justify-between items-center mb-2">
                        <div className="font-bold text-neutral-900">Healthcare Corp</div>
                        <div className="text-xs bg-green-500 text-white px-2 py-1 rounded-full">8 Active Jobs</div>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-center text-xs">
                        <div>
                          <div className="font-bold text-green-900">31</div>
                          <div className="text-green-700">Applied</div>
                        </div>
                        <div>
                          <div className="font-bold text-green-900">12</div>
                          <div className="text-green-700">Screen</div>
                        </div>
                        <div>
                          <div className="font-bold text-green-900">7</div>
                          <div className="text-green-700">Interview</div>
                        </div>
                        <div>
                          <div className="font-bold text-green-900">3</div>
                          <div className="text-green-700">Offer</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4 border-l-4 border-purple-500">
                      <div className="flex justify-between items-center mb-2">
                        <div className="font-bold text-neutral-900">Retail Solutions LLC</div>
                        <div className="text-xs bg-purple-500 text-white px-2 py-1 rounded-full">5 Active Jobs</div>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-center text-xs">
                        <div>
                          <div className="font-bold text-purple-900">18</div>
                          <div className="text-purple-700">Applied</div>
                        </div>
                        <div>
                          <div className="font-bold text-purple-900">6</div>
                          <div className="text-purple-700">Screen</div>
                        </div>
                        <div>
                          <div className="font-bold text-purple-900">4</div>
                          <div className="text-purple-700">Interview</div>
                        </div>
                        <div>
                          <div className="font-bold text-purple-900">1</div>
                          <div className="text-purple-700">Offer</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-center text-xs text-neutral-500 mt-4">
                    ✨ Manage all your clients from one dashboard
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 px-[5%] bg-white">
          <div className="max-w-[1200px] mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-4">Agency Challenges We Solve</h2>
              <p className="text-xl text-neutral-500">Built specifically for boutique staffing firms</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8">
                <div className="text-3xl mb-4">🔀</div>
                <h3 className="text-xl font-bold text-neutral-900 mb-3">Client Chaos</h3>
                <p className="text-neutral-600 mb-4">Managing 5+ clients across separate spreadsheets, email threads, and tools. Constantly switching contexts and losing track of candidates.</p>
                <div className="bg-white rounded-lg p-4 border-2 border-red-300">
                  <div className="font-semibold text-green-700 mb-2">✓ TalentPatriot Solution:</div>
                  <p className="text-sm text-neutral-600">One unified dashboard for all clients. Switch between client pipelines with a single click. Keep candidates organized by client and role.</p>
                </div>
              </div>
              
              <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-8">
                <div className="text-3xl mb-4">💸</div>
                <h3 className="text-xl font-bold text-neutral-900 mb-3">Enterprise Pricing That Kills Margins</h3>
                <p className="text-neutral-600 mb-4">Bullhorn, JobAdder charging $500-800/month. That's 2-3 placements just to break even on your software costs.</p>
                <div className="bg-white rounded-lg p-4 border-2 border-amber-300">
                  <div className="font-semibold text-green-700 mb-2">✓ TalentPatriot Solution:</div>
                  <p className="text-sm text-neutral-600">$89/recruiter/month for unlimited clients. Save $400-700/month compared to enterprise ATS while getting 90% of the features.</p>
                </div>
              </div>
              
              <div className="bg-purple-50 border-2 border-purple-200 rounded-2xl p-8">
                <div className="text-3xl mb-4">🏷️</div>
                <h3 className="text-xl font-bold text-neutral-900 mb-3">No White-Label Options</h3>
                <p className="text-neutral-600 mb-4">Sending candidates to generic careers pages that don't match your client's brand. Looks unprofessional and hurts conversion.</p>
                <div className="bg-white rounded-lg p-4 border-2 border-purple-300">
                  <div className="font-semibold text-green-700 mb-2">✓ TalentPatriot Solution:</div>
                  <p className="text-sm text-neutral-600">White-label careers pages for every client. Custom domain, logo, colors. Candidates never see "TalentPatriot" branding.</p>
                </div>
              </div>
              
              <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-8">
                <div className="text-3xl mb-4">📊</div>
                <h3 className="text-xl font-bold text-neutral-900 mb-3">Can't Prove ROI to Clients</h3>
                <p className="text-neutral-600 mb-4">Clients ask "How's my search going?" and you scramble through emails and notes. No clean way to show progress or metrics.</p>
                <div className="bg-white rounded-lg p-4 border-2 border-blue-300">
                  <div className="font-semibold text-green-700 mb-2">✓ TalentPatriot Solution:</div>
                  <p className="text-sm text-neutral-600">Client-facing dashboards showing pipeline status, time-to-fill, and candidate quality. Generate reports with one click.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 px-[5%] bg-gradient-to-br from-[#EFF6FF] to-[#F0FDF4]">
          <div className="max-w-[1200px] mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-4">Features Agencies Love</h2>
              <p className="text-xl text-neutral-500">Everything you need to manage multiple clients professionally</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: '🏢',
                  title: 'Multi-Client Dashboard',
                  desc: 'View all clients at a glance. Switch between pipelines instantly. Never lose track of a search again.',
                  features: ['Unified client overview', 'One-click context switching', 'Cross-client candidate search']
                },
                {
                  icon: '🏷️',
                  title: 'White-Label Careers Pages',
                  desc: 'Each client gets their own branded careers page. Their logo, colors, domain—your professionalism.',
                  features: ['Custom domains per client', 'Client branding & logos', 'No TalentPatriot branding']
                },
                {
                  icon: '📊',
                  title: 'Client Reporting',
                  desc: 'Generate beautiful reports showing pipeline progress, time-to-fill, and candidate quality metrics.',
                  features: ['One-click report generation', 'Client-facing dashboards', 'Prove your value with data']
                },
                {
                  icon: '🎯',
                  title: 'AI Resume Matching',
                  desc: 'Automatically parse resumes and match candidates to requirements across all client jobs.',
                  features: ['Skills extraction', 'Fit scoring', 'Cross-client matching']
                },
                {
                  icon: '📧',
                  title: 'Email Integration',
                  desc: 'Send personalized outreach from your own email. Templates, tracking, and follow-ups built in.',
                  features: ['Gmail/Outlook sync', 'Email templates', 'Open/click tracking']
                },
                {
                  icon: '💰',
                  title: 'Per-Recruiter Pricing',
                  desc: 'Pay per recruiter, not per client. Scale your client base without scaling your software costs.',
                  features: ['Unlimited clients included', 'Predictable monthly cost', 'No hidden fees']
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

        <section className="py-24 px-[5%] bg-white">
          <div className="max-w-[1200px] mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-4">Simple, Transparent Pricing</h2>
              <p className="text-xl text-neutral-500">Pay per recruiter, not per client</p>
            </div>
            
            <div className="max-w-[600px] mx-auto">
              <div className="bg-gradient-to-br from-[#EFF6FF] to-[#F0FDF4] rounded-3xl p-8 border-2 border-[#0EA5E9] shadow-xl">
                <div className="text-center mb-6">
                  <div className="text-sm font-semibold text-[#0EA5E9] mb-2">AGENCY PLAN</div>
                  <div className="text-5xl font-bold text-neutral-900 mb-2">$89<span className="text-xl font-normal text-neutral-500">/recruiter/month</span></div>
                  <p className="text-neutral-600">Unlimited clients included</p>
                </div>
                
                <div className="space-y-3 mb-8">
                  {[
                    'Unlimited clients & jobs',
                    'White-label careers pages',
                    'Multi-client dashboard',
                    'AI resume parsing & matching',
                    'Email integration & templates',
                    'Client reporting & analytics',
                    'Team collaboration',
                    'Priority support',
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-5 h-5 bg-[#10B981] rounded-full flex items-center justify-center text-white text-xs">✓</div>
                      <span className="text-neutral-700">{feature}</span>
                    </div>
                  ))}
                </div>
                
                <Link href="/beta">
                  <Button className="w-full btn-gradient text-white font-semibold py-4 rounded-xl text-lg hover:shadow-lg transition-shadow">
                    Start 14-Day Free Trial
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <p className="text-center text-sm text-neutral-500 mt-4">No credit card required</p>
              </div>
            </div>
          </div>
        </section>

        <section className="relative py-24 px-[5%] bg-gradient-to-br from-[#0EA5E9] to-[#10B981] text-white text-center overflow-hidden">
          <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-[radial-gradient(circle,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:50px_50px] animate-move-bg pointer-events-none" />
          
          <div className="max-w-[800px] mx-auto relative z-10">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              Ready to Scale Your Agency?
            </h2>
            <p className="text-xl opacity-95 mb-8">
              Join boutique agencies who've grown their client base without growing their tech costs.
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
                onClick={() => window.location.href = 'mailto:demo@talentpatriot.com?subject=Demo Request - Agency'}
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
