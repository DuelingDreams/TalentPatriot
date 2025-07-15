// Demo data seed script for ATS
// Run this to populate the application with sample data

const API_BASE = 'http://localhost:5000/api';

interface Client {
  name: string;
  industry?: string;
  location?: string;
  website?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  notes?: string;
}

interface Job {
  title: string;
  description?: string;
  clientId: string;
  status: 'open' | 'closed' | 'on_hold' | 'filled';
}

interface Candidate {
  name: string;
  email: string;
  phone?: string;
  resumeUrl?: string;
}

const sampleClients: Client[] = [
  {
    name: 'TechCorp Solutions',
    industry: 'Technology',
    location: 'San Francisco, CA',
    website: 'https://techcorp.com',
    contactName: 'Sarah Johnson',
    contactEmail: 'sarah.johnson@techcorp.com',
    contactPhone: '+1 (555) 123-4567',
    notes: 'Long-term partner specializing in AI and machine learning solutions. Prefers senior-level candidates with 5+ years experience.'
  },
  {
    name: 'Global Finance Inc',
    industry: 'Finance',
    location: 'New York, NY',
    website: 'https://globalfinance.com',
    contactName: 'Michael Chen',
    contactEmail: 'michael.chen@globalfinance.com',
    contactPhone: '+1 (555) 987-6543',
    notes: 'Investment banking firm looking for quantitative analysts and portfolio managers. High-volume recruiting needs.'
  },
  {
    name: 'Healthcare Innovations',
    industry: 'Healthcare',
    location: 'Boston, MA',
    website: 'https://healthinnovations.com',
    contactName: 'Dr. Emma Rodriguez',
    contactEmail: 'emma.rodriguez@healthinnovations.com',
    contactPhone: '+1 (555) 456-7890',
    notes: 'Biotech startup focused on personalized medicine. Looking for research scientists and clinical specialists.'
  },
  {
    name: 'RetailMax Corporation',
    industry: 'Retail',
    location: 'Seattle, WA',
    website: 'https://retailmax.com',
    contactName: 'David Park',
    contactEmail: 'david.park@retailmax.com',
    contactPhone: '+1 (555) 234-5678',
    notes: 'E-commerce platform expanding rapidly. Needs software engineers and product managers.'
  },
  {
    name: 'Green Energy Solutions',
    industry: 'Energy',
    location: 'Austin, TX',
    website: 'https://greenenergy.com',
    contactName: 'Lisa Thompson',
    contactEmail: 'lisa.thompson@greenenergy.com',
    contactPhone: '+1 (555) 345-6789',
    notes: 'Renewable energy company focused on solar and wind projects. Seeks environmental engineers and project managers.'
  },
  {
    name: 'MediaStream Studios',
    industry: 'Media & Entertainment',
    location: 'Los Angeles, CA',
    contactName: 'Alex Martinez',
    contactEmail: 'alex.martinez@mediastream.com',
    contactPhone: '+1 (555) 567-8901',
    notes: 'Content creation studio specializing in streaming platforms. Looking for creative directors and video editors.'
  },
  {
    name: 'EduTech Learning',
    industry: 'Education',
    location: 'Chicago, IL',
    website: 'https://edutech.com',
    contactName: 'Jennifer Lee',
    contactEmail: 'jennifer.lee@edutech.com',
    notes: 'Online learning platform for K-12 education. Needs curriculum designers and educational content creators.'
  },
  {
    name: 'CloudNine Infrastructure',
    industry: 'Technology',
    location: 'Denver, CO',
    website: 'https://cloudnine.com',
    contactName: 'Robert Kim',
    contactEmail: 'robert.kim@cloudnine.com',
    contactPhone: '+1 (555) 678-9012',
    notes: 'Cloud infrastructure provider. Focuses on DevOps engineers and cloud architects.'
  }
];

const sampleJobs: Omit<Job, 'clientId'>[] = [
  {
    title: 'Senior Software Engineer',
    description: 'Lead development of AI-powered applications using Python and machine learning frameworks.',
    status: 'open'
  },
  {
    title: 'Product Manager',
    description: 'Drive product strategy and roadmap for our core platform.',
    status: 'open'
  },
  {
    title: 'Data Scientist',
    description: 'Analyze large datasets to derive insights and build predictive models.',
    status: 'open'
  },
  {
    title: 'UX Designer',
    description: 'Create intuitive user experiences for our mobile and web applications.',
    status: 'open'
  },
  {
    title: 'DevOps Engineer',
    description: 'Manage cloud infrastructure and deployment pipelines.',
    status: 'open'
  }
];

const sampleCandidates: Candidate[] = [
  {
    name: 'John Smith',
    email: 'john.smith@email.com',
    phone: '+1 (555) 111-2222'
  },
  {
    name: 'Maria Garcia',
    email: 'maria.garcia@email.com',
    phone: '+1 (555) 333-4444'
  },
  {
    name: 'Ahmed Hassan',
    email: 'ahmed.hassan@email.com',
    phone: '+1 (555) 555-6666'
  },
  {
    name: 'Emily Watson',
    email: 'emily.watson@email.com',
    phone: '+1 (555) 777-8888'
  },
  {
    name: 'Carlos Rodriguez',
    email: 'carlos.rodriguez@email.com',
    phone: '+1 (555) 999-0000'
  },
  {
    name: 'Anna Chen',
    email: 'anna.chen@email.com',
    phone: '+1 (555) 222-3333'
  }
];

async function seedClients() {
  console.log('Seeding clients...');
  const createdClients = [];
  
  for (const client of sampleClients) {
    try {
      const response = await fetch(`${API_BASE}/clients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(client),
      });
      
      if (response.ok) {
        const createdClient = await response.json();
        createdClients.push(createdClient);
        console.log(`✓ Created client: ${client.name}`);
      } else {
        console.error(`✗ Failed to create client: ${client.name}`);
      }
    } catch (error) {
      console.error(`✗ Error creating client ${client.name}:`, error);
    }
  }
  
  return createdClients;
}

async function seedJobs(clients: any[]) {
  console.log('Seeding jobs...');
  const createdJobs = [];
  
  for (let i = 0; i < sampleJobs.length; i++) {
    const job = sampleJobs[i];
    const client = clients[i % clients.length]; // Distribute jobs across clients
    
    try {
      const response = await fetch(`${API_BASE}/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...job,
          clientId: client.id,
        }),
      });
      
      if (response.ok) {
        const createdJob = await response.json();
        createdJobs.push(createdJob);
        console.log(`✓ Created job: ${job.title} for ${client.name}`);
      } else {
        console.error(`✗ Failed to create job: ${job.title}`);
      }
    } catch (error) {
      console.error(`✗ Error creating job ${job.title}:`, error);
    }
  }
  
  return createdJobs;
}

async function seedCandidates() {
  console.log('Seeding candidates...');
  const createdCandidates = [];
  
  for (const candidate of sampleCandidates) {
    try {
      const response = await fetch(`${API_BASE}/candidates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(candidate),
      });
      
      if (response.ok) {
        const createdCandidate = await response.json();
        createdCandidates.push(createdCandidate);
        console.log(`✓ Created candidate: ${candidate.name}`);
      } else {
        console.error(`✗ Failed to create candidate: ${candidate.name}`);
      }
    } catch (error) {
      console.error(`✗ Error creating candidate ${candidate.name}:`, error);
    }
  }
  
  return createdCandidates;
}

async function main() {
  console.log('🌱 Starting demo data seeding...\n');
  
  try {
    const clients = await seedClients();
    console.log(`\n📊 Created ${clients.length} clients\n`);
    
    const jobs = await seedJobs(clients);
    console.log(`\n💼 Created ${jobs.length} jobs\n`);
    
    const candidates = await seedCandidates();
    console.log(`\n👥 Created ${candidates.length} candidates\n`);
    
    console.log('🎉 Demo data seeding completed successfully!');
    console.log('\nYou can now:');
    console.log('- View clients at /clients');
    console.log('- View jobs at /jobs');
    console.log('- View candidates at /candidates');
    console.log('- Explore the job pipeline at /jobs/{job-id}');
    
  } catch (error) {
    console.error('❌ Error during seeding:', error);
  }
}

// Run the seeding script
main().catch(console.error);

export { sampleClients, sampleJobs, sampleCandidates };