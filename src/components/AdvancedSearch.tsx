import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Job, Client } from '@shared/schema';
import { Search, Filter, X } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';

interface SearchFilters {
  searchTerm: string;
  status: string;
  experienceLevel: string;
  remoteOption: string;
  clientId: string;
  stage: string;
  jobId: string;
  startDate: string;
  endDate: string;
}

interface AdvancedSearchProps {
  searchType: 'candidates' | 'jobs';
  orgId: string;
  onResults: (results: any[]) => void;
  onLoading: (loading: boolean) => void;
}

export function AdvancedSearch({ searchType, orgId, onResults, onLoading }: AdvancedSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    searchTerm: '',
    status: '',
    experienceLevel: '',
    remoteOption: '',
    clientId: '',
    stage: '',
    jobId: '',
    startDate: '',
    endDate: ''
  });

  const [isExpanded, setIsExpanded] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  // Get clients for filtering
  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ['/api/clients', orgId],
    queryFn: () => apiRequest(`/api/clients?orgId=${orgId}`),
    enabled: searchType === 'jobs' && !!orgId
  });

  // Get jobs for candidate filtering
  const { data: jobs = [] } = useQuery<Job[]>({
    queryKey: ['/api/jobs', orgId],
    queryFn: () => apiRequest(`/api/jobs?orgId=${orgId}`),
    enabled: searchType === 'candidates' && !!orgId
  });

  const handleSearch = async () => {
    if (!orgId) return;

    onLoading(true);
    try {
      const searchData: any = {
        orgId,
        searchTerm: filters.searchTerm || undefined,
      };

      // Add filters based on search type
      if (searchType === 'jobs') {
        if (filters.status) searchData.status = filters.status;
        if (filters.experienceLevel) searchData.experienceLevel = filters.experienceLevel;
        if (filters.remoteOption) searchData.remoteOption = filters.remoteOption;
        if (filters.clientId) searchData.clientId = filters.clientId;
      } else {
        if (filters.stage) searchData.stage = filters.stage;
        if (filters.status) searchData.status = filters.status;
        if (filters.jobId) searchData.jobId = filters.jobId;
        if (filters.startDate && filters.endDate) {
          searchData.startDate = new Date(filters.startDate).toISOString();
          searchData.endDate = new Date(filters.endDate).toISOString();
        }
      }

      const results = await apiRequest(`/api/search/${searchType}`, {
        method: 'POST',
        body: JSON.stringify(searchData),
        headers: { 'Content-Type': 'application/json' }
      });

      onResults(results);
      updateActiveFilters();
    } catch (error) {
      console.error('Search failed:', error);
      onResults([]);
    } finally {
      onLoading(false);
    }
  };

  const updateActiveFilters = () => {
    const active: string[] = [];
    if (filters.searchTerm) active.push(`Search: "${filters.searchTerm}"`);
    if (filters.status) active.push(`Status: ${filters.status}`);
    if (filters.experienceLevel) active.push(`Experience: ${filters.experienceLevel}`);
    if (filters.remoteOption) active.push(`Remote: ${filters.remoteOption}`);
    if (filters.stage) active.push(`Stage: ${filters.stage}`);
    if (filters.startDate && filters.endDate) {
      active.push(`Date Range: ${filters.startDate} to ${filters.endDate}`);
    }
    setActiveFilters(active);
  };

  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      status: '',
      experienceLevel: '',
      remoteOption: '',
      clientId: '',
      stage: '',
      jobId: '',
      startDate: '',
      endDate: ''
    });
    setActiveFilters([]);
    onResults([]);
  };

  const removeFilter = (filterText: string) => {
    const newFilters = { ...filters };
    if (filterText.startsWith('Search:')) newFilters.searchTerm = '';
    if (filterText.startsWith('Status:')) newFilters.status = '';
    if (filterText.startsWith('Experience:')) newFilters.experienceLevel = '';
    if (filterText.startsWith('Remote:')) newFilters.remoteOption = '';
    if (filterText.startsWith('Stage:')) newFilters.stage = '';
    if (filterText.startsWith('Date Range:')) {
      newFilters.startDate = '';
      newFilters.endDate = '';
    }
    setFilters(newFilters);
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Search className="w-5 h-5" />
          Advanced {searchType === 'candidates' ? 'Candidate' : 'Job'} Search
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Basic search */}
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder={`Search ${searchType === 'candidates' ? 'candidates by name or email' : 'jobs by title, description, or location'}...`}
              value={filters.searchTerm}
              onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Button onClick={() => setIsExpanded(!isExpanded)} variant="outline" size="icon">
            <Filter className="w-4 h-4" />
          </Button>
          <Button onClick={handleSearch}>
            Search
          </Button>
        </div>

        {/* Active filters */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {activeFilters.map((filter, index) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                {filter}
                <X 
                  className="w-3 h-3 cursor-pointer" 
                  onClick={() => removeFilter(filter)}
                />
              </Badge>
            ))}
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear All
            </Button>
          </div>
        )}

        {/* Advanced filters */}
        {isExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t">
            {/* Common filters */}
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Job-specific filters */}
            {searchType === 'jobs' && (
              <>
                <div>
                  <Label htmlFor="experienceLevel">Experience Level</Label>
                  <Select value={filters.experienceLevel} onValueChange={(value) => setFilters(prev => ({ ...prev, experienceLevel: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select experience" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Levels</SelectItem>
                      <SelectItem value="entry">Entry</SelectItem>
                      <SelectItem value="mid">Mid</SelectItem>
                      <SelectItem value="senior">Senior</SelectItem>
                      <SelectItem value="executive">Executive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="remoteOption">Remote Option</Label>
                  <Select value={filters.remoteOption} onValueChange={(value) => setFilters(prev => ({ ...prev, remoteOption: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select remote option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Options</SelectItem>
                      <SelectItem value="onsite">On-site</SelectItem>
                      <SelectItem value="remote">Remote</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="clientId">Client</Label>
                  <Select value={filters.clientId} onValueChange={(value) => setFilters(prev => ({ ...prev, clientId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Clients</SelectItem>
                      {clients.map((client: any) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* Candidate-specific filters */}
            {searchType === 'candidates' && (
              <>
                <div>
                  <Label htmlFor="stage">Pipeline Stage</Label>
                  <Select value={filters.stage} onValueChange={(value) => setFilters(prev => ({ ...prev, stage: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select stage" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Stages</SelectItem>
                      <SelectItem value="applied">Applied</SelectItem>
                      <SelectItem value="screen">Screen</SelectItem>
                      <SelectItem value="interview">Interview</SelectItem>
                      <SelectItem value="offer">Offer</SelectItem>
                      <SelectItem value="hired">Hired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="jobId">Specific Job</Label>
                  <Select value={filters.jobId} onValueChange={(value) => setFilters(prev => ({ ...prev, jobId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select job" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Jobs</SelectItem>
                      {jobs.map((job: any) => (
                        <SelectItem key={job.id} value={job.id}>
                          {job.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}