import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  CheckCircle, 
  Users, 
  Building2, 
  Target, 
  TrendingUp, 
  FileText, 
  Calendar,
  ArrowRight,
  Star,
  Briefcase,
  Shield,
  Zap,
  Globe,
  ChevronRight,
  BarChart3,
  Sparkles
} from 'lucide-react'
import { Link } from 'wouter'

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 fixed w-full z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-lg">
                  <Briefcase className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                    TalentPatriot
                  </h1>
                  <p className="text-xs text-slate-600 -mt-1">Professional ATS</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost" className="text-slate-700 hover:text-slate-900 font-medium">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg">
                  Get Started Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full opacity-20 blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full opacity-20 blur-3xl"></div>
        </div>
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-2 mb-8">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">Built for humans. Not just headcounts.</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-8 tracking-tight">
            <span className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
              Finally, an ATS/CRM that
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              gets out of your way
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            TalentPatriot is a clean, modern hiring platform for <span className="font-semibold text-slate-800">recruiters, 
            BDs, and PMs</span> who want clarity — not clutter. Track jobs, 
            candidates, and clients in one place, without the bloat of enterprise systems.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/login">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-10 py-6 text-lg shadow-xl hover:shadow-2xl transition-all duration-200 group">
                Experience the Demo
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="lg" variant="outline" className="border-2 border-slate-300 hover:border-slate-400 text-slate-700 px-10 py-6 text-lg hover:bg-slate-50 transition-all duration-200">
                Start Free Trial
              </Button>
            </Link>
          </div>
          
          {/* Trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-600" />
              <span>Try the Demo Instantly</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-600" />
              <span>No Credit Card Required</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-600" />
              <span>Sign Up Free</span>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-white relative">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">
            <span className="bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Our Mission
            </span>
          </h2>
          <p className="text-xl md:text-2xl text-slate-600 leading-relaxed max-w-4xl mx-auto">
            To create a lightweight, candidate-friendly ATS that gives small and mid-sized teams 
            <span className="font-semibold text-slate-800"> everything they need</span> — and 
            <span className="font-semibold text-slate-800"> nothing they don't</span>.
          </p>
        </div>
      </section>

      {/* What It Replaces Section */}
      <section className="py-20 bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              <span className="bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                What It Replaces
              </span>
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Most ATS/CRMs are overloaded. You just need to hire. TalentPatriot replaces:
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-red-100">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Traditional ATS</h3>
              <p className="text-slate-600">Bloated dashboards and complex workflows that slow you down</p>
            </div>
            
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-red-100">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Spreadsheet chaos</h3>
              <p className="text-slate-600">Job and candidate silos that create duplicate work and confusion</p>
            </div>
            
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-red-100">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">BD/PM misalignment</h3>
              <p className="text-slate-600">Handoff breakdowns where context gets lost between teams</p>
            </div>
          </div>
          
          <p className="text-center mt-12 text-xl text-slate-700 font-medium">
            With TalentPatriot, everything is in one place. Organized. Searchable. Collaborative.
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Everything you need,
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                nothing you don't
              </span>
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Designed to eliminate friction, not add complexity. Every feature serves a purpose.
            </p>
            
            <blockquote className="mt-8 text-lg text-slate-700 font-medium italic max-w-2xl mx-auto">
              "After 10 years in recruiting, I built the ATS I always wanted. Simple. Fast. It just works."
              <span className="block mt-2 text-base not-italic">— Mike Hildebrand</span>
            </blockquote>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: BarChart3,
                title: 'Visual Pipeline Management',
                description: 'Drag-and-drop kanban boards that mirror your actual workflow',
                color: 'blue'
              },
              {
                icon: Users,
                title: 'Unified Team Workspace',
                description: 'Recruiters, BDs, and PMs working from the same source of truth',
                color: 'purple'
              },
              {
                icon: Zap,
                title: 'Smart Automation',
                description: 'Automate repetitive tasks while maintaining personal touch',
                color: 'green'
              },
              {
                icon: Shield,
                title: 'Enterprise Security',
                description: 'Role-based access control to keep your data secure',
                color: 'red'
              },
              {
                icon: Globe,
                title: 'Works Everywhere',
                description: 'Cloud-based solution accessible from any device',
                color: 'yellow'
              },
              {
                icon: TrendingUp,
                title: 'Real-time Analytics',
                description: 'Actionable insights without information overload',
                color: 'indigo'
              }
            ].map((feature, index) => {
              const bgColors = {
                blue: 'bg-blue-100',
                purple: 'bg-purple-100',
                green: 'bg-green-100',
                red: 'bg-red-100',
                yellow: 'bg-yellow-100',
                indigo: 'bg-indigo-100'
              };
              const textColors = {
                blue: 'text-blue-600',
                purple: 'text-purple-600',
                green: 'text-green-600',
                red: 'text-red-600',
                yellow: 'text-yellow-600',
                indigo: 'text-indigo-600'
              };
              
              return (
                <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-0 bg-white overflow-hidden">
                  <CardContent className="p-8">
                    <div className={`w-14 h-14 ${bgColors[feature.color as keyof typeof bgColors]} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                      <feature.icon className={`w-7 h-7 ${textColors[feature.color as keyof typeof textColors]}`} />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-3">{feature.title}</h3>
                    <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-blue-50 to-purple-50 rounded-full opacity-50 blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Built for how you
              </span>{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                actually work
              </span>
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              A logical hierarchy that matches your workflow: Client → Job → Candidate
            </p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8 mb-16">
            {[
              {
                step: '01',
                title: 'Client Management',
                description: 'Organize all client relationships with complete job history and requirements in one place',
                icon: Building2,
                color: 'blue'
              },
              {
                step: '02',
                title: 'Job Pipeline',
                description: 'Visual kanban boards for each position with drag-and-drop candidate management',
                icon: Target,
                color: 'purple'
              },
              {
                step: '03',
                title: 'Team Collaboration',
                description: 'Real-time updates, notes, and handoffs between recruiters, BDs, and PMs',
                icon: Users,
                color: 'green'
              }
            ].map((item, index) => {
              const bgColors = {
                blue: 'bg-blue-100',
                purple: 'bg-purple-100',
                green: 'bg-green-100'
              };
              const textColors = {
                blue: 'text-blue-600',
                purple: 'text-purple-600',
                green: 'text-green-600'
              };
              
              return (
                <div key={index} className="relative">
                  <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 border border-slate-100">
                    <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                      {item.step}
                    </div>
                    <div className={`w-14 h-14 ${bgColors[item.color as keyof typeof bgColors]} rounded-xl flex items-center justify-center mb-6 mt-4`}>
                      <item.icon className={`w-7 h-7 ${textColors[item.color as keyof typeof textColors]}`} />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-3">{item.title}</h3>
                    <p className="text-slate-600 leading-relaxed">{item.description}</p>
                  </div>
                  {index < 2 && (
                    <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                      <ChevronRight className="w-8 h-8 text-slate-300" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>



      {/* CTA Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700"></div>
        <div className="absolute inset-0 bg-grid-white/10"></div>
        
        <div className="max-w-5xl mx-auto text-center px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur border border-white/30 rounded-full px-4 py-2 mb-8">
            <Sparkles className="w-4 h-4 text-white" />
            <span className="text-sm font-medium text-white">Built for humans. Not just headcounts.</span>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 leading-tight">
            Ready to transform your
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-pink-200">
              hiring process?
            </span>
          </h2>
          
          <p className="text-xl md:text-2xl text-blue-100 mb-12 max-w-3xl mx-auto">
            Built for small to mid-sized teams who want to focus on hiring, not wrestling with software.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
            <Link href="/login">
              <Button size="lg" className="bg-white text-blue-700 hover:bg-gray-100 px-12 py-6 text-lg shadow-2xl hover:shadow-xl transition-all duration-200 font-semibold group">
                Experience the Demo
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-blue-700 px-12 py-6 text-lg transition-all duration-200 font-semibold">
                Start Your Free Trial
              </Button>
            </Link>
          </div>
          
          <p className="text-sm text-blue-100">
            No credit card required • 5-minute setup • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-1">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-lg">
                  <Briefcase className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold">TalentPatriot</h3>
              </div>
              <p className="text-slate-400 leading-relaxed">
                The modern ATS built for clarity, collaboration, and results.
              </p>
              <div className="flex space-x-4 mt-6">
                {/* Social icons placeholder */}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-6 text-slate-100">Product</h4>
              <ul className="space-y-3 text-slate-400">
                <li><Link href="/login" className="hover:text-white transition-colors">Demo Account</Link></li>
                <li><Link href="/signup" className="hover:text-white transition-colors">Start Free Trial</Link></li>
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-6 text-slate-100">Company</h4>
              <ul className="space-y-3 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Press Kit</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-6 text-slate-100">Resources</h4>
              <ul className="space-y-3 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API Reference</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-slate-400 text-sm">
                &copy; 2025 TalentPatriot, Inc. All rights reserved.
              </p>
              <div className="flex space-x-6 text-sm text-slate-400">
                <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}