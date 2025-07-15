import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function populateDemoData() {
  console.log('🚀 Populating demo data...')
  
  // Create demo clients data based on what works
  const demoClients = [
    {
      id: '11111111-1111-1111-1111-111111111111',
      name: 'TechCorp Solutions',
      industry: 'Technology',
      website: 'https://techcorp.demo',
      notes: 'Leading tech company specializing in AI solutions',
      status: 'demo'
    },
    {
      id: '22222222-2222-2222-2222-222222222222',
      name: 'InnovateCo',
      industry: 'Software Development',
      website: 'https://innovate.demo',
      notes: 'Fast-growing startup focused on mobile applications',
      status: 'demo'
    },
    {
      id: '33333333-3333-3333-3333-333333333333',
      name: 'DataDyne Corp',
      industry: 'Data Analytics',
      website: 'https://datadyne.demo',
      notes: 'Enterprise data analytics and visualization company',
      status: 'demo'
    }
  ]
  
  const demoCandidates = [
    {
      id: '44444444-4444-4444-4444-444444444444',
      name: 'Alex Rodriguez',
      email: 'alex.demo@example.com',
      phone: '+1 (555) 111-2222',
      status: 'demo'
    },
    {
      id: '55555555-5555-5555-5555-555555555555',
      name: 'Sarah Chen',
      email: 'sarah.demo@example.com',
      phone: '+1 (555) 222-3333',
      status: 'demo'
    },
    {
      id: '66666666-6666-6666-6666-666666666666',
      name: 'Michael Park',
      email: 'michael.demo@example.com',
      phone: '+1 (555) 333-4444',
      status: 'demo'
    },
    {
      id: '77777777-7777-7777-7777-777777777777',
      name: 'Emma Wilson',
      email: 'emma.demo@example.com',
      phone: '+1 (555) 444-5555',
      status: 'demo'
    },
    {
      id: '88888888-8888-8888-8888-888888888888',
      name: 'David Kim',
      email: 'david.demo@example.com',
      phone: '+1 (555) 555-6666',
      status: 'demo'
    }
  ]
  
  const demoJobs = [
    {
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      title: 'Senior React Developer',
      description: 'We are looking for an experienced React developer to join our frontend team.',
      clientId: '11111111-1111-1111-1111-111111111111',
      status: 'open',
      recordStatus: 'demo'
    },
    {
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      title: 'DevOps Engineer',
      description: 'Seeking a skilled DevOps engineer to manage our cloud infrastructure.',
      clientId: '22222222-2222-2222-2222-222222222222',
      status: 'open',
      recordStatus: 'demo'
    },
    {
      id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      title: 'Data Scientist',
      description: 'Join our data science team to build machine learning models.',
      clientId: '33333333-3333-3333-3333-333333333333',
      status: 'open',
      recordStatus: 'demo'
    },
    {
      id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
      title: 'Product Manager',
      description: 'Lead product development for our mobile app.',
      clientId: '22222222-2222-2222-2222-222222222222',
      status: 'filled',
      recordStatus: 'demo'
    }
  ]
  
  const demoJobCandidates = [
    {
      id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
      jobId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      candidateId: '44444444-4444-4444-4444-444444444444',
      stage: 'applied',
      notes: 'Strong React portfolio, good communication skills',
      assignedTo: 'cd99579b-1b80-4802-9651-e881fb707583',
      status: 'demo'
    },
    {
      id: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
      jobId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      candidateId: '55555555-5555-5555-5555-555555555555',
      stage: 'interview',
      notes: 'Impressive technical background, scheduled for final interview',
      assignedTo: 'cd99579b-1b80-4802-9651-e881fb707583',
      status: 'demo'
    },
    {
      id: '10101010-1010-1010-1010-101010101010',
      jobId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      candidateId: '66666666-6666-6666-6666-666666666666',
      stage: 'technical',
      notes: 'Excellent AWS knowledge, completing technical assessment',
      assignedTo: 'cd99579b-1b80-4802-9651-e881fb707583',
      status: 'demo'
    },
    {
      id: '20202020-2020-2020-2020-202020202020',
      jobId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      candidateId: '77777777-7777-7777-7777-777777777777',
      stage: 'offer',
      notes: 'Strong candidate, offer extended',
      assignedTo: 'cd99579b-1b80-4802-9651-e881fb707583',
      status: 'demo'
    },
    {
      id: '30303030-3030-3030-3030-303030303030',
      jobId: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      candidateId: '88888888-8888-8888-8888-888888888888',
      stage: 'screening',
      notes: 'PhD in ML, reviewing research publications',
      assignedTo: 'cd99579b-1b80-4802-9651-e881fb707583',
      status: 'demo'
    },
    {
      id: '40404040-4040-4040-4040-404040404040',
      jobId: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
      candidateId: '44444444-4444-4444-4444-444444444444',
      stage: 'hired',
      notes: 'Excellent product sense, started last week',
      assignedTo: 'cd99579b-1b80-4802-9651-e881fb707583',
      status: 'demo'
    }
  ]
  
  // Now create components for the frontend to use this data
  const demoDataContent = `
// Demo data for frontend use
export const demoClients = ${JSON.stringify(demoClients, null, 2)};

export const demoCandidates = ${JSON.stringify(demoCandidates, null, 2)};

export const demoJobs = ${JSON.stringify(demoJobs, null, 2)};

export const demoJobCandidates = ${JSON.stringify(demoJobCandidates, null, 2)};

export const demoCandidateNotes = [
  {
    id: '50505050-5050-5050-5050-505050505050',
    jobCandidateId: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    authorId: 'cd99579b-1b80-4802-9651-e881fb707583',
    content: 'Initial screening call went well. Candidate has strong React experience and good problem-solving skills.',
    status: 'demo',
    createdAt: '2024-01-15T10:00:00Z'
  },
  {
    id: '60606060-6060-6060-6060-606060606060',
    jobCandidateId: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
    authorId: 'cd99579b-1b80-4802-9651-e881fb707583',
    content: 'Technical interview completed successfully. Moving to final round with team lead.',
    status: 'demo',
    createdAt: '2024-01-16T14:30:00Z'
  },
  {
    id: '70707070-7070-7070-7070-707070707070',
    jobCandidateId: '10101010-1010-1010-1010-101010101010',
    authorId: 'cd99579b-1b80-4802-9651-e881fb707583',
    content: 'Candidate demonstrated excellent knowledge of containerization and CI/CD pipelines.',
    status: 'demo',
    createdAt: '2024-01-17T09:15:00Z'
  },
  {
    id: '80808080-8080-8080-8080-808080808080',
    jobCandidateId: '20202020-2020-2020-2020-202020202020',
    authorId: 'cd99579b-1b80-4802-9651-e881fb707583',
    content: 'Reference checks completed successfully. Extending offer with competitive package.',
    status: 'demo',
    createdAt: '2024-01-18T16:45:00Z'
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
`
  
  // Write the demo data file
  const fs = require('fs')
  fs.writeFileSync('client/src/lib/demo-data.ts', demoDataContent)
  
  console.log('✅ Demo data file created at client/src/lib/demo-data.ts')
  console.log('✅ Demo data includes:')
  console.log(`   - ${demoClients.length} clients`)
  console.log(`   - ${demoCandidates.length} candidates`)
  console.log(`   - ${demoJobs.length} jobs`)
  console.log(`   - ${demoJobCandidates.length} job-candidate relationships`)
  console.log(`   - 4 candidate notes`)
  console.log('✅ Helper functions and pipeline data included')
  
  console.log('\n🎉 Demo data setup complete!')
}

populateDemoData().catch(console.error)