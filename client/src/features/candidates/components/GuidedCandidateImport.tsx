import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/shared/hooks/use-toast'
import { 
  Upload, 
  FileText, 
  Users, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft,
  Loader2,
  Link,
  Plus
} from 'lucide-react'

interface GuidedCandidateImportProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (importedData: any) => void
}

export default function GuidedCandidateImport({ isOpen, onClose, onComplete }: GuidedCandidateImportProps) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [importMethod, setImportMethod] = useState<'csv' | 'resume' | 'manual' | null>(null)
  const [candidateData, setCandidateData] = useState({
    names: '',
    emails: '',
    notes: ''
  })
  const { toast } = useToast()
  
  const totalSteps = 3

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
      // Simulate import process
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const candidateCount = importMethod === 'csv' ? 15 : importMethod === 'resume' ? 5 : 3
      
      toast({
        title: "Import successful!",
        description: `${candidateCount} candidates have been added to your database.`,
      })
      
      onComplete({ method: importMethod, count: candidateCount })
      onClose()
    } catch (error) {
      toast({
        title: "Import failed",
        description: "Please try again or contact support.",
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
              <Users className="w-12 h-12 text-indigo-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold leading-tight mb-2">How would you like to add candidates?</h3>
              <p className="text-slate-600">Choose the method that works best for you</p>
            </div>
            
            <div className="space-y-3">
              <div 
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  importMethod === 'csv' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'
                }`}
                onClick={() => setImportMethod('csv')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-6 h-6 text-indigo-600" />
                    <div>
                      <h4 className="font-medium">Import from CSV/Excel</h4>
                      <p className="text-sm text-slate-600">Upload a spreadsheet with candidate information</p>
                    </div>
                  </div>
                  {importMethod === 'csv' && <CheckCircle className="w-5 h-5 text-indigo-600" />}
                </div>
              </div>
              
              <div 
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  importMethod === 'resume' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'
                }`}
                onClick={() => setImportMethod('resume')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Upload className="w-6 h-6 text-indigo-600" />
                    <div>
                      <h4 className="font-medium">Upload resumes</h4>
                      <p className="text-sm text-slate-600">Upload PDF or Word document resumes</p>
                    </div>
                  </div>
                  {importMethod === 'resume' && <CheckCircle className="w-5 h-5 text-indigo-600" />}
                </div>
              </div>
              
              <div 
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  importMethod === 'manual' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'
                }`}
                onClick={() => setImportMethod('manual')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Plus className="w-6 h-6 text-indigo-600" />
                    <div>
                      <h4 className="font-medium">Add manually</h4>
                      <p className="text-sm text-slate-600">Enter candidate details one by one</p>
                    </div>
                  </div>
                  {importMethod === 'manual' && <CheckCircle className="w-5 h-5 text-indigo-600" />}
                </div>
              </div>
            </div>
          </div>
        )

      case 2:
        if (importMethod === 'csv') {
          return (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-bold leading-tight mb-2">Upload Your CSV File</h3>
                <p className="text-slate-600">Make sure your file includes columns for name, email, and phone</p>
              </div>
              
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-indigo-400 transition-colors">
                <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium mb-2">Drop your CSV file here</h4>
                <p className="text-slate-600 mb-4">or click to browse</p>
                <Button variant="outline">
                  Choose File
                </Button>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">CSV Format Example:</h4>
                <pre className="text-sm text-blue-700 bg-white p-2 rounded border">
{`Name,Email,Phone,Experience
John Smith,john@email.com,555-0123,5 years
Jane Doe,jane@email.com,555-0124,3 years`}
                </pre>
              </div>
            </div>
          )
        } else if (importMethod === 'resume') {
          return (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-bold leading-tight mb-2">Upload Resume Files</h3>
                <p className="text-slate-600">Support for PDF, DOC, and DOCX files</p>
              </div>
              
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-indigo-400 transition-colors">
                <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium mb-2">Drop resume files here</h4>
                <p className="text-slate-600 mb-4">You can upload multiple files at once</p>
                <Button variant="outline">
                  Choose Files
                </Button>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-2">AI Resume Parsing</h4>
                <p className="text-sm text-green-700">
                  We'll automatically extract contact information, skills, and experience from uploaded resumes.
                </p>
              </div>
            </div>
          )
        } else {
          return (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-bold leading-tight mb-2">Add Candidate Information</h3>
                <p className="text-slate-600">Enter basic details to get started</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="names">Candidate Names (one per line)</Label>
                  <Textarea
                    id="names"
                    value={candidateData.names}
                    onChange={(e) => setCandidateData({...candidateData, names: e.target.value})}
                    placeholder="John Smith&#10;Jane Doe&#10;Mike Johnson"
                    rows={4}
                  />
                </div>
                
                <div>
                  <Label htmlFor="emails">Email Addresses (one per line)</Label>
                  <Textarea
                    id="emails"
                    value={candidateData.emails}
                    onChange={(e) => setCandidateData({...candidateData, emails: e.target.value})}
                    placeholder="john@email.com&#10;jane@email.com&#10;mike@email.com"
                    rows={4}
                  />
                </div>
                
                <div>
                  <Label htmlFor="notes">Additional Notes (optional)</Label>
                  <Textarea
                    id="notes"
                    value={candidateData.notes}
                    onChange={(e) => setCandidateData({...candidateData, notes: e.target.value})}
                    placeholder="Any additional information about these candidates..."
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )
        }

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold leading-tight mb-2">Ready to Import</h3>
              <p className="text-slate-600">
                {importMethod === 'csv' && 'Your CSV file will be processed and candidates added to your database.'}
                {importMethod === 'resume' && 'Resume files will be parsed and candidate profiles created automatically.'}
                {importMethod === 'manual' && 'The candidate information you entered will be added to your database.'}
              </p>
            </div>
            
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <h4 className="font-medium text-indigo-900 mb-2">What happens next?</h4>
              <ul className="text-sm text-indigo-700 space-y-1">
                <li>• Candidates will be added to your database</li>
                <li>• You can assign them to jobs and track their progress</li>
                <li>• All candidate data will be organized in your pipeline</li>
                <li>• You can start scheduling interviews and taking notes</li>
              </ul>
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
            <span>Import Your Candidates</span>
            <span className="text-sm font-normal text-slate-500">
              Step {step} of {totalSteps}
            </span>
          </DialogTitle>
          <DialogDescription className="sr-only">
            Import candidates from CSV, resumes, or enter them manually.
          </DialogDescription>
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
            <Button onClick={handleNext} disabled={!importMethod}>
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button 
              onClick={handleComplete} 
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {loading ? 'Importing...' : 'Import Candidates'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}