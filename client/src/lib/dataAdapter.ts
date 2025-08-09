import { 
  DEMO_ORG_ID, 
  demoClients, 
  demoJobs, 
  demoCandidates 
} from './demo-data-consolidated'
import { apiRequest } from './queryClient'

// Demo storage - in-memory state for demo mode
class DemoStore {
  jobs: any[] = []
  clients: any[] = []
  candidates: any[] = []
  jobCandidates: any[] = []
  pipelineColumns: any[] = []
  applications: any[] = []

  constructor() {
    this.initialize()
  }

  initialize() {
    // Initialize with consolidated demo data
    this.clients = [...demoClients]
    this.jobs = [...demoJobs]
    this.candidates = [...demoCandidates]
    
    // Initialize job candidates for demo jobs
    this.jobCandidates = [
      {
        id: 'demo-job-candidate-1',
        jobId: 'demo-job-1',
        candidateId: 'demo-candidate-1',
        stage: 'applied',
        notes: 'Strong technical background in React and Node.js',
        appliedAt: new Date('2024-07-05').toISOString(),
        createdAt: new Date('2024-07-05').toISOString(),
        updatedAt: new Date('2024-07-05').toISOString(),
        orgId: DEMO_ORG_ID,
        candidate: {
          id: 'demo-candidate-1',
          firstName: 'Emily',
          lastName: 'Rodriguez',
          email: 'emily.rodriguez@email.com',
          phone: '+1-555-0789',
          skills: ['React', 'TypeScript', 'Node.js', 'Python']
        }
      },
      {
        id: 'demo-job-candidate-2',
        jobId: 'demo-job-2',
        candidateId: 'demo-candidate-2',
        stage: 'interview',
        notes: 'Great product management experience at previous startups',
        appliedAt: new Date('2024-07-12').toISOString(),
        createdAt: new Date('2024-07-12').toISOString(),
        updatedAt: new Date('2024-07-12').toISOString(),
        orgId: DEMO_ORG_ID,
        candidate: {
          id: 'demo-candidate-2',
          firstName: 'James',
          lastName: 'Wilson',
          email: 'james.wilson@email.com',
          phone: '+1-555-0321',
          skills: ['Product Management', 'Agile', 'Data Analysis']
        }
      }
    ]

    // Initialize pipeline columns for demo jobs
    this.ensureDefaultPipelineForJob('demo-job-1')
    this.ensureDefaultPipelineForJob('demo-job-2')
  }

  ensureDefaultPipelineForJob(jobId: string) {
    const existingColumns = this.pipelineColumns.filter(col => col.jobId === jobId)
    if (existingColumns.length === 0) {
      const defaultStages = ['Applied', 'Screen', 'Interview', 'Offer', 'Hired']
      defaultStages.forEach((title, index) => {
        this.pipelineColumns.push({
          id: `demo-pipeline-${jobId}-${index + 1}`,
          jobId,
          title,
          position: index + 1,
          orgId: DEMO_ORG_ID,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
      })
    }
  }

  generateUniqueSlug(title: string): string {
    const baseSlug = title.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
    
    const existingSlugs = this.jobs.map(job => job.publicSlug).filter(Boolean)
    let slug = `${baseSlug}-demo`
    let counter = 1
    
    while (existingSlugs.includes(slug)) {
      slug = `${baseSlug}-demo-${counter}`
      counter++
    }
    
    return slug
  }
}

const demoStore = new DemoStore()

// Helper to check if user is in demo mode
export const isDemo = (userRole?: string): boolean => {
  if (userRole === 'demo_viewer') return true
  
  // Check URL parameter
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('demo') === 'true') return true
    
    // Check localStorage
    if (localStorage.getItem('tp_demo') === 'true') return true
  }
  
  return false
}

// Network delay simulation for demo
const delay = (ms: number = 250) => new Promise(resolve => setTimeout(resolve, ms))

// Data adapter interface
export const dataAdapter = {
  // Jobs
  async getJobs(userRole?: string): Promise<any[]> {
    if (isDemo(userRole)) {
      await delay()
      return [...demoStore.jobs]
    }
    return apiRequest('/api/jobs')
  },

  async createJob(jobData: any, userRole?: string): Promise<any> {
    if (isDemo(userRole)) {
      await delay()
      const newJob = {
        ...jobData,
        id: `demo-job-${Date.now()}`,
        orgId: DEMO_ORG_ID,
        status: 'draft',
        recordStatus: 'demo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'demo-user'
      }
      demoStore.jobs.push(newJob)
      return newJob
    }
    return apiRequest('/api/jobs', {
      method: 'POST',
      body: JSON.stringify(jobData)
    })
  },

  async updateJob(jobId: string, updates: any, userRole?: string): Promise<any> {
    if (isDemo(userRole)) {
      await delay()
      const jobIndex = demoStore.jobs.findIndex(job => job.id === jobId)
      if (jobIndex >= 0) {
        demoStore.jobs[jobIndex] = {
          ...demoStore.jobs[jobIndex],
          ...updates,
          updatedAt: new Date().toISOString()
        }
        return demoStore.jobs[jobIndex]
      }
      throw new Error('Job not found')
    }
    return apiRequest(`/api/jobs/${jobId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    })
  },

  async publishJob(jobId: string, userRole?: string): Promise<any> {
    if (isDemo(userRole)) {
      await delay()
      const jobIndex = demoStore.jobs.findIndex(job => job.id === jobId)
      if (jobIndex >= 0) {
        const job = demoStore.jobs[jobIndex]
        if (!job.publicSlug) {
          job.publicSlug = demoStore.generateUniqueSlug(job.title)
        }
        job.status = 'open'
        job.publishedAt = new Date().toISOString()
        job.updatedAt = new Date().toISOString()
        
        // Ensure pipeline columns exist
        demoStore.ensureDefaultPipelineForJob(jobId)
        
        return job
      }
      throw new Error('Job not found')
    }
    return apiRequest(`/api/jobs/${jobId}/publish`, { method: 'POST' })
  },

  // Public Jobs
  async getPublicJobs(userRole?: string): Promise<any[]> {
    if (isDemo(userRole)) {
      await delay()
      return demoStore.jobs.filter(job => job.status === 'open')
    }
    return apiRequest('/api/public/jobs')
  },

  async getJobBySlug(slug: string, userRole?: string): Promise<any> {
    if (isDemo(userRole)) {
      await delay()
      const job = demoStore.jobs.find(job => job.publicSlug === slug)
      if (!job) throw new Error('Job not found')
      return job
    }
    return apiRequest(`/api/public/jobs/${slug}`)
  },

  // Clients
  async getClients(userRole?: string): Promise<any[]> {
    if (isDemo(userRole)) {
      await delay()
      return [...demoStore.clients]
    }
    return apiRequest('/api/clients')
  },

  // Candidates and Applications
  async getCandidatesForJob(jobId: string, userRole?: string): Promise<any[]> {
    if (isDemo(userRole)) {
      await delay()
      return demoStore.jobCandidates.filter(jc => jc.jobId === jobId)
    }
    return apiRequest(`/api/jobs/${jobId}/candidates`)
  },

  async getJobCandidates(userRole?: string): Promise<any[]> {
    if (isDemo(userRole)) {
      await delay()
      return [...demoStore.jobCandidates]
    }
    return apiRequest('/api/job-candidates')
  },

  async applyToJob(jobId: string, applicationData: any, userRole?: string): Promise<any> {
    if (isDemo(userRole)) {
      await delay()
      
      // Find or create candidate
      let candidate = demoStore.candidates.find(c => c.email === applicationData.email)
      if (!candidate) {
        candidate = {
          id: `demo-candidate-${Date.now()}`,
          firstName: applicationData.firstName,
          lastName: applicationData.lastName,
          name: `${applicationData.firstName} ${applicationData.lastName}`,
          email: applicationData.email,
          phone: applicationData.phone || '',
          resumeUrl: applicationData.resumeUrl || null,
          status: 'demo',
          orgId: DEMO_ORG_ID,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'demo-applicant'
        }
        demoStore.candidates.push(candidate)
      }

      // Create job-candidate relationship
      const jobCandidate = {
        id: `demo-job-candidate-${Date.now()}`,
        jobId,
        candidateId: candidate.id,
        stage: 'applied',
        notes: applicationData.coverLetter || '',
        appliedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        orgId: DEMO_ORG_ID,
        candidate: {
          id: candidate.id,
          firstName: candidate.firstName,
          lastName: candidate.lastName,
          email: candidate.email,
          phone: candidate.phone,
          skills: []
        }
      }
      demoStore.jobCandidates.push(jobCandidate)

      return {
        candidate_id: candidate.id,
        application_id: jobCandidate.id,
        success: true
      }
    }
    
    return apiRequest(`/api/jobs/${jobId}/apply`, {
      method: 'POST',
      body: JSON.stringify(applicationData)
    })
  },

  async moveCandidateStage(jobCandidateId: string, newStage: string, userRole?: string): Promise<any> {
    if (isDemo(userRole)) {
      await delay()
      const candidateIndex = demoStore.jobCandidates.findIndex(jc => jc.id === jobCandidateId)
      if (candidateIndex >= 0) {
        demoStore.jobCandidates[candidateIndex].stage = newStage
        demoStore.jobCandidates[candidateIndex].updatedAt = new Date().toISOString()
        return demoStore.jobCandidates[candidateIndex]
      }
      throw new Error('Job candidate not found')
    }
    
    return apiRequest(`/api/job-candidates/${jobCandidateId}`, {
      method: 'PUT',
      body: JSON.stringify({ stage: newStage })
    })
  },

  // Pipeline
  async getPipelineForJob(jobId: string, userRole?: string): Promise<any> {
    if (isDemo(userRole)) {
      await delay()
      const columns = demoStore.pipelineColumns.filter(col => col.jobId === jobId)
      const candidates = demoStore.jobCandidates.filter(jc => jc.jobId === jobId)
      
      return {
        columns: columns.sort((a, b) => a.position - b.position),
        candidates
      }
    }
    
    return apiRequest(`/api/jobs/${jobId}/pipeline`)
  }
}