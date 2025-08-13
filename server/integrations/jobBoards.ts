/**
 * Job Board Integration Adapters
 * Stubbed implementations for posting jobs to external job boards
 */

interface Job {
  id: string
  title: string
  description: string | null
  location: string | null
  slug: string | null
}

interface Organization {
  id: string
  name: string | null
  slug: string | null
}

interface PostJobParams {
  job: Job
  org: Organization
  targets: string[]
}

// Indeed Adapter
class IndeedAdapter {
  static async postJob(job: Job, org: Organization): Promise<void> {
    console.log('🟡 [INDEED] Posting job to Indeed:', {
      jobTitle: job.title,
      organization: org.name,
      location: job.location,
      jobId: job.id
    })

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    console.log('✅ [INDEED] Job posted successfully:', {
      externalId: `indeed_${job.id}_${Date.now()}`,
      publicUrl: `https://indeed.com/jobs/${job.slug}`,
      cost: '$0.50/click'
    })
  }
}

// LinkedIn Adapter
class LinkedInAdapter {
  static async postJob(job: Job, org: Organization): Promise<void> {
    console.log('🟡 [LINKEDIN] Posting job to LinkedIn:', {
      jobTitle: job.title,
      organization: org.name,
      location: job.location,
      jobId: job.id
    })

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 800))
    
    console.log('✅ [LINKEDIN] Job posted successfully:', {
      externalId: `linkedin_${job.id}_${Date.now()}`,
      publicUrl: `https://linkedin.com/jobs/view/${job.slug}`,
      cost: '$495/month (included in plan)'
    })
  }
}

// ZipRecruiter Adapter
class ZipRecruiterAdapter {
  static async postJob(job: Job, org: Organization): Promise<void> {
    console.log('🟡 [ZIPRECRUITER] Posting job to ZipRecruiter:', {
      jobTitle: job.title,
      organization: org.name,
      location: job.location,
      jobId: job.id
    })

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1200))
    
    console.log('✅ [ZIPRECRUITER] Job posted successfully:', {
      externalId: `zip_${job.id}_${Date.now()}`,
      publicUrl: `https://ziprecruiter.com/jobs/${job.slug}`,
      cost: '$249/month plan'
    })
  }
}

// Greenhouse Adapter
class GreenhouseAdapter {
  static async postJob(job: Job, org: Organization): Promise<void> {
    console.log('🟡 [GREENHOUSE] Posting job to Greenhouse:', {
      jobTitle: job.title,
      organization: org.name,
      location: job.location,
      jobId: job.id
    })

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 600))
    
    console.log('✅ [GREENHOUSE] Job posted successfully:', {
      externalId: `gh_${job.id}_${Date.now()}`,
      publicUrl: `https://boards.greenhouse.io/${org.slug}/${job.slug}`,
      cost: 'Included in ATS plan'
    })
  }
}

// Lever Adapter
class LeverAdapter {
  static async postJob(job: Job, org: Organization): Promise<void> {
    console.log('🟡 [LEVER] Posting job to Lever:', {
      jobTitle: job.title,
      organization: org.name,
      location: job.location,
      jobId: job.id
    })

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 900))
    
    console.log('✅ [LEVER] Job posted successfully:', {
      externalId: `lever_${job.id}_${Date.now()}`,
      publicUrl: `https://jobs.lever.co/${org.slug}/${job.slug}`,
      cost: 'Included in ATS plan'
    })
  }
}

// Main integration function
export async function postJobToTargets({ job, org, targets }: PostJobParams): Promise<void> {
  console.log('🚀 [JOB BOARDS] Starting external job posting:', {
    jobTitle: job.title,
    organization: org.name,
    targets: targets,
    jobId: job.id
  })

  const adapters: Record<string, (job: Job, org: Organization) => Promise<void>> = {
    indeed: IndeedAdapter.postJob,
    linkedin: LinkedInAdapter.postJob,
    ziprecruiter: ZipRecruiterAdapter.postJob,
    monster: ZipRecruiterAdapter.postJob, // Use same adapter for now
    glassdoor: LinkedInAdapter.postJob, // Use same adapter for now
    craigslist: IndeedAdapter.postJob, // Use same adapter for now
    greenhouse: GreenhouseAdapter.postJob,
    lever: LeverAdapter.postJob
  }

  const results: Array<{ target: string; success: boolean; error?: string }> = []

  // Process each target in parallel
  const promises = targets.map(async (target) => {
    const adapter = adapters[target]
    if (!adapter) {
      console.warn(`⚠️ [JOB BOARDS] Unknown target: ${target}`)
      results.push({ target, success: false, error: 'Unknown adapter' })
      return
    }

    try {
      await adapter(job, org)
      results.push({ target, success: true })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error(`❌ [JOB BOARDS] Failed to post to ${target}:`, errorMessage)
      results.push({ target, success: false, error: errorMessage })
    }
  })

  await Promise.all(promises)

  const successful = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length

  console.log('📊 [JOB BOARDS] External posting complete:', {
    jobId: job.id,
    successful,
    failed,
    results
  })

  if (failed > 0) {
    console.warn(`⚠️ [JOB BOARDS] ${failed} posting(s) failed, but job publish succeeded`)
  }
}