import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  Users, Search, Mail, Phone, FileText, Calendar, 
  MapPin, Info, Download, Eye
} from 'lucide-react'
import { Link } from 'wouter'
import { demoCandidates } from '@/lib/demo-data-consolidated'

const candidateSkills: Record<string, string[]> = {
  '44444444-4444-4444-4444-444444444444': ['React', 'TypeScript', 'Node.js', 'AWS'],
  '55555555-5555-5555-5555-555555555555': ['Python', 'Django', 'PostgreSQL', 'Docker'],
  '66666666-6666-6666-6666-666666666666': ['Java', 'Spring Boot', 'Kubernetes', 'MongoDB'],
  '77777777-7777-7777-7777-777777777777': ['Vue.js', 'Go', 'GraphQL', 'Redis'],
  '88888888-8888-8888-8888-888888888888': ['Angular', 'C#', '.NET Core', 'Azure'],
  '99999999-9999-9999-9999-999999999999': ['Flutter', 'Dart', 'Firebase', 'React Native']
}

const candidateLocations: Record<string, string> = {
  '44444444-4444-4444-4444-444444444444': 'San Francisco, CA',
  '55555555-5555-5555-5555-555555555555': 'New York, NY',
  '66666666-6666-6666-6666-666666666666': 'Austin, TX',
  '77777777-7777-7777-7777-777777777777': 'Seattle, WA',
  '88888888-8888-8888-8888-888888888888': 'Boston, MA',
  '99999999-9999-9999-9999-999999999999': 'Los Angeles, CA'
}

const candidateExperience: Record<string, string> = {
  '44444444-4444-4444-4444-444444444444': '5+ years',
  '55555555-5555-5555-5555-555555555555': '3-5 years',
  '66666666-6666-6666-6666-666666666666': '7+ years',
  '77777777-7777-7777-7777-777777777777': '2-3 years',
  '88888888-8888-8888-8888-888888888888': '10+ years',
  '99999999-9999-9999-9999-999999999999': '4-6 years'
}

export function DemoCandidates() {
  const [searchTerm, setSearchTerm] = useState('')
  
  const filteredCandidates = demoCandidates.filter(candidate =>
    candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (candidateSkills[candidate.id] || []).some((skill: string) => 
      skill.toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  return (
    <div className="tp-container space-y-6">
      {/* Demo Alert */}
      <Alert className="border-[#264C99]/20 bg-[#264C99]/5">
        <Info className="w-4 h-4 text-[#264C99]" />
        <AlertDescription className="text-[#1A1A1A]">
          <strong>Demo Mode:</strong> Viewing sample candidate profiles. All personal information is fictional for demonstration purposes.
        </AlertDescription>
      </Alert>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5C667B]" />
        <Input
          placeholder="Search candidates by name, email, or skills..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="card">
          <CardHeader className="pb-3">
            <CardTitle className="tp-label text-[#5C667B]">All Candidates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1A1A1A]">{demoCandidates.length}</div>
            <p className="text-xs text-[#5C667B] mt-1">Total profiles</p>
          </CardContent>
        </Card>
        
        <Card className="card">
          <CardHeader className="pb-3">
            <CardTitle className="tp-label text-[#5C667B]">Active Candidates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1A1A1A]">4</div>
            <p className="text-xs text-[#5C667B] mt-1">In active pipeline</p>
          </CardContent>
        </Card>
        
        <Card className="card">
          <CardHeader className="pb-3">
            <CardTitle className="tp-label text-[#5C667B]">New This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1A1A1A]">2</div>
            <p className="text-xs text-[#5C667B] mt-1">Recent applications</p>
          </CardContent>
        </Card>
        
        <Card className="card">
          <CardHeader className="pb-3">
            <CardTitle className="tp-label text-[#5C667B]">Interviewed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1A1A1A]">3</div>
            <p className="text-xs text-[#5C667B] mt-1">Completed interviews</p>
          </CardContent>
        </Card>
      </div>

      {/* Candidates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCandidates.map((candidate) => (
          <Card key={candidate.id} className="card hover:shadow-lg transition-all duration-200 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-2 mb-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Avatar className="w-12 h-12 flex-shrink-0">
                    <AvatarFallback className="bg-[#264C99] text-white text-sm">
                      {candidate.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <h3 className="tp-label text-[#1A1A1A] font-medium truncate">{candidate.name}</h3>
                    <p className="tp-body text-[#5C667B] text-sm truncate">{candidate.email}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[#5C667B] text-sm">
                  <MapPin className="w-4 h-4" />
                  <span>{candidateLocations[candidate.id] || 'Remote'}</span>
                </div>
                
                <div className="flex items-center gap-2 text-[#5C667B] text-sm">
                  <Calendar className="w-4 h-4" />
                  <span>{candidateExperience[candidate.id] || '3+ years'} experience</span>
                </div>

                <div className="flex items-center gap-2 text-[#5C667B] text-sm">
                  <FileText className="w-4 h-4" />
                  <span>Resume available</span>
                </div>
              </div>

              {candidateSkills[candidate.id] && (
                <div className="mt-4 pt-4 border-t border-[#F0F4F8]">
                  <div className="flex flex-wrap gap-1">
                    {candidateSkills[candidate.id].slice(0, 3).map((skill, index) => (
                      <Badge key={index} variant="secondary" className="text-xs bg-[#F0F4F8] text-[#5C667B]">
                        {skill}
                      </Badge>
                    ))}
                    {candidateSkills[candidate.id].length > 3 && (
                      <Badge variant="secondary" className="text-xs bg-[#F0F4F8] text-[#5C667B]">
                        +{candidateSkills[candidate.id].length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-[#F0F4F8]">
                <div className="flex items-center justify-between">
                  <Badge 
                    variant="default" 
                    className="bg-[#264C99]/10 text-[#264C99] border-[#264C99]/20"
                  >
                    New
                  </Badge>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="btn-secondary text-xs">
                      <Eye className="w-3 h-3 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}