import { useState, useEffect } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Download, 
  ExternalLink,
  FileText,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { getResumeSignedUrl, isStoragePath, openResumeInNewTab } from '@/lib/resumeUtils'

// Set up PDF.js worker using react-pdf recommended approach
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

interface ResumePreviewProps {
  resumeUrl: string
  candidateName: string
}

export default function ResumePreviewComponent({ resumeUrl, candidateName }: ResumePreviewProps) {
  const [numPages, setNumPages] = useState<number>(0)
  const [pageNumber, setPageNumber] = useState<number>(1)
  const [scale, setScale] = useState<number>(1.0)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [signedUrl, setSignedUrl] = useState<string | null>(null)

  // Generate signed URL if resumeUrl is a storage path
  useEffect(() => {
    async function fetchSignedUrl() {
      if (isStoragePath(resumeUrl)) {
        try {
          setLoading(true)
          const url = await getResumeSignedUrl(resumeUrl)
          setSignedUrl(url)
          setLoading(false)
        } catch (err) {
          console.error('Failed to generate signed URL:', err)
          setError('Failed to load resume. The file may not be accessible.')
          setLoading(false)
        }
      } else {
        // It's already a full URL (legacy data)
        setSignedUrl(resumeUrl)
        setLoading(false)
      }
    }
    fetchSignedUrl()
  }, [resumeUrl])

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setLoading(false)
    setError(null)
  }

  const onDocumentLoadError = (error: Error) => {
    console.error('Failed to load PDF:', error)
    setError('Failed to load resume. The file may be corrupted or in an unsupported format.')
    setLoading(false)
  }

  const goToPrevPage = () => {
    setPageNumber(page => Math.max(1, page - 1))
  }

  const goToNextPage = () => {
    setPageNumber(page => Math.min(numPages, page + 1))
  }

  const zoomIn = () => {
    setScale(scale => Math.min(2.0, scale + 0.2))
  }

  const zoomOut = () => {
    setScale(scale => Math.max(0.5, scale - 0.2))
  }

  const downloadResume = async () => {
    if (!signedUrl) return
    const link = document.createElement('a')
    link.href = signedUrl
    // Extract file extension from URL or storage path
    const pathOrUrl = signedUrl || resumeUrl
    const urlParts = pathOrUrl.split('.')
    const extension = urlParts.length > 1 ? urlParts.pop() : ''
    const fileName = extension ? 
      `${candidateName.replace(/\s+/g, '_')}_Resume.${extension}` : 
      `${candidateName.replace(/\s+/g, '_')}_Resume`
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const openInNewTab = async () => {
    try {
      await openResumeInNewTab(resumeUrl)
    } catch (err) {
      console.error('Failed to open resume:', err)
      setError('Failed to open resume. Please try again.')
    }
  }

  // Check if the file is a PDF
  const isPDF = (resumeUrl.toLowerCase().includes('.pdf') || resumeUrl.includes('application/pdf')) || 
                (signedUrl?.toLowerCase().includes('.pdf') ?? false)

  if (loading && !signedUrl) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Loader2 className="w-12 h-12 mx-auto animate-spin text-primary mb-4" />
          <p className="text-sm text-gray-600">Loading resume...</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-destructive mb-4" />
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <Button variant="outline" onClick={openInNewTab}>
            <ExternalLink className="w-4 h-4 mr-2" />
            Try Opening in New Tab
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!isPDF) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Resume Document
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <div className="space-y-2 mb-4">
              <p className="text-sm text-gray-600">Preview available only for PDF files.</p>
              <p className="text-sm text-gray-600">You can download the resume or open it in a new tab.</p>
            </div>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={downloadResume}>
                <Download className="w-4 h-4 mr-2" />
                Download Resume
              </Button>
              <Button variant="outline" onClick={openInNewTab}>
                <ExternalLink className="w-4 h-4 mr-2" />
                Open in New Tab
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Resume Preview
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={downloadResume}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button variant="outline" size="sm" onClick={openInNewTab}>
              <ExternalLink className="w-4 h-4 mr-2" />
              Open
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {/* Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPrevPage}
                  disabled={pageNumber <= 1 || loading}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm">
                  {loading ? 'Loading...' : `Page ${pageNumber} of ${numPages}`}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextPage}
                  disabled={pageNumber >= numPages || loading}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={zoomOut} disabled={scale <= 0.5}>
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="text-sm">{Math.round(scale * 100)}%</span>
                <Button variant="outline" size="sm" onClick={zoomIn} disabled={scale >= 2.0}>
                  <ZoomIn className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* PDF Viewer */}
            <div className="border rounded-lg overflow-auto max-h-96 bg-gray-50 flex justify-center">
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <span className="ml-2">Loading resume...</span>
                </div>
              )}
              
              {signedUrl && (
                <Document
                  file={signedUrl}
                  onLoadSuccess={onDocumentLoadSuccess}
                  onLoadError={onDocumentLoadError}
                  className="flex justify-center"
                >
                  <Page
                    pageNumber={pageNumber}
                    scale={scale}
                    renderAnnotationLayer={false}
                    renderTextLayer={false}
                    className="shadow-lg"
                  />
                </Document>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}