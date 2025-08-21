import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ChevronRight, Mail, Phone, Calendar, FileText, MoreVertical } from 'lucide-react'
import type { PipelineColumn } from '@/hooks/usePipeline'

interface JobCandidate {
  id: string
  jobId: string
  candidateId: string
  columnId: string | null
  status: string
  appliedAt: string
  candidate: {
    id: string
    name: string
    email: string
    phone?: string | null
    resumeUrl?: string | null
  }
}

import { useMoveApplication } from '@/hooks/usePipeline'
import { toast } from '@/hooks/use-toast'

interface MobilePipelineProps {
  columns: PipelineColumn[]
  candidates: JobCandidate[]
  jobId: string
}

export function MobilePipeline({ columns, candidates, jobId }: MobilePipelineProps) {
  const [selectedCandidate, setSelectedCandidate] = useState<JobCandidate | null>(null)
  const [selectedColumn, setSelectedColumn] = useState<string>('')
  const moveApplication = useMoveApplication()

  const handleMoveCandidate = async (candidateId: string, newColumnId: string) => {
    try {
      await moveApplication.mutateAsync({
        applicationId: candidateId,
        columnId: newColumnId
      })
      toast({
        title: "Candidate Moved",
        description: "Candidate has been moved to the new stage successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to move candidate. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getCandidatesForColumn = (columnId: string) => {
    return candidates.filter(candidate => candidate.columnId === columnId)
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  return (
    <div className="space-y-4">
      {columns.map((column) => {
        const columnCandidates = getCandidatesForColumn(column.id)
        
        return (
          <Card key={column.id} className="shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-medium">{column.title || column.name || 'Column'}</CardTitle>
                <Badge variant="secondary" className="text-sm">
                  {columnCandidates.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {columnCandidates.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <div className="text-4xl mb-2">🎯</div>
                  <p>No candidates in this stage</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {columnCandidates.map((candidate) => (
                    <Sheet key={candidate.id}>
                      <SheetTrigger asChild>
                        <Card 
                          className="cursor-pointer hover:shadow-md transition-shadow bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                          onClick={() => setSelectedCandidate(candidate)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3 flex-1 min-w-0">
                                <Avatar className="h-10 w-10 bg-blue-100 dark:bg-blue-900">
                                  <AvatarFallback className="text-blue-700 dark:text-blue-300 font-medium">
                                    {getInitials(candidate.candidate.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-gray-900 dark:text-white truncate">
                                    {candidate.candidate.name}
                                  </h4>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                    {candidate.candidate.email}
                                  </p>
                                  <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-500">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    {new Date(candidate.appliedAt).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                              <ChevronRight className="h-5 w-5 text-gray-400" />
                            </div>
                          </CardContent>
                        </Card>
                      </SheetTrigger>
                      
                      <SheetContent side="bottom" className="h-[80vh] overflow-y-auto">
                        <SheetHeader className="text-left">
                          <div className="flex items-center space-x-3 mb-4">
                            <Avatar className="h-12 w-12 bg-blue-100 dark:bg-blue-900">
                              <AvatarFallback className="text-blue-700 dark:text-blue-300 font-medium text-lg">
                                {getInitials(candidate.candidate.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <SheetTitle className="text-xl">{candidate.candidate.name}</SheetTitle>
                              <p className="text-gray-600 dark:text-gray-400">{candidate.candidate.email}</p>
                            </div>
                          </div>
                        </SheetHeader>
                        
                        <div className="space-y-6 mt-6">
                          {/* Contact Information */}
                          <div>
                            <h3 className="font-medium text-gray-900 dark:text-white mb-3">Contact Information</h3>
                            <div className="space-y-2">
                              <div className="flex items-center space-x-3 text-sm">
                                <Mail className="h-4 w-4 text-gray-500" />
                                <span>{candidate.candidate.email}</span>
                              </div>
                              {candidate.candidate.phone && (
                                <div className="flex items-center space-x-3 text-sm">
                                  <Phone className="h-4 w-4 text-gray-500" />
                                  <span>{candidate.candidate.phone}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Application Details */}
                          <div>
                            <h3 className="font-medium text-gray-900 dark:text-white mb-3">Application Details</h3>
                            <div className="space-y-2">
                              <div className="flex items-center space-x-3 text-sm">
                                <Calendar className="h-4 w-4 text-gray-500" />
                                <span>Applied: {new Date(candidate.appliedAt).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center space-x-3 text-sm">
                                <Badge variant="outline">
                                  Current Stage: {column.title || column.name || 'Unknown'}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          {/* Resume */}
                          {candidate.candidate.resumeUrl && (
                            <div>
                              <h3 className="font-medium text-gray-900 dark:text-white mb-3">Resume</h3>
                              <Button variant="outline" size="sm" className="w-full" asChild>
                                <a href={candidate.candidate.resumeUrl} target="_blank" rel="noopener noreferrer">
                                  <FileText className="h-4 w-4 mr-2" />
                                  View Resume
                                </a>
                              </Button>
                            </div>
                          )}

                          {/* Move Candidate */}
                          <div>
                            <h3 className="font-medium text-gray-900 dark:text-white mb-3">Move to Stage</h3>
                            <Select 
                              value={selectedColumn} 
                              onValueChange={(value) => {
                                setSelectedColumn(value)
                                if (value && value !== candidate.columnId) {
                                  handleMoveCandidate(candidate.id, value)
                                }
                              }}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select new stage" />
                              </SelectTrigger>
                              <SelectContent>
                                {columns.map((col) => (
                                  <SelectItem 
                                    key={col.id} 
                                    value={col.id}
                                    disabled={col.id === candidate.columnId}
                                  >
                                    {col.title || col.name || 'Column'} {col.id === candidate.columnId && '(Current)'}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex space-x-2 pt-4">
                            <Button variant="outline" size="sm" className="flex-1">
                              Schedule Interview
                            </Button>
                            <Button variant="outline" size="sm" className="flex-1">
                              Send Message
                            </Button>
                          </div>
                        </div>
                      </SheetContent>
                    </Sheet>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}