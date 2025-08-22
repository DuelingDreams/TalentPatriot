import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
// import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { 
  Search, 
  Book, 
  Video, 
  MessageCircle, 
  FileText, 
  ExternalLink,
  Play,
  Clock,
  Users,
  Zap,
  Settings,
  PieChart,
  UserPlus,
  Briefcase,
  ChevronRight
} from 'lucide-react'

interface HelpItem {
  id: string
  title: string
  description: string
  category: string
  type: 'article' | 'video' | 'tutorial' | 'faq'
  duration?: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  tags: string[]
}

const helpItems: HelpItem[] = [
  {
    id: '1',
    title: 'Getting Started with TalentPatriot',
    description: 'Complete guide to setting up your organization and posting your first job',
    category: 'Getting Started',
    type: 'tutorial',
    duration: '10 min',
    difficulty: 'beginner',
    tags: ['setup', 'onboarding', 'basics']
  },
  {
    id: '2',
    title: 'Creating and Managing Job Postings',
    description: 'Learn how to create, edit, and publish job postings effectively',
    category: 'Jobs',
    type: 'article',
    duration: '5 min',
    difficulty: 'beginner',
    tags: ['jobs', 'posting', 'management']
  },
  {
    id: '3',
    title: 'Using the Visual Pipeline',
    description: 'Master the drag-and-drop pipeline to manage candidate flow',
    category: 'Pipeline',
    type: 'video',
    duration: '8 min',
    difficulty: 'intermediate',
    tags: ['pipeline', 'candidates', 'workflow']
  },
  {
    id: '4',
    title: 'AI Resume Parsing Setup',
    description: 'Configure and optimize AI-powered resume parsing for your organization',
    category: 'AI Features',
    type: 'tutorial',
    duration: '12 min',
    difficulty: 'intermediate',
    tags: ['ai', 'resume', 'automation']
  },
  {
    id: '5',
    title: 'Team Collaboration Best Practices',
    description: 'Optimize team workflows and communication within TalentPatriot',
    category: 'Collaboration',
    type: 'article',
    duration: '7 min',
    difficulty: 'intermediate',
    tags: ['team', 'collaboration', 'workflow']
  },
  {
    id: '6',
    title: 'Understanding Analytics and Reports',
    description: 'Get insights from your hiring data with advanced analytics',
    category: 'Analytics',
    type: 'video',
    duration: '15 min',
    difficulty: 'advanced',
    tags: ['analytics', 'reports', 'data']
  }
]

const faqItems = [
  {
    id: 'faq1',
    question: 'How do I invite team members to my organization?',
    answer: 'Go to Account Settings (click your profile icon in the top right and select "Account Settings"), then scroll to the Team Management section. Click "Invite Members" to add new users to your organization. They\'ll receive an invitation email to join.'
  },
  {
    id: 'faq2',
    question: 'Can I customize the pipeline stages?',
    answer: 'Yes! Each job can have custom pipeline stages. When creating or editing a job, you can add, remove, or reorder stages to match your hiring process.'
  },
  {
    id: 'faq3',
    question: 'How does AI resume parsing work?',
    answer: 'Our AI uses OpenAI GPT-4o to automatically extract candidate information from resumes, including contact details, work experience, education, and skills. This reduces manual data entry and improves accuracy.'
  },
  {
    id: 'faq4',
    question: 'Is my data secure in TalentPatriot?',
    answer: 'Absolutely. We use enterprise-grade security including data encryption, secure authentication, and multi-tenant isolation. Your organization\'s data is completely separate from other organizations.'
  },
  {
    id: 'faq5',
    question: 'How do I set up branded careers pages?',
    answer: 'Go to Settings > Careers Page to customize your public job listings with your company logo, colors, and branding. Your careers page will be available at yourcompany.talentpatriot.com/careers.'
  },
  {
    id: 'faq6',
    question: 'Can I export my candidate data?',
    answer: 'Yes, you can export candidate data, job applications, and analytics reports in CSV format. Go to the Analytics section and use the export functionality.'
  }
]

const quickActions = [
  { icon: UserPlus, title: 'Add Team Member', description: 'Invite colleagues to collaborate', href: '/settings/team' },
  { icon: Briefcase, title: 'Post New Job', description: 'Create your first job posting', action: 'post-job' },
  { icon: Settings, title: 'Organization Setup', description: 'Complete your profile', href: '/settings/organization' },
  { icon: PieChart, title: 'View Analytics', description: 'See your hiring metrics', href: '/analytics' }
]

export function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const categories = [
    'all',
    'Getting Started',
    'Jobs',
    'Pipeline',
    'AI Features',
    'Analytics',
    'Collaboration'
  ]

  const filteredItems = helpItems.filter(item => {
    const matchesSearch = searchQuery === '' || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  const getTypeIcon = (type: HelpItem['type']) => {
    switch (type) {
      case 'video': return <Video className="w-4 h-4" />
      case 'tutorial': return <Play className="w-4 h-4" />
      case 'article': return <FileText className="w-4 h-4" />
      default: return <Book className="w-4 h-4" />
    }
  }

  const getDifficultyColor = (difficulty: HelpItem['difficulty']) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800'
      case 'advanced': return 'bg-red-100 text-red-800'
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Help Center</h1>
          <p className="text-lg text-slate-600">Find answers, tutorials, and guides to get the most out of TalentPatriot</p>
        </div>

        {/* Search */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              placeholder="Search for help articles, tutorials, or features..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 py-3 text-lg"
            />
          </div>
        </div>

        <Tabs defaultValue="getting-started" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="getting-started">Getting Started</TabsTrigger>
            <TabsTrigger value="documentation">Documentation</TabsTrigger>
            <TabsTrigger value="faq">FAQ</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
          </TabsList>

          {/* Getting Started Tab */}
          <TabsContent value="getting-started" className="space-y-8">
            {/* Quick Actions */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {quickActions.map((action, index) => (
                  <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <action.icon className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-sm">{action.title}</CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-slate-600">{action.description}</p>
                      <div className="flex items-center gap-1 mt-3 text-blue-600 text-sm">
                        <span>Get started</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Popular Tutorials */}
            <div>
              <h2 className="text-2xl font-semibold mb-4">Popular Tutorials</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {helpItems.slice(0, 3).map((item) => (
                  <Card key={item.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(item.type)}
                          <Badge variant="secondary" className={getDifficultyColor(item.difficulty)}>
                            {item.difficulty}
                          </Badge>
                        </div>
                        {item.duration && (
                          <div className="flex items-center gap-1 text-sm text-slate-500">
                            <Clock className="w-4 h-4" />
                            {item.duration}
                          </div>
                        )}
                      </div>
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                      <CardDescription>{item.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {item.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <Button variant="outline" className="w-full">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Tutorial
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Documentation Tab */}
          <TabsContent value="documentation" className="space-y-6">
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2 mb-6">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category === 'all' ? 'All Categories' : category}
                </Button>
              ))}
            </div>

            {/* Documentation Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item) => (
                <Card key={item.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(item.type)}
                        <Badge variant="secondary" className={getDifficultyColor(item.difficulty)}>
                          {item.difficulty}
                        </Badge>
                      </div>
                      {item.duration && (
                        <div className="flex items-center gap-1 text-sm text-slate-500">
                          <Clock className="w-4 h-4" />
                          {item.duration}
                        </div>
                      )}
                    </div>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {item.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <Button variant="outline" className="w-full">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Read {item.type === 'video' ? 'Watch' : 'Article'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredItems.length === 0 && (
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-600 mb-2">No results found</h3>
                <p className="text-slate-500">Try adjusting your search or browse different categories</p>
              </div>
            )}
          </TabsContent>

          {/* FAQ Tab */}
          <TabsContent value="faq">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-semibold mb-6">Frequently Asked Questions</h2>
              <div className="space-y-4">
                {faqItems.map((faq) => (
                  <Card key={faq.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {faq.question}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-slate-600">
                      {faq.answer}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Contact Tab */}
          <TabsContent value="contact">
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageCircle className="w-5 h-5" />
                      Live Chat Support
                    </CardTitle>
                    <CardDescription>
                      Get instant help from our support team
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600 mb-4">
                      Available Monday-Friday, 9 AM - 6 PM EST
                    </p>
                    <Button className="w-full">
                      Start Chat
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Community Forum
                    </CardTitle>
                    <CardDescription>
                      Connect with other TalentPatriot users
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600 mb-4">
                      Share tips, ask questions, and get community support
                    </p>
                    <Button variant="outline" className="w-full">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Visit Forum
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5" />
                      Feature Requests
                    </CardTitle>
                    <CardDescription>
                      Suggest new features or improvements
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600 mb-4">
                      Help shape the future of TalentPatriot
                    </p>
                    <Button variant="outline" className="w-full">
                      Submit Request
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Documentation
                    </CardTitle>
                    <CardDescription>
                      Complete technical documentation
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600 mb-4">
                      API reference, guides, and best practices
                    </p>
                    <Button variant="outline" className="w-full">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Docs
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}