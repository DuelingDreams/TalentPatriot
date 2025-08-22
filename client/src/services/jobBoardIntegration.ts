// Job Board Integration Service
// This service handles posting jobs to external job boards like LinkedIn, Indeed, etc.

export interface JobPostingData {
  title: string
  description: string
  location: string
  remoteOption: 'onsite' | 'remote' | 'hybrid'
  salaryRange?: string
  experienceLevel: 'entry' | 'mid' | 'senior' | 'executive'
  jobType: 'full_time' | 'part_time' | 'contract' | 'freelance'
  companyName: string
  applicationUrl?: string
}

export interface JobBoardConfig {
  id: string
  name: string
  apiKey?: string
  enabled: boolean
  settings: Record<string, any>
}

// Job board API adapters
class LinkedInJobsAPI {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async postJob(jobData: JobPostingData): Promise<{ success: boolean; jobId?: string; error?: string }> {
    try {
      // LinkedIn Jobs API integration
      // Requires LinkedIn Talent Solutions API access
      const response = await fetch('https://api.linkedin.com/v2/jobPostings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0'
        },
        body: JSON.stringify({
          title: jobData.title,
          description: jobData.description,
          location: jobData.location,
          employmentType: this.mapJobType(jobData.jobType),
          workplaceType: this.mapRemoteOption(jobData.remoteOption),
          experienceLevel: this.mapExperienceLevel(jobData.experienceLevel),
          // Additional LinkedIn-specific fields
        })
      })

      if (response.ok) {
        const result = await response.json()
        return { success: true, jobId: result.id }
      } else {
        return { success: false, error: `LinkedIn API error: ${response.statusText}` }
      }
    } catch (error) {
      return { success: false, error: `LinkedIn posting failed: ${error}` }
    }
  }

  private mapJobType(jobType: string): string {
    const mapping: Record<string, string> = {
      'full_time': 'FULL_TIME',
      'part_time': 'PART_TIME', 
      'contract': 'CONTRACT',
      'freelance': 'CONTRACTOR'
    }
    return mapping[jobType] || 'FULL_TIME'
  }

  private mapRemoteOption(option: string): string {
    const mapping: Record<string, string> = {
      'onsite': 'ON_SITE',
      'remote': 'REMOTE',
      'hybrid': 'HYBRID'
    }
    return mapping[option] || 'ON_SITE'
  }

  private mapExperienceLevel(level: string): string {
    const mapping: Record<string, string> = {
      'entry': 'ENTRY_LEVEL',
      'mid': 'MID_SENIOR',
      'senior': 'SENIOR',
      'executive': 'EXECUTIVE'
    }
    return mapping[level] || 'MID_SENIOR'
  }
}

class IndeedJobsAPI {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async postJob(jobData: JobPostingData): Promise<{ success: boolean; jobId?: string; error?: string }> {
    try {
      // Indeed Job Posting API integration
      const response = await fetch('https://secure.indeed.com/rpc/jobpost', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: jobData.title,
          description: jobData.description,
          location: jobData.location,
          jobtype: this.mapJobType(jobData.jobType),
          salary: jobData.salaryRange,
          // Additional Indeed-specific fields
        })
      })

      if (response.ok) {
        const result = await response.json()
        return { success: true, jobId: result.jobkey }
      } else {
        return { success: false, error: `Indeed API error: ${response.statusText}` }
      }
    } catch (error) {
      return { success: false, error: `Indeed posting failed: ${error}` }
    }
  }

  private mapJobType(jobType: string): string {
    const mapping: Record<string, string> = {
      'full_time': 'fulltime',
      'part_time': 'parttime',
      'contract': 'contract',
      'freelance': 'temporary'
    }
    return mapping[jobType] || 'fulltime'
  }
}

// Main job board integration service
export class JobBoardIntegrationService {
  private configs: Map<string, JobBoardConfig> = new Map()

  constructor() {
    // Initialize with default configurations
    this.initializeDefaultConfigs()
  }

  private initializeDefaultConfigs() {
    const defaultConfigs: JobBoardConfig[] = [
      {
        id: 'linkedin',
        name: 'LinkedIn',
        enabled: false,
        settings: { autoPost: true, sponsoredPost: false }
      },
      {
        id: 'indeed',
        name: 'Indeed',
        enabled: false,
        settings: { autoPost: true, bidAmount: 0 }
      },
      {
        id: 'monster',
        name: 'Monster',
        enabled: false,
        settings: { autoPost: true, duration: 30 }
      },
      {
        id: 'glassdoor',
        name: 'Glassdoor',
        enabled: false,
        settings: { autoPost: true, enhancedListing: false }
      },
      {
        id: 'ziprecruiter',
        name: 'ZipRecruiter',  
        enabled: false,
        settings: { autoPost: true, premiumPlacement: false }
      },
      {
        id: 'craigslist',
        name: 'Craigslist',
        enabled: false,
        settings: { autoPost: false, category: 'jobs' }
      }
    ]

    defaultConfigs.forEach(config => {
      this.configs.set(config.id, config)
    })
  }

  async postToJobBoards(
    jobData: JobPostingData, 
    targetBoards: string[], 
    autoPost: boolean = false
  ): Promise<Record<string, { success: boolean; jobId?: string; error?: string }>> {
    const results: Record<string, { success: boolean; jobId?: string; error?: string }> = {}

    for (const boardId of targetBoards) {
      const config = this.configs.get(boardId)
      
      if (!config || !config.enabled) {
        results[boardId] = { 
          success: false, 
          error: `${boardId} not configured or disabled` 
        }
        continue
      }

      if (autoPost) {
        // Actual posting logic
        results[boardId] = await this.postToBoard(boardId, jobData, config)
      } else {
        // Queue for manual posting or approval
        results[boardId] = { 
          success: true, 
          jobId: `queued-${Date.now()}`,
          error: 'Queued for manual posting'
        }
      }
    }

    return results
  }

  private async postToBoard(
    boardId: string, 
    jobData: JobPostingData, 
    config: JobBoardConfig
  ): Promise<{ success: boolean; jobId?: string; error?: string }> {
    try {
      switch (boardId) {
        case 'linkedin':
          if (config.apiKey) {
            const linkedInAPI = new LinkedInJobsAPI(config.apiKey)
            return await linkedInAPI.postJob(jobData)
          }
          break
          
        case 'indeed':
          if (config.apiKey) {
            const indeedAPI = new IndeedJobsAPI(config.apiKey)
            return await indeedAPI.postJob(jobData)
          }
          break
          
        case 'monster':
        case 'glassdoor':
        case 'ziprecruiter':
        case 'craigslist':
          // Placeholder for other integrations
          return { 
            success: false, 
            error: `${boardId} integration not yet implemented` 
          }
          
        default:
          return { success: false, error: `Unknown job board: ${boardId}` }
      }
      
      return { success: false, error: 'API key not configured' }
    } catch (error) {
      return { success: false, error: `Failed to post to ${boardId}: ${error}` }
    }
  }

  // Configuration management
  updateJobBoardConfig(boardId: string, config: Partial<JobBoardConfig>) {
    const existing = this.configs.get(boardId)
    if (existing) {
      this.configs.set(boardId, { ...existing, ...config })
    }
  }

  getJobBoardConfig(boardId: string): JobBoardConfig | null {
    return this.configs.get(boardId) || null
  }

  getAllConfigs(): JobBoardConfig[] {
    return Array.from(this.configs.values())
  }

  // Pricing calculator
  calculatePostingCosts(targetBoards: string[]): Record<string, number> {
    const costs: Record<string, number> = {}
    
    const pricingMap: Record<string, number> = {
      linkedin: 495, // Monthly plan
      indeed: 50,    // Per post estimate
      monster: 249,  // Monthly plan
      glassdoor: 599, // Monthly plan  
      ziprecruiter: 249, // Monthly plan
      craigslist: 75 // Per post
    }

    targetBoards.forEach(boardId => {
      costs[boardId] = pricingMap[boardId] || 0
    })

    return costs
  }
}

// Export singleton instance
export const jobBoardService = new JobBoardIntegrationService()