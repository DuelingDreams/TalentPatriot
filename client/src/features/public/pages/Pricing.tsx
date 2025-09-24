import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Check, ArrowRight, Star, Building2, Zap, Trophy, Users, UserCheck } from "lucide-react"
import { Link } from "wouter"

export default function Pricing() {
  const plans = [
    {
      name: "Starter",
      price: "$129",
      period: "/mo",
      description: "For small teams moving off spreadsheets",
      features: [
        "3 Recruiter/Admin seats included",
        "Unlimited free collaborators (hiring managers, interviewers, viewers, owner)",
        "Up to 5 active jobs",
        "Branded careers page (subdomain)",
        "Resume uploads + AI parsing (basic)",
        "Kanban-style pipeline management",
        "Automated email notifications",
        "Basic dashboards & reports"
      ],
      buttonText: "Get Started",
      buttonVariant: "outline" as const,
      popular: false,
      icon: Users
    },
    {
      name: "Growth",
      price: "$249",
      period: "/mo",
      description: "Most popular – for growing SMBs & boutique agencies",
      features: [
        "10 Recruiter/Admin seats included",
        "Unlimited free collaborators",
        "Up to 25 active jobs",
        "AI-powered candidate matching & insights",
        "Advanced analytics dashboards",
        "Multi-client pipelines (great for agencies)",
        "Internal messaging + interview scheduling",
        "Advanced filtering & search",
        "Customizable pipeline stages"
      ],
      buttonText: "Get Started",
      buttonVariant: "default" as const,
      popular: true,
      icon: Zap
    },
    {
      name: "Agency / Pro",
      price: "$499",
      period: "/mo",
      description: "For staffing firms & high-growth SMBs",
      features: [
        "25 Recruiter/Admin seats included",
        "Unlimited free collaborators",
        "Unlimited active jobs",
        "White-label careers pages (custom domain + branding)",
        "Expanded AI features (auto shortlisting, candidate scoring)",
        "Advanced reports & CSV/Excel export",
        "Priority support & dedicated onboarding"
      ],
      buttonText: "Get Started",
      buttonVariant: "outline" as const,
      popular: false,
      icon: Building2
    },
    {
      name: "Enterprise / Custom",
      price: "$999+",
      period: "/mo",
      description: "For enterprises & compliance-heavy orgs",
      features: [
        "Custom recruiter/admin seat counts",
        "Unlimited free collaborators",
        "SSO (Okta, Azure AD)",
        "Custom integrations (HRIS, payroll, Slack/Teams)",
        "SLA guarantees & dedicated success manager"
      ],
      buttonText: "Get Started",
      buttonVariant: "outline" as const,
      popular: false,
      icon: Trophy
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
          <Link href="/">
            <div className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                <img 
                  src="/talentpatriot-logo.png" 
                  alt="TalentPatriot Logo" 
                  className="w-8 h-8 object-contain"
                  loading="lazy"
                />
              </div>
              <span className="text-xl font-bold text-[#1A1A1A] font-[Inter,sans-serif]">TalentPatriot</span>
            </div>
          </Link>
        </div>
      </header>

      <main className="py-16">
        {/* Hero Section */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 md:px-12 text-center mb-16">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#1A1A1A] mb-6 font-[Inter,sans-serif]">
            TalentPatriot Pricing
          </h1>
          <p className="text-xl md:text-2xl text-[#5C667B] mb-8 font-[Inter,sans-serif] leading-relaxed">
            Pay only for recruiters. <span className="font-bold text-[#1A1A1A]">Unlimited free collaborators</span> are always included.
          </p>
        </section>

        {/* Pricing Cards */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 lg:gap-8">
            {plans.map((plan, index) => {
              const IconComponent = plan.icon
              return (
                <Card 
                  key={index} 
                  className={`group relative transition-all duration-300 hover:-translate-y-1 ${
                    plan.popular 
                      ? 'border-[#4285F4] shadow-lg hover:shadow-2xl ring-2 ring-[#4285F4] ring-opacity-20' 
                      : 'border-[#D1E7FF] shadow-sm hover:shadow-xl hover:border-[#264C99]'
                  } bg-white min-h-[600px] focus-within:ring-2 focus-within:ring-[#1F3A5F] focus-within:ring-offset-2`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <div className="bg-[#4285F4] text-white px-4 py-2 rounded-full text-sm font-medium font-[Inter,sans-serif] flex items-center gap-2 shadow-lg">
                        <Star className="w-4 h-4 fill-current" />
                        Recommended
                      </div>
                    </div>
                  )}
                  
                  <div className={`absolute top-0 left-0 w-full h-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                    plan.popular 
                      ? 'bg-gradient-to-r from-[#4285F4] to-[#1F3A5F]' 
                      : 'bg-gradient-to-r from-[#264C99] to-[#1F3A5F]'
                  }`}></div>

                  <CardContent className="p-8 h-full flex flex-col">
                    {/* Plan Icon & Name */}
                    <div className="text-center mb-6">
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md border transition-transform duration-300 group-hover:scale-110 ${
                        plan.popular 
                          ? 'bg-gradient-to-br from-[#4285F4]/10 to-[#1F3A5F]/10 border-[#4285F4]/30' 
                          : 'bg-gradient-to-br from-[#D1E7FF] to-[#E8F2FF] border-[#B8D4FF]'
                      }`}>
                        <IconComponent className={`w-8 h-8 ${plan.popular ? 'text-[#4285F4]' : 'text-[#1F3A5F]'}`} />
                      </div>
                      <h3 className="text-2xl font-bold text-[#1A1A1A] font-[Inter,sans-serif] mb-2">
                        {plan.name}
                      </h3>
                    </div>

                    {/* Price */}
                    <div className="text-center mb-6">
                      <div className="flex items-baseline justify-center">
                        <span className={`text-4xl lg:text-5xl font-bold font-[Inter,sans-serif] ${
                          plan.popular ? 'text-[#4285F4]' : 'text-[#1F3A5F]'
                        }`}>
                          {plan.price}
                        </span>
                        <span className="text-xl text-[#5C667B] font-[Inter,sans-serif] ml-1">
                          {plan.period}
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-[#5C667B] text-center mb-8 font-[Inter,sans-serif] leading-relaxed">
                      {plan.description}
                    </p>

                    {/* Features */}
                    <div className="flex-grow mb-8">
                      <ul className="space-y-4">
                        {plan.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                              <Check className="w-3 h-3 text-green-600" strokeWidth={3} />
                            </div>
                            <span className="text-[#3D4852] font-[Inter,sans-serif] leading-relaxed">
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* CTA Button */}
                    <div className="mt-auto">
                      <Link href="/beta">
                        <Button 
                          className={`w-full py-4 rounded-lg font-medium text-base transition-all duration-300 focus:ring-2 focus:ring-offset-2 ${
                            plan.popular
                              ? 'bg-[#4285F4] hover:bg-[#3367D6] text-white focus:ring-[#4285F4] shadow-lg hover:shadow-xl'
                              : plan.buttonVariant === 'outline'
                              ? 'border-[#1F3A5F] text-[#1F3A5F] hover:bg-[#1F3A5F] hover:text-white focus:ring-[#1F3A5F] bg-transparent border-2'
                              : 'bg-[#1F3A5F] hover:bg-[#264C99] text-white focus:ring-[#1F3A5F]'
                          }`}
                          variant={plan.buttonVariant}
                        >
                          {plan.buttonText}
                          <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 bg-[#F7F9FC] mt-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] text-center mb-12 font-[Inter,sans-serif]">
              Frequently Asked Questions
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-bold text-[#1A1A1A] mb-3 font-[Inter,sans-serif]">
                  What counts as a "recruiter seat"?
                </h3>
                <p className="text-[#5C667B] leading-relaxed font-[Inter,sans-serif]">
                  Recruiter seats are for users who can create jobs, move candidates through pipelines, and manage the hiring process. Hiring managers, interviewers, and viewers are always free.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-bold text-[#1A1A1A] mb-3 font-[Inter,sans-serif]">
                  Can I change plans anytime?
                </h3>
                <p className="text-[#5C667B] leading-relaxed font-[Inter,sans-serif]">
                  Yes! You can upgrade or downgrade your plan at any time. Changes take effect at your next billing cycle, and we'll prorate any differences.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-bold text-[#1A1A1A] mb-3 font-[Inter,sans-serif]">
                  Is there a free trial?
                </h3>
                <p className="text-[#5C667B] leading-relaxed font-[Inter,sans-serif]">
                  We offer a 14-day free trial on all paid plans. No credit card required to start – just apply for beta access and we'll set you up.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-bold text-[#1A1A1A] mb-3 font-[Inter,sans-serif]">
                  What's included in "unlimited collaborators"?
                </h3>
                <p className="text-[#5C667B] leading-relaxed font-[Inter,sans-serif]">
                  Add unlimited hiring managers, interviewers, executives, and read-only viewers at no extra cost. They can review candidates, leave feedback, and participate in the hiring process.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-6 font-[Inter,sans-serif]">
              Ready to Transform Your Hiring?
            </h2>
            <p className="text-xl text-[#5C667B] mb-8 font-[Inter,sans-serif] leading-relaxed">
              Join the beta and start hiring smarter with TalentPatriot's AI-powered recruitment platform.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/beta">
                <Button className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg font-medium text-base transition-colors w-full sm:w-auto shadow-lg hover:shadow-xl">
                  Apply for Beta Access
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/">
                <Button 
                  variant="outline" 
                  className="border-[#1F3A5F] text-[#1F3A5F] hover:bg-[#1F3A5F] hover:text-white px-8 py-4 rounded-lg font-medium text-base transition-colors w-full sm:w-auto"
                >
                  Back to Home
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}