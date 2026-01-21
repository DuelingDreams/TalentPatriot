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
    <div className="min-h-screen bg-tp-page-bg font-[Inter,sans-serif]">
      {/* Navigation */}
      <nav className="bg-white border-b border-neutral-200 fixed w-full z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center">
                <img 
                  src="/talentpatriot-logo.png" 
                  alt="TalentPatriot Logo" 
                  className="w-8 h-8 md:w-10 md:h-10 object-contain"
                />
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-neutral-900 tracking-tight">
                TalentPatriot
              </h1>
            </Link>
            <div className="flex items-center gap-2 md:gap-3">
              <Link href="/">
                <Button variant="ghost" className="text-neutral-600 hover:text-tp-primary font-medium">
                  Home
                </Button>
              </Link>
              <Link href="/login">
                <Button className="bg-neutral-700 hover:bg-neutral-800 text-white font-medium text-sm md:text-base px-3 md:px-4 py-2 transition-colors">
                  Sign In
                </Button>
              </Link>
              <Link href="/onboarding/step1">
                <Button className="bg-tp-primary hover:bg-tp-accent text-white font-medium text-sm md:text-base px-4 md:px-6 py-2 whitespace-nowrap transition-colors">
                  Start Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-tp-page-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-neutral-900 mb-6 tracking-tight">
              Hiring shouldn't be this hard.
            </h1>
            <p className="text-lg md:text-xl text-neutral-600 mb-8 max-w-4xl mx-auto leading-relaxed">
              Yet for small businesses and boutique staffing firms, most recruiting software creates more 
              problems than it solves—bloated workflows, enterprise pricing, and systems built for companies 
              ten times your size.
            </p>
            <p className="text-xl md:text-2xl text-tp-primary font-semibold">
              TalentPatriot was built to change that.
            </p>
          </div>
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
      <section className="py-16 bg-tp-page-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">Our Philosophy</h2>
            <p className="text-xl text-tp-primary font-semibold mb-12">
              A TalentPatriot is someone who stands up for better hiring.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <Card className="bg-white hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-tp-primary-light rounded-xl flex items-center justify-center mb-4">
                  <Heart className="w-6 h-6 text-tp-accent" />
                </div>
                <h3 className="text-xl font-bold text-neutral-900 mb-3">Candidates Before Checkboxes</h3>
                <p className="text-neutral-600 leading-relaxed">
                  We put the human experience first, treating every candidate with the dignity and respect they deserve.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-tp-primary-light rounded-xl flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-tp-accent" />
                </div>
                <h3 className="text-xl font-bold text-neutral-900 mb-3">Relationships Over Volume</h3>
                <p className="text-neutral-600 leading-relaxed">
                  Quality connections matter more than quantity. We help you build and maintain meaningful relationships.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-tp-primary-light rounded-xl flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-tp-accent" />
                </div>
                <h3 className="text-xl font-bold text-neutral-900 mb-3">Small Teams, Big Impact</h3>
                <p className="text-neutral-600 leading-relaxed">
                  We empower small, focused teams to compete with anyone through better tools and smarter workflows.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center max-w-3xl mx-auto">
            <p className="text-lg text-neutral-600 leading-relaxed">
              We believe recruiting is a craft. It deserves tools that are fast, intuitive, and built for real-world 
              workflows—not enterprise HR theory.
            </p>
          </div>
        </div>
      </section>

      {/* Who We're Built For */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">Who We're Built For</h2>
            <p className="text-lg text-neutral-600 max-w-3xl mx-auto">
              TalentPatriot is purpose-built for teams who win on relationships, speed, and trust.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="bg-tp-page-bg border-2 border-tp-primary-light hover:border-tp-accent transition-colors">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-tp-primary-light rounded-xl flex items-center justify-center mb-4">
                  <Building2 className="w-6 h-6 text-tp-accent" />
                </div>
                <h3 className="text-2xl font-bold text-neutral-900 mb-4">Small Businesses</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-tp-secondary mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-neutral-600">Hiring without enterprise complexity</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-tp-secondary mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-neutral-600">Getting up and running in under an hour</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-tp-secondary mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-neutral-600">Keeping hiring organized without a dedicated HR department</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-tp-page-bg border-2 border-tp-primary-light hover:border-tp-accent transition-colors">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-tp-primary-light rounded-xl flex items-center justify-center mb-4">
                  <UserCheck className="w-6 h-6 text-tp-accent" />
                </div>
                <h3 className="text-2xl font-bold text-neutral-900 mb-4">Boutique Staffing & Recruiting Firms</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-tp-secondary mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-neutral-600">Managing pipelines without fighting your ATS</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-tp-secondary mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-neutral-600">Tracking relationships like a CRM—not a spreadsheet</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-tp-secondary mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-neutral-600">Collaborating with clients and teammates effortlessly</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why We Built TalentPatriot */}
      <section className="py-16 bg-tp-page-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-6">Why We Built TalentPatriot</h2>
              <p className="text-lg text-neutral-600 leading-relaxed mb-6">
                TalentPatriot was born out of high-trust hiring environments where accuracy, discretion, and 
                relationships mattered. We brought those same principles to small businesses and boutique 
                firms who deserve better tools—but don't want enterprise overhead.
              </p>
              <p className="text-lg text-neutral-600 leading-relaxed">
                The result is a clean, candidate-first ATS/CRM that helps you move faster, stay organized, 
                and stop losing great candidates to better systems.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <Card className="bg-white p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-tp-primary-light rounded-xl flex items-center justify-center flex-shrink-0">
                    <Zap className="w-6 h-6 text-tp-accent" />
                  </div>
                  <div>
                    <h3 className="font-bold text-neutral-900 mb-1">Move Faster</h3>
                    <p className="text-sm text-neutral-600">Speed matters in competitive hiring markets</p>
                  </div>
                </div>
              </Card>
              <Card className="bg-white p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-tp-primary-light rounded-xl flex items-center justify-center flex-shrink-0">
                    <Target className="w-6 h-6 text-tp-accent" />
                  </div>
                  <div>
                    <h3 className="font-bold text-neutral-900 mb-1">Stay Organized</h3>
                    <p className="text-sm text-neutral-600">Keep every candidate and conversation tracked</p>
                  </div>
                </div>
              </Card>
              <Card className="bg-white p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-tp-primary-light rounded-xl flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-6 h-6 text-tp-accent" />
                  </div>
                  <div>
                    <h3 className="font-bold text-neutral-900 mb-1">Win Top Talent</h3>
                    <p className="text-sm text-neutral-600">Stop losing candidates to better systems</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Our Promise */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-6">Our Promise</h2>
          </div>
          <Card className="bg-tp-page-bg border-none shadow-lg">
            <CardContent className="p-8 md:p-12">
              <div className="space-y-6 text-center">
                <div className="flex items-center justify-center gap-3">
                  <Shield className="w-8 h-8 text-tp-accent flex-shrink-0" />
                  <p className="text-lg md:text-xl text-neutral-700 font-medium">
                    No bloated features you don't need.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3">
                  <Shield className="w-8 h-8 text-tp-accent flex-shrink-0" />
                  <p className="text-lg md:text-xl text-neutral-700 font-medium">
                    No enterprise mistakes you can't afford.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3">
                  <Sparkles className="w-8 h-8 text-tp-secondary flex-shrink-0" />
                  <p className="text-lg md:text-xl text-tp-primary font-bold">
                    Just hiring software that works the way you do.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-tp-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Hire Better?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join forward-thinking teams who are building better hiring processes with TalentPatriot.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/onboarding/step1">
              <Button className="bg-white text-tp-primary hover:bg-neutral-100 px-8 py-4 rounded-md font-medium text-base transition-colors w-full sm:w-auto">
                Start Free Trial
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/demo">
              <Button variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-tp-primary px-8 py-4 rounded-md font-medium text-base transition-colors w-full sm:w-auto">
                Request Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-neutral-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                  <img 
                    src="/talentpatriot-logo.png" 
                    alt="TalentPatriot Logo" 
                    className="w-8 h-8 object-contain"
                  />
                </div>
                <h3 className="text-xl font-bold text-neutral-900">TalentPatriot</h3>
              </div>
              <p className="text-neutral-600 leading-relaxed mb-4">
                The intelligent ATS/CRM built for small businesses and boutique staffing firms. 
                Hire better without enterprise complexity.
              </p>
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm" className="text-neutral-600 hover:text-tp-primary">
                  <Mail className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-neutral-600 hover:text-tp-primary">
                  <Linkedin className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-neutral-600 hover:text-tp-primary">
                  <Github className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-neutral-900 mb-4">Product</h4>
              <ul className="space-y-2">
                <li><Link href="/" className="text-neutral-600 hover:text-tp-primary transition-colors">Features</Link></li>
                <li><Link href="/demo" className="text-neutral-600 hover:text-tp-primary transition-colors">Demo</Link></li>
                <li><Link href="/pricing" className="text-neutral-600 hover:text-tp-primary transition-colors">Pricing</Link></li>
                <li><Link href="/help" className="text-neutral-600 hover:text-tp-primary transition-colors">Support</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-neutral-900 mb-4">Company</h4>
              <ul className="space-y-2">
                <li><Link href="/about" className="text-neutral-600 hover:text-tp-primary transition-colors">About Us</Link></li>
                <li><Link href="/careers" className="text-neutral-600 hover:text-tp-primary transition-colors">Careers</Link></li>
                <li><Link href="/privacy" className="text-neutral-600 hover:text-tp-primary transition-colors">Privacy</Link></li>
                <li><Link href="/terms" className="text-neutral-600 hover:text-tp-primary transition-colors">Terms</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-neutral-200 mt-8 pt-8 text-center">
            <p className="text-neutral-600">
              © 2025 TalentPatriot. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
