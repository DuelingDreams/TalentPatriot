import { v4 as uuidv4 } from 'uuid';
import {
  demoClients,
  demoJobs,
  demoCandidates,
  demoPipelineColumns,
} from '@/lib/demo-data-consolidated';

const delay = (ms = 250) => new Promise(res => setTimeout(res, ms));

const store = {
  clients: [...demoClients],
  jobs: [...demoJobs],
  candidates: [...demoCandidates],
  pipelineColumns: [...demoPipelineColumns],
};

const kebab = (s: string) =>
  s?.toString().trim().toLowerCase()
   .replace(/[^a-z0-9]+/g, '-')
   .replace(/(^-|-$)+/g, '');

const findJob = (id: string) => store.jobs.find(j => j.id === id);
const ensureDefaultPipeline = (jobId: string, orgId = 'DEMO_ORG_ID') => {
  const has = store.pipelineColumns.some(c => c.job_id === jobId);
  if (has) return;
  const defs = [
    { name: 'Applied', position: 1 },
    { name: 'Screen', position: 2 },
    { name: 'Interview', position: 3 },
    { name: 'Offer', position: 4 },
    { name: 'Hired', position: 5 },
  ];
  defs.forEach(d => {
    store.pipelineColumns.push({
      id: uuidv4(),
      job_id: jobId,
      organization_id: orgId,
      name: d.name,
      position: d.position,
      created_at: new Date().toISOString(),
    } as any);
  });
};

export const demoAdapter = {
  async getJobs() {
    await delay();
    // Newest first
    return [...store.jobs].sort((a,b) => (b.updated_at || b.created_at || '').localeCompare(a.updated_at || a.created_at || ''));
  },

  async getPublicJobs(params?: any) {
    await delay();
    let rows = store.jobs.filter(j => j.status === 'open' && j.published_at);
    // simple client filtering
    if (params?.q) {
      const q = params.q.toLowerCase();
      rows = rows.filter(j => j.title.toLowerCase().includes(q) || (j.location||'').toLowerCase().includes(q));
    }
    return rows;
  },

  async getJobBySlug(slug: string) {
    await delay();
    return store.jobs.find(j => j.slug === slug) || null;
  },

  async createJob(payload: any) {
    await delay();
    const id = uuidv4();
    const title = payload.title || 'Untitled Job';
    const slug = kebab(payload.slug || title);
    const row: any = {
      id,
      organization_id: payload.organization_id || 'DEMO_ORG_ID',
      client_id: payload.client_id || store.clients[0]?.id,
      title,
      description: payload.description || '',
      requirements: payload.requirements || '',
      location: payload.location || 'Remote',
      job_type: payload.job_type || 'Full Time',
      salary_range: payload.salary_range || '$60,000 - $90,000',
      status: 'draft',
      slug,
      published_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    store.jobs.unshift(row);
    return row;
  },

  async updateJob(id: string, patch: any) {
    await delay();
    const row = findJob(id);
    if (!row) throw new Error('Job not found');
    Object.assign(row, patch, { updated_at: new Date().toISOString() });
    return row;
  },

  async publishJob(id: string) {
    await delay();
    const row = findJob(id);
    if (!row) throw new Error('Job not found');
    if (!row.slug) row.slug = kebab(row.title || 'job');
    row.status = 'open';
    row.published_at = row.published_at || new Date().toISOString();
    ensureDefaultPipeline(row.id, row.organization_id);
    return { publicUrl: `/careers/${row.slug}`, job: row };
  },

  async getClients() {
    await delay();
    return [...store.clients];
  },

  async getCandidatesForJob(jobId: string) {
    await delay();
    return store.candidates.filter(c => c.job_id === jobId);
  },

  async moveCandidateStage(candidateId: string, nextStageName: string) {
    await delay();
    const c = store.candidates.find(x => x.id === candidateId);
    if (!c) throw new Error('Candidate not found');
    c.stage = nextStageName;
    return c;
  },

  async applyToJob({ jobId, applicant }: { jobId: string; applicant: any; }) {
    await delay();
    ensureDefaultPipeline(jobId);
    // Deduplicate by email within org
    const email = (applicant.email || '').toLowerCase();
    let c = store.candidates.find(x => x.organization_id === 'DEMO_ORG_ID' && (x.email||'').toLowerCase() === email);
    if (!c) {
      c = {
        id: uuidv4(),
        organization_id: 'DEMO_ORG_ID',
        job_id: jobId,
        name: `${applicant.first_name || ''} ${applicant.last_name || ''}`.trim() || applicant.name || 'Applicant',
        email,
        phone: applicant.phone || '',
        resume_url: applicant.resume_url || '',
        stage: 'Applied',
        applied_at: new Date().toISOString(),
      } as any;
      store.candidates.unshift(c);
    } else {
      c.job_id = jobId;
      c.stage = 'Applied';
      c.applied_at = new Date().toISOString();
    }
    return { candidate_id: c!.id, application_id: uuidv4() };
  },
};