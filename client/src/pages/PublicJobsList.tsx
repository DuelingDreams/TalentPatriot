import { useState, useMemo } from 'react';
import { Link } from 'wouter';
import { MapPin, Calendar, Building2, DollarSign, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDebounce } from '@/hooks/useDebounce';
import { usePublicJobs } from '@/hooks/usePublicJobs';
import type { Job } from '@shared/schema';

export default function PublicJobsList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('__all_types');

  // Debounce search term to prevent excessive API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 400);
  const debouncedLocationFilter = useDebounce(locationFilter, 400);

  // Use the shared hook with debounced search
  const filters = useMemo(() => ({
    location: debouncedLocationFilter || undefined,
    jobType: typeFilter === '__all_types' ? undefined : typeFilter,
  }), [debouncedLocationFilter, typeFilter]);

  const { 
    jobs, 
    isLoading, 
    error, 
    isEmpty 
  } = usePublicJobs({
    q: debouncedSearchTerm || undefined,
    filters
  });

  // Client-side filtering for immediate feedback on search input
  const filteredJobs = useMemo(() => {
    if (!searchTerm && !locationFilter && typeFilter === '__all_types') {
      return jobs;
    }
    
    return jobs.filter(job => {
      const matchesSearch = !searchTerm || 
        job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLocation = !locationFilter || 
        job.location?.toLowerCase().includes(locationFilter.toLowerCase());
      const matchesType = typeFilter === '__all_types' || job.jobType === typeFilter;
      
      return matchesSearch && matchesLocation && matchesType;
    });
  }, [jobs, searchTerm, locationFilter, typeFilter]);

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Unable to Load Jobs</h1>
          <p className="text-gray-600 mb-6">We're having trouble loading the job listings. Please try again later.</p>
          <Button onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Find Your Next Opportunity
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Explore exciting career opportunities with innovative companies looking for talented professionals like you.
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="md:col-span-2">
                <Input
                  placeholder="Search jobs by title or keywords..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <Input
                  placeholder="Location"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                />
              </div>
              <div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Job Type" />
                  </SelectTrigger>
                  <SelectContent className="z-[100]">
                    <SelectItem value="__all_types">All Types</SelectItem>
                    <SelectItem value="full-time">Full-time</SelectItem>
                    <SelectItem value="part-time">Part-time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="internship">Internship</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="mb-6">
          <p className="text-gray-600">
            {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} found
          </p>
        </div>

        {/* Job Listings */}
        {filteredJobs.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-gray-500 text-lg">
                No jobs found matching your criteria.
              </p>
              <p className="text-gray-400 mt-2">
                Try adjusting your search filters.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {filteredJobs.map((job) => (
              <Card key={job.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl text-gray-900 mb-2">
                        {job.title}
                      </CardTitle>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        {job.department && (
                          <div className="flex items-center gap-1">
                            <Building2 className="h-4 w-4" />
                            {job.department}
                          </div>
                        )}
                        {job.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {job.location}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Posted {new Date(job.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge 
                        variant={job.jobType === 'full-time' ? 'default' : 'secondary'}
                        className="capitalize"
                      >
                        {job.jobType?.replace('-', ' ')}
                      </Badge>
                      <Badge 
                        variant={job.status === 'open' ? 'default' : 'secondary'}
                        className="capitalize bg-green-100 text-green-800"
                      >
                        {job.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {job.description && (
                    <p className="text-gray-700 mb-4 line-clamp-3">
                      {job.description.length > 200 
                        ? `${job.description.substring(0, 200)}...` 
                        : job.description
                      }
                    </p>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Clock className="h-4 w-4" />
                      Apply by: Open
                    </div>
                    <Link href={`/careers/${job.id}`}>
                      <Button>
                        View Details & Apply
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}