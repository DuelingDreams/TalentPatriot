import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Briefcase, MapPin, DollarSign, Clock } from 'lucide-react';

interface Job {
  id: string;
  title: string;
  description: string;
  location: string;
  jobType: string;
  department: string;
  salaryRange: string;
  publishedAt: string;
}

export default function CareersPage() {
  const { data: jobs, isLoading, error } = useQuery<Job[]>({
    queryKey: ['/api/public/jobs'],
    queryFn: async () => {
      const response = await fetch('/api/public/jobs');
      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-300 rounded w-48 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-300 rounded w-64 mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Jobs</h1>
            <p className="text-gray-600">Unable to load available positions. Please try again later.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Join Our Team</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover exciting career opportunities and help us build the future of talent management.
            </p>
          </div>
        </div>
      </div>

      {/* Jobs List */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {!jobs || jobs.length === 0 ? (
          <div className="text-center py-12">
            <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">No Open Positions</h2>
            <p className="text-gray-600">
              We don't have any open positions at the moment, but we're always looking for great talent.
              Check back soon for new opportunities!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Open Positions ({jobs.length})
              </h2>
            </div>
            
            {jobs.map((job) => (
              <Card key={job.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl font-semibold text-gray-900 mb-2">
                        {job.title}
                      </CardTitle>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        {job.location && (
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {job.location}
                          </div>
                        )}
                        {job.jobType && (
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {job.jobType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </div>
                        )}
                        {job.salaryRange && (
                          <div className="flex items-center">
                            <DollarSign className="w-4 h-4 mr-1" />
                            {job.salaryRange}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {job.department && (
                        <Badge variant="secondary">{job.department}</Badge>
                      )}
                      <Link href={`/careers/${job.id}/apply`}>
                        <Button className="bg-blue-600 hover:bg-blue-700">
                          Apply Now
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">
                    {job.description}
                  </p>
                  {job.publishedAt && (
                    <p className="text-sm text-gray-500 mt-4">
                      Posted {new Date(job.publishedAt).toLocaleDateString()}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-white border-t mt-16">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="text-center">
            <p className="text-gray-600">
              Don't see the right position? Send us your resume and we'll keep you in mind for future opportunities.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}