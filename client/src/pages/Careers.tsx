import { useState, useMemo } from 'react'
import { useLocation } from 'wouter'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { useDebounce } from '@/hooks/useDebounce'
import { usePublicJobs } from '@/hooks/usePublicJobs'
import { MapPin, Clock, DollarSign, Briefcase, Building2, Search, Loader2, FileX, Calendar } from 'lucide-react'
import type { Job } from '@shared/schema'

export default function Careers() {
  const [searchTerm, setSearchTerm] = useState('')
  const [, setLocation] = useLocation()
  const { toast } = useToast()

  // Debounce search term to prevent excessive API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 400)

  // Use shared hook for consistent data fetching with caching
  const { 
    jobs, 
    isLoading: loading, 
    error, 
    isEmpty 
  } = usePublicJobs({
    q: debouncedSearchTerm || undefined
  })

  // Handle errors
  if (error) {
    toast({
      title: "Error",
      description: "Failed to load job listings",
      variant: "destructive"
    })
  }

  // Client-side filtering for immediate feedback on search input
  const filteredJobs = useMemo(() => {
    if (!searchTerm) return jobs;
    
    return jobs.filter((job: Job) =>
      job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (job.location && job.location.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [jobs, searchTerm])



  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {/* Dynamic organization name from subdomain or fallback */}
                Careers at {(() => {
                  const hostname = window.location.hostname;
                  if (hostname.includes('.') && !hostname.startsWith('localhost')) {
                    const subdomain = hostname.split('.')[0];
                    return subdomain.replace(/[-_]/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
                  }
                  return 'TalentPatriot';
                })()}
              </h1>
              <p className="mt-2 text-gray-600">Find your next opportunity</p>
            </div>
            <img 
              src="/talentpatriot-logo.png"
              alt="TalentPatriot" 
              className="h-12 object-contain"
            />
          </div>
        </div>
      </header>

      {/* Search Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search jobs by title, description, or location..."
            className="pl-10 pr-4 py-3 text-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Job Listings */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : filteredJobs.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredJobs.map((job: Job) => (
              <Card key={job.id} className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setLocation(`/careers/${job.publicSlug || job.id}`)}>
                <CardHeader>
                  <CardTitle className="text-xl">{job.title}</CardTitle>
                  {job.department && (
                    <div className="flex items-center gap-2 text-gray-600 mt-1">
                      <Building2 className="w-4 h-4" />
                      <span>{job.department}</span>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 mb-4 line-clamp-3">{job.description}</p>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    {job.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{job.location}</span>
                      </div>
                    )}
                    {job.jobType && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span className="capitalize">{job.jobType.replace('-', ' ')}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <Button 
                    className="w-full mt-4"
                    onClick={() => window.location.href = `/careers/${job.publicSlug || job.id}`}
                  >
                    View Details & Apply
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No open positions</h3>
            <p className="text-gray-600">Check back later for new opportunities</p>
          </div>
        )}
      </div>
    </div>
  )
}