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
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200 fixed w-full z-50">
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
                <h1 className="text-2xl font-bold text-slate-900">
                  TalentPatriot
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <Link href="/login">
                <Button variant="ghost" className="text-slate-700 hover:text-slate-900 font-medium text-base px-4 py-2">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium text-base px-6 py-3 shadow-sm whitespace-nowrap transition-colors duration-200">
                  Start Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6">
            Effortless Hiring Starts Here
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-600 mb-12 max-w-3xl mx-auto">
            TalentPatriot helps small teams track jobs, move candidates through pipelines, 
            and hire faster — all in one intuitive platform.
          </p>
          
          {/* Dashboard Screenshot */}
          <div className="mb-12 relative max-w-5xl mx-auto">
            <div className="bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl shadow-2xl p-8 aspect-video flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-500 text-lg">TalentPatriot Dashboard</p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/signup">
              <Button className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium text-lg px-8 py-4 shadow-lg transition-all duration-200 w-full sm:w-auto">
                Start Free
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" className="border-2 border-slate-900 text-slate-900 hover:bg-slate-50 rounded-lg font-medium text-lg px-8 py-4 transition-all duration-200 w-full sm:w-auto">
                Book a Demo
              </Button>
            </Link>
          </div>
          
          <div className="text-sm text-slate-500">
            Built for teams like yours • Trusted by SMB recruiters
          </div>
        </div>
      </section>

      {/* Who It's For Section */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-slate-900 mb-16">
            Built for Busy Recruiters, Founders, and Hiring Managers
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <UserCheck className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-2xl font-semibold text-slate-900 mb-4">Recruiters</h3>
                <p className="text-slate-600 text-lg">
                  Track candidates and communicate in one place
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Rocket className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-2xl font-semibold text-slate-900 mb-4">Founders</h3>
                <p className="text-slate-600 text-lg">
                  Stay in the loop, even if you don't have a hiring team
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Target className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-semibold text-slate-900 mb-4">Hiring Managers</h3>
                <p className="text-slate-600 text-lg">
                  See your pipeline without logging into spreadsheets
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-slate-900 mb-16">
            Everything You Need — Nothing You Don't
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-5xl mb-4">🧩</div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Drag-and-drop job pipeline</h3>
              <p className="text-slate-600">Move candidates through stages with a simple drag and drop</p>
            </div>
            
            <div className="text-center">
              <div className="text-5xl mb-4">📇</div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Centralized candidate profiles</h3>
              <p className="text-slate-600">All candidate information in one searchable database</p>
            </div>
            
            <div className="text-center">
              <div className="text-5xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Notes, tags, and reminders</h3>
              <p className="text-slate-600">Keep track of every interaction and never miss a follow-up</p>
            </div>
            
            <div className="text-center">
              <div className="text-5xl mb-4">👥</div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">CRM-lite for passive talent</h3>
              <p className="text-slate-600">Build talent pools for future opportunities</p>
            </div>
          </div>
        </div>
      </section>

      {/* Screenshot Gallery */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-slate-900 mb-16">
            See TalentPatriot in Action
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-br from-slate-100 to-slate-200 p-8 aspect-video flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                  <p className="text-slate-500">Candidate Dashboard</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-8 aspect-video flex items-center justify-center">
                <div className="text-center">
                  <Target className="w-12 h-12 text-blue-400 mx-auto mb-2" />
                  <p className="text-blue-600">Job Pipeline View</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-br from-purple-100 to-purple-200 p-8 aspect-video flex items-center justify-center">
                <div className="text-center">
                  <UserCheck className="w-12 h-12 text-purple-400 mx-auto mb-2" />
                  <p className="text-purple-600">Candidate Profile</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Teaser */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-slate-900 mb-6">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-slate-600 mb-12">
            No contracts. No hidden fees. Just straightforward pricing built for growing teams.
          </p>
          <Link href="/pricing">
            <Button className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium text-lg px-8 py-4 shadow-lg transition-all duration-200">
              View Pricing
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-32 bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">
            Start Hiring Smarter Today
          </h2>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link href="/signup">
              <Button className="bg-white text-slate-900 hover:bg-slate-100 rounded-lg font-medium text-lg px-8 py-4 shadow-lg transition-all duration-200 w-full sm:w-auto">
                Start Free
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-slate-900 rounded-lg font-medium text-lg px-8 py-4 transition-all duration-200 w-full sm:w-auto">
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
                className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-slate-400 rounded-lg h-12"
              />
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 h-12">
                Get Started
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-white py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center">
                <img 
                  src="/tp-logo.png" 
                  alt="TalentPatriot Logo" 
                  className="w-10 h-10 object-contain"
                />
              </div>
              <span className="text-xl font-bold">TalentPatriot</span>
            </div>
            
            <nav className="flex flex-wrap justify-center gap-6 text-sm">
              <a href="#" className="hover:text-slate-300 transition-colors">About</a>
              <a href="#" className="hover:text-slate-300 transition-colors">Privacy</a>
              <a href="#" className="hover:text-slate-300 transition-colors">Terms</a>
              <a href="#" className="hover:text-slate-300 transition-colors">Contact</a>
            </nav>
            
            <p className="text-sm text-slate-400">
              © 2025 TalentPatriot
            </p>
          </div>
        </div>
      </footer>


    </div>
  )
}