import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { 
  Briefcase, 
  Code, 
  Globe, 
  Award, 
  Loader2, 
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw
} from 'lucide-react'
import { useToast } from '@/shared/hooks/use-toast'
import { apiRequest } from '@/lib/queryClient'
import type { Candidate } from '@shared/schema'
import { toCamelCase } from '@shared/utils/caseConversion'

interface WorkExperience {
  title: string
  company: string
  duration?: string
  location?: string
  description?: string
  achievements?: string[]
}

interface Project {
  name: string
  description?: string
  technologies?: string[]
  url?: string
}

interface ResumeInsightsProps {
  candidate: Candidate
  orgId?: string
  onParsingTriggered?: () => void
}

export function ResumeInsights({ candidate, orgId, onParsingTriggered }: ResumeInsightsProps) {
  const { toast } = useToast()
  const [isParsing, setIsParsing] = useState(false)
  
  const candidateId = candidate.id || (candidate as any).id
  
  const triggerParsing = async () => {
    if (isParsing) return
    
    setIsParsing(true)
    try {
      // apiRequest automatically includes x-org-id header from session storage
      await apiRequest(`/api/candidates/${candidateId}/parse-resume`, {
        method: 'POST'
      })
      
      toast({
        title: 'Resume Analysis Started',
        description: 'AI is analyzing the resume. Refresh in a few seconds to see insights.',
      })
      
      onParsingTriggered?.()
      
      // Auto-refresh after 5 seconds
      setTimeout(() => {
        window.location.reload()
      }, 5000)
    } catch (error) {
      console.error('Failed to trigger parsing:', error)
      toast({
        title: 'Failed to Start Analysis',
        description: 'Could not start resume analysis. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsParsing(false)
    }
  }
  
  // Normalize candidate data to camelCase (handles both snake_case and camelCase)
  const normalizedCandidate = toCamelCase(candidate as any)
  
  // Extract fields from normalized data
  const {
    parsingStatus,
    parsingError,
    summary,
    resumeUrl,
    workExperience,
    projects,
    skills,
    languages,
    certifications
  } = normalizedCandidate

  // Parse all fields with error handling (they might be JSON strings or already parsed)
  let workHistory: WorkExperience[] = []
  try {
    if (workExperience) {
      const parsed = typeof workExperience === 'string' ? JSON.parse(workExperience) : workExperience
      workHistory = Array.isArray(parsed) ? parsed : []
    }
  } catch (error) {
    console.warn('Failed to parse work experience:', error)
  }
  
  let projectList: Project[] = []
  try {
    if (projects) {
      const parsed = typeof projects === 'string' ? JSON.parse(projects) : projects
      projectList = Array.isArray(parsed) ? parsed : []
    }
  } catch (error) {
    console.warn('Failed to parse projects:', error)
  }

  let skillsList: string[] = []
  try {
    if (skills) {
      const parsed = typeof skills === 'string' ? JSON.parse(skills) : skills
      skillsList = Array.isArray(parsed) ? parsed : []
    }
  } catch (error) {
    console.warn('Failed to parse skills:', error)
  }

  let languagesList: string[] = []
  try {
    if (languages) {
      const parsed = typeof languages === 'string' ? JSON.parse(languages) : languages
      languagesList = Array.isArray(parsed) ? parsed : []
    }
  } catch (error) {
    console.warn('Failed to parse languages:', error)
  }

  let certificationsList: string[] = []
  try {
    if (certifications) {
      const parsed = typeof certifications === 'string' ? JSON.parse(certifications) : certifications
      certificationsList = Array.isArray(parsed) ? parsed : []
    }
  } catch (error) {
    console.warn('Failed to parse certifications:', error)
  }

  // If no resume or parsing hasn't started
  if (!resumeUrl) {
    return null
  }

  // Parsing status indicator
  const ParsingStatusBadge = () => {
    if (parsingStatus === 'processing') {
      return (
        <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          Analyzing Resume...
        </Badge>
      )
    }
    
    if (parsingStatus === 'failed') {
      return (
        <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700">
          <AlertCircle className="w-3 h-3 mr-1" />
          Parsing Failed
        </Badge>
      )
    }
    
    if (parsingStatus === 'completed') {
      return (
        <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">
          <CheckCircle className="w-3 h-3 mr-1" />
          AI Analyzed
        </Badge>
      )
    }
    
    if (parsingStatus === 'pending') {
      return (
        <Badge variant="outline" className="border-gray-200 bg-gray-50 text-gray-700">
          <Clock className="w-3 h-3 mr-1" />
          Pending Analysis
        </Badge>
      )
    }
    
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header with status */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Resume Insights</h2>
        <ParsingStatusBadge />
      </div>

      {/* Parsing Error */}
      {parsingStatus === 'failed' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Failed to analyze resume{parsingError ? `: ${parsingError}` : ''}</span>
            {orgId && (
              <Button
                size="sm"
                variant="outline"
                onClick={triggerParsing}
                disabled={isParsing}
                className="ml-4 border-red-300 text-red-700 hover:bg-red-50"
                data-testid="btn-retry-analysis"
              >
                {isParsing ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Retry Analysis
                  </>
                )}
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Processing State */}
      {parsingStatus === 'processing' && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>
            AI is analyzing this resume to extract skills, experience, and qualifications. This usually takes 5-10 seconds.
          </AlertDescription>
        </Alert>
      )}

      {/* Pending State */}
      {parsingStatus === 'pending' && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Resume analysis is pending.</span>
            {orgId && (
              <Button
                size="sm"
                variant="outline"
                onClick={triggerParsing}
                disabled={isParsing}
                className="ml-4"
                data-testid="btn-analyze-resume"
              >
                {isParsing ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Analyze Now
                  </>
                )}
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Parsed Data - Only show if completed */}
      {parsingStatus === 'completed' && (
        <>
          {/* Professional Summary */}
          {summary && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Professional Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 leading-relaxed">{summary}</p>
              </CardContent>
            </Card>
          )}

          {/* Work Experience */}
          {workHistory && workHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  Work Experience
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {workHistory.map((exp, index) => (
                    <div key={index} className="relative pl-6 border-l-2 border-gray-200 pb-6 last:pb-0">
                      <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-primary border-2 border-white" />
                      
                      <div className="space-y-2">
                        <div>
                          <h4 className="font-semibold text-gray-900">{exp.title}</h4>
                          <p className="text-sm text-gray-600">{exp.company}</p>
                          <div className="flex gap-4 text-xs text-gray-500 mt-1">
                            {exp.duration && <span>{exp.duration}</span>}
                            {exp.location && <span>{exp.location}</span>}
                          </div>
                        </div>
                        
                        {exp.description && (
                          <p className="text-sm text-gray-700">{exp.description}</p>
                        )}
                        
                        {exp.achievements && Array.isArray(exp.achievements) && exp.achievements.length > 0 && (
                          <ul className="space-y-1 mt-2">
                            {exp.achievements.map((achievement, i) => (
                              <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                                <span className="text-primary mt-1">•</span>
                                <span>{achievement}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Projects */}
          {projectList && projectList.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Code className="w-4 h-4" />
                  Projects
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {projectList.map((project, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-primary/50 transition-colors">
                      <h4 className="font-semibold text-gray-900 mb-2">{project.name}</h4>
                      {project.description && (
                        <p className="text-sm text-gray-700 mb-3">{project.description}</p>
                      )}
                      {project.technologies && Array.isArray(project.technologies) && project.technologies.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {project.technologies.map((tech, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {tech}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Skills, Languages, Certifications */}
          {((skillsList.length > 0) || (languagesList.length > 0) || (certificationsList.length > 0)) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Skills */}
              {skillsList.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Code className="w-4 h-4" />
                      Skills
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {skillsList.map((skill, index) => (
                        <Badge key={index} variant="outline">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Languages */}
              {languagesList.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Languages
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {languagesList.map((language, index) => (
                        <Badge key={index} variant="outline">
                          {language}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Certifications */}
              {certificationsList.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Award className="w-4 h-4" />
                      Certifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {certificationsList.map((cert, index) => (
                        <Badge key={index} variant="outline">
                          {cert}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Empty state if no parsed data */}
          {!summary && workHistory.length === 0 && projectList.length === 0 && 
           skillsList.length === 0 && languagesList.length === 0 && 
           certificationsList.length === 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Resume was analyzed but no structured data could be extracted. The resume may not contain standard sections or be in an unsupported format.
              </AlertDescription>
            </Alert>
          )}
        </>
      )}
    </div>
  )
}
