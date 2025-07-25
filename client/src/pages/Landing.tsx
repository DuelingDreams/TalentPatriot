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
                <div className="w-10 h-10 rounded-lg flex items-center justify-center">
                  <img 
                    src="/tp-logo.png" 
                    alt="TalentPatriot Logo" 
                    className="w-10 h-10 object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                    TalentPatriot
                  </h1>
                  <p className="text-xs text-slate-600 -mt-1">Professional ATS</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <Link href="/login">
                <Button variant="ghost" className="text-slate-700 hover:text-slate-900 font-medium text-sm sm:text-base px-2 sm:px-4">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg text-sm sm:text-base px-3 sm:px-4 whitespace-nowrap">
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
            TalentPatriot is a clean, modern hiring platform for <span className="font-semibold text-slate-800">small and midsized 
            businesses</span> who want clarity — not clutter. Perfect for hiring managers, recruiters, and admins 
            who need powerful tools without enterprise complexity.
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
              <span>5-Minute Setup</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-600" />
              <span>No Credit Card Required</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-600" />
              <span>Works Anywhere</span>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-24 bg-gradient-to-br from-blue-50 via-white to-purple-50 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 right-20 w-32 h-32 bg-blue-300 rounded-full opacity-10 blur-2xl"></div>
          <div className="absolute bottom-20 left-20 w-40 h-40 bg-purple-300 rounded-full opacity-10 blur-2xl"></div>
        </div>
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-blue-100 border border-blue-200 rounded-full px-6 py-3 mb-8">
            <Target className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-semibold text-blue-700 uppercase tracking-wide">Our Mission</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-12 leading-tight">
            <span className="bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              To create a lightweight, candidate-friendly ATS
            </span>
            <br />
            <span className="text-slate-600">that gives small and mid-sized teams</span>
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-extrabold">
              everything they need
            </span>
            <span className="text-slate-600"> — and </span>
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent font-extrabold">
              nothing they don't
            </span>
          </h2>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/50 max-w-4xl mx-auto">
            <p className="text-lg md:text-xl text-slate-700 leading-relaxed">
              We believe hiring should be about <span className="font-semibold text-blue-600">human connection</span>, 
              not navigating complex software. TalentPatriot strips away the bloat and focuses on what matters: 
              <span className="font-semibold text-slate-800"> helping great people find great opportunities</span>.
            </p>
          </div>
        </div>
      </section>

      {/* What It Replaces Section */}
      <section className="py-24 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-40 left-1/4 w-64 h-64 bg-blue-500 rounded-full opacity-5 blur-3xl"></div>
          <div className="absolute bottom-40 right-1/4 w-48 h-48 bg-purple-500 rounded-full opacity-5 blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-red-100 border border-red-200 rounded-full px-6 py-3 mb-8">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-semibold text-red-700 uppercase tracking-wide">Problem Solved</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold mb-8 text-white">
              What It Replaces
            </h2>
            <p className="text-xl text-slate-300 max-w-4xl mx-auto leading-relaxed">
              Most ATS/CRMs are overloaded. You just need to hire. 
              <span className="text-white font-semibold"> TalentPatriot eliminates the chaos:</span>
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
            <div className="group bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-8 shadow-xl border border-red-200 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Complex Enterprise ATS</h3>
              <p className="text-slate-700 text-lg leading-relaxed">
                Bloated dashboards with 50+ features you'll never use. Requires IT setup, training, and expensive per-seat licensing.
              </p>
            </div>
            
            <div className="group bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-8 shadow-xl border border-orange-200 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Spreadsheet & Email Chaos</h3>
              <p className="text-slate-700 text-lg leading-relaxed">
                Candidate data scattered across Excel files, email threads, and sticky notes. No collaboration or pipeline visibility.
              </p>
            </div>
            
            <div className="group bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-8 shadow-xl border border-purple-200 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Team Misalignment</h3>
              <p className="text-slate-700 text-lg leading-relaxed">
                Hiring managers, recruiters, and admins working in silos. Context gets lost in handoffs, candidates slip through cracks.
              </p>
            </div>
          </div>
          
          <div className="text-center">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-10 max-w-4xl mx-auto shadow-2xl">
              <h3 className="text-3xl font-bold text-white mb-6">With TalentPatriot</h3>
              <div className="grid md:grid-cols-3 gap-6 text-center">
                <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                  <Zap className="w-8 h-8 text-white mx-auto mb-2" />
                  <div className="text-white font-semibold">5-Minute Setup</div>
                  <div className="text-blue-100 text-sm">No IT required</div>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                  <Users className="w-8 h-8 text-white mx-auto mb-2" />
                  <div className="text-white font-semibold">Team Collaboration</div>
                  <div className="text-blue-100 text-sm">Notes & stage history</div>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                  <TrendingUp className="w-8 h-8 text-white mx-auto mb-2" />
                  <div className="text-white font-semibold">Real-time Analytics</div>
                  <div className="text-blue-100 text-sm">Track performance</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Role-Based Features Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Built for your team,
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                no matter your role
              </span>
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              TalentPatriot adapts to how your team actually works. Each role gets the tools they need.
            </p>
          </div>

          {/* Role Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
            {[
              {
                role: 'Hiring Manager',
                description: 'Oversee hiring for your team. Create jobs, review candidates, schedule interviews.',
                titles: 'Team Lead, Director, Founder',
                color: 'blue',
                icon: Target
              },
              {
                role: 'Recruiter',
                description: 'Source and manage candidates, screen applicants, guide them through your pipeline.',
                titles: 'Recruiter, Talent Partner, HR Coordinator',
                color: 'purple',
                icon: Users
              },
              {
                role: 'Admin',
                description: 'Organization owner. Manage users, billing, and access to all jobs and candidates.',
                titles: 'Founder, COO, HR Manager',
                color: 'green',
                icon: Shield
              },
              {
                role: 'Interviewer',
                description: 'Review resumes, submit feedback, and help score candidates in your area.',
                titles: 'Department Lead, Tech Lead, Peer Interviewer',
                color: 'orange',
                icon: FileText
              }
            ].map((roleCard, index) => {
              const bgColors = {
                blue: 'bg-blue-50 border-blue-200',
                purple: 'bg-purple-50 border-purple-200',
                green: 'bg-green-50 border-green-200',
                orange: 'bg-orange-50 border-orange-200'
              };
              const iconColors = {
                blue: 'text-blue-600',
                purple: 'text-purple-600',
                green: 'text-green-600',
                orange: 'text-orange-600'
              };
              
              return (
                <Card key={index} className={`group hover:shadow-xl transition-all duration-300 border-2 ${bgColors[roleCard.color as keyof typeof bgColors]} bg-white/60 backdrop-blur`}>
                  <CardContent className="p-6">
                    <div className="mb-4">
                      <roleCard.icon className={`w-8 h-8 ${iconColors[roleCard.color as keyof typeof iconColors]} mb-3`} />
                      <h3 className="text-xl font-bold text-slate-900 mb-2">{roleCard.role}</h3>
                      <p className="text-sm text-slate-600 font-medium mb-3">{roleCard.titles}</p>
                    </div>
                    <p className="text-slate-700 text-sm leading-relaxed">{roleCard.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold mb-6">
              <span className="bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Everything you need,
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                nothing you don't
              </span>
            </h3>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Professional ATS capabilities without the enterprise complexity or cost. Built specifically for growing businesses.
            </p>
            

          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: 'Quick Setup, No IT Team Needed',
                description: '5-minute setup with guided onboarding. Start hiring immediately with zero technical configuration required.',
                color: 'blue'
              },
              {
                icon: Users,
                title: 'Easy for Everyone to Use',
                description: 'Intuitive interface designed for recruiters, hiring managers, and executives. No training manuals needed.',
                color: 'purple'
              },
              {
                icon: Building2,
                title: 'Integrated CRM Without Spreadsheets',
                description: 'Build talent pipelines with built-in candidate relationship management. Say goodbye to Excel chaos.',
                color: 'green'
              },
              {
                icon: FileText,
                title: 'Collaborative Hiring Features',
                description: 'Notes, tags, stage history, and real-time updates keep your entire team aligned on every candidate.',
                color: 'red'
              },
              {
                icon: TrendingUp,
                title: 'Real-time Analytics',
                description: 'Actionable insights and reporting to track your hiring performance without information overload.',
                color: 'yellow'
              },
              {
                icon: BarChart3,
                title: 'Visual Pipeline Management',
                description: 'Drag-and-drop kanban boards that mirror your actual workflow with complete stage visibility.',
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
                description: 'Real-time updates, notes, and handoffs between hiring managers, recruiters, and admins',
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
            Built for small and midsized businesses who want to focus on hiring, not wrestling with software. Perfect for teams of 5-500 employees.
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
                <div className="w-10 h-10 rounded-lg flex items-center justify-center">
                  <img 
                    src="/tp-logo.png" 
                    alt="TalentPatriot Logo" 
                    className="w-10 h-10 object-contain"
                  />
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