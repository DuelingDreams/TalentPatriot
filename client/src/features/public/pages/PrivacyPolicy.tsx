import { useEffect } from 'react'
import { Link } from 'wouter'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Shield, Lock, Eye, UserCheck, Globe, FileText, Mail } from 'lucide-react'

export default function PrivacyPolicy() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="min-h-screen bg-[#F7F9FC]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <Link href="/">
              <a className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <div className="w-10 h-10 bg-[#1F3A5F] rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-xl">TP</span>
                </div>
                <span className="text-2xl font-bold text-[#1F3A5F]">TalentPatriot</span>
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

      {/* Privacy Policy Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl shadow-sm p-8 md:p-12">
          {/* Title Section */}
          <div className="mb-8 text-center">
            <div className="w-16 h-16 bg-[#E6F2FF] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-[#1F3A5F]" />
            </div>
            <h1 className="text-4xl font-bold text-[#1A1A1A] mb-4">Privacy Policy</h1>
            <p className="text-[#5C667B]">Last updated: January 30, 2025</p>
          </div>

          {/* Introduction */}
          <section className="mb-10">
            <p className="text-[#5C667B] leading-relaxed">
              At TalentPatriot ("we", "us", or "our"), we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our applicant tracking system and related services.
            </p>
          </section>

          {/* Information We Collect */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <Eye className="w-6 h-6 text-[#264C99]" />
              <h2 className="text-2xl font-semibold text-[#1A1A1A]">Information We Collect</h2>
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-[#1A1A1A] mb-2">Personal Information</h3>
                <ul className="list-disc list-inside space-y-2 text-[#5C667B]">
                  <li>Name, email address, and contact information</li>
                  <li>Company name and job title</li>
                  <li>Account credentials and authentication data</li>
                  <li>Professional information you choose to share</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium text-[#1A1A1A] mb-2">Candidate Information</h3>
                <ul className="list-disc list-inside space-y-2 text-[#5C667B]">
                  <li>Resumes and application materials</li>
                  <li>Interview notes and evaluations</li>
                  <li>Communication history</li>
                  <li>Skills and experience data</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium text-[#1A1A1A] mb-2">Usage Information</h3>
                <ul className="list-disc list-inside space-y-2 text-[#5C667B]">
                  <li>Log data and analytics</li>
                  <li>Device and browser information</li>
                  <li>Feature usage patterns</li>
                  <li>Performance metrics</li>
                </ul>
              </div>
            </div>
          </section>

          {/* How We Use Your Information */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <UserCheck className="w-6 h-6 text-[#264C99]" />
              <h2 className="text-2xl font-semibold text-[#1A1A1A]">How We Use Your Information</h2>
            </div>
            
            <ul className="list-disc list-inside space-y-2 text-[#5C667B]">
              <li>Provide and maintain our applicant tracking services</li>
              <li>Process job applications and manage recruitment workflows</li>
              <li>Enable collaboration between hiring team members</li>
              <li>Send notifications about application status and system updates</li>
              <li>Improve our services and develop new features</li>
              <li>Ensure platform security and prevent fraud</li>
              <li>Comply with legal obligations and respond to lawful requests</li>
            </ul>
          </section>

          {/* Data Security */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <Lock className="w-6 h-6 text-[#264C99]" />
              <h2 className="text-2xl font-semibold text-[#1A1A1A]">Data Security</h2>
            </div>
            
            <p className="text-[#5C667B] mb-4">
              We implement industry-standard security measures to protect your data:
            </p>
            
            <ul className="list-disc list-inside space-y-2 text-[#5C667B]">
              <li>Encryption of data in transit and at rest</li>
              <li>Regular security audits and vulnerability assessments</li>
              <li>Access controls and authentication requirements</li>
              <li>Secure data centers with physical security measures</li>
              <li>Employee training on data protection best practices</li>
              <li>Incident response procedures for security events</li>
            </ul>
          </section>

          {/* Data Sharing */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <Globe className="w-6 h-6 text-[#264C99]" />
              <h2 className="text-2xl font-semibold text-[#1A1A1A]">Data Sharing and Disclosure</h2>
            </div>
            
            <p className="text-[#5C667B] mb-4">
              We do not sell your personal information. We may share your information only in these circumstances:
            </p>
            
            <ul className="list-disc list-inside space-y-2 text-[#5C667B]">
              <li><strong>With your consent:</strong> When you explicitly authorize us to share information</li>
              <li><strong>Within your organization:</strong> With authorized users in your company account</li>
              <li><strong>Service providers:</strong> With trusted vendors who help us operate our services</li>
              <li><strong>Legal requirements:</strong> When required by law or to protect rights and safety</li>
              <li><strong>Business transfers:</strong> In connection with mergers or acquisitions</li>
            </ul>
          </section>

          {/* Your Rights */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-6 h-6 text-[#264C99]" />
              <h2 className="text-2xl font-semibold text-[#1A1A1A]">Your Rights and Choices</h2>
            </div>
            
            <p className="text-[#5C667B] mb-4">
              You have the following rights regarding your personal information:
            </p>
            
            <ul className="list-disc list-inside space-y-2 text-[#5C667B]">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Update or correct inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your personal data</li>
              <li><strong>Portability:</strong> Receive your data in a structured format</li>
              <li><strong>Objection:</strong> Object to certain processing activities</li>
              <li><strong>Restriction:</strong> Request limited processing of your data</li>
            </ul>
          </section>

          {/* Data Retention */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-[#1A1A1A] mb-4">Data Retention</h2>
            
            <p className="text-[#5C667B]">
              We retain personal information for as long as necessary to provide our services and comply with legal obligations. Specific retention periods include:
            </p>
            
            <ul className="list-disc list-inside space-y-2 text-[#5C667B] mt-4">
              <li>Active account data: Retained while your account is active</li>
              <li>Candidate data: Retained according to your organization's policies</li>
              <li>Legal compliance data: Retained as required by applicable laws</li>
              <li>Deleted data: Removed from our systems within 90 days of deletion request</li>
            </ul>
          </section>

          {/* International Data Transfers */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-[#1A1A1A] mb-4">International Data Transfers</h2>
            
            <p className="text-[#5C667B]">
              Your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place for international transfers, including standard contractual clauses and other transfer mechanisms approved by relevant authorities.
            </p>
          </section>

          {/* Children's Privacy */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-[#1A1A1A] mb-4">Children's Privacy</h2>
            
            <p className="text-[#5C667B]">
              Our services are not intended for children under 16 years of age. We do not knowingly collect personal information from children. If we learn that we have collected information from a child under 16, we will delete that information promptly.
            </p>
          </section>

          {/* Changes to Privacy Policy */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-[#1A1A1A] mb-4">Changes to This Privacy Policy</h2>
            
            <p className="text-[#5C667B]">
              We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last updated" date. We encourage you to review this Privacy Policy periodically.
            </p>
          </section>

          {/* Contact Information */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <Mail className="w-6 h-6 text-[#264C99]" />
              <h2 className="text-2xl font-semibold text-[#1A1A1A]">Contact Us</h2>
            </div>
            
            <p className="text-[#5C667B] mb-4">
              If you have questions or concerns about this Privacy Policy or our data practices, please contact us:
            </p>
            
            <div className="bg-[#F0F4F8] rounded-xl p-6">
              <p className="text-[#1A1A1A] font-medium mb-2">TalentPatriot Privacy Team</p>
              <p className="text-[#5C667B]">Email: privacy@talentpatriot.com</p>
              <p className="text-[#5C667B]">Address: [Your Company Address]</p>
            </div>
          </section>

          {/* Legal Basis */}
          <section>
            <h2 className="text-2xl font-semibold text-[#1A1A1A] mb-4">Legal Basis for Processing</h2>
            
            <p className="text-[#5C667B] mb-4">
              We process personal information under the following legal bases:
            </p>
            
            <ul className="list-disc list-inside space-y-2 text-[#5C667B]">
              <li><strong>Contract:</strong> To fulfill our service agreement with you</li>
              <li><strong>Consent:</strong> When you provide explicit consent for specific processing</li>
              <li><strong>Legitimate interests:</strong> To improve our services and ensure security</li>
              <li><strong>Legal obligation:</strong> To comply with applicable laws and regulations</li>
            </ul>
          </section>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="text-center text-sm text-[#5C667B]">
            © 2025 TalentPatriot. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}