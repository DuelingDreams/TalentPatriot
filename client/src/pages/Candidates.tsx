import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useAuth } from '@/contexts/AuthContext'
import { DemoCandidates } from '@/components/demo/DemoCandidates'
import { useCandidates } from '@/hooks/useCandidates'
import { AddCandidateDialog } from '@/components/dialogs/AddCandidateDialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Search, 
  Users, 
  UserCheck, 
  Calendar, 
  Star, 
  MapPin, 
  Mail, 
  Phone,
  Briefcase,
  Clock,
  Plus,
  Building2,
  FileX
} from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { formatDistanceToNow } from 'date-fns'
import { Link, useLocation } from 'wouter'
import { useToast } from '@/hooks/use-toast'

export default function Candidates() {
  const { userRole, currentOrgId } = useAuth()
  const [, setLocation] = useLocation()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const { toast } = useToast()

  // Handle onboarding actions for demo users
  useEffect(() => {
    if (userRole === 'demo_viewer') {
      const urlParams = new URLSearchParams(window.location.search)
      const action = urlParams.get('action')
      const isOnboarding = urlParams.get('onboarding') === 'true'
      
      if (action === 'import-guided' && isOnboarding) {
        toast({
          title: "Candidate Import (Demo)",
          description: "Demo candidates are already loaded! Explore their profiles and see how candidate management works.",
        })
        // Clear parameters
        const url = new URL(window.location.href)
        url.searchParams.delete('action')
        url.searchParams.delete('onboarding')
        window.history.replaceState({}, document.title, url.pathname)
      }
    }
  }, [userRole, toast])
  
  // Show demo candidates for demo viewers
  if (userRole === 'demo_viewer') {
    return (
      <DashboardLayout pageTitle="Demo Candidates">
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Candidate Database</h1>
            <p className="text-base text-gray-700 mt-2">Explore our demo candidate profiles</p>
          </div>
          <DemoCandidates />
        </div>
      </DashboardLayout>
    )
  }
  
  // Check if user has organization - only for non-demo users
  if (!currentOrgId && userRole !== 'demo_viewer') {
    return (
      <DashboardLayout pageTitle="Candidates">
        <div className="p-6">
          <Card className="max-w-2xl mx-auto rounded-2xl shadow-sm">
            <CardHeader className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-blue-600" />
              </div>
              <CardTitle className="text-xl font-semibold">Organization Setup Required</CardTitle>
              <p className="text-base text-gray-700 mt-2">
                You need to set up your organization before you can manage candidates.
              </p>
            </CardHeader>
            <CardContent className="text-center">
              <AddCandidateDialog>
                <Button className="bg-primary text-white py-2 px-4 rounded-2xl shadow-sm hover:shadow-lg">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Candidate
                </Button>
              </AddCandidateDialog>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  // Real candidates page for authenticated users
  const { data: candidates, isLoading } = useCandidates()
  
  // Filter candidates based on search and tab
  const filteredCandidates = candidates?.filter((candidate: any) => {
    const matchesSearch = candidate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         candidate.email.toLowerCase().includes(searchQuery.toLowerCase())
    
    if (activeTab === 'all') return matchesSearch
    if (activeTab === 'active') return matchesSearch && candidate.status === 'active'
    if (activeTab === 'new') {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      return matchesSearch && new Date(candidate.createdAt) >= oneWeekAgo
    }
    return matchesSearch
  }) || []

  // Calculate stats
  const totalCandidates = candidates?.length || 0
  const activeCandidates = candidates?.filter((c: any) => c.status === 'active').length || 0
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const newThisWeek = candidates?.filter((c: any) => new Date(c.createdAt) >= oneWeekAgo).length || 0
  const favoriteCandidates = candidates?.filter((c: any) => c.status === 'favorite').length || 0

  return (
    <DashboardLayout pageTitle="Candidates">
      <div className="tp-container">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="tp-h1">Candidate Database</h1>
            <p className="tp-body text-[#5C667B]">Manage and track candidate profiles</p>
          </div>
          <AddCandidateDialog />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="card">
            <CardHeader className="pb-3">
              <CardTitle className="tp-label text-[#5C667B]">All Candidates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#1A1A1A]">{totalCandidates}</div>
              <p className="text-xs text-[#5C667B] mt-1">Total in database</p>
            </CardContent>
          </Card>
          
          <Card className="card">
            <CardHeader className="pb-3">
              <CardTitle className="tp-label text-[#5C667B]">Active Candidates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#1A1A1A]">{activeCandidates}</div>
              <p className="text-xs text-[#5C667B] mt-1">Currently interviewing</p>
            </CardContent>
          </Card>
          
          <Card className="card">
            <CardHeader className="pb-3">
              <CardTitle className="tp-label text-[#5C667B]">New This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#1A1A1A]">{newThisWeek}</div>
              <p className="text-xs text-[#5C667B] mt-1">Recent additions</p>
            </CardContent>
          </Card>
          
          <Card className="card">
            <CardHeader className="pb-3">
              <CardTitle className="tp-label text-[#5C667B]">Favorites</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#1A1A1A]">{favoriteCandidates}</div>
              <p className="text-xs text-[#5C667B] mt-1">Starred candidates</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="card mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5C667B]" />
                <Input
                  placeholder="Search candidates by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="new">New</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {/* Candidates List */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="card">
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-[#F0F4F8] rounded-full"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-[#F0F4F8] rounded w-24"></div>
                        <div className="h-3 bg-[#F0F4F8] rounded w-32"></div>
                      </div>
                    </div>
                    <div className="h-16 bg-[#F0F4F8] rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredCandidates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCandidates.map((candidate: any) => (
              <Link key={candidate.id} href={`/candidates/${candidate.id}`}>
                <Card className="card hover:shadow-lg transition-all duration-200 cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={""} alt={candidate.name} />
                          <AvatarFallback className="bg-[#264C99] text-white">
                            {candidate.name.split(' ').map((n: string) => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-[#1A1A1A]">{candidate.name}</h3>
                          <p className="text-sm text-[#5C667B]">{candidate.email}</p>
                        </div>
                      </div>
                      {candidate.status === 'favorite' && (
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      )}
                    </div>

                    <div className="space-y-2 text-sm">
                      {candidate.phone && (
                        <div className="flex items-center gap-2 text-[#5C667B]">
                          <Phone className="w-4 h-4" />
                          <span>{candidate.phone}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 text-[#5C667B]">
                        <Clock className="w-4 h-4" />
                        <span>Added {formatDistanceToNow(new Date(candidate.createdAt), { addSuffix: true })}</span>
                      </div>

                      {candidate.resumeUrl && (
                        <div className="flex items-center gap-2 text-[#5C667B]">
                          <Briefcase className="w-4 h-4" />
                          <span>Resume uploaded</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-[#F0F4F8]">
                      <Badge 
                        variant={candidate.status === 'active' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {candidate.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="card">
            <CardContent className="p-12 text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-[#5C667B]" />
              <h3 className="tp-h2 mb-2">No candidates found</h3>
              <p className="tp-body text-[#5C667B] mb-4">
                {searchQuery ? 'Try adjusting your search terms.' : 'Get started by adding your first candidate.'}
              </p>
              <AddCandidateDialog />
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}