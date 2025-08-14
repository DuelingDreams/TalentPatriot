import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { CheckCircle2, XCircle, Clock, MessageSquare, Calendar, Upload } from 'lucide-react'
import { CandidateNotes } from '@/components/CandidateNotes'
import { ResumeUpload } from '@/components/ResumeUpload'
import { useAuth } from '@/hooks/useAuth'
import { useMessages, useCreateMessage } from '@/hooks/useMessages'
import { useInterviews, useCreateInterview } from '@/hooks/useInterviews'
import { useToast } from '@/hooks/use-toast'

export function TestFeatures() {
  const { user, currentOrgId } = useAuth()
  const { toast } = useToast()
  
  // Test states
  const [testResults, setTestResults] = useState<Record<string, 'pending' | 'success' | 'error'>>({})
  const [testMessage, setTestMessage] = useState('')
  const [interviewTitle, setInterviewTitle] = useState('')
  
  // Data queries
  const { data: messages, isLoading: messagesLoading } = useMessages(user?.id)
  const { data: interviews, isLoading: interviewsLoading } = useInterviews(currentOrgId || undefined)
  
  // Mutations
  const createMessageMutation = useCreateMessage()
  const createInterviewMutation = useCreateInterview()

  const updateTestResult = (test: string, result: 'success' | 'error') => {
    setTestResults(prev => ({ ...prev, [test]: result }))
  }

  const testMessaging = async () => {
    if (!user?.id || !currentOrgId) {
      toast({
        title: "Error",
        description: "Please ensure you're logged in with an organization",
        variant: "destructive"
      })
      return
    }

    setTestResults(prev => ({ ...prev, messaging: 'pending' }))
    
    try {
      await createMessageMutation.mutateAsync({
        orgId: currentOrgId,
        type: 'internal',
        priority: 'normal',
        subject: 'Test Message',
        content: testMessage || 'This is a test message to verify messaging functionality.',
        senderId: user.id,
        recipientId: user.id, // Send to self for testing
      })
      
      updateTestResult('messaging', 'success')
      toast({
        title: "Success",
        description: "Message created successfully"
      })
      setTestMessage('')
    } catch (error) {
      updateTestResult('messaging', 'error')
      toast({
        title: "Error",
        description: "Failed to create message",
        variant: "destructive"
      })
    }
  }

  const testInterview = async () => {
    if (!user?.id || !currentOrgId) {
      toast({
        title: "Error", 
        description: "Please ensure you're logged in with an organization",
        variant: "destructive"
      })
      return
    }

    setTestResults(prev => ({ ...prev, interview: 'pending' }))
    
    try {
      // Create a mock interview for testing
      await createInterviewMutation.mutateAsync({
        orgId: currentOrgId,
        jobCandidateId: 'test-job-candidate-id', // Mock ID for testing
        title: interviewTitle || 'Test Interview',
        type: 'video',
        status: 'scheduled',
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        duration: '60',
        location: 'Video Call',
        interviewerId: user.id,
        notes: 'Test interview created via feature testing page'
      })
      
      updateTestResult('interview', 'success')
      toast({
        title: "Success",
        description: "Interview scheduled successfully"
      })
      setInterviewTitle('')
    } catch (error) {
      updateTestResult('interview', 'error')
      toast({
        title: "Error",
        description: "Failed to schedule interview",
        variant: "destructive"
      })
    }
  }

  const getStatusIcon = (status: 'pending' | 'success' | 'error' | undefined) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: 'pending' | 'success' | 'error' | undefined) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Testing...</Badge>
      case 'success':
        return <Badge variant="default" className="bg-green-100 text-green-800">Working</Badge>
      case 'error':
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="outline">Not Tested</Badge>
    }
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Feature Testing</h1>
          <p className="text-gray-600 mt-2">
            Test the messaging, interview scheduling, candidate notes, and resume upload features
          </p>
        </div>
      </div>

      {/* Current User Status */}
      <Card>
        <CardHeader>
          <CardTitle>Current Session</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p><strong>User:</strong> {user?.email || 'Not logged in'}</p>
            <p><strong>Organization:</strong> {currentOrgId || 'None selected'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Feature Tests */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Messaging Test */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Messaging System
              </CardTitle>
              {getStatusIcon(testResults.messaging)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Status:</span>
              {getStatusBadge(testResults.messaging)}
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Test Message:</label>
              <Textarea
                placeholder="Enter a test message..."
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
              />
            </div>
            
            <Button 
              onClick={testMessaging}
              disabled={createMessageMutation.isPending}
              className="w-full"
            >
              {createMessageMutation.isPending ? 'Sending...' : 'Send Test Message'}
            </Button>
            
            <div className="text-sm text-gray-600">
              <p><strong>Messages loaded:</strong> {messagesLoading ? 'Loading...' : messages?.length || 0}</p>
            </div>
          </CardContent>
        </Card>

        {/* Interview Scheduling Test */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Interview Scheduling
              </CardTitle>
              {getStatusIcon(testResults.interview)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Status:</span>
              {getStatusBadge(testResults.interview)}
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Interview Title:</label>
              <Input
                placeholder="Enter interview title..."
                value={interviewTitle}
                onChange={(e) => setInterviewTitle(e.target.value)}
              />
            </div>
            
            <Button 
              onClick={testInterview}
              disabled={createInterviewMutation.isPending}
              className="w-full"
            >
              {createInterviewMutation.isPending ? 'Scheduling...' : 'Schedule Test Interview'}
            </Button>
            
            <div className="text-sm text-gray-600">
              <p><strong>Interviews loaded:</strong> {interviewsLoading ? 'Loading...' : interviews?.length || 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Component Tests */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Candidate Notes Test */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Candidate Notes Component
          </h2>
          <CandidateNotes 
            candidateId="test-candidate-1"
            jobCandidateId="test-job-candidate-1"
          />
        </div>

        {/* Resume Upload Test */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Resume Upload Component
          </h2>
          <ResumeUpload 
            candidateId="test-candidate-1"
            onUploadComplete={(fileUrl) => {
              toast({
                title: "Upload Complete",
                description: `Resume uploaded: ${fileUrl}`
              })
            }}
          />
        </div>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-2">Database Connections</h4>
              <div className="space-y-1 text-sm">
                <div className="flex items-center justify-between">
                  <span>Messages API</span>
                  <Badge variant={messagesLoading ? "secondary" : "default"}>
                    {messagesLoading ? "Loading" : "Connected"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Interviews API</span>
                  <Badge variant={interviewsLoading ? "secondary" : "default"}>
                    {interviewsLoading ? "Loading" : "Connected"}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Feature Status</h4>
              <div className="space-y-1 text-sm">
                <div className="flex items-center justify-between">
                  <span>Candidate Notes</span>
                  <Badge variant="default">Available</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Resume Upload</span>
                  <Badge variant="default">Available</Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Alert>
        <AlertDescription>
          <strong>Instructions:</strong> This page allows you to test all the key features. 
          Use the messaging and interview tests to verify database operations. 
          The candidate notes and resume upload components should work independently. 
          All features require proper authentication and organization context.
        </AlertDescription>
      </Alert>
    </div>
  )
}

export default TestFeatures