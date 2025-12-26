import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, FileText } from 'lucide-react'
import { Link } from 'wouter'
import { useEffect } from 'react'

export default function DemoTranscript() {
  useEffect(() => {
    document.title = "Demo Transcript — TalentPatriot Product Tour"
    
    let metaDescription = document.querySelector('meta[name="description"]')
    if (!metaDescription) {
      metaDescription = document.createElement('meta')
      metaDescription.setAttribute('name', 'description')
      document.head.appendChild(metaDescription)
    }
    metaDescription.setAttribute('content', 'Complete transcript of the TalentPatriot product demo video. Learn about our SMB-focused ATS features and functionality.')
  }, [])

  return (
    <div className="min-h-screen bg-tp-page-bg font-[Inter,sans-serif]">
      {/* Skip to Content Link */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-6 focus:py-3 focus:bg-tp-primary focus:text-white focus:rounded-md focus:shadow-lg focus:font-medium"
      >
        Skip to main content
      </a>

      {/* Navigation */}
      <header>
        <nav className="bg-white border-b border-neutral-200 fixed w-full z-50 shadow-sm" role="banner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center">
                <img 
                  src="/talentpatriot-logo.png" 
                  alt="TalentPatriot Logo" 
                  className="w-8 h-8 md:w-10 md:h-10 object-contain"
                  loading="eager"
                />
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-neutral-900 tracking-tight">
                TalentPatriot
              </h1>
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              <Link href="/login">
                <Button className="bg-tp-secondary hover:bg-tp-secondary/90 text-white font-medium text-sm md:text-base px-3 md:px-4 py-2 transition-colors">
                  Sign In
                </Button>
              </Link>
              <Link href="/beta">
                <Button className="bg-tp-primary hover:bg-tp-accent text-white font-medium text-sm md:text-base px-4 md:px-6 py-2 whitespace-nowrap transition-colors">
                  Beta Access
                </Button>
              </Link>
            </div>
          </div>
        </div>
        </nav>
      </header>

      {/* Main Content */}
      <main id="main-content">
        <section className="pt-32 py-16 bg-tp-page-bg">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-12">
            {/* Back Link */}
            <div className="mb-8">
              <Button 
                variant="outline" 
                className="border-tp-primary text-tp-primary hover:bg-tp-primary hover:text-white"
                onClick={() => {
                  const demoSection = document.getElementById('demo')
                  if (demoSection) {
                    window.location.href = '/#demo'
                  } else {
                    window.location.href = '/'
                  }
                }}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Demo
              </Button>
            </div>

            {/* Header */}
            <div className="text-center mb-12">
              <div className="w-16 h-16 bg-gradient-to-br from-info-100 to-info-50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg border border-info-200">
                <FileText className="w-8 h-8 text-tp-primary" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4 font-[Inter,sans-serif]">
                Demo Video Transcript
              </h1>
              <p className="text-lg text-neutral-600 font-[Inter,sans-serif]">
                Complete transcript of the TalentPatriot product tour
              </p>
            </div>

            {/* Transcript Content */}
            <Card className="border border-info-100 shadow-lg">
              <CardContent className="p-8 md:p-12">
                <div className="prose prose-lg max-w-none">
                  <div className="mb-8 p-4 bg-info-50 rounded-lg border border-tp-primary/20">
                    <p className="text-sm text-tp-primary font-medium mb-2">Note:</p>
                    <p className="text-sm text-neutral-600">
                      This transcript is for the upcoming TalentPatriot product demo video. 
                      The actual video will be available soon.
                    </p>
                  </div>

                  <h2 className="text-2xl font-bold text-neutral-900 mb-6 font-[Inter,sans-serif]">
                    TalentPatriot Product Demo - Transcript Placeholder
                  </h2>

                  <div className="space-y-6 text-neutral-500 leading-relaxed">
                    <p>
                      <strong className="text-neutral-900">[00:00 - 00:15]</strong><br />
                      Welcome to TalentPatriot, the ATS built specifically for small and mid-sized businesses. 
                      In the next two minutes, I'll show you how we're making recruitment faster, fairer, 
                      and more accessible for growing teams.
                    </p>

                    <p>
                      <strong className="text-neutral-900">[00:15 - 00:30]</strong><br />
                      Let's start with what makes us different: fair pricing. Unlike other ATSs that charge 
                      for every user, we only charge for recruiter seats. Your hiring managers, interviewers, 
                      and collaborators? They're always free.
                    </p>

                    <p>
                      <strong className="text-neutral-900">[00:30 - 00:45]</strong><br />
                      Here's our drag-and-drop pipeline in action. Move candidates seamlessly through your 
                      hiring stages with our Kanban-style boards. Each job gets its own customizable pipeline, 
                      perfect for different roles and client requirements.
                    </p>

                    <p>
                      <strong className="text-neutral-900">[00:45 - 01:00]</strong><br />
                      Our AI-powered resume parsing automatically extracts key information and populates 
                      candidate profiles. No more manual data entry – just upload a resume and watch 
                      the magic happen.
                    </p>

                    <p>
                      <strong className="text-neutral-900">[01:00 - 01:15]</strong><br />
                      For boutique staffing agencies, our multi-client pipeline system lets you manage 
                      different client requirements without the chaos. Each client gets their own space 
                      while you maintain oversight across all placements.
                    </p>

                    <p>
                      <strong className="text-neutral-900">[01:15 - 01:30]</strong><br />
                      Team collaboration is built right in. Leave notes, mention teammates, set reminders, 
                      and keep everyone aligned throughout the hiring process. All without paying extra 
                      for collaboration features.
                    </p>

                    <p>
                      <strong className="text-neutral-900">[01:30 - 01:45]</strong><br />
                      Launch your branded careers page in under a day. Our 5-step onboarding gets you 
                      from signup to posting jobs fast. Candidates can apply directly through your 
                      custom-branded portal.
                    </p>

                    <p>
                      <strong className="text-neutral-900">[01:45 - 02:00]</strong><br />
                      Ready to stop wrestling with clunky ATSs? TalentPatriot combines enterprise-level 
                      features with SMB-friendly pricing and setup. Join our beta program and start 
                      hiring smarter today.
                    </p>
                  </div>

                  <div className="mt-12 p-6 bg-info-50 rounded-lg border border-info-200">
                    <h3 className="text-lg font-bold text-neutral-900 mb-3 font-[Inter,sans-serif]">
                      Accessibility Features
                    </h3>
                    <ul className="text-sm text-neutral-600 space-y-2">
                      <li>• Closed captions available in English</li>
                      <li>• Screen reader compatible transcript</li>
                      <li>• Keyboard navigation support</li>
                      <li>• High contrast video player controls</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CTA Section */}
            <div className="text-center mt-12">
              <h2 className="text-2xl font-bold text-neutral-900 mb-6 font-[Inter,sans-serif]">
                Ready to Experience TalentPatriot?
              </h2>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/beta">
                  <Button className="bg-success hover:bg-success-600 text-white px-8 py-4 rounded-md font-medium text-base transition-colors w-full sm:w-auto">
                    Start Free in Beta
                  </Button>
                </Link>
                <Link href="/">
                  <Button 
                    variant="outline" 
                    className="border-tp-primary text-tp-primary hover:bg-tp-primary hover:text-white px-8 py-4 rounded-md font-medium text-base transition-colors w-full sm:w-auto"
                  >
                    Back to Home
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white py-12 border-t border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                <img 
                  src="/talentpatriot-logo.png" 
                  alt="TalentPatriot Logo" 
                  className="w-8 h-8 object-contain"
                  loading="lazy"
                />
              </div>
              <span className="text-lg font-bold leading-tight text-neutral-900 font-[Inter,sans-serif]">TalentPatriot</span>
            </div>
            
            <nav className="flex flex-wrap justify-center gap-4 md:gap-6 text-sm text-neutral-600 text-center font-[Inter,sans-serif]">
              <Link href="/about" className="hover:text-neutral-900 transition-colors px-2">About</Link>
              <Link href="/privacy" className="hover:text-neutral-900 transition-colors px-2">Privacy</Link>
              <Link href="/terms" className="hover:text-neutral-900 transition-colors px-2">Terms</Link>
              <a href="mailto:contact@talentpatriot.com" className="hover:text-neutral-900 transition-colors px-2">Contact</a>
            </nav>
            
            <p className="text-sm text-neutral-600 text-center font-[Inter,sans-serif]">
              © 2025 TalentPatriot
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
