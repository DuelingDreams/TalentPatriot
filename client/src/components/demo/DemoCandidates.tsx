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
import { demoCandidates } from '@/lib/demo-data'

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
    <div className="space-y-6">
      {/* Demo Alert */}
      <Alert>
        <Info className="w-4 h-4" />
        <AlertDescription>
          <strong>Demo Mode:</strong> Viewing sample candidate profiles. All personal information is fictional for demonstration purposes.
        </AlertDescription>
      </Alert>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search candidates by name, email, or skills..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Total Candidates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{demoCandidates.length}</div>
            <p className="text-xs text-slate-500 mt-1">In talent pool</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Active Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">4</div>
            <p className="text-xs text-slate-500 mt-1">Currently interviewing</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">New This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">2</div>
            <p className="text-xs text-slate-500 mt-1">Recent applications</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Response Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">78%</div>
            <p className="text-xs text-green-600 mt-1">+5% this month</p>
          </CardContent>
        </Card>
      </div>

      {/* Candidates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCandidates.map((candidate) => (
          <Card key={candidate.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700">
                      {candidate.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{candidate.name}</CardTitle>
                    <Badge variant="outline" className="mt-1">
                      {candidateExperience[candidate.id]}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  <Mail className="w-4 h-4" />
                  <span className="truncate">{candidate.email}</span>
                </div>
                
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone className="w-4 h-4" />
                  <span>{candidate.phone}</span>
                </div>
                
                <div className="flex items-center gap-2 text-slate-600">
                  <MapPin className="w-4 h-4" />
                  <span>{candidateLocations[candidate.id]}</span>
                </div>
                
                <div className="flex items-center gap-2 text-slate-600">
                  <Calendar className="w-4 h-4" />
                  <span>Applied {new Date(candidate.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-1 mt-3">
                {(candidateSkills[candidate.id] || []).map((skill, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
              
              <div className="pt-3 flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" asChild>
                  <Link href={`/candidates/${candidate.id}`}>
                    <Eye className="w-4 h-4 mr-1" />
                    View Profile
                  </Link>
                </Button>
                <Button variant="outline" size="sm" disabled>
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCandidates.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-slate-600">No candidates found matching your search.</p>
        </Card>
      )}
    </div>
  )
}