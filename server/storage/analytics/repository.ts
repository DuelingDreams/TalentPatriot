import { supabase } from '../../lib/supabase';
import type { 
  IAnalyticsRepository,
  DashboardStats,
  PipelineSnapshotData,
  StageTimeData,
  JobHealthData,
  DashboardActivityData
} from './interface';

export class AnalyticsRepository implements IAnalyticsRepository {
  async getDashboardStats(orgId: string): Promise<DashboardStats> {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Query all counts in parallel for best performance
      const [jobsResult, candidatesResult, applicationsResult, hiresResult] = await Promise.all([
        supabase.from('jobs').select('id', { count: 'exact' }).eq('org_id', orgId),
        supabase.from('candidates').select('id', { count: 'exact' }).eq('org_id', orgId),
        supabase.from('job_candidate').select('id', { count: 'exact' }).eq('org_id', orgId),
        supabase.from('job_candidate').select('id', { count: 'exact' }).eq('org_id', orgId).eq('stage', 'hired')
      ]);

      const [jobsMonthResult, candidatesMonthResult, applicationsMonthResult, hiresMonthResult] = await Promise.all([
        supabase.from('jobs').select('id', { count: 'exact' }).eq('org_id', orgId).gte('created_at', startOfMonth.toISOString()),
        supabase.from('candidates').select('id', { count: 'exact' }).eq('org_id', orgId).gte('created_at', startOfMonth.toISOString()),
        supabase.from('job_candidate').select('id', { count: 'exact' }).eq('org_id', orgId).gte('created_at', startOfMonth.toISOString()),
        supabase.from('job_candidate').select('id', { count: 'exact' }).eq('org_id', orgId).eq('stage', 'hired').gte('updated_at', startOfMonth.toISOString())
      ]);

      return {
        totalJobs: jobsResult.count || 0,
        totalCandidates: candidatesResult.count || 0,
        totalApplications: applicationsResult.count || 0,
        totalHires: hiresResult.count || 0,
        jobsThisMonth: jobsMonthResult.count || 0,
        candidatesThisMonth: candidatesMonthResult.count || 0,
        applicationsThisMonth: applicationsMonthResult.count || 0,
        hiresThisMonth: hiresMonthResult.count || 0
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }
  
  async getPipelineSnapshot(orgId: string, limit: number = 10): Promise<PipelineSnapshotData[]> {
    try {
      let query = supabase
        .from('v_dashboard_pipeline_snapshot')
        .select('*')
        .eq('org_id', orgId)
        .eq('job_status', 'open')
        .order('total_candidates', { ascending: false })

      if (limit > 0) {
        query = query.limit(limit)
      }

      const { data, error } = await query

      if (error) {
        console.error('Database pipeline snapshot fetch error:', error)
        throw new Error(`Failed to fetch pipeline snapshot: ${error.message}`)
      }

      return (data || []) as PipelineSnapshotData[]
    } catch (err) {
      console.error('Pipeline snapshot fetch exception:', err)
      throw err
    }
  }
  
  async getStageTimeAnalytics(orgId: string, jobId?: string): Promise<StageTimeData[]> {
    try {
      let query = supabase
        .from('v_pipeline_stage_avg_time')
        .select('*')

      // Join with jobs to filter by org_id
      const { data: jobs } = await supabase
        .from('jobs')
        .select('id')
        .eq('org_id', orgId)

      if (!jobs || jobs.length === 0) {
        return []
      }

      const jobIds = jobs.map(job => job.id)
      query = query.in('job_id', jobIds)

      if (jobId) {
        query = query.eq('job_id', jobId)
      }

      const { data, error } = await query

      if (error) {
        console.error('Database stage time analytics fetch error:', error)
        throw new Error(`Failed to fetch stage time analytics: ${error.message}`)
      }

      return (data || []) as StageTimeData[]
    } catch (err) {
      console.error('Stage time analytics fetch exception:', err)
      throw err
    }
  }
  
  async getJobHealthData(orgId: string): Promise<JobHealthData[]> {
    try {
      const { data, error } = await supabase
        .from('v_job_health')
        .select('*')
        .eq('org_id', orgId)
        .order('total_candidates', { ascending: false })

      if (error) {
        console.error('Database job health fetch error:', error)
        throw new Error(`Failed to fetch job health data: ${error.message}`)
      }

      return (data || []) as JobHealthData[]
    } catch (err) {
      console.error('Job health fetch exception:', err)
      throw err
    }
  }
  
  async getDashboardActivity(orgId: string, limit: number = 50): Promise<DashboardActivityData[]> {
    try {
      const { data, error } = await supabase
        .from('v_dashboard_activity')
        .select('*')
        .eq('org_id', orgId)
        .order('changed_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Database dashboard activity fetch error:', error)
        throw new Error(`Failed to fetch dashboard activity: ${error.message}`)
      }

      return (data || []) as DashboardActivityData[]
    } catch (err) {
      console.error('Dashboard activity fetch exception:', err)
      throw err
    }
  }
}
