// Centralized demo data for all entities
export const DEMO_ORG_ID = '550e8400-e29b-41d4-a716-446655440000'
export const DEMO_ORG_FIXED = 'demo-org-fixed'

export const demoClients = [
  {
    id: 'demo-client-1',
    name: 'TechCorp Solutions',
    industry: 'Technology',
    contactName: 'Sarah Johnson',
    contactEmail: 'sarah@techcorp.com',
    contactPhone: '+1-555-0123',
    website: 'https://techcorp.com',
    location: '123 Innovation Drive, Tech Valley, CA 94025',
    notes: 'Key client in the technology sector',
    orgId: DEMO_ORG_ID,
    status: 'demo' as const,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    createdBy: 'demo-user'
  },
  {
    id: 'demo-client-2',
    name: 'Green Energy Inc',
    industry: 'Energy',
    contactName: 'Michael Chen',
    contactEmail: 'michael@greenenergy.com',
    contactPhone: '+1-555-0456',
    website: 'https://greenenergy.com',
    location: '456 Solar Plaza, Austin, TX 78701',
    notes: 'Sustainable energy solutions provider',
    orgId: DEMO_ORG_ID,
    status: 'demo' as const,
    createdAt: new Date('2024-02-20'),
    updatedAt: new Date('2024-02-20'),
    createdBy: 'demo-user'
  }
]

export const demoJobs = [
  {
    id: 'demo-job-1',
    title: 'Senior Software Engineer',
    description: 'We are looking for an experienced software engineer to join our growing team.',
    clientId: 'demo-client-1',
    status: 'open' as const,
    recordStatus: 'demo' as const,
    assignedTo: 'demo-user',
    orgId: DEMO_ORG_ID,
    location: 'San Francisco, CA',
    jobType: 'full_time' as const,
    department: 'Engineering',
    salaryRange: '$150,000 - $200,000',
    createdAt: new Date('2024-07-01'),
    updatedAt: new Date('2024-07-01'),
    createdBy: 'demo-user'
  },
  {
    id: 'demo-job-2',
    title: 'Product Manager',
    description: 'Lead product development for our clean energy platform.',
    clientId: 'demo-client-2',
    status: 'open' as const,
    recordStatus: 'demo' as const,
    assignedTo: 'demo-user',
    orgId: DEMO_ORG_ID,
    location: 'Austin, TX',
    jobType: 'full_time' as const,
    department: 'Product',
    salaryRange: '$130,000 - $170,000',
    createdAt: new Date('2024-07-10'),
    updatedAt: new Date('2024-07-10'),
    createdBy: 'demo-user'
  }
]

export const demoCandidates = [
  {
    id: 'demo-candidate-1',
    name: 'Emily Rodriguez',
    email: 'emily.rodriguez@email.com',
    phone: '+1-555-0789',
    resumeUrl: null,
    status: 'demo' as const,
    orgId: DEMO_ORG_FIXED,
    createdAt: new Date('2024-07-05'),
    updatedAt: new Date('2024-07-05'),
    createdBy: 'demo-user'
  },
  {
    id: 'demo-candidate-2',
    name: 'James Wilson',
    email: 'james.wilson@email.com',
    phone: '+1-555-0321',
    resumeUrl: null,
    status: 'demo' as const,
    orgId: DEMO_ORG_FIXED,
    createdAt: new Date('2024-07-12'),
    updatedAt: new Date('2024-07-12'),
    createdBy: 'demo-user'
  }
]

export const demoMessages = [
  {
    id: 'demo-message-1',
    subject: 'Interview Feedback - Emily Rodriguez',
    content: 'Great technical interview. Strong React skills demonstrated.',
    senderId: 'demo-user-1',
    priority: 'medium',
    createdAt: new Date('2024-07-15').toISOString()
  }
]