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
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 fixed w-full z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center">
                <img 
                  src="/tp-logo.png" 
                  alt="TalentPatriot Logo" 
                  className="w-10 h-10 object-contain"
                />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                TalentPatriot
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" className="text-slate-600 hover:text-slate-900 font-medium text-base px-4 py-2 transition">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-base px-5 py-3 shadow-sm whitespace-nowrap transition">
                  Start Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 py-12 px-6 md:px-12 bg-white">
        <div className="max-w-6xl mx-auto text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight leading-relaxed">
            Effortless Hiring Starts Here
          </h1>
          
          <p className="text-lg md:text-xl text-base leading-relaxed text-slate-700 mb-8 max-w-3xl mx-auto md:mx-0">
            TalentPatriot helps small teams track jobs, move candidates through pipelines, 
            and hire faster — all in one intuitive platform.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start mb-12">
            <Link href="/signup">
              <Button className="bg-indigo-600 text-white px-5 py-3 rounded-xl hover:bg-indigo-700 transition font-medium w-full sm:w-auto">
                Start Free
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" className="border border-indigo-600 text-indigo-600 px-5 py-3 rounded-xl hover:bg-indigo-50 transition font-medium w-full sm:w-auto">
                Book a Demo
              </Button>
            </Link>
          </div>
          
          {/* Dashboard Screenshot */}
          <div className="mb-8 relative max-w-5xl mx-auto">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl shadow-xl p-8 aspect-video flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 text-lg">TalentPatriot Dashboard</p>
              </div>
            </div>
          </div>
          
          <div className="text-base text-slate-600 text-center md:text-left">
            Built for teams like yours • Trusted by SMB recruiters
          </div>
        </div>
      </section>

      {/* Who It's For Section */}
      <section className="py-12 px-6 md:px-12 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-semibold text-center mb-6 text-slate-900">
            Built for Busy Recruiters, Founders, and Hiring Managers
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white shadow-md rounded-2xl p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserCheck className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Recruiters</h3>
              <p className="text-base leading-relaxed text-slate-700">
                Track candidates and communicate in one place
              </p>
            </div>
            
            <div className="bg-white shadow-md rounded-2xl p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Rocket className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Founders</h3>
              <p className="text-base leading-relaxed text-slate-700">
                Stay in the loop, even if you don't have a hiring team
              </p>
            </div>
            
            <div className="bg-white shadow-md rounded-2xl p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Hiring Managers</h3>
              <p className="text-base leading-relaxed text-slate-700">
                See your pipeline without logging into spreadsheets
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="py-12 px-6 md:px-12 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-semibold text-center text-slate-900 mb-8">
            Everything You Need — Nothing You Don't
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow p-6">
              <div className="text-4xl mb-4">🧩</div>
              <h3 className="text-lg font-medium text-slate-900 mb-3">Drag-and-drop job pipeline</h3>
              <p className="text-base leading-relaxed text-slate-700">Move candidates through stages with a simple drag and drop</p>
            </div>
            
            <div className="bg-white rounded-xl shadow p-6">
              <div className="text-4xl mb-4">📇</div>
              <h3 className="text-lg font-medium text-slate-900 mb-3">Centralized candidate profiles</h3>
              <p className="text-base leading-relaxed text-slate-700">All candidate information in one searchable database</p>
            </div>
            
            <div className="bg-white rounded-xl shadow p-6">
              <div className="text-4xl mb-4">📝</div>
              <h3 className="text-lg font-medium text-slate-900 mb-3">Notes, tags, and reminders</h3>
              <p className="text-base leading-relaxed text-slate-700">Keep track of every interaction and never miss a follow-up</p>
            </div>
            
            <div className="bg-white rounded-xl shadow p-6">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-lg font-medium text-slate-900 mb-3">CRM-lite for passive talent</h3>
              <p className="text-base leading-relaxed text-slate-700">Build talent pools for future opportunities</p>
            </div>
          </div>
        </div>
      </section>

      {/* Screenshot Gallery */}
      <section className="py-12 px-6 md:px-12 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-semibold text-center text-slate-900 mb-8">
            See TalentPatriot in Action
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-xl shadow-xl overflow-hidden">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 aspect-video flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                  <p className="text-slate-600 text-base font-medium">Candidate Dashboard</p>
                </div>
              </div>
            </div>
            
            <div className="rounded-xl shadow-xl overflow-hidden">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 aspect-video flex items-center justify-center">
                <div className="text-center">
                  <Target className="w-12 h-12 text-blue-600 mx-auto mb-2" />
                  <p className="text-blue-700 text-base font-medium">Job Pipeline View</p>
                </div>
              </div>
            </div>
            
            <div className="rounded-xl shadow-xl overflow-hidden">
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 aspect-video flex items-center justify-center">
                <div className="text-center">
                  <UserCheck className="w-12 h-12 text-purple-600 mx-auto mb-2" />
                  <p className="text-purple-700 text-base font-medium">Candidate Profile</p>
                </div>
              </div>
            </div>
            
            <div className="rounded-xl shadow-xl overflow-hidden">
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 aspect-video flex items-center justify-center">
                <div className="text-center">
                  <Users className="w-12 h-12 text-green-600 mx-auto mb-2" />
                  <p className="text-green-700 text-base font-medium">Team Collaboration</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Teaser */}
      <section className="bg-slate-100 py-12 px-6 md:px-12">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-semibold text-center text-slate-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-base leading-relaxed text-slate-700 mb-8">
            No contracts. No hidden fees. Just straightforward pricing built for growing teams.
          </p>
          <Link href="/pricing">
            <Button className="bg-indigo-600 text-white rounded-lg px-5 py-3 hover:bg-indigo-700 transition font-medium">
              View Pricing
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>



      {/* Final CTA Section */}
      <section className="bg-white py-12 px-6 md:px-12">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-center text-slate-900 mb-8">
            Start Hiring Smarter Today
          </h2>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/signup">
              <Button className="bg-indigo-600 text-white px-5 py-3 rounded-xl hover:bg-indigo-700 transition font-medium w-full sm:w-auto">
                Start Free
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" className="border border-indigo-600 text-indigo-600 px-5 py-3 rounded-xl hover:bg-indigo-50 transition font-medium w-full sm:w-auto">
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
                className="flex-1 rounded px-4 py-2 border w-full md:w-1/3"
              />
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded px-4 py-2 transition font-medium">
                Get Started
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-100 py-6">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                <img 
                  src="/tp-logo.png" 
                  alt="TalentPatriot Logo" 
                  className="w-8 h-8 object-contain"
                />
              </div>
              <span className="text-lg font-semibold text-slate-900">TalentPatriot</span>
            </div>
            
            <nav className="flex flex-wrap justify-center gap-4 text-sm text-slate-600 text-center">
              <a href="#" className="hover:text-slate-900 transition-colors">About</a>
              <a href="#" className="hover:text-slate-900 transition-colors">Privacy</a>
              <a href="#" className="hover:text-slate-900 transition-colors">Terms</a>
              <a href="#" className="hover:text-slate-900 transition-colors">Contact</a>
            </nav>
            
            <p className="text-sm text-slate-600 text-center">
              © 2025 TalentPatriot
            </p>
          </div>
        </div>
      </footer>


    </div>
  )
}