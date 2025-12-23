import { useState } from 'react'
import { useParams, Link } from 'wouter'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useClient } from '@/features/organization/hooks/useClients'
import { useJobs } from '@/features/jobs/hooks/useJobs'
import { ArrowLeft, Building2, MapPin, Globe, User, Mail, Phone, Calendar, Briefcase, Users, FileText, MessageSquare, Loader2, Edit } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>()
  const { data: client, isLoading: clientLoading } = useClient(id || undefined)
  const { data: allJobs } = useJobs()

  // Filter jobs for this client
  const clientJobs = allJobs?.filter((job: any) => job.client_id === id) || []

  if (clientLoading) {
    return (
      <DashboardLayout pageTitle="Client Details">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  if (!client) {
    return (
      <DashboardLayout pageTitle="Client Not Found">
        <div className="text-center py-12">
          <Building2 className="w-12 h-12 mx-auto text-neutral-600 mb-4" />
          <h3 className="text-lg font-medium text-neutral-900 mb-2">Client not found</h3>
          <p className="text-neutral-600 mb-4">The client you're looking for doesn't exist.</p>
          <Link href="/clients">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Clients
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout pageTitle={client.name}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex items-center gap-4">
            <Link href="/clients">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-info-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-info-600" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-neutral-900">{client.name}</h1>
                <div className="flex items-center gap-4 mt-1">
                  {client.industry && (
                    <Badge variant="outline">{client.industry}</Badge>
                  )}
                  {client.location && (
                    <div className="flex items-center gap-1 text-sm text-neutral-600">
                      <MapPin className="w-3 h-3" />
                      {client.location}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <Button>
            <Edit className="w-4 h-4 mr-2" />
            Edit Client
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-info-600" />
                <div>
                  <div className="text-2xl font-bold text-neutral-900">{clientJobs.length}</div>
                  <div className="text-sm text-neutral-600">Active Jobs</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-success-600" />
                <div>
                  <div className="text-2xl font-bold text-neutral-900">0</div>
                  <div className="text-sm text-neutral-600">Total Candidates</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-tp-accent" />
                <div>
                  <div className="text-2xl font-bold text-neutral-900">0</div>
                  <div className="text-sm text-neutral-600">Notes</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-warning-600" />
                <div>
                  <div className="text-2xl font-bold text-neutral-900">
                    {formatDistanceToNow(new Date(client.createdAt))}
                  </div>
                  <div className="text-sm text-neutral-600">Client Since</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabbed Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="jobs">Jobs ({clientJobs.length})</TabsTrigger>
            <TabsTrigger value="candidates">Candidates</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Client Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Client Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-neutral-600">Company Name</label>
                      <p className="text-neutral-900">{client.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-neutral-600">Industry</label>
                      <p className="text-neutral-900">{client.industry || '—'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-neutral-600">Location</label>
                      <p className="text-neutral-900">{client.location || '—'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-neutral-600">Website</label>
                      {client.website ? (
                        <a 
                          href={client.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-info-600 hover:underline flex items-center gap-1"
                        >
                          <Globe className="w-3 h-3" />
                          {client.website.replace(/^https?:\/\//, '')}
                        </a>
                      ) : (
                        <p className="text-neutral-900">—</p>
                      )}
                    </div>
                  </div>
                  
                  {client.notes && (
                    <div>
                      <label className="text-sm font-medium text-neutral-600">Notes</label>
                      <p className="text-neutral-900 whitespace-pre-wrap">{client.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Primary Contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {client.contactName || client.contactEmail || client.contactPhone ? (
                    <div className="space-y-3">
                      {client.contactName && (
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-neutral-400" />
                          <span>{client.contactName}</span>
                        </div>
                      )}
                      {client.contactEmail && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-neutral-400" />
                          <a 
                            href={`mailto:${client.contactEmail}`}
                            className="text-info-600 hover:underline"
                          >
                            {client.contactEmail}
                          </a>
                        </div>
                      )}
                      {client.contactPhone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-neutral-400" />
                          <span>{client.contactPhone}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-neutral-500">No contact information available</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="jobs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Client Jobs</CardTitle>
              </CardHeader>
              <CardContent>
                {clientJobs.length === 0 ? (
                  <div className="text-center py-8">
                    <Briefcase className="w-12 h-12 mx-auto text-neutral-400 mb-4" />
                    <h3 className="text-lg font-medium text-neutral-900 mb-2">No jobs yet</h3>
                    <p className="text-neutral-500">No jobs have been created for this client.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Job Title</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {clientJobs.map((job: any) => (
                          <TableRow key={job.id}>
                            <TableCell>
                              <Link href={`/jobs/${job.id}`}>
                                <button className="font-medium text-neutral-900 hover:text-info-600 text-left">
                                  {job.title}
                                </button>
                              </Link>
                              {job.description && (
                                <p className="text-sm text-neutral-500 mt-1 line-clamp-2">
                                  {job.description}
                                </p>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant={job.status === 'open' ? 'default' : 'secondary'}>
                                {job.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm text-neutral-500">
                                <Calendar className="w-3 h-3" />
                                {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Link href={`/jobs/${job.id}`}>
                                <Button size="sm" variant="outline">
                                  View Pipeline
                                </Button>
                              </Link>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="candidates">
            <Card>
              <CardHeader>
                <CardTitle>Candidates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Users className="w-12 h-12 mx-auto text-neutral-400 mb-4" />
                  <h3 className="text-lg font-medium text-neutral-900 mb-2">Coming Soon</h3>
                  <p className="text-neutral-500">Candidate management for this client will be available soon.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="notes">
            <Card>
              <CardHeader>
                <CardTitle>Internal Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 mx-auto text-neutral-400 mb-4" />
                  <h3 className="text-lg font-medium text-neutral-900 mb-2">Coming Soon</h3>
                  <p className="text-neutral-500">Internal notes for this client will be available soon.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="files">
            <Card>
              <CardHeader>
                <CardTitle>Files & Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 mx-auto text-neutral-400 mb-4" />
                  <h3 className="text-lg font-medium text-neutral-900 mb-2">Coming Soon</h3>
                  <p className="text-neutral-500">File storage for this client will be available soon.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="contacts">
            <Card>
              <CardHeader>
                <CardTitle>Additional Contacts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <User className="w-12 h-12 mx-auto text-neutral-400 mb-4" />
                  <h3 className="text-lg font-medium text-neutral-900 mb-2">Coming Soon</h3>
                  <p className="text-neutral-500">Additional contact management will be available soon.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}