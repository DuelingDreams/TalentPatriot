import { MapPin, Clock, Briefcase, Building2, DollarSign } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { Job } from '@shared/schema'

interface JobDescriptionFormatterProps {
  job: Job
  showHeader?: boolean
}

interface ParsedSection {
  title: string
  content: string[]
  type: 'summary' | 'responsibilities' | 'requirements' | 'nice_to_have' | 'benefits' | 'other'
}

function parseJobDescription(description: string): ParsedSection[] {
  if (!description) return []
  
  const sections: ParsedSection[] = []
  const lines = description.split('\n').map(line => line.trim()).filter(Boolean)
  
  const sectionPatterns = [
    { pattern: /^(about\s+(the\s+)?role|role\s+summary|overview|summary|about\s+this\s+(position|opportunity)):?$/i, type: 'summary' as const, title: 'Role Summary' },
    { pattern: /^(what\s+you('ll|.ll)?\s+do|responsibilities|key\s+responsibilities|your\s+responsibilities|duties):?$/i, type: 'responsibilities' as const, title: "What You'll Do" },
    { pattern: /^(what\s+we('re|.re)?\s+looking\s+for|requirements|qualifications|must\s+have|required|who\s+you\s+are):?$/i, type: 'requirements' as const, title: "What We're Looking For" },
    { pattern: /^(nice\s+to\s+have|preferred|bonus|plus|good\s+to\s+have):?$/i, type: 'nice_to_have' as const, title: 'Nice to Have' },
    { pattern: /^(why\s+you('ll|.ll)?\s+love\s+(this\s+)?(role|job|working\s+here)|benefits|perks|what\s+we\s+offer|why\s+join\s+us):?$/i, type: 'benefits' as const, title: "Why You'll Love This Role" },
  ]
  
  let currentSection: ParsedSection | null = null
  let summaryContent: string[] = []
  let foundExplicitSection = false
  
  for (const line of lines) {
    let matchedPattern = false
    
    for (const { pattern, type, title } of sectionPatterns) {
      if (pattern.test(line)) {
        if (currentSection && currentSection.content.length > 0) {
          sections.push(currentSection)
        }
        currentSection = { title, content: [], type }
        matchedPattern = true
        foundExplicitSection = true
        break
      }
    }
    
    if (!matchedPattern) {
      const cleanLine = line.replace(/^[-•*]\s*/, '').trim()
      
      if (currentSection) {
        if (cleanLine) {
          currentSection.content.push(cleanLine)
        }
      } else {
        if (cleanLine) {
          summaryContent.push(cleanLine)
        }
      }
    }
  }
  
  if (currentSection && currentSection.content.length > 0) {
    sections.push(currentSection)
  }
  
  if (summaryContent.length > 0 && !sections.some(s => s.type === 'summary')) {
    const bulletCount = summaryContent.filter(line => 
      /^[-•*]\s/.test(line) || /^\d+\.\s/.test(line)
    ).length
    const isListLike = bulletCount > summaryContent.length * 0.5
    
    if (isListLike) {
      sections.unshift({
        title: "What You'll Do",
        content: summaryContent.map(line => line.replace(/^[-•*]\s*/, '').replace(/^\d+\.\s*/, '').trim()),
        type: 'responsibilities'
      })
    } else if (summaryContent.length <= 4) {
      sections.unshift({
        title: 'Role Summary',
        content: [summaryContent.join(' ')],
        type: 'summary'
      })
    } else {
      const summaryText = summaryContent.slice(0, 3).join(' ')
      const remainingContent = summaryContent.slice(3)
      
      if (summaryText) {
        sections.unshift({
          title: 'Role Summary',
          content: [summaryText],
          type: 'summary'
        })
      }
      
      if (remainingContent.length > 0) {
        sections.push({
          title: 'About This Role',
          content: remainingContent,
          type: 'other'
        })
      }
    }
  }
  
  return sections
}

function SectionCard({ section }: { section: ParsedSection }) {
  const isSummary = section.type === 'summary'
  
  return (
    <div className="mb-6">
      <h3 className="flex items-center gap-2 text-lg font-semibold text-neutral-900 mb-3">
        <span className="text-tp-accent">◆</span>
        {section.title}
        {section.type === 'summary' && (
          <Badge variant="secondary" className="ml-2 text-xs bg-amber-100 text-amber-800 border-0">
            Important
          </Badge>
        )}
      </h3>
      
      {isSummary ? (
        <Card className="bg-neutral-50 border-neutral-200">
          <CardContent className="p-4">
            <p className="text-neutral-700 leading-relaxed">
              {section.content.join(' ')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-2 ml-1">
          {section.content.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 text-neutral-700">
              <span className="text-neutral-400 mt-1.5 text-xs">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function JobMetaBadges({ job }: { job: Job }) {
  const badges = []
  
  if (job.location) {
    badges.push({
      icon: MapPin,
      label: job.location,
      color: 'bg-red-50 text-red-700 border-red-200'
    })
  }
  
  if (job.jobType) {
    badges.push({
      icon: Clock,
      label: job.jobType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      color: 'bg-blue-50 text-blue-700 border-blue-200'
    })
  }
  
  if (job.experienceLevel) {
    badges.push({
      icon: Briefcase,
      label: job.experienceLevel.replace(/\b\w/g, l => l.toUpperCase()),
      color: 'bg-purple-50 text-purple-700 border-purple-200'
    })
  }
  
  if (job.salaryRange) {
    badges.push({
      icon: DollarSign,
      label: job.salaryRange,
      color: 'bg-green-50 text-green-700 border-green-200'
    })
  }
  
  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((badge, idx) => (
        <Badge 
          key={idx} 
          variant="outline" 
          className={`${badge.color} font-medium px-3 py-1.5 text-sm`}
        >
          <badge.icon className="w-3.5 h-3.5 mr-1.5" />
          {badge.label}
        </Badge>
      ))}
    </div>
  )
}

export function JobDescriptionFormatter({ job, showHeader = true }: JobDescriptionFormatterProps) {
  const sections = parseJobDescription(job.description || '')
  
  return (
    <div className="space-y-6">
      {showHeader && (
        <div className="border-b border-neutral-200 pb-6">
          <h2 className="text-2xl font-bold text-neutral-900 mb-4">{job.title}</h2>
          <JobMetaBadges job={job} />
        </div>
      )}
      
      {sections.length > 0 ? (
        <div className="space-y-2">
          {sections.map((section, idx) => (
            <SectionCard key={idx} section={section} />
          ))}
        </div>
      ) : (
        <div className="prose prose-neutral max-w-none">
          <p className="text-neutral-700 whitespace-pre-wrap leading-relaxed">
            {job.description || 'No description available.'}
          </p>
        </div>
      )}
    </div>
  )
}

export function JobMetaBadgesCompact({ job }: { job: Job }) {
  return <JobMetaBadges job={job} />
}
