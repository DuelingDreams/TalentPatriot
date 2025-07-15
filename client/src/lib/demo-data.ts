// Demo data for frontend use
export const demoClients = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'TechCorp Solutions',
    industry: 'Technology',
    website: 'https://techcorp.demo',
    notes: 'Leading tech company specializing in AI solutions',
    status: 'demo',
    contactName: 'Sarah Johnson',
    contactEmail: 'sarah@techcorp.demo',
    contactPhone: '+1 (555) 123-4567',
    location: 'San Francisco, CA',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'InnovateCo',
    industry: 'Software Development',
    website: 'https://innovate.demo',
    notes: 'Fast-growing startup focused on mobile applications',
    status: 'demo',
    contactName: 'Michael Chen',
    contactEmail: 'michael@innovate.demo',
    contactPhone: '+1 (555) 234-5678',
    location: 'Austin, TX',
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z'
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'DataDyne Corp',
    industry: 'Data Analytics',
    website: 'https://datadyne.demo',
    notes: 'Enterprise data analytics and visualization company',
    status: 'demo',
    contactName: 'Emily Rodriguez',
    contactEmail: 'emily@datadyne.demo',
    contactPhone: '+1 (555) 345-6789',
    location: 'New York, NY',
    createdAt: '2024-01-03T00:00:00Z',
    updatedAt: '2024-01-03T00:00:00Z'
  }
];

export const demoCandidates = [
  {
    id: '44444444-4444-4444-4444-444444444444',
    name: 'Alex Rodriguez',
    email: 'alex.demo@example.com',
    phone: '+1 (555) 111-2222',
    status: 'demo',
    resumeUrl: 'https://example.com/resume/alex.pdf',
    createdAt: '2024-01-10T00:00:00Z'
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    name: 'Sarah Chen',
    email: 'sarah.demo@example.com',
    phone: '+1 (555) 222-3333',
    status: 'demo',
    resumeUrl: 'https://example.com/resume/sarah.pdf',
    createdAt: '2024-01-11T00:00:00Z'
  },
  {
    id: '66666666-6666-6666-6666-666666666666',
    name: 'Michael Park',
    email: 'michael.demo@example.com',
    phone: '+1 (555) 333-4444',
    status: 'demo',
    resumeUrl: 'https://example.com/resume/michael.pdf',
    createdAt: '2024-01-12T00:00:00Z'
  },
  {
    id: '77777777-7777-7777-7777-777777777777',
    name: 'Emma Wilson',
    email: 'emma.demo@example.com',
    phone: '+1 (555) 444-5555',
    status: 'demo',
    resumeUrl: 'https://example.com/resume/emma.pdf',
    createdAt: '2024-01-13T00:00:00Z'
  },
  {
    id: '88888888-8888-8888-8888-888888888888',
    name: 'David Kim',
    email: 'david.demo@example.com',
    phone: '+1 (555) 555-6666',
    status: 'demo',
    resumeUrl: 'https://example.com/resume/david.pdf',
    createdAt: '2024-01-14T00:00:00Z'
  },
  {
    id: '99999999-9999-9999-9999-999999999999',
    name: 'Lisa Chen',
    email: 'lisa.demo@example.com',
    phone: '+1 (555) 777-8888',
    status: 'demo',
    resumeUrl: 'https://example.com/resume/lisa.pdf',
    createdAt: '2024-01-15T00:00:00Z'
  }
];

export const demoJobs = [
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    title: 'Senior React Developer',
    description: 'We are looking for an experienced React developer to join our frontend team. Must have 5+ years of experience with React, TypeScript, and modern development practices.',
    clientId: '11111111-1111-1111-1111-111111111111',
    status: 'open',
    recordStatus: 'demo',
    createdAt: '2024-01-15T00:00:00Z'
  },
  {
    id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    title: 'DevOps Engineer',
    description: 'Seeking a skilled DevOps engineer to manage our cloud infrastructure. Experience with AWS, Docker, and Kubernetes required.',
    clientId: '22222222-2222-2222-2222-222222222222',
    status: 'open',
    recordStatus: 'demo',
    createdAt: '2024-01-16T00:00:00Z'
  },
  {
    id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    title: 'Data Scientist',
    description: 'Join our data science team to build machine learning models and analyze large datasets. PhD in Data Science or related field preferred.',
    clientId: '33333333-3333-3333-3333-333333333333',
    status: 'open',
    recordStatus: 'demo',
    createdAt: '2024-01-17T00:00:00Z'
  },
  {
    id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    title: 'Product Manager',
    description: 'Lead product development for our mobile app. Experience in agile methodologies and user research required.',
    clientId: '22222222-2222-2222-2222-222222222222',
    status: 'filled',
    recordStatus: 'demo',
    createdAt: '2024-01-18T00:00:00Z'
  }
];

export const demoJobCandidates = [
  {
    id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    jobId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    candidateId: '44444444-4444-4444-4444-444444444444',
    stage: 'applied',
    notes: 'Strong React portfolio, good communication skills',
    assignedTo: 'cd99579b-1b80-4802-9651-e881fb707583',
    status: 'demo',
    updatedAt: '2024-01-20T10:00:00Z'
  },
  {
    id: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
    jobId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    candidateId: '55555555-5555-5555-5555-555555555555',
    stage: 'interview',
    notes: 'Impressive technical background, scheduled for final interview',
    assignedTo: 'cd99579b-1b80-4802-9651-e881fb707583',
    status: 'demo',
    updatedAt: '2024-01-21T14:30:00Z'
  },
  {
    id: '10101010-1010-1010-1010-101010101010',
    jobId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    candidateId: '66666666-6666-6666-6666-666666666666',
    stage: 'technical',
    notes: 'Excellent AWS knowledge, completing technical assessment',
    assignedTo: 'cd99579b-1b80-4802-9651-e881fb707583',
    status: 'demo',
    updatedAt: '2024-01-22T09:15:00Z'
  },
  {
    id: '20202020-2020-2020-2020-202020202020',
    jobId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    candidateId: '77777777-7777-7777-7777-777777777777',
    stage: 'offer',
    notes: 'Strong candidate, offer extended',
    assignedTo: 'cd99579b-1b80-4802-9651-e881fb707583',
    status: 'demo',
    updatedAt: '2024-01-23T16:45:00Z'
  },
  {
    id: '30303030-3030-3030-3030-303030303030',
    jobId: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    candidateId: '88888888-8888-8888-8888-888888888888',
    stage: 'screening',
    notes: 'PhD in ML, reviewing research publications',
    assignedTo: 'cd99579b-1b80-4802-9651-e881fb707583',
    status: 'demo',
    updatedAt: '2024-01-24T11:20:00Z'
  },
  {
    id: '40404040-4040-4040-4040-404040404040',
    jobId: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    candidateId: '99999999-9999-9999-9999-999999999999',
    stage: 'hired',
    notes: 'Excellent product sense, started last week',
    assignedTo: 'cd99579b-1b80-4802-9651-e881fb707583',
    status: 'demo',
    updatedAt: '2024-01-25T08:00:00Z'
  }
];

export const demoCandidateNotes = [
  {
    id: '50505050-5050-5050-5050-505050505050',
    jobCandidateId: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    authorId: 'cd99579b-1b80-4802-9651-e881fb707583',
    content: 'Initial screening call went well. Candidate has strong React experience and good problem-solving skills.',
    status: 'demo',
    createdAt: '2024-01-20T10:30:00Z'
  },
  {
    id: '60606060-6060-6060-6060-606060606060',
    jobCandidateId: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
    authorId: 'cd99579b-1b80-4802-9651-e881fb707583',
    content: 'Technical interview completed successfully. Moving to final round with team lead.',
    status: 'demo',
    createdAt: '2024-01-21T15:00:00Z'
  },
  {
    id: '70707070-7070-7070-7070-707070707070',
    jobCandidateId: '10101010-1010-1010-1010-101010101010',
    authorId: 'cd99579b-1b80-4802-9651-e881fb707583',
    content: 'Candidate demonstrated excellent knowledge of containerization and CI/CD pipelines.',
    status: 'demo',
    createdAt: '2024-01-22T09:45:00Z'
  },
  {
    id: '80808080-8080-8080-8080-808080808080',
    jobCandidateId: '20202020-2020-2020-2020-202020202020',
    authorId: 'cd99579b-1b80-4802-9651-e881fb707583',
    content: 'Reference checks completed successfully. Extending offer with competitive package.',
    status: 'demo',
    createdAt: '2024-01-23T17:00:00Z'
  }
];

export const PIPELINE_STAGES = [
  { id: 'applied', name: 'Applied', color: 'bg-blue-100 text-blue-800' },
  { id: 'screening', name: 'Screening', color: 'bg-yellow-100 text-yellow-800' },
  { id: 'interview', name: 'Interview', color: 'bg-purple-100 text-purple-800' },
  { id: 'technical', name: 'Technical', color: 'bg-indigo-100 text-indigo-800' },
  { id: 'final', name: 'Final Round', color: 'bg-pink-100 text-pink-800' },
  { id: 'offer', name: 'Offer', color: 'bg-orange-100 text-orange-800' },
  { id: 'hired', name: 'Hired', color: 'bg-green-100 text-green-800' },
  { id: 'rejected', name: 'Rejected', color: 'bg-red-100 text-red-800' }
];

// Helper functions for demo data
export function getDemoClientById(id: string) {
  return demoClients.find(client => client.id === id);
}

export function getDemoCandidateById(id: string) {
  return demoCandidates.find(candidate => candidate.id === id);
}

export function getDemoJobById(id: string) {
  return demoJobs.find(job => job.id === id);
}

export function getDemoJobCandidatesByJobId(jobId: string) {
  return demoJobCandidates.filter(jc => jc.jobId === jobId);
}

export function getDemoJobCandidatesByStage(stage: string) {
  return demoJobCandidates.filter(jc => jc.stage === stage);
}

export function getDemoJobsForClient(clientId: string) {
  return demoJobs.filter(job => job.clientId === clientId);
}

export function getDemoNotesForJobCandidate(jobCandidateId: string) {
  return demoCandidateNotes.filter(note => note.jobCandidateId === jobCandidateId);
}

export function getDemoJobCandidateWithDetails(jobCandidateId: string) {
  const jc = demoJobCandidates.find(jc => jc.id === jobCandidateId);
  if (!jc) return null;
  
  const candidate = getDemoCandidateById(jc.candidateId);
  const job = getDemoJobById(jc.jobId);
  const client = job ? getDemoClientById(job.clientId) : null;
  const notes = getDemoNotesForJobCandidate(jc.id);
  
  return {
    ...jc,
    candidates: candidate,
    jobs: job,
    client: client,
    notes: notes
  };
}

// Pipeline data grouped by stage
export function getDemoPipelineData() {
  const pipelineData = PIPELINE_STAGES.map(stage => ({
    ...stage,
    candidates: getDemoJobCandidatesByStage(stage.id).map(jc => getDemoJobCandidateWithDetails(jc.id)).filter(Boolean)
  }));
  
  return pipelineData;
}

// Client statistics
export function getDemoClientStats() {
  return demoClients.map(client => ({
    ...client,
    _count: {
      jobs: getDemoJobsForClient(client.id).length
    }
  }));
}

// Job statistics
export function getDemoJobStats() {
  return demoJobs.map(job => ({
    ...job,
    client: getDemoClientById(job.clientId),
    _count: {
      candidates: getDemoJobCandidatesByJobId(job.id).length
    }
  }));
}

// Candidate statistics
export function getDemoCandidateStats() {
  return demoCandidates.map(candidate => ({
    ...candidate,
    _count: {
      applications: demoJobCandidates.filter(jc => jc.candidateId === candidate.id).length
    }
  }));
}