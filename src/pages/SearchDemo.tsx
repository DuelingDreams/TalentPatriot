import React, { useState } from 'react';
import { AdvancedSearch } from '@/components/AdvancedSearch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Users, Briefcase, Mail, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SearchDemo() {
  const [candidateResults, setCandidateResults] = useState<any[]>([]);
  const [jobResults, setJobResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Demo organization ID
  const orgId = "16aa3531-ac4f-4f29-8d7e-c296a804f1d3";

  const handleCandidateResults = (results: any[]) => {
    setCandidateResults(results);
  };

  const handleJobResults = (results: any[]) => {
    setJobResults(results);
  };

  const testEmailNotification = async () => {
    // Simulate a new application to trigger email
    try {
      const response = await fetch('/api/jobs/ff3a0178-676f-4e4a-9978-e416fe187755/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: 'Demo',
          lastName: 'User',
          email: 'demo@example.com',
          phone: '555-0000'
        })
      });
      
      if (response.ok) {
        alert('Email notification sent! (Check server logs for SendGrid activity)');
      }
    } catch (error) {
      console.error('Failed to test email:', error);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">
          TalentPatriot Beta Features Demo
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Experience the new enhanced search capabilities and email notification system that make recruiting more efficient than ever.
        </p>
      </div>

      {/* Feature Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Enhanced Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>• Advanced filtering by stage, job, date range</li>
              <li>• Search across candidate names and emails</li>
              <li>• Filter jobs by status, experience level, remote option</li>
              <li>• Real-time results with proper validation</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Email Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>• Automatic new application alerts</li>
              <li>• Interview reminder emails</li>
              <li>• Status update notifications</li>
              <li>• Team collaboration alerts</li>
            </ul>
            <Button 
              onClick={testEmailNotification}
              className="mt-4 w-full"
              variant="outline"
            >
              <Bell className="w-4 h-4 mr-2" />
              Test Email Notification
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Search Interface */}
      <Tabs defaultValue="candidates" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="candidates" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Search Candidates
          </TabsTrigger>
          <TabsTrigger value="jobs" className="flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            Search Jobs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="candidates" className="space-y-6">
          <AdvancedSearch
            searchType="candidates"
            orgId={orgId}
            onResults={handleCandidateResults}
            onLoading={setIsLoading}
          />

          {candidateResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Search Results ({candidateResults.length} candidates found)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {candidateResults.map((candidate: any) => (
                    <div key={candidate.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{candidate.name}</h3>
                          <p className="text-gray-600">{candidate.email}</p>
                          {candidate.phone && <p className="text-gray-500">{candidate.phone}</p>}
                        </div>
                        <div className="text-right">
                          <Badge variant="secondary">
                            {candidate.job_candidate?.[0]?.stage || 'No stage'}
                          </Badge>
                          <p className="text-sm text-gray-500 mt-1">
                            Applied: {new Date(candidate.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="jobs" className="space-y-6">
          <AdvancedSearch
            searchType="jobs"
            orgId={orgId}
            onResults={handleJobResults}
            onLoading={setIsLoading}
          />

          {jobResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Search Results ({jobResults.length} jobs found)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {jobResults.map((job: any) => (
                    <div key={job.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{job.title}</h3>
                          <p className="text-gray-600">{job.location}</p>
                          <p className="text-sm text-gray-500 mt-1">{job.description}</p>
                        </div>
                        <div className="text-right space-y-1">
                          <Badge variant={job.status === 'open' ? 'default' : 'secondary'}>
                            {job.status}
                          </Badge>
                          {job.experience_level && (
                            <Badge variant="outline">{job.experience_level}</Badge>
                          )}
                          {job.remote_option && (
                            <Badge variant="outline">{job.remote_option}</Badge>
                          )}
                        </div>
                      </div>
                      {job.salary_range && (
                        <p className="text-sm font-medium text-green-600 mt-2">
                          {job.salary_range}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {isLoading && (
        <div className="text-center py-8">
          <p className="text-gray-600">Searching...</p>
        </div>
      )}
    </div>
  );
}