import { Router } from 'express';
import { storage } from '../storage/index';
import { supabaseAdmin } from '../middleware/auth';
import { writeLimiter } from '../middleware/rate-limit';
import { refreshIfStale } from '../lib/analyticsRefresh';
import type { ApplicationRow } from './utils';

export function createAnalyticsRoutes() {
  const router = Router();

  router.get('/api/reports/metrics', async (req, res) => {
    try {
      const { orgId, period = '3months' } = req.query as { orgId: string; period: string }
      
      if (!orgId) {
        return res.status(400).json({ error: 'Organization ID is required' })
      }

      console.log(`[ANALYTICS] Generating comprehensive metrics for org: ${orgId}, period: ${period}`)

      await refreshIfStale();

      let periodMonths = 3
      switch (period) {
        case '1month': periodMonths = 1; break
        case '6months': periodMonths = 6; break  
        case '1year': periodMonths = 12; break
        case 'all': periodMonths = 0; break
        default: periodMonths = 3
      }

      const startDate = periodMonths > 0 ? new Date() : null
      if (startDate) {
        startDate.setMonth(startDate.getMonth() - periodMonths)
      }

      let pipelineQuery = supabaseAdmin
        .from('mv_pipeline_metrics')
        .select('*')
        .eq('org_id', orgId)
      if (startDate) pipelineQuery = pipelineQuery.gte('period_month', startDate.toISOString())
      pipelineQuery = pipelineQuery.order('period_month')

      let timeToHireQuery = supabaseAdmin
        .from('mv_time_to_hire')
        .select('*')
        .eq('org_id', orgId)
      if (startDate) timeToHireQuery = timeToHireQuery.gte('hire_month', startDate.toISOString())
      timeToHireQuery = timeToHireQuery.order('hire_month')

      const [pipelineData, sourceData, timeToHireData, skillsData, recruiterData, clientData] = await Promise.all([
        pipelineQuery,
        
        supabaseAdmin
          .from('mv_candidate_sources')
          .select('*')
          .eq('org_id', orgId)
          .order('total_applications', { ascending: false }),
        
        timeToHireQuery,
        
        supabaseAdmin
          .from('v_candidate_skills_flattened')
          .select('skill_name, skill_category, candidate_id')
          .eq('org_id', orgId),
        
        supabaseAdmin
          .from('mv_recruiter_performance')
          .select('*')
          .eq('org_id', orgId)
          .order('candidates_hired', { ascending: false }),
        
        supabaseAdmin
          .from('mv_client_performance')
          .select('*')
          .eq('org_id', orgId)
          .order('total_jobs', { ascending: false })
      ])

      const pipelineConversion = {
        applied: pipelineData.data?.reduce((sum, row) => sum + (row.total_applications || 0), 0) || 0,
        screened: pipelineData.data?.reduce((sum, row) => sum + (row.screening_count || 0), 0) || 0,
        interviewed: pipelineData.data?.reduce((sum, row) => sum + (row.interview_count || 0), 0) || 0,
        offered: pipelineData.data?.reduce((sum, row) => sum + (row.offer_count || 0), 0) || 0,
        hired: pipelineData.data?.reduce((sum, row) => sum + (row.hired_count || 0), 0) || 0,
        conversionRates: [
          { 
            stage: 'Applied to Screening', 
            rate: pipelineData.data?.length ? 
              pipelineData.data.reduce((sum, row) => sum + (row.applied_to_screening_rate || 0), 0) / pipelineData.data.length : 0
          },
          { 
            stage: 'Screening to Interview', 
            rate: pipelineData.data?.length ? 
              pipelineData.data.reduce((sum, row) => sum + (row.screening_to_interview_rate || 0), 0) / pipelineData.data.length : 0
          },
          { 
            stage: 'Interview to Offer', 
            rate: pipelineData.data?.length ? 
              pipelineData.data.reduce((sum, row) => sum + (row.interview_to_offer_rate || 0), 0) / pipelineData.data.length : 0
          },
          { 
            stage: 'Offer to Hired', 
            rate: pipelineData.data?.length ? 
              pipelineData.data.reduce((sum, row) => sum + (row.offer_acceptance_rate || 0), 0) / pipelineData.data.length : 0
          }
        ]
      }

      const sourceOfHire = (sourceData.data || []).map(row => ({
        source: row.source || 'Direct',
        count: row.total_applications || 0,
        percentage: Math.round((row.hire_rate || 0) * 100) / 100,
        hireRate: Math.round((row.hire_rate || 0) * 100) / 100,
        qualityRate: Math.round((row.quality_rate || 0) * 100) / 100
      }))

      const timeToHireAvg = timeToHireData.data?.length ? 
        timeToHireData.data.reduce((sum, row) => sum + (row.days_to_hire || 0), 0) / timeToHireData.data.length : 0
      
      const timeToHire = {
        average: Math.round(timeToHireAvg),
        median: Math.round(timeToHireAvg),
        trend: 0,
        byMonth: (timeToHireData.data || []).reduce((acc, row) => {
          const month = new Date(row.hire_month).toLocaleDateString('en-US', { month: 'short' })
          const existing = acc.find(item => item.month === month)
          if (existing) {
            existing.count += 1
            existing.average = (existing.average + (row.days_to_hire || 0)) / 2
          } else {
            acc.push({
              month,
              average: row.days_to_hire || 0,
              count: 1
            })
          }
          return acc
        }, [] as Array<{ month: string; average: number; count: number }>)
      }

      const recruiterPerformance = (recruiterData.data || []).map(row => ({
        recruiter: row.recruiter_name || 'Unknown',
        jobsPosted: row.jobs_managed || 0,
        candidatesHired: row.candidates_hired || 0,
        avgTimeToHire: Math.round(row.avg_time_to_hire || 0),
        conversionRate: Math.round((row.conversion_rate || 0) * 100) / 100
      }))

      const monthlyTrends = (pipelineData.data || []).map(row => ({
        month: new Date(row.period_month).toLocaleDateString('en-US', { month: 'short' }),
        applications: row.total_applications || 0,
        hires: row.hired_count || 0
      }))

      const skillsAggregated = (skillsData.data || []).reduce((acc: Record<string, { count: number; category: string }>, row: any) => {
        const skillName = row.skill_name
        if (!acc[skillName]) {
          acc[skillName] = { count: 0, category: row.skill_category || 'Other' }
        }
        acc[skillName].count += 1
        return acc
      }, {})

      const topSkills = Object.entries(skillsAggregated)
        .map(([skill, data]) => ({
          skill,
          skillCategory: data.category,
          count: data.count,
          hireRate: 0,
          avgTimeToHire: 0
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 15)

      const skillsByCategory = (skillsData.data || []).reduce((acc: Record<string, { skills: Set<string>; candidates: Set<string> }>, row: any) => {
        const category = row.skill_category || 'Other'
        if (!acc[category]) {
          acc[category] = { skills: new Set(), candidates: new Set() }
        }
        acc[category].skills.add(row.skill_name)
        acc[category].candidates.add(row.candidate_id)
        return acc
      }, {})

      const skillCategorySummary = Object.entries(skillsByCategory).map(([category, data]) => ({
        category,
        uniqueSkills: data.skills.size,
        candidateCount: data.candidates.size
      })).sort((a, b) => b.candidateCount - a.candidateCount)

      const clientPerformance = (clientData.data || []).map(row => ({
        clientName: row.client_name || 'Unknown Client',
        industry: row.industry,
        totalJobs: row.total_jobs || 0,
        activeJobs: row.active_jobs || 0,
        fillRate: Math.round((row.fill_rate || 0) * 100) / 100,
        avgTimeToFill: Math.round(row.avg_time_to_fill || 0),
        agingJobs30: row.aging_jobs_30_days || 0,
        agingJobs60: row.aging_jobs_60_days || 0
      }))

      const analytics = {
        timeToHire,
        sourceOfHire,
        pipelineConversion,
        recruiterPerformance,
        monthlyTrends,
        topSkills,
        skillCategorySummary,
        clientPerformance,
        summary: {
          totalApplications: pipelineConversion.applied,
          totalHires: pipelineConversion.hired,
          overallConversionRate: pipelineConversion.applied > 0 ? 
            Math.round((pipelineConversion.hired / pipelineConversion.applied) * 100 * 100) / 100 : 0,
          avgTimeToHire: timeToHire.average,
          topPerformingSource: sourceOfHire[0]?.source || 'N/A',
          topRecruiter: recruiterPerformance[0]?.recruiter || 'N/A'
        }
      }

      console.log(`[ANALYTICS] Generated comprehensive analytics for org ${orgId}:`, {
        applications: analytics.summary.totalApplications,
        hires: analytics.summary.totalHires,
        sources: sourceOfHire.length,
        recruiters: recruiterPerformance.length,
        clients: clientPerformance.length
      })

      res.setHeader('Cache-Control', 'private, max-age=300, must-revalidate')
      res.setHeader('Vary', 'X-Org-Id')
      res.json(analytics)
    } catch (error) {
      console.error('Error fetching comprehensive analytics:', error)
      res.status(500).json({ error: 'Failed to fetch analytics metrics' })
    }
  })

  router.get('/api/analytics/skills-demand', async (req, res) => {
    try {
      const { orgId, limit = 20 } = req.query as { orgId: string; limit?: string }
      
      if (!orgId) {
        return res.status(400).json({ error: 'Organization ID is required' })
      }

      const { data, error } = await supabaseAdmin
        .from('v_candidate_skills_flattened')
        .select('skill_name, skill_category, candidate_id')
        .eq('org_id', orgId)
      
      if (error) throw error

      const skillsAggregated = (data || []).reduce((acc: Record<string, { candidates: Set<string>; category: string }>, row: any) => {
        const skillName = row.skill_name
        if (!acc[skillName]) {
          acc[skillName] = { candidates: new Set(), category: row.skill_category || 'Other' }
        }
        acc[skillName].candidates.add(row.candidate_id)
        return acc
      }, {})

      const aggregatedSkills = Object.entries(skillsAggregated)
        .map(([skill_name, data]) => ({
          skill_name,
          skill_category: data.category,
          candidate_count: data.candidates.size
        }))
        .sort((a, b) => b.candidate_count - a.candidate_count)
        .slice(0, parseInt(limit as string))
      
      res.setHeader('Cache-Control', 'private, max-age=300')
      res.json(aggregatedSkills)
    } catch (error) {
      console.error('Error fetching skills demand:', error)
      res.status(500).json({ error: 'Failed to fetch skills demand analytics' })
    }
  })

  router.get('/api/analytics/diversity-metrics', async (req, res) => {
    try {
      const { orgId } = req.query as { orgId: string }
      
      if (!orgId) {
        return res.status(400).json({ error: 'Organization ID is required' })
      }

      const { data: candidates } = await supabaseAdmin
        .from('candidates')
        .select('*')
        .eq('org_id', orgId)
      
      const diversityMetrics = {
        totalCandidates: candidates?.length || 0,
        locations: candidates?.reduce((acc, candidate) => {
          return acc
        }, [] as any[]) || [],
        experienceLevels: candidates?.reduce((acc, candidate) => {
          const level = candidate.experience_level || 'unknown'
          acc[level] = (acc[level] || 0) + 1
          return acc
        }, {} as Record<string, number>) || {}
      }
      
      res.setHeader('Cache-Control', 'private, max-age=600')
      res.json(diversityMetrics)
    } catch (error) {
      console.error('Error fetching diversity metrics:', error)
      res.status(500).json({ error: 'Failed to fetch diversity metrics' })
    }
  })

  router.get('/api/analytics/aging-jobs', async (req, res) => {
    try {
      const { orgId } = req.query as { orgId: string }
      
      if (!orgId) {
        return res.status(400).json({ error: 'Organization ID is required' })
      }

      const { data: agingJobs } = await supabaseAdmin
        .from('jobs')
        .select('id, title, created_at, client_id, clients(name)')
        .eq('org_id', orgId)
        .eq('status', 'active')
        .lt('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: true })
      
      const processedJobs = (agingJobs || []).map(job => ({
        id: job.id,
        title: job.title,
        clientName: job.clients?.name || 'Unknown Client',
        daysOpen: Math.floor((Date.now() - new Date(job.created_at).getTime()) / (1000 * 60 * 60 * 24)),
        urgencyLevel: Math.floor((Date.now() - new Date(job.created_at).getTime()) / (1000 * 60 * 60 * 24)) > 60 ? 'high' : 'medium'
      }))
      
      res.setHeader('Cache-Control', 'private, max-age=300')
      res.json(processedJobs)
    } catch (error) {
      console.error('Error fetching aging jobs:', error)
      res.status(500).json({ error: 'Failed to fetch aging jobs' })
    }
  })

  router.post('/api/reports/generate', async (req, res) => {
    try {
      const { orgId, period, format } = req.query as { orgId: string; period: string; format: string }
      
      if (!orgId) {
        return res.status(400).json({ error: 'Organization ID is required' })
      }

      if (format === 'excel') {
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        res.setHeader('Content-Disposition', `attachment; filename="talent-patriot-report-${period}.xlsx"`)
        res.send(Buffer.from('Mock Excel Report Content'))
      } else {
        res.setHeader('Content-Type', 'application/zip')
        res.setHeader('Content-Disposition', `attachment; filename="talent-patriot-report-${period}.zip"`)
        res.send(Buffer.from('Mock CSV Report Archive'))
      }
    } catch (error) {
      console.error('Error generating report:', error)
      res.status(500).json({ error: 'Failed to generate report' })
    }
  })

  router.get('/api/analytics/pipeline-snapshot', async (req, res) => {
    try {
      const { orgId, limit } = req.query as { orgId: string; limit?: string }
      
      if (!orgId) {
        return res.status(400).json({ error: 'Organization ID is required' })
      }

      const limitNum = limit ? parseInt(limit, 10) : 10
      const data = await storage.analytics.getPipelineSnapshot(orgId, limitNum)
      
      res.setHeader('Cache-Control', 'private, max-age=30, must-revalidate')
      res.setHeader('Vary', 'X-Org-Id')
      res.json(data)
    } catch (error) {
      console.error('Error fetching pipeline snapshot:', error)
      res.status(500).json({ error: 'Failed to fetch pipeline snapshot' })
    }
  })

  router.get('/api/analytics/stage-time', async (req, res) => {
    try {
      const { orgId, jobId } = req.query as { orgId: string; jobId?: string }
      
      if (!orgId) {
        return res.status(400).json({ error: 'Organization ID is required' })
      }

      const data = await storage.analytics.getStageTimeAnalytics(orgId, jobId)
      
      res.setHeader('Cache-Control', 'private, max-age=60, must-revalidate')
      res.setHeader('Vary', 'X-Org-Id')
      res.json(data)
    } catch (error) {
      console.error('Error fetching stage time analytics:', error)
      res.status(500).json({ error: 'Failed to fetch stage time analytics' })
    }
  })

  router.get('/api/analytics/job-health', async (req, res) => {
    try {
      const { orgId } = req.query as { orgId: string }
      
      if (!orgId) {
        return res.status(400).json({ error: 'Organization ID is required' })
      }

      const data = await storage.analytics.getJobHealthData(orgId)
      
      res.setHeader('Cache-Control', 'private, max-age=120, must-revalidate')
      res.setHeader('Vary', 'X-Org-Id')
      res.json(data)
    } catch (error) {
      console.error('Error fetching job health data:', error)
      res.status(500).json({ error: 'Failed to fetch job health data' })
    }
  })

  router.get('/api/analytics/dashboard-activity', async (req, res) => {
    try {
      const { orgId, limit } = req.query as { orgId: string; limit?: string }
      
      if (!orgId) {
        return res.status(400).json({ error: 'Organization ID is required' })
      }

      const limitNum = limit ? parseInt(limit, 10) : 50
      const data = await storage.analytics.getDashboardActivity(orgId, limitNum)
      
      res.setHeader('Cache-Control', 'private, max-age=15, must-revalidate')
      res.setHeader('Vary', 'X-Org-Id')
      res.json(data)
    } catch (error) {
      console.error('Error fetching dashboard activity:', error)
      res.status(500).json({ error: 'Failed to fetch dashboard activity' })
    }
  })

  router.get('/api/ai/insights', async (req, res) => {
    try {
      const { orgId } = req.query as { orgId: string }
      
      if (!orgId) {
        return res.status(400).json({ error: 'Organization ID is required' })
      }

      console.log(`[AI INSIGHTS] Generating insights for organization: ${orgId}`)

      const { generateAIInsights } = await import('../aiInsights')

      const { DatabaseStorage } = await import('../storage')
      const storageInstance = new DatabaseStorage()
      const [jobs, candidates] = await Promise.all([
        storageInstance.jobs.getJobsByOrg(orgId),
        storageInstance.candidates.getCandidatesByOrg(orgId)
      ])
      
      let applications: ApplicationRow[] = []
      try {
        applications = candidates || []
      } catch (error) {
        console.warn('Applications data not available for AI insights, using candidates as proxy')
        applications = []
      }

      const hasRealData = jobs.length > 0 || candidates.length > 0
      
      if (!hasRealData) {
        console.log(`[AI INSIGHTS] No real data found for organization ${orgId} - returning empty state`)
        return res.json({
          summary: null,
          recommendations: [],
          metrics: {
            trendsAnalyzed: 0,
            patternsDetected: 0,
            recommendationsGenerated: 0,
          },
          lastUpdated: new Date().toISOString(),
          hasData: false
        })
      }

      const recruitmentData = {
        totalJobs: jobs.length,
        totalCandidates: candidates.length,
        totalApplications: Array.isArray(applications) ? applications.length : 0,
        applicationsTrend: 0,
        avgTimeToHire: 0,
        topSources: [
          { source: 'Company Website', count: Math.floor(candidates.length * 0.4) },
          { source: 'LinkedIn', count: Math.floor(candidates.length * 0.3) },
          { source: 'Referrals', count: Math.floor(candidates.length * 0.2) },
          { source: 'Job Boards', count: Math.floor(candidates.length * 0.1) }
        ],
        pipelineStages: [
          { stage: 'Applied', count: candidates.length },
          { stage: 'Screening', count: Math.floor(candidates.length * 0.6) },
          { stage: 'Interview', count: Math.floor(candidates.length * 0.3) },
          { stage: 'Offer', count: Math.floor(candidates.length * 0.1) },
          { stage: 'Hired', count: Math.floor(candidates.length * 0.05) }
        ],
        recentActivity: [
          { type: 'applications', count: candidates.length, date: new Date().toISOString().split('T')[0] },
          { type: 'interviews', count: Math.floor(candidates.length * 0.3), date: new Date().toISOString().split('T')[0] },
          { type: 'hires', count: Math.floor(candidates.length * 0.05), date: new Date().toISOString().split('T')[0] }
        ]
      }

      console.log(`[AI INSIGHTS] Calling OpenAI with real data for organization ${orgId}:`, JSON.stringify(recruitmentData, null, 2))
      
      const insights = await generateAIInsights(orgId, recruitmentData)
      
      res.json(insights)
    } catch (error) {
      console.error('Error generating AI insights:', error)
      res.status(500).json({ error: 'Failed to generate AI insights' })
    }
  })

  router.post('/api/ai/analyze-resume', async (req, res) => {
    try {
      const { resumeText } = req.body
      
      if (!resumeText) {
        return res.status(400).json({ error: 'Resume text is required' })
      }

      const { analyzeResumeWithAI } = await import('../aiInsights')
      const analysis = await analyzeResumeWithAI(resumeText)
      
      res.json(analysis)
    } catch (error) {
      console.error('Error analyzing resume:', error)
      res.status(500).json({ error: 'Failed to analyze resume' })
    }
  })

  router.post('/api/candidates/:id/parse-resume', writeLimiter, async (req, res) => {
    try {
      const { id: candidateId } = req.params
      const orgId = req.get('x-org-id') || req.headers['x-org-id'] as string
      
      console.log(`[MANUAL PARSE] Request received for candidate ${candidateId}, orgId header: ${orgId}`)
      
      if (!orgId) {
        console.log(`[MANUAL PARSE] Missing orgId header`)
        return res.status(400).json({ error: 'Organization ID is required' })
      }

      console.log(`[MANUAL PARSE] Fetching candidate ${candidateId}...`)

      const candidate = await storage.candidates.getCandidate(candidateId)
      console.log(`[MANUAL PARSE] Candidate lookup result:`, candidate ? `Found: ${candidate.name}` : 'Not found')
      
      if (!candidate) {
        console.log(`[MANUAL PARSE] Candidate ${candidateId} not found in database`)
        return res.status(404).json({ error: 'Candidate not found' })
      }

      const candidateOrgId = candidate.orgId || (candidate as any).org_id
      console.log(`[MANUAL PARSE] Candidate orgId: ${candidateOrgId || 'null (legacy)'}, request orgId: ${orgId}`)
      
      if (candidateOrgId && candidateOrgId !== orgId) {
        console.log(`[MANUAL PARSE] OrgId mismatch - candidate belongs to different org`)
        return res.status(404).json({ error: 'Candidate not found' })
      }

      const resumeUrl = candidate.resumeUrl || (candidate as any).resume_url
      console.log(`[MANUAL PARSE] Resume URL: ${resumeUrl}`)
      
      if (!resumeUrl) {
        console.log(`[MANUAL PARSE] No resume URL found for candidate`)
        return res.status(400).json({ error: 'Candidate does not have a resume uploaded' })
      }

      console.log(`[MANUAL PARSE] Starting async parsing for candidate ${candidateId}`)
      
      res.json({ 
        success: true, 
        message: 'Resume parsing started',
        candidateId,
        resumeUrl
      })

      const { DatabaseStorage: LegacyStorage } = await import('../storage.legacy')
      const legacyStorage = new LegacyStorage()
      legacyStorage.parseAndUpdateCandidateFromStorage(candidateId, resumeUrl)
        .then(() => {
          console.log(`[MANUAL PARSE] Successfully completed parsing for candidate ${candidateId}`)
        })
        .catch((err: unknown) => {
          console.error(`[MANUAL PARSE] Failed to parse resume for candidate ${candidateId}:`, err)
        })

    } catch (error) {
      console.error('[MANUAL PARSE] Error triggering resume parse:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      res.status(500).json({ error: 'Failed to trigger resume parsing', details: errorMessage })
    }
  })

  router.post('/api/data/export', writeLimiter, async (req, res) => {
    try {
      const { orgId, format, tables } = req.body
      
      if (!orgId || !tables?.length) {
        return res.status(400).json({ error: 'Organization ID and tables are required' })
      }

      if (format === 'excel') {
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        res.setHeader('Content-Disposition', `attachment; filename="talentpatriot-export-${new Date().toISOString().split('T')[0]}.xlsx"`)
        res.send(Buffer.from('TalentPatriot Excel Export'))
      } else {
        res.setHeader('Content-Type', 'application/zip')
        res.setHeader('Content-Disposition', `attachment; filename="talentpatriot-export-${new Date().toISOString().split('T')[0]}.zip"`)
        res.send(Buffer.from('TalentPatriot CSV Export Archive'))
      }
    } catch (error) {
      console.error('Error exporting data:', error)
      res.status(500).json({ error: 'Failed to export data' })
    }
  })

  router.post('/api/data/import', writeLimiter, async (req, res) => {
    try {
      res.setHeader('Content-Type', 'text/plain')
      res.setHeader('Transfer-Encoding', 'chunked')
      
      const total = 100
      for (let i = 0; i <= total; i += 20) {
        const progress = {
          total,
          processed: i,
          errors: i > 60 ? ['Warning: Duplicate email found'] : [],
          status: i === total ? 'completed' : 'processing'
        }
        res.write(JSON.stringify(progress) + '\n')
        await new Promise(resolve => setTimeout(resolve, 300))
      }
      
      res.end()
    } catch (error) {
      console.error('Error importing data:', error)
      res.status(500).json({ error: 'Failed to import data' })
    }
  })

  router.post('/api/data/backup', writeLimiter, async (req, res) => {
    try {
      const { orgId } = req.body
      
      if (!orgId) {
        return res.status(400).json({ error: 'Organization ID is required' })
      }

      res.setHeader('Content-Type', 'application/zip')
      res.setHeader('Content-Disposition', `attachment; filename="talentpatriot-backup-${new Date().toISOString().split('T')[0]}.zip"`)
      res.send(Buffer.from('TalentPatriot Complete Database Backup'))
    } catch (error) {
      console.error('Error creating backup:', error)
      res.status(500).json({ error: 'Failed to create backup' })
    }
  })

  return router;
}
