import { useEffect } from 'react'
import { Link } from 'wouter'
import { Button } from '@/components/ui/button'
import { ArrowLeft, FileText, Scale, Shield, AlertCircle, Users, Ban, RefreshCw } from 'lucide-react'

export default function TermsOfService() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="min-h-screen bg-tp-page-bg">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <Link href="/">
              <a className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <div className="w-10 h-10 bg-tp-primary rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-xl">TP</span>
                </div>
                <span className="text-2xl font-bold text-tp-primary">TalentPatriot</span>
              </a>
            </Link>
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Terms of Service Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl shadow-sm p-8 md:p-12">
          {/* Title Section */}
          <div className="mb-8 text-center">
            <div className="w-16 h-16 bg-tp-primary-light rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-tp-primary" />
            </div>
            <h1 className="text-4xl font-bold text-neutral-900 mb-4">Terms of Service</h1>
            <p className="text-neutral-600">Last updated: January 30, 2025</p>
          </div>

          {/* Introduction */}
          <section className="mb-10">
            <p className="text-neutral-600 leading-relaxed">
              Welcome to TalentPatriot. These Terms of Service ("Terms") govern your use of our applicant tracking system and related services (the "Service") operated by TalentPatriot ("we", "us", or "our"). By accessing or using our Service, you agree to be bound by these Terms.
            </p>
          </section>

          {/* Acceptance of Terms */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <Scale className="w-6 h-6 text-tp-accent" />
              <h2 className="text-2xl font-bold leading-tight text-neutral-900">1. Acceptance of Terms</h2>
            </div>
            
            <p className="text-neutral-600 mb-4">
              By creating an account or using our Service, you acknowledge that you have read, understood, and agree to be bound by these Terms and our Privacy Policy. If you do not agree to these Terms, you may not access or use the Service.
            </p>

            <p className="text-neutral-600">
              If you are using the Service on behalf of an organization, you represent and warrant that you have the authority to bind that organization to these Terms.
            </p>
          </section>

          {/* Service Description */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold leading-tight text-neutral-900 mb-4">2. Service Description</h2>
            
            <p className="text-neutral-600 mb-4">
              TalentPatriot provides a cloud-based applicant tracking system that enables organizations to:
            </p>
            
            <ul className="list-disc list-inside space-y-2 text-neutral-600">
              <li>Post job openings and manage recruitment pipelines</li>
              <li>Track and organize candidate applications</li>
              <li>Collaborate with team members on hiring decisions</li>
              <li>Schedule interviews and manage communications</li>
              <li>Store and manage recruitment-related documents</li>
              <li>Generate reports and analytics on hiring processes</li>
            </ul>
          </section>

          {/* Account Registration */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-6 h-6 text-tp-accent" />
              <h2 className="text-2xl font-bold leading-tight text-neutral-900">3. Account Registration and Security</h2>
            </div>
            
            <div className="space-y-4 text-neutral-600">
              <p>To use certain features of our Service, you must register for an account. You agree to:</p>
              
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Provide accurate, current, and complete information</li>
                <li>Maintain and promptly update your account information</li>
                <li>Keep your password secure and confidential</li>
                <li>Notify us immediately of any unauthorized use of your account</li>
                <li>Accept responsibility for all activities under your account</li>
              </ul>

              <p>We reserve the right to suspend or terminate accounts that violate these Terms or engage in fraudulent activity.</p>
            </div>
          </section>

          {/* Acceptable Use */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-tp-accent" />
              <h2 className="text-2xl font-bold leading-tight text-neutral-900">4. Acceptable Use Policy</h2>
            </div>
            
            <p className="text-neutral-600 mb-4">
              You agree to use the Service only for lawful purposes and in accordance with these Terms. You agree not to:
            </p>
            
            <ul className="list-disc list-inside space-y-2 text-neutral-600">
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe upon the rights of others</li>
              <li>Upload malicious code or interfere with the Service</li>
              <li>Attempt to gain unauthorized access to any part of the Service</li>
              <li>Use the Service to send spam or unsolicited communications</li>
              <li>Scrape or copy content without permission</li>
              <li>Impersonate another person or organization</li>
              <li>Use the Service for discriminatory hiring practices</li>
            </ul>
          </section>

          {/* Intellectual Property */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold leading-tight text-neutral-900 mb-4">5. Intellectual Property Rights</h2>
            
            <div className="space-y-4 text-neutral-600">
              <div>
                <h3 className="text-lg font-medium text-neutral-900 mb-2">Our Intellectual Property</h3>
                <p>
                  The Service and its original content, features, and functionality are owned by TalentPatriot and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-neutral-900 mb-2">Your Content</h3>
                <p>
                  You retain all rights to the content you upload to the Service. By uploading content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, and display your content solely for the purpose of providing the Service.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-neutral-900 mb-2">Feedback</h3>
                <p>
                  Any feedback, suggestions, or improvements you provide may be used by us without any obligation to you.
                </p>
              </div>
            </div>
          </section>

          {/* Payment Terms */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold leading-tight text-neutral-900 mb-4">6. Payment Terms</h2>
            
            <div className="space-y-4 text-neutral-600">
              <p>Certain features of the Service require payment. You agree to:</p>
              
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Pay all fees according to the pricing plan you select</li>
                <li>Provide accurate payment information</li>
                <li>Authorize us to charge your payment method</li>
                <li>Pay any applicable taxes</li>
              </ul>

              <p>
                <strong>Billing:</strong> Subscription fees are billed in advance on a monthly or annual basis and are non-refundable except as required by law.
              </p>

              <p>
                <strong>Price Changes:</strong> We may change our prices upon 30 days' notice. Continued use after price changes constitutes acceptance of the new prices.
              </p>
            </div>
          </section>

          {/* Termination */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <Ban className="w-6 h-6 text-tp-accent" />
              <h2 className="text-2xl font-bold leading-tight text-neutral-900">7. Termination</h2>
            </div>
            
            <div className="space-y-4 text-neutral-600">
              <p>
                Either party may terminate these Terms at any time. You may terminate by closing your account and discontinuing use of the Service.
              </p>

              <p>
                We may terminate or suspend your access immediately, without prior notice, for:
              </p>
              
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Breach of these Terms</li>
                <li>Non-payment of fees</li>
                <li>Fraudulent or illegal activity</li>
                <li>Upon request by law enforcement</li>
              </ul>

              <p>
                Upon termination, your right to use the Service will cease immediately. We will make your data available for export for 30 days after termination.
              </p>
            </div>
          </section>

          {/* Disclaimers */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-tp-accent" />
              <h2 className="text-2xl font-bold leading-tight text-neutral-900">8. Disclaimers and Limitations</h2>
            </div>
            
            <div className="space-y-4 text-neutral-600">
              <p className="uppercase font-medium">
                The Service is provided "AS IS" and "AS AVAILABLE" without warranties of any kind, either express or implied.
              </p>

              <p>
                We do not warrant that:
              </p>
              
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>The Service will be uninterrupted or error-free</li>
                <li>The Service will meet your specific requirements</li>
                <li>The results obtained will be accurate or reliable</li>
                <li>Any errors in the Service will be corrected</li>
              </ul>

              <p className="uppercase font-medium mt-4">
                In no event shall TalentPatriot be liable for any indirect, incidental, special, consequential, or punitive damages.
              </p>
            </div>
          </section>

          {/* Indemnification */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold leading-tight text-neutral-900 mb-4">9. Indemnification</h2>
            
            <p className="text-neutral-600">
              You agree to indemnify, defend, and hold harmless TalentPatriot and its officers, directors, employees, and agents from any claims, liabilities, damages, losses, and expenses arising from your use of the Service or violation of these Terms.
            </p>
          </section>

          {/* Governing Law */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold leading-tight text-neutral-900 mb-4">10. Governing Law and Disputes</h2>
            
            <div className="space-y-4 text-neutral-600">
              <p>
                These Terms shall be governed by and construed in accordance with the laws of [Your Jurisdiction], without regard to its conflict of law provisions.
              </p>

              <p>
                Any disputes arising from these Terms or the Service shall be resolved through binding arbitration in accordance with the rules of [Arbitration Organization].
              </p>
            </div>
          </section>

          {/* Changes to Terms */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <RefreshCw className="w-6 h-6 text-tp-accent" />
              <h2 className="text-2xl font-bold leading-tight text-neutral-900">11. Changes to Terms</h2>
            </div>
            
            <p className="text-neutral-600">
              We reserve the right to modify these Terms at any time. We will notify you of material changes by posting the new Terms on this page and updating the "Last updated" date. Your continued use of the Service after changes constitutes acceptance of the modified Terms.
            </p>
          </section>

          {/* Contact Information */}
          <section>
            <h2 className="text-2xl font-bold leading-tight text-neutral-900 mb-4">12. Contact Information</h2>
            
            <p className="text-neutral-600 mb-4">
              If you have any questions about these Terms, please contact us:
            </p>
            
            <div className="bg-tp-card-surface rounded-xl p-6">
              <p className="text-neutral-900 font-medium mb-2">TalentPatriot Legal Team</p>
              <p className="text-neutral-600">Email: legal@talentpatriot.com</p>
              <p className="text-neutral-600">Address: [Your Company Address]</p>
            </div>
          </section>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-neutral-200 mt-16">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="text-center text-sm text-neutral-600">
            © 2025 TalentPatriot. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
