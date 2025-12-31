import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Users, 
  Target, 
  Sparkles,
  ArrowRight,
  Heart,
  Globe,
  Zap,
  Shield,
  TrendingUp,
  CheckCircle,
  Award,
  Clock,
  Building2,
  UserCheck,
  BarChart3,
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
                <Button className="bg-tp-secondary hover:bg-tp-secondary/90 text-white font-medium text-sm md:text-base px-3 md:px-4 py-2 transition-colors">
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
            <div className="w-20 h-20 bg-tp-primary-light rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Heart className="w-10 h-10 text-tp-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-neutral-900 mb-6 tracking-tight">
              About TalentPatriot
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl text-tp-primary font-medium mb-8 max-w-4xl mx-auto">
              Building the future of recruitment technology for growing teams with AI-powered simplicity and human-centered design.
            </p>
          </div>

          {/* Our Focus */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-16">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-tp-primary mb-2">5-500</div>
              <div className="text-neutral-600 font-medium">Team Size Focus</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-tp-primary mb-2">2024</div>
              <div className="text-neutral-600 font-medium">Founded</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-tp-primary mb-2">Beta</div>
              <div className="text-neutral-600 font-medium">Early Access</div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Target className="w-8 h-8 text-tp-accent" />
                <h2 className="text-3xl md:text-4xl font-bold text-neutral-900">Our Mission</h2>
              </div>
              <p className="text-lg text-neutral-600 leading-relaxed mb-6">
                To empower growing businesses with recruitment technology that's powerful yet simple, 
                helping teams find and hire the right talent without the complexity and cost of 
                traditional enterprise systems.
              </p>
              <p className="text-lg text-neutral-600 leading-relaxed">
                We believe that great hiring shouldn't be limited to Fortune 500 companies. 
                Every growing business deserves access to intelligent, user-friendly recruitment tools 
                that scale with their success.
              </p>
            </div>
            <div className="relative">
              <Card className="bg-tp-page-bg border-none shadow-lg p-8">
                <CardContent className="p-0">
                  <div className="flex items-center gap-3 mb-4">
                    <Sparkles className="w-8 h-8 text-tp-accent" />
                    <h3 className="text-2xl font-bold text-neutral-900">Our Vision</h3>
                  </div>
                  <p className="text-neutral-600 leading-relaxed">
                    To become the go-to recruitment platform for the next generation of successful 
                    companies, making intelligent hiring accessible, affordable, and delightful for 
                    teams of all sizes.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-16 bg-tp-page-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">Our Core Values</h2>
            <p className="text-lg text-neutral-600 max-w-3xl mx-auto">
              The principles that guide everything we build and every decision we make
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-white hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-tp-primary-light rounded-xl flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-tp-accent" />
                </div>
                <h3 className="text-xl font-bold text-neutral-900 mb-3">Human-Centered</h3>
                <p className="text-neutral-600 leading-relaxed">
                  We design for humans first. Every feature prioritizes user experience and creates 
                  meaningful connections between companies and candidates.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-tp-primary-light rounded-xl flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-tp-accent" />
                </div>
                <h3 className="text-xl font-bold text-neutral-900 mb-3">Intelligent Simplicity</h3>
                <p className="text-neutral-600 leading-relaxed">
                  We harness the power of AI to make complex recruitment processes simple and intuitive, 
                  without sacrificing functionality or intelligence.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-tp-primary-light rounded-xl flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-tp-accent" />
                </div>
                <h3 className="text-xl font-bold text-neutral-900 mb-3">Trust & Security</h3>
                <p className="text-neutral-600 leading-relaxed">
                  We protect sensitive candidate and company data with enterprise-grade security, 
                  building trust through transparency and reliability.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-tp-primary-light rounded-xl flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-tp-accent" />
                </div>
                <h3 className="text-xl font-bold text-neutral-900 mb-3">Growth Mindset</h3>
                <p className="text-neutral-600 leading-relaxed">
                  We grow with our customers, adapting and scaling our platform to support their 
                  journey from startup to industry leader.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-tp-primary-light rounded-xl flex items-center justify-center mb-4">
                  <Globe className="w-6 h-6 text-tp-accent" />
                </div>
                <h3 className="text-xl font-bold text-neutral-900 mb-3">Inclusive by Design</h3>
                <p className="text-neutral-600 leading-relaxed">
                  We promote fair and inclusive hiring practices, helping organizations build 
                  diverse teams and create equal opportunities for all candidates.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-tp-primary-light rounded-xl flex items-center justify-center mb-4">
                  <Award className="w-6 h-6 text-tp-accent" />
                </div>
                <h3 className="text-xl font-bold text-neutral-900 mb-3">Customer Success</h3>
                <p className="text-neutral-600 leading-relaxed">
                  Your success is our success. We're committed to providing exceptional support 
                  and continuously improving based on customer feedback.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* The TalentPatriot Story */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-6">The TalentPatriot Story</h2>
              <div className="space-y-4 text-neutral-600 leading-relaxed">
                <p>
                  TalentPatriot was born from a simple observation: growing companies were stuck 
                  choosing between expensive, overly complex enterprise ATS systems or basic 
                  tools that couldn't scale with their needs.
                </p>
                <p>
                  Having experienced this challenge firsthand while scaling multiple startups, 
                  our founders set out to build the recruitment platform they wished they had – 
                  one that combines enterprise-level functionality with startup-friendly simplicity.
                </p>
                <p>
                  We're currently offering free beta access to forward-thinking companies who want 
                  to help shape the future of recruitment technology. Our beta partners get full 
                  access to all features while providing valuable feedback to refine the platform.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-tp-page-bg p-6">
                <div className="text-center">
                  <Clock className="w-8 h-8 text-tp-accent mx-auto mb-2" />
                  <div className="text-2xl font-bold text-tp-primary">2024</div>
                  <div className="text-sm text-neutral-600">Founded</div>
                </div>
              </Card>
              <Card className="bg-tp-page-bg p-6">
                <div className="text-center">
                  <Building2 className="w-8 h-8 text-tp-accent mx-auto mb-2" />
                  <div className="text-2xl font-bold text-tp-primary">Free</div>
                  <div className="text-sm text-neutral-600">Beta Access</div>
                </div>
              </Card>
              <Card className="bg-tp-page-bg p-6">
                <div className="text-center">
                  <UserCheck className="w-8 h-8 text-tp-accent mx-auto mb-2" />
                  <div className="text-2xl font-bold text-tp-primary">AI-First</div>
                  <div className="text-sm text-neutral-600">Technology</div>
                </div>
              </Card>
              <Card className="bg-tp-page-bg p-6">
                <div className="text-center">
                  <BarChart3 className="w-8 h-8 text-tp-accent mx-auto mb-2" />
                  <div className="text-2xl font-bold text-tp-primary">Growing</div>
                  <div className="text-sm text-neutral-600">Team</div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose TalentPatriot */}
      <section className="py-16 bg-tp-page-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">Why Choose TalentPatriot?</h2>
            <p className="text-lg text-neutral-600 max-w-3xl mx-auto">
              We're building the next generation of recruitment technology designed specifically for growing teams.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: "AI-Powered Intelligence",
                description: "Advanced resume parsing, candidate matching, and hiring insights powered by OpenAI GPT-4o"
              },
              {
                icon: Users,
                title: "Built for Growing Teams",
                description: "Designed specifically for companies with 5-500 employees who need enterprise features without enterprise complexity"
              },
              {
                icon: Shield,
                title: "Enterprise Security",
                description: "Bank-level security, GDPR compliance, and multi-tenant data isolation keep your information safe"
              },
              {
                icon: TrendingUp,
                title: "Scales With You",
                description: "Start small and grow big. Our platform adapts to your changing needs as your team expands"
              },
              {
                icon: Heart,
                title: "Candidate-Friendly",
                description: "Beautiful application experiences that candidates love, improving your employer brand"
              },
              {
                icon: Clock,
                title: "Quick Implementation",
                description: "Get up and running in minutes, not months. No complex setup or training required"
              }
            ].map((item, index) => (
              <Card key={index} className="bg-white hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-tp-primary-light rounded-xl flex items-center justify-center mb-4">
                    <item.icon className="w-6 h-6 text-tp-accent" />
                  </div>
                  <h3 className="text-lg font-bold text-neutral-900 mb-3">{item.title}</h3>
                  <p className="text-neutral-600 leading-relaxed">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section (Future) */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">Meet Our Team</h2>
            <p className="text-lg text-neutral-600 max-w-3xl mx-auto">
              We're a passionate team of builders, designers, and recruitment experts dedicated to transforming how companies hire.
            </p>
          </div>

          <div className="text-center">
            <Card className="bg-tp-page-bg p-12 max-w-2xl mx-auto">
              <CardContent className="p-0">
                <Users className="w-16 h-16 text-tp-accent mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-neutral-900 mb-4">We're Growing!</h3>
                <p className="text-neutral-600 leading-relaxed mb-6">
                  We're building something special and looking for talented individuals who share our 
                  passion for creating great recruitment technology for growing teams.
                </p>
                <Button className="bg-tp-primary hover:bg-tp-accent text-white px-6 py-3">
                  Join Our Team
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-tp-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Shape the Future of Hiring?
          </h2>
          <p className="text-xl text-info-100 mb-8 max-w-2xl mx-auto">
            Join our free beta program and help build the recruitment platform that growing teams actually need.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/onboarding/step1">
              <Button className="bg-white text-tp-primary hover:bg-neutral-100 px-8 py-4 rounded-md font-medium text-base transition-colors w-full sm:w-auto">
                Join Free Beta
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/careers">
              <Button variant="outline" className="border-white text-white hover:bg-white hover:text-tp-primary px-8 py-4 rounded-md font-medium text-base transition-colors w-full sm:w-auto">
                View Demo
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
                The intelligent ATS built for growing teams. Streamline your hiring, 
                make better decisions, and build teams that drive success.
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
                <li><Link href="/careers" className="text-neutral-600 hover:text-tp-primary transition-colors">Demo</Link></li>
                <li><Link href="/docs" className="text-neutral-600 hover:text-tp-primary transition-colors">Documentation</Link></li>
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
              © 2024 TalentPatriot. All rights reserved. Built with ❤️ for growing teams.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
