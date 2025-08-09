// client/src/lib/demo-data-consolidated.ts
import { v4 as uuidv4 } from 'uuid';

// ====== Constants ======
export const DEMO_ORG_ID = '550e8400-e29b-41d4-a716-446655440000';

// ====== Helper Functions ======
const now = new Date();
const daysAgo = (n: number) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000).toISOString();
const randomSalary = () => {
  const base = Math.floor(Math.random() * 50_000) + 50_000;
  return `$${base.toLocaleString()} - $${(base + 30_000).toLocaleString()}`;
};
const pick = <T>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

// ====== Clients ======
export const demoClients = [
  { id: uuidv4(), name: 'BrightTech Solutions', industry: 'IT Services', location: 'Austin, TX' },
  { id: uuidv4(), name: 'GreenLeaf Marketing', industry: 'Marketing', location: 'Chicago, IL' },
  { id: uuidv4(), name: 'UrbanWorks Construction', industry: 'Construction', location: 'Denver, CO' },
  { id: uuidv4(), name: 'Summit Financial Group', industry: 'Finance', location: 'New York, NY' },
  { id: uuidv4(), name: 'BlueWave Healthcare', industry: 'Healthcare', location: 'San Diego, CA' },
];

// ====== Jobs ======
export const demoJobs = [
  {
    id: uuidv4(),
    organization_id: DEMO_ORG_ID,
    client_id: demoClients[0].id,
    title: 'Frontend Developer',
    description: 'Build and maintain responsive web applications for SMB clients.',
    requirements: '3+ years React experience, Tailwind CSS, API integration.',
    location: 'Austin, TX',
    job_type: 'Full Time',
    salary_range: randomSalary(),
    status: 'open',
    slug: 'frontend-developer',
    published_at: daysAgo(15),
    created_at: daysAgo(20),
    updated_at: daysAgo(15),
  },
  {
    id: uuidv4(),
    organization_id: DEMO_ORG_ID,
    client_id: demoClients[0].id,
    title: 'IT Support Specialist',
    description: 'Provide Tier 1-2 support for SMB clients.',
    requirements: 'Troubleshooting, Windows/Mac OS, Networking basics.',
    location: 'Remote',
    job_type: 'Contract',
    salary_range: randomSalary(),
    status: 'open',
    slug: 'it-support-specialist',
    published_at: daysAgo(10),
    created_at: daysAgo(12),
    updated_at: daysAgo(10),
  },
  {
    id: uuidv4(),
    organization_id: DEMO_ORG_ID,
    client_id: demoClients[1].id,
    title: 'Digital Marketing Manager',
    description: 'Lead campaigns for B2B and B2C SMB clients.',
    requirements: 'SEO, SEM, Analytics, Content Strategy.',
    location: 'Chicago, IL',
    job_type: 'Full Time',
    salary_range: randomSalary(),
    status: 'open',
    slug: 'digital-marketing-manager',
    published_at: daysAgo(18),
    created_at: daysAgo(20),
    updated_at: daysAgo(18),
  },
  {
    id: uuidv4(),
    organization_id: DEMO_ORG_ID,
    client_id: demoClients[1].id,
    title: 'Content Writer',
    description: 'Create engaging content for client blogs and campaigns.',
    requirements: 'Strong writing skills, SEO knowledge.',
    location: 'Remote',
    job_type: 'Part Time',
    salary_range: randomSalary(),
    status: 'open',
    slug: 'content-writer',
    published_at: daysAgo(5),
    created_at: daysAgo(7),
    updated_at: daysAgo(5),
  },
  {
    id: uuidv4(),
    organization_id: DEMO_ORG_ID,
    client_id: demoClients[2].id,
    title: 'Project Manager - Construction',
    description: 'Manage commercial construction projects for SMB clients.',
    requirements: 'PMP certification preferred, 5+ years experience.',
    location: 'Denver, CO',
    job_type: 'Full Time',
    salary_range: randomSalary(),
    status: 'open',
    slug: 'project-manager-construction',
    published_at: daysAgo(25),
    created_at: daysAgo(27),
    updated_at: daysAgo(25),
  },
  {
    id: uuidv4(),
    organization_id: DEMO_ORG_ID,
    client_id: demoClients[2].id,
    title: 'Skilled Carpenter',
    description: 'Perform finish carpentry and custom builds.',
    requirements: '3+ years carpentry experience, attention to detail.',
    location: 'Denver, CO',
    job_type: 'Contract',
    salary_range: randomSalary(),
    status: 'open',
    slug: 'skilled-carpenter',
    published_at: daysAgo(8),
    created_at: daysAgo(10),
    updated_at: daysAgo(8),
  },
  {
    id: uuidv4(),
    organization_id: DEMO_ORG_ID,
    client_id: demoClients[3].id,
    title: 'Financial Analyst',
    description: 'Analyze financial data for SMB investment portfolios.',
    requirements: '2+ years in finance, Excel, BI tools.',
    location: 'New York, NY',
    job_type: 'Full Time',
    salary_range: randomSalary(),
    status: 'open',
    slug: 'financial-analyst',
    published_at: daysAgo(30),
    created_at: daysAgo(35),
    updated_at: daysAgo(30),
  },
  {
    id: uuidv4(),
    organization_id: DEMO_ORG_ID,
    client_id: demoClients[3].id,
    title: 'Accountant',
    description: 'Manage accounts payable/receivable for SMB clients.',
    requirements: 'QuickBooks, Payroll, Tax filing.',
    location: 'Remote',
    job_type: 'Full Time',
    salary_range: randomSalary(),
    status: 'open',
    slug: 'accountant',
    published_at: daysAgo(3),
    created_at: daysAgo(5),
    updated_at: daysAgo(3),
  },
  {
    id: uuidv4(),
    organization_id: DEMO_ORG_ID,
    client_id: demoClients[4].id,
    title: 'Registered Nurse',
    description: 'Provide patient care for a small healthcare practice.',
    requirements: 'RN license, 2+ years experience.',
    location: 'San Diego, CA',
    job_type: 'Full Time',
    salary_range: randomSalary(),
    status: 'open',
    slug: 'registered-nurse',
    published_at: daysAgo(14),
    created_at: daysAgo(16),
    updated_at: daysAgo(14),
  },
  {
    id: uuidv4(),
    organization_id: DEMO_ORG_ID,
    client_id: demoClients[4].id,
    title: 'Medical Assistant',
    description: 'Assist physicians and nurses in patient care.',
    requirements: 'Certification preferred, good communication skills.',
    location: 'San Diego, CA',
    job_type: 'Full Time',
    salary_range: randomSalary(),
    status: 'open',
    slug: 'medical-assistant',
    published_at: daysAgo(6),
    created_at: daysAgo(8),
    updated_at: daysAgo(6),
  },
  {
    id: uuidv4(),
    organization_id: DEMO_ORG_ID,
    client_id: demoClients[0].id,
    title: 'DevOps Engineer',
    description: 'Automate and maintain cloud infrastructure.',
    requirements: 'AWS, CI/CD pipelines, Docker/K8s.',
    location: 'Remote',
    job_type: 'Full Time',
    salary_range: randomSalary(),
    status: 'open',
    slug: 'devops-engineer',
    published_at: daysAgo(11),
    created_at: daysAgo(13),
    updated_at: daysAgo(11),
  },
  {
    id: uuidv4(),
    organization_id: DEMO_ORG_ID,
    client_id: demoClients[1].id,
    title: 'Graphic Designer',
    description: 'Design brand materials and marketing assets.',
    requirements: 'Adobe Creative Suite, branding experience.',
    location: 'Chicago, IL',
    job_type: 'Contract',
    salary_range: randomSalary(),
    status: 'open',
    slug: 'graphic-designer',
    published_at: daysAgo(9),
    created_at: daysAgo(11),
    updated_at: daysAgo(9),
  },
];

// ====== Pipeline Columns ======
export const demoPipelineColumns = [
  { id: uuidv4(), job_id: null, organization_id: DEMO_ORG_ID, name: 'Applied', position: 1 },
  { id: uuidv4(), job_id: null, organization_id: DEMO_ORG_ID, name: 'Screen', position: 2 },
  { id: uuidv4(), job_id: null, organization_id: DEMO_ORG_ID, name: 'Interview', position: 3 },
  { id: uuidv4(), job_id: null, organization_id: DEMO_ORG_ID, name: 'Offer', position: 4 },
  { id: uuidv4(), job_id: null, organization_id: DEMO_ORG_ID, name: 'Hired', position: 5 },
];

// ====== Candidates ======
const firstNames = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Drew', 'Quinn', 'Riley', 'Jamie', 'Avery'];
const lastNames = ['Smith', 'Johnson', 'Lee', 'Brown', 'Garcia', 'Martinez', 'Davis', 'Miller', 'Wilson', 'Anderson'];
const stages = ['Applied', 'Screen', 'Interview', 'Offer', 'Hired'];

export const demoCandidates = Array.from({ length: 40 }).map((_, i) => {
  const fn = pick(firstNames);
  const ln = pick(lastNames);
  const job = pick(demoJobs);
  return {
    id: uuidv4(),
    orgId: DEMO_ORG_ID,
    name: `${fn} ${ln}`,
    email: `${fn.toLowerCase()}.${ln.toLowerCase()}@example.com`,
    phone: `555-01${(i % 10).toString().padStart(2, '0')}`,
    resumeUrl: 'https://example.com/resume.pdf',
    status: 'demo' as const,
    createdAt: daysAgo(Math.floor(Math.random() * 60)),
    updatedAt: daysAgo(Math.floor(Math.random() * 60)),
    createdBy: null,
  };
});
