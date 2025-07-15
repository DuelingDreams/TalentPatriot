import { useState } from 'react'
import { useParams, Link } from 'wouter'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useClient } from '@/hooks/useClients'
import { useJobs } from '@/hooks/useJobs'
import { 
  ArrowLeft, Building2, MapPin, Globe, User, Mail, Phone, Calendar, Briefcase, Users, FileText, MessageSquare, 
  Loader2, Edit, Plus, Star, Activity, TrendingUp, Clock, Upload, Download, ExternalLink,
  UserPlus, Target, BarChart3, Eye, Filter, Search, Tag, Settings
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>()
  const { data: client, isLoading: clientLoading } = useClient(id || null)
  const { data: allJobs } = useJobs()
  const [activeTab, setActiveTab] = useState("overview")
  const [isEditingNote, setIsEditingNote] = useState(false)
  const [newNote, setNewNote] = useState("")

  // Filter jobs for this client
  const clientJobs = allJobs?.filter(job => job.client_id === id) || []

  // Mock data for demonstration (would come from API in production)
  const clientNotes = [
    {
      id: "1",
      content: "Prefers candidates with 5+ years experience. Very responsive to emails.",
      authorId: "user1",
      createdAt: new Date("2024-01-15"),
      type: "preference"
    },
    {
      id: "2", 
      content: "Strong relationship with hiring manager Jane Smith. Quarterly check-ins work well.",
      authorId: "user2",
      createdAt: new Date("2024-01-10"),
      type: "relationship"
    }
  ]

  const clientFiles = [
    {
      id: "1",
      fileName: "NDA_TechCorp.pdf",
      fileType: "nda",
      fileSize: "256 KB",
      uploadedBy: "John Doe",
      createdAt: new Date("2024-01-01")
    },
    {
      id: "2",
      fileName: "SOW_Q1_2024.pdf", 
      fileType: "sow",
      fileSize: "512 KB",
      uploadedBy: "Jane Smith",
      createdAt: new Date("2024-01-05")
    }
  ]

  const clientContacts = [
    {
      id: "1",
      name: "Sarah Johnson",
      title: "HR Director",
      email: "sarah.johnson@techcorp.com",
      phone: "(555) 123-4567",
      department: "Human Resources",
      linkedinUrl: "https://linkedin.com/in/sarahjohnson",
      isPrimary: true,
      notes: "Primary contact for all hiring decisions"
    },
    {
      id: "2",
      name: "Mike Chen",
      title: "Engineering Manager",
      email: "mike.chen@techcorp.com", 
      phone: "(555) 234-5678",
      department: "Engineering",
      linkedinUrl: "https://linkedin.com/in/mikechen",
      isPrimary: false,
      notes: "Technical interview coordinator"
    }
  ]

  const activityFeed = [
    {
      id: "1",
      action: "Job posted",
      description: "Senior Developer position posted",
      timestamp: new Date("2024-01-20"),
      user: "John Doe"
    },
    {
      id: "2",
      action: "Note added",
      description: "Added preference note about experience requirements",
      timestamp: new Date("2024-01-19"),
      user: "Jane Smith"
    },
    {
      id: "3",
      action: "Contact updated",
      description: "Updated Sarah Johnson's phone number",
      timestamp: new Date("2024-01-18"),
      user: "Mike Wilson"
    }
  ]

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
          <Building2 className="w-12 h-12 mx-auto text-slate-400 mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">Client not found</h3>
          <p className="text-slate-500 mb-4">The client you're looking for doesn't exist.</p>
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'idle': return 'bg-yellow-100 text-yellow-800' 
      case 'prospect': return 'bg-blue-100 text-blue-800'
      case 'paused': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getFileTypeIcon = (type: string) => {
    switch (type) {
      case 'nda': return '📄'
      case 'sow': return '📋'
      case 'msa': return '📃'
      case 'contract': return '📝'
      default: return '📁'
    }
  }

  return (
    <DashboardLayout pageTitle={client.name}>
      <div className="space-y-6">
        {/* Enhanced Header */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex items-center gap-4">
            <Link href="/clients">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-semibold text-slate-900">{client.name}</h1>
                  <Button variant="ghost" size="sm">
                    <Star className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-4 mt-1">
                  {client.industry && (
                    <Badge variant="outline">{client.industry}</Badge>
                  )}
                  <Badge className={getStatusColor('active')}>Active</Badge>
                  {client.location && (
                    <div className="flex items-center gap-1 text-sm text-slate-600">
                      <MapPin className="w-3 h-3" />
                      {client.location}
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-sm text-slate-600">
                    <Tag className="w-3 h-3" />
                    SB, 8a
                  </div>
                  {client.website && (
                    <a 
                      href={client.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                    >
                      <Globe className="w-3 h-3" />
                      Website
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Quick Actions
            </Button>
            <Button>
              <Edit className="w-4 h-4 mr-2" />
              Edit Client
            </Button>
          </div>
        </div>

        {/* Comprehensive Tabbed Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="jobs">Jobs</TabsTrigger>
            <TabsTrigger value="candidates">Candidates</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Company Info Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Company Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-600">Industry</label>
                    <p className="text-slate-900">{client.industry || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">Location</label>
                    <p className="text-slate-900">{client.location || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">Website</label>
                    {client.website ? (
                      <a href={client.website} target="_blank" rel="noopener noreferrer" 
                         className="text-blue-600 hover:text-blue-700 flex items-center gap-1">
                        {client.website}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <p className="text-slate-500">Not specified</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">Client Owner</label>
                    <p className="text-slate-900">John Doe</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">Last Contacted</label>
                    <p className="text-slate-900">3 days ago</p>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Metrics Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Quick Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Jobs Posted</span>
                    <span className="font-semibold text-slate-900">{clientJobs.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Active Jobs</span>
                    <span className="font-semibold text-green-600">
                      {clientJobs.filter(job => job.status === 'open').length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Total Candidates</span>
                    <span className="font-semibold text-slate-900">24</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Interviews Scheduled</span>
                    <span className="font-semibold text-blue-600">3</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Successful Hires</span>
                    <span className="font-semibold text-green-600">5</span>
                  </div>
                </CardContent>
              </Card>

              {/* Activity Feed Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {activityFeed.slice(0, 5).map((activity) => (
                      <div key={activity.id} className="flex gap-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900">{activity.action}</p>
                          <p className="text-xs text-slate-600">{activity.description}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            {formatDistanceToNow(activity.timestamp, { addSuffix: true })} by {activity.user}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Jobs Tab */}
          <TabsContent value="jobs" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Client Jobs</h3>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Job
              </Button>
            </div>
            
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Candidates</TableHead>
                    <TableHead>Posted</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientJobs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                        No jobs posted for this client yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    clientJobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell className="font-medium">{job.title}</TableCell>
                        <TableCell>
                          <Badge variant={job.status === 'open' ? 'default' : 'secondary'}>
                            {job.status}
                          </Badge>
                        </TableCell>
                        <TableCell>0</TableCell>
                        <TableCell>{formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Candidates Tab */}
          <TabsContent value="candidates" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">All Candidates</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
                <Button>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Candidate
                </Button>
              </div>
            </div>
            
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Job</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                      No candidates found for this client's jobs
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Client Notes</h3>
              <Button onClick={() => setIsEditingNote(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Note
              </Button>
            </div>

            {isEditingNote && (
              <Card>
                <CardHeader>
                  <CardTitle>Add New Note</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Note type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="relationship">Relationship</SelectItem>
                        <SelectItem value="preference">Preference</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Textarea
                    placeholder="Enter your note..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button onClick={() => setIsEditingNote(false)}>Save Note</Button>
                    <Button variant="outline" onClick={() => setIsEditingNote(false)}>Cancel</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-4">
              {clientNotes.map((note) => (
                <Card key={note.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            {note.type}
                          </Badge>
                          <span className="text-sm text-slate-500">
                            {format(note.createdAt, 'MMM d, yyyy')}
                          </span>
                        </div>
                        <p className="text-slate-900">{note.content}</p>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Files Tab */}
          <TabsContent value="files" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Client Files</h3>
              <Button>
                <Upload className="w-4 h-4 mr-2" />
                Upload File
              </Button>
            </div>

            <Card>
              <CardContent className="pt-6">
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
                  <Upload className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                  <h4 className="text-lg font-medium text-slate-900 mb-2">Upload Files</h4>
                  <p className="text-slate-600 mb-4">Drag and drop files here, or click to browse</p>
                  <Button>Choose Files</Button>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {clientFiles.map((file) => (
                <Card key={file.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getFileTypeIcon(file.fileType)}</span>
                        <div>
                          <p className="font-medium text-slate-900">{file.fileName}</p>
                          <p className="text-sm text-slate-600">
                            {file.fileSize} • Uploaded by {file.uploadedBy} • {format(file.createdAt, 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Contacts Tab */}
          <TabsContent value="contacts" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Client Contacts</h3>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Contact
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Contact</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Input placeholder="Full Name" />
                      <Input placeholder="Job Title" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Input placeholder="Email" type="email" />
                      <Input placeholder="Phone" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Input placeholder="Department" />
                      <Input placeholder="LinkedIn URL" />
                    </div>
                    <Textarea placeholder="Notes about this contact..." />
                    <div className="flex gap-2">
                      <Button>Add Contact</Button>
                      <Button variant="outline">Cancel</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {clientContacts.map((contact) => (
                <Card key={contact.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-slate-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-slate-900">{contact.name}</h4>
                            {contact.isPrimary && (
                              <Badge variant="default" className="text-xs">Primary</Badge>
                            )}
                          </div>
                          <p className="text-slate-600">{contact.title}</p>
                          <p className="text-sm text-slate-500">{contact.department}</p>
                          <div className="flex gap-4 mt-2">
                            {contact.email && (
                              <a href={`mailto:${contact.email}`} 
                                 className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700">
                                <Mail className="w-3 h-3" />
                                {contact.email}
                              </a>
                            )}
                            {contact.phone && (
                              <div className="flex items-center gap-1 text-sm text-slate-600">
                                <Phone className="w-3 h-3" />
                                {contact.phone}
                              </div>
                            )}
                            {contact.linkedinUrl && (
                              <a href={contact.linkedinUrl} target="_blank" rel="noopener noreferrer"
                                 className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700">
                                <ExternalLink className="w-3 h-3" />
                                LinkedIn
                              </a>
                            )}
                          </div>
                          {contact.notes && (
                            <p className="text-sm text-slate-600 mt-2">{contact.notes}</p>
                          )}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}