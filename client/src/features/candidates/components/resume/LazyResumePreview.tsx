import { lazy, Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Loader2 } from 'lucide-react'

// Lazy load the actual PDF viewer component
const ResumePreviewComponent = lazy(() => import('./ResumePreviewComponent'))

interface ResumePreviewProps {
  resumeUrl: string
  candidateName: string
}

// Loading skeleton for the PDF viewer
const PDFSkeleton = () => (
  <Card>
    <CardHeader>
      <CardTitle className="text-lg flex items-center gap-2">
        <FileText className="w-5 h-5" />
        Resume Preview
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {/* Controls skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-100 animate-pulse rounded" />
            <div className="w-24 h-4 bg-slate-100 animate-pulse rounded" />
            <div className="w-8 h-8 bg-slate-100 animate-pulse rounded" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-100 animate-pulse rounded" />
            <div className="w-12 h-4 bg-slate-100 animate-pulse rounded" />
            <div className="w-8 h-8 bg-slate-100 animate-pulse rounded" />
          </div>
        </div>
        
        {/* PDF viewer skeleton */}
        <div className="border rounded-lg overflow-auto max-h-96 bg-gray-50 flex items-center justify-center">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="ml-2">Loading PDF viewer...</span>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
)

export function ResumePreview({ resumeUrl, candidateName }: ResumePreviewProps) {
  return (
    <Suspense fallback={<PDFSkeleton />}>
      <ResumePreviewComponent resumeUrl={resumeUrl} candidateName={candidateName} />
    </Suspense>
  )
}