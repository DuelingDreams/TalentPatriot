// Dashboard stats return type
export type DashboardStats = {
  totalJobs: number;
  totalCandidates: number;
  totalApplications: number;
  totalHires: number;
  jobsThisMonth: number;
  candidatesThisMonth: number;
  applicationsThisMonth: number;
  hiresThisMonth: number;
  averageTimeToHire?: number;
  conversionRate?: number;
  topSources?: Array<{ source: string; count: number }>;
  recentActivity?: Array<{ type: string; description: string; timestamp: Date }>;
};

// Analytics types from the database views
export type PipelineSnapshotData = {
  job_id: string;
  job_title: string;
  org_id: string;
  job_status: string;
  applied: number;
  phone_screen: number;
  interview: number;
  technical: number;
  final: number;
  offer: number;
  hired: number;
  rejected: number;
  total_candidates: number;
  created_at: string;
  updated_at: string;
};

export type StageTimeData = {
  job_id: string;
  stage: string;
  avg_hours_in_stage: number;
  sample_size: number;
};

export type JobHealthData = {
  job_id: string;
  title: string;
  org_id: string;
  job_status: string;
  applied_count: number;
  phone_screen_count: number;
  interview_count: number;
  technical_count: number;
  final_count: number;
  offer_count: number;
  hired_count: number;
  rejected_count: number;
  total_candidates: number;
  health_status: 'Healthy' | 'Needs Attention' | 'Stale' | 'Closed' | 'No Candidates';
  last_active_move: string | null;
  last_any_move: string | null;
};

export type DashboardActivityData = {
  changed_at: string;
  job_id: string;
  job_title: string;
  candidate_id: string;
  candidate_name: string;
  from_stage: string | null;
  to_stage: string;
  from_stage_display: string | null;
  to_stage_display: string;
  org_id: string;
};

// Analytics domain repository interface
export interface IAnalyticsRepository {
  // Performance-optimized methods
  getDashboardStats(orgId: string): Promise<DashboardStats>;
  
  // Analytics methods for new dashboard views
  getPipelineSnapshot(orgId: string, limit?: number): Promise<PipelineSnapshotData[]>;
  getStageTimeAnalytics(orgId: string, jobId?: string): Promise<StageTimeData[]>;
  getJobHealthData(orgId: string): Promise<JobHealthData[]>;
  getDashboardActivity(orgId: string, limit?: number): Promise<DashboardActivityData[]>;
}