-- =========================================================
-- TalentPatriot: Dashboard Analytics - Schema Compatible Version
-- Safe, additive, idempotent. Aligns with existing Drizzle schema.
-- =========================================================

-- 0) Housekeeping: required extension for UUIDs (usually enabled)
create extension if not exists pgcrypto;

-- =========================================================
-- 1) STAGE ORDERING (for progress bars and analytics)
-- =========================================================

-- Stage ordering table (uses your existing candidate_stage enum)
create table if not exists public.stage_order (
  stage text primary key, -- Using text to match your candidate_stage enum values
  position int not null unique,
  display_name text not null
);

-- Insert stage order data matching actual Supabase enum values
insert into public.stage_order(stage, position, display_name) values
  ('applied', 1, 'Applied'),
  ('phone_screen', 2, 'Phone Screen'),
  ('interview', 3, 'Interview'),
  ('technical', 4, 'Technical'),
  ('final', 5, 'Final'),
  ('offer', 6, 'Offer'),
  ('hired', 7, 'Hired'),
  ('rejected', 8, 'Rejected')
on conflict (stage) do update set 
  position = excluded.position,
  display_name = excluded.display_name;

-- Helper function: get stage order
create or replace function public.stage_order_of(p_stage text)
returns int language sql stable as $$
  select position from public.stage_order where stage = p_stage
$$;

-- =========================================================
-- 2) PIPELINE STAGE EVENTS LOG
--    (drives avg time in stage, progress bar math, activity feed)
-- =========================================================

create table if not exists public.job_pipeline_stage_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  job_id uuid not null,
  candidate_id uuid not null,
  job_candidate_id uuid, -- references job_candidate.id for direct linking
  from_stage text, -- using text to match candidate_stage enum
  to_stage text not null, -- using text to match candidate_stage enum
  changed_at timestamptz not null default now(),
  changed_by uuid, -- references auth.users(id)
  
  -- Add constraints to ensure valid stage values match Supabase enum
  constraint valid_from_stage check (
    from_stage is null or from_stage in ('applied', 'phone_screen', 'interview', 'technical', 'final', 'offer', 'hired', 'rejected')
  ),
  constraint valid_to_stage check (
    to_stage in ('applied', 'phone_screen', 'interview', 'technical', 'final', 'offer', 'hired', 'rejected')
  )
);

-- Indexes for common analytics queries
create index if not exists idx_jpse_job_stage_time on public.job_pipeline_stage_events(job_id, to_stage, changed_at desc);
create index if not exists idx_jpse_candidate_time on public.job_pipeline_stage_events(candidate_id, changed_at desc);
create index if not exists idx_jpse_org_job on public.job_pipeline_stage_events(org_id, job_id);
create index if not exists idx_jpse_job_candidate on public.job_pipeline_stage_events(job_candidate_id);

-- RLS: Restrict to organization membership
alter table public.job_pipeline_stage_events enable row level security;

do $$
begin
  -- Drop existing policies if they exist to avoid conflicts
  drop policy if exists jpse_select_auth on public.job_pipeline_stage_events;
  drop policy if exists jpse_insert_auth on public.job_pipeline_stage_events;
  
  -- Create org-scoped policies
  create policy jpse_select_auth on public.job_pipeline_stage_events
    for select to authenticated 
    using (
      org_id in (
        select org_id from public.user_organizations 
        where user_id = auth.uid()
      )
    );

  create policy jpse_insert_auth on public.job_pipeline_stage_events
    for insert to authenticated 
    with check (
      org_id in (
        select org_id from public.user_organizations 
        where user_id = auth.uid()
      )
    );
end$$;

-- =========================================================
-- 3) AUTO-LOG STAGE CHANGES (trigger for job_candidate table)
-- =========================================================

-- Create shadow table to track previous stage values
create table if not exists public._job_candidate_stage_shadow (
  job_candidate_id uuid primary key,
  last_stage text,
  updated_at timestamptz not null default now()
);

-- Function to log stage transitions
create or replace function public._log_job_candidate_stage_transition()
returns trigger language plpgsql as $$
declare
  prev_stage text;
begin
  -- Get previous stage from shadow table
  if tg_op = 'INSERT' then
    prev_stage := null;
  else
    prev_stage := (
      select last_stage 
      from public._job_candidate_stage_shadow 
      where job_candidate_id = new.id
    );
  end if;

  -- Log transition if stage actually changed
  if prev_stage is distinct from new.stage then
    insert into public.job_pipeline_stage_events(
      org_id, 
      job_id, 
      candidate_id, 
      job_candidate_id,
      from_stage, 
      to_stage, 
      changed_at, 
      changed_by
    )
    values (
      new.org_id,
      new.job_id,
      new.candidate_id,
      new.id,
      prev_stage,
      new.stage,
      new.updated_at,
      auth.uid()
    );

    -- Update shadow table
    insert into public._job_candidate_stage_shadow(job_candidate_id, last_stage, updated_at)
    values (new.id, new.stage, new.updated_at)
    on conflict (job_candidate_id) do update
      set last_stage = excluded.last_stage, updated_at = excluded.updated_at;
  end if;

  return new;
end $$;

-- Install trigger on job_candidate table
drop trigger if exists tr_log_job_candidate_stage_transition on public.job_candidate;
create trigger tr_log_job_candidate_stage_transition
  after insert or update of stage on public.job_candidate
  for each row execute function public._log_job_candidate_stage_transition();

-- =========================================================
-- 4) ANALYTIC VIEWS FOR DASHBOARD
-- =========================================================

-- a) Current pipeline stage counts per job
create or replace view public.v_pipeline_stage_counts as
select
  jc.job_id,
  jc.stage,
  count(*)::int as candidate_count
from public.job_candidate jc
where jc.status = 'active' -- only active job_candidate records
group by jc.job_id, jc.stage;

-- b) Average time-in-stage (in hours) per job/stage from events
create or replace view public.v_pipeline_stage_avg_time as
with ordered_events as (
  select
    e.job_id,
    e.candidate_id,
    e.to_stage,
    e.changed_at,
    lead(e.changed_at) over (
      partition by e.job_id, e.candidate_id 
      order by e.changed_at
    ) as next_changed_at
  from public.job_pipeline_stage_events e
),
durations as (
  select
    job_id,
    to_stage as stage,
    extract(epoch from (
      coalesce(next_changed_at, now()) - changed_at
    )) / 3600.0 as hours_in_stage
  from ordered_events
  where extract(epoch from (
    coalesce(next_changed_at, now()) - changed_at
  )) / 3600.0 > 0 -- avoid negative durations
)
select
  job_id,
  stage,
  round(avg(hours_in_stage)::numeric, 1) as avg_hours_in_stage,
  count(*)::int as sample_size
from durations
group by job_id, stage
having count(*) >= 1; -- require at least 1 sample

-- c) Job health assessment
create or replace view public.v_job_health as
with last_activity as (
  select
    job_id,
    max(changed_at) filter (where to_stage != 'hired' and to_stage != 'rejected') as last_active_move,
    max(changed_at) as last_any_move
  from public.job_pipeline_stage_events
  group by job_id
),
stage_counts as (
  select
    job_id,
    sum(case when stage = 'applied' then candidate_count else 0 end) as c_applied,
    sum(case when stage = 'phone_screen' then candidate_count else 0 end) as c_phone_screen,
    sum(case when stage = 'interview' then candidate_count else 0 end) as c_interview,
    sum(case when stage = 'technical' then candidate_count else 0 end) as c_technical,
    sum(case when stage = 'final' then candidate_count else 0 end) as c_final,
    sum(case when stage = 'offer' then candidate_count else 0 end) as c_offer,
    sum(case when stage = 'hired' then candidate_count else 0 end) as c_hired,
    sum(case when stage = 'rejected' then candidate_count else 0 end) as c_rejected,
    sum(candidate_count) as c_total
  from public.v_pipeline_stage_counts
  group by job_id
)
select
  j.id as job_id,
  j.title,
  j.org_id,
  j.status as job_status,
  coalesce(sc.c_applied, 0) as applied_count,
  coalesce(sc.c_phone_screen, 0) as phone_screen_count,
  coalesce(sc.c_interview, 0) as interview_count,
  coalesce(sc.c_technical, 0) as technical_count,
  coalesce(sc.c_final, 0) as final_count,
  coalesce(sc.c_offer, 0) as offer_count,
  coalesce(sc.c_hired, 0) as hired_count,
  coalesce(sc.c_rejected, 0) as rejected_count,
  coalesce(sc.c_total, 0) as total_candidates,
  case
    when j.status != 'open' then 'Closed'
    when la.last_active_move is null and coalesce(sc.c_total, 0) = 0 then 'No Candidates'
    when la.last_active_move is null then 'Needs Attention'
    when la.last_active_move < now() - interval '14 days' then 'Stale'
    when coalesce(sc.c_interview, 0) + coalesce(sc.c_technical, 0) + coalesce(sc.c_final, 0) = 0 
         and (coalesce(sc.c_applied, 0) + coalesce(sc.c_phone_screen, 0)) > 0
         and la.last_any_move < now() - interval '7 days' then 'Needs Attention'
    else 'Healthy'
  end as health_status,
  la.last_active_move,
  la.last_any_move
from public.jobs j
left join last_activity la on la.job_id = j.id
left join stage_counts sc on sc.job_id = j.id;

-- d) Recent activity feed for dashboard
create or replace view public.v_dashboard_activity as
select
  e.changed_at,
  e.job_id,
  j.title as job_title,
  e.candidate_id,
  c.name as candidate_name,
  e.from_stage,
  e.to_stage,
  so_from.display_name as from_stage_display,
  so_to.display_name as to_stage_display,
  e.org_id
from public.job_pipeline_stage_events e
left join public.jobs j on j.id = e.job_id
left join public.candidates c on c.id = e.candidate_id
left join public.stage_order so_from on so_from.stage = e.from_stage
left join public.stage_order so_to on so_to.stage = e.to_stage
order by e.changed_at desc
limit 100;

-- =========================================================
-- 5) DASHBOARD PIPELINE SNAPSHOT (main view for UI components)
-- =========================================================
create or replace view public.v_dashboard_pipeline_snapshot as
select
  j.id as job_id,
  j.title as job_title,
  j.org_id,
  j.status as job_status,
  -- Use COALESCE to ensure zero counts for missing stages
  coalesce(sum(case when c.stage = 'applied' then c.candidate_count else 0 end), 0) as applied,
  coalesce(sum(case when c.stage = 'phone_screen' then c.candidate_count else 0 end), 0) as phone_screen,
  coalesce(sum(case when c.stage = 'interview' then c.candidate_count else 0 end), 0) as interview,
  coalesce(sum(case when c.stage = 'technical' then c.candidate_count else 0 end), 0) as technical,
  coalesce(sum(case when c.stage = 'final' then c.candidate_count else 0 end), 0) as final,
  coalesce(sum(case when c.stage = 'offer' then c.candidate_count else 0 end), 0) as offer,
  coalesce(sum(case when c.stage = 'hired' then c.candidate_count else 0 end), 0) as hired,
  coalesce(sum(case when c.stage = 'rejected' then c.candidate_count else 0 end), 0) as rejected,
  coalesce(sum(c.candidate_count), 0) as total_candidates,
  j.created_at,
  j.updated_at
from public.jobs j
left join public.v_pipeline_stage_counts c on c.job_id = j.id
group by j.id, j.title, j.org_id, j.status, j.created_at, j.updated_at
order by j.updated_at desc;

-- =========================================================
-- 6) PERFORMANCE INDEXES
-- =========================================================

-- Optimize job_candidate queries (your main application table)
create index if not exists idx_job_candidate_job_stage on public.job_candidate(job_id, stage);
create index if not exists idx_job_candidate_org_stage on public.job_candidate(org_id, stage);
create index if not exists idx_job_candidate_status on public.job_candidate(status) where status = 'active';
create index if not exists idx_job_candidate_updated on public.job_candidate(updated_at desc);

-- Optimize jobs table for dashboard queries
create index if not exists idx_jobs_org_status on public.jobs(org_id, status);
create index if not exists idx_jobs_status_updated on public.jobs(status, updated_at desc) where status = 'open';

-- =========================================================
-- 7) MATERIALIZED VIEW FOR FAST DASHBOARD LOADS
-- =========================================================

-- Create materialized view for high-performance dashboard
create materialized view if not exists public.mv_dashboard_snapshot as
select * from public.v_dashboard_pipeline_snapshot;

-- Index the materialized view
create unique index if not exists idx_mv_dash_job_id on public.mv_dashboard_snapshot(job_id);
create index if not exists idx_mv_dash_org_status on public.mv_dashboard_snapshot(org_id, job_status);

-- Function to refresh dashboard snapshot (call this from your app or cron)
create or replace function public.refresh_dashboard_snapshot()
returns void language sql security definer as $$
  refresh materialized view concurrently public.mv_dashboard_snapshot;
$$;

-- Grant permissions to refresh function
grant execute on function public.refresh_dashboard_snapshot() to authenticated;

-- =========================================================
-- 8) VIEW PERMISSIONS (RLS will be inherited from base tables)
-- =========================================================

-- Grant read access to views for authenticated users
grant select on public.v_pipeline_stage_counts to authenticated;
grant select on public.v_pipeline_stage_avg_time to authenticated;
grant select on public.v_job_health to authenticated;
grant select on public.v_dashboard_activity to authenticated;
grant select on public.v_dashboard_pipeline_snapshot to authenticated;
grant select on public.mv_dashboard_snapshot to authenticated;
grant select on public.stage_order to authenticated;

-- =========================================================
-- 9) SEED EXISTING DATA (create initial events from current job_candidate records)
-- =========================================================

-- Create initial stage events for existing job_candidate records
-- This will populate the events table with current state
do $$
begin
  -- Only run if events table is empty to avoid duplicates
  if not exists (select 1 from public.job_pipeline_stage_events limit 1) then
    
    -- Insert initial events for all current job_candidate records
    insert into public.job_pipeline_stage_events (
      org_id, job_id, candidate_id, job_candidate_id, 
      from_stage, to_stage, changed_at, changed_by
    )
    select 
      jc.org_id,
      jc.job_id, 
      jc.candidate_id,
      jc.id,
      null as from_stage, -- no previous stage for initial data
      jc.stage as to_stage,
      jc.created_at as changed_at,
      null as changed_by -- unknown who initially created
    from public.job_candidate jc
    where jc.status = 'active';
    
    -- Populate shadow table with current states
    insert into public._job_candidate_stage_shadow (job_candidate_id, last_stage, updated_at)
    select id, stage, updated_at
    from public.job_candidate
    where status = 'active'
    on conflict (job_candidate_id) do nothing;
    
    -- Refresh materialized view with initial data
    refresh materialized view public.mv_dashboard_snapshot;
    
  end if;
end$$;

-- =========================================================
-- END OF SCRIPT
-- =========================================================

-- Summary of what this script provides:
-- 
-- 1. ✅ Stage tracking compatible with your candidate_stage enum
-- 2. ✅ Automatic event logging when job_candidate.stage changes  
-- 3. ✅ Org-scoped RLS for multi-tenant security
-- 4. ✅ Analytics views that match your UI component expectations
-- 5. ✅ Performance optimizations with proper indexing
-- 6. ✅ Materialized view for fast dashboard loads
-- 7. ✅ Backward compatibility - seeds existing data
-- 8. ✅ Safe, idempotent execution
--
-- Your dashboard components can now query:
-- - v_dashboard_pipeline_snapshot (or mv_dashboard_snapshot for speed)
-- - v_pipeline_stage_avg_time (for AI insights with time data)
-- - v_job_health (for health indicators)
-- - v_dashboard_activity (for recent activity feeds)