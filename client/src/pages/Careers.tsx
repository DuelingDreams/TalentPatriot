import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useLocation } from 'wouter'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { MapPin, Clock, DollarSign, Briefcase, Building2, Search, Loader2, FileX } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'

interface PublicJob {
  id: string
  title: string
  description: string
  location?: string
  salaryRange?: string
  createdAt: string
  publicSlug: string
  client?: {
    name: string
  }
}

export default function Careers() {
  const [searchTerm, setSearchTerm] = useState('')
  const [, setLocation] = useLocation()
  const { toast } = useToast()

  // Fetch public jobs using React Query
  const { data: jobs = [], isLoading: loading, error } = useQuery({
    queryKey: ['/api/public/jobs'],
    queryFn: () => fetch('/api/public/jobs').then(r => r.json())
  })

  // Handle errors
  if (error) {
    toast({
      title: "Error",
      description: "Failed to load job listings",
      variant: "destructive"
    })
  }

  const filteredJobs = jobs.filter((job: PublicJob) =>
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (job.location && job.location.toLowerCase().includes(searchTerm.toLowerCase()))
  )



  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {/* Dynamic organization name from subdomain or fallback */}
                Careers at {window.location.hostname.includes('.') && !window.location.hostname.startsWith('localhost') 
                  ? window.location.hostname.split('.')[0].replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                  : 'TalentPatriot'}
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
            {filteredJobs.map((job: PublicJob) => (
              <Card key={job.id} className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setLocation(`/careers/${job.publicSlug}/apply`)}>
                <CardHeader>
                  <CardTitle className="text-xl">{job.title}</CardTitle>
                  {job.client && (
                    <div className="flex items-center gap-2 text-gray-600 mt-1">
                      <Building2 className="w-4 h-4" />
                      <span>{job.client.name}</span>
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
                    {job.salaryRange && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        <span>{job.salaryRange}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <Button className="w-full mt-4">
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