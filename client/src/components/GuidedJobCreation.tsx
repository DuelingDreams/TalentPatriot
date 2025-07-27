import { useState, useEffect } from 'react'
import { useLocation } from 'wouter'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Lightbulb, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react'

const jobTemplates = [
  {
    id: 'software-engineer',
    title: 'Software Engineer',
    department: 'Engineering',
    type: 'full-time',
    description: 'We are looking for a talented Software Engineer to join our growing team...',
    requirements: '• 3+ years of software development experience\n• Proficiency in JavaScript, Python, or Java\n• Experience with modern frameworks\n• Strong problem-solving skills',
    benefits: '• Competitive salary and equity\n• Health, dental, and vision insurance\n• Flexible work arrangements\n• Professional development budget'
  },
  {
    id: 'product-manager',
    title: 'Product Manager',
    department: 'Product',
    type: 'full-time',
    description: 'Join our product team to drive strategy and execution for our core platform...',
    requirements: '• 5+ years of product management experience\n• Strong analytical and strategic thinking\n• Experience with agile methodologies\n• Excellent communication skills',
    benefits: '• Competitive compensation package\n• Stock options\n• Health benefits\n• Remote work flexibility'
  },
  {
    id: 'sales-representative',
    title: 'Sales Representative',
    department: 'Sales',
    type: 'full-time',
    description: 'We are seeking a driven Sales Representative to expand our customer base...',
    requirements: '• 2+ years of B2B sales experience\n• Proven track record of meeting quotas\n• Strong communication and negotiation skills\n• CRM experience preferred',
    benefits: '• Base salary plus commission\n• Health and dental insurance\n• Sales incentives and bonuses\n• Career advancement opportunities'
  }
]

interface GuidedJobCreationProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (jobData: any) => void
}

export default function GuidedJobCreation({ isOpen, onClose, onComplete }: GuidedJobCreationProps) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [jobData, setJobData] = useState({
    title: '',
    department: '',
    type: 'full-time',
    description: '',
    requirements: '',
    benefits: '',
    location: '',
    salary: ''
  })
  const { toast } = useToast()

  const totalSteps = 4

  const handleTemplateSelect = (templateId: string) => {
    const template = jobTemplates.find(t => t.id === templateId)
    if (template) {
      setSelectedTemplate(templateId)
      setJobData({
        ...jobData,
        title: template.title,
        department: template.department,
        type: template.type,
        description: template.description,
        requirements: template.requirements,
        benefits: template.benefits
      })
    }
  }

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleComplete = async () => {
    setLoading(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      toast({
        title: "Job posted successfully!",
        description: "Your job posting is now live and attracting candidates.",
      })
      
      onComplete(jobData)
      onClose()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create job posting. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Lightbulb className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Choose a Starting Point</h3>
              <p className="text-slate-600">Start with a template or create from scratch</p>
            </div>
            
            <div className="space-y-3">
              <div 
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedTemplate === null ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'
                }`}
                onClick={() => {
                  setSelectedTemplate(null)
                  setJobData({
                    title: '',
                    department: '',
                    type: 'full-time',
                    description: '',
                    requirements: '',
                    benefits: '',
                    location: '',
                    salary: ''
                  })
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Start from scratch</h4>
                    <p className="text-sm text-slate-600">Create a custom job posting</p>
                  </div>
                  {selectedTemplate === null && <CheckCircle className="w-5 h-5 text-indigo-600" />}
                </div>
              </div>
              
              {jobTemplates.map((template) => (
                <div
                  key={template.id}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedTemplate === template.id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'
                  }`}
                  onClick={() => handleTemplateSelect(template.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{template.title}</h4>
                      <p className="text-sm text-slate-600">{template.department} • {template.type}</p>
                    </div>
                    {selectedTemplate === template.id && <CheckCircle className="w-5 h-5 text-indigo-600" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold mb-2">Job Details</h3>
              <p className="text-slate-600">Fill in the basic information about this role</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Job Title *</Label>
                <Input
                  id="title"
                  value={jobData.title}
                  onChange={(e) => setJobData({...jobData, title: e.target.value})}
                  placeholder="e.g. Senior Software Engineer"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={jobData.department}
                    onChange={(e) => setJobData({...jobData, department: e.target.value})}
                    placeholder="e.g. Engineering"
                  />
                </div>
                
                <div>
                  <Label htmlFor="type">Employment Type</Label>
                  <Select value={jobData.type} onValueChange={(value) => setJobData({...jobData, type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full-time">Full-time</SelectItem>
                      <SelectItem value="part-time">Part-time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="internship">Internship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={jobData.location}
                    onChange={(e) => setJobData({...jobData, location: e.target.value})}
                    placeholder="e.g. San Francisco, CA"
                  />
                </div>
                
                <div>
                  <Label htmlFor="salary">Salary Range</Label>
                  <Input
                    id="salary"
                    value={jobData.salary}
                    onChange={(e) => setJobData({...jobData, salary: e.target.value})}
                    placeholder="e.g. $120k - $150k"
                  />
                </div>
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold mb-2">Job Description</h3>
              <p className="text-slate-600">Describe the role and what you're looking for</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="description">Job Description *</Label>
                <Textarea
                  id="description"
                  value={jobData.description}
                  onChange={(e) => setJobData({...jobData, description: e.target.value})}
                  placeholder="Describe the role, responsibilities, and what makes this opportunity exciting..."
                  rows={4}
                />
              </div>
              
              <div>
                <Label htmlFor="requirements">Requirements</Label>
                <Textarea
                  id="requirements"
                  value={jobData.requirements}
                  onChange={(e) => setJobData({...jobData, requirements: e.target.value})}
                  placeholder="List the required skills, experience, and qualifications..."
                  rows={4}
                />
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold mb-2">Benefits & Perks</h3>
              <p className="text-slate-600">What makes your company a great place to work?</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="benefits">Benefits & Perks</Label>
                <Textarea
                  id="benefits"
                  value={jobData.benefits}
                  onChange={(e) => setJobData({...jobData, benefits: e.target.value})}
                  placeholder="List the benefits, perks, and company culture highlights..."
                  rows={6}
                />
              </div>
            </div>
            
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <h4 className="font-medium text-indigo-900 mb-2">Ready to post?</h4>
              <p className="text-sm text-indigo-700">
                Your job posting will be published and start attracting qualified candidates immediately.
              </p>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Create Your First Job</span>
            <span className="text-sm font-normal text-slate-500">
              Step {step} of {totalSteps}
            </span>
          </DialogTitle>
        </DialogHeader>
        
        {/* Progress bar */}
        <div className="w-full bg-slate-200 rounded-full h-2 mb-6">
          <div 
            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>
        
        {renderStep()}
        
        {/* Navigation buttons */}
        <div className="flex items-center justify-between pt-6 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 1}
            className="flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          {step < totalSteps ? (
            <Button onClick={handleNext} disabled={!jobData.title && step > 1}>
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button 
              onClick={handleComplete} 
              disabled={loading || !jobData.title || !jobData.description}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {loading ? 'Creating Job...' : 'Post Job'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}