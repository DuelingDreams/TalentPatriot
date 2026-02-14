import { supabase } from './supabase';

let lastRefreshTime = 0;
let refreshInFlight: Promise<void> | null = null;
let deferredTimer: ReturnType<typeof setTimeout> | null = null;
const REFRESH_COOLDOWN_MS = 5 * 60 * 1000;
const SCHEDULED_INTERVAL_MS = 15 * 60 * 1000;
let scheduledTimer: ReturnType<typeof setInterval> | null = null;

async function doRefresh(): Promise<void> {
  const { error } = await supabase.rpc('refresh_analytics_cache');
  if (error) {
    throw new Error(error.message);
  }
  lastRefreshTime = Date.now();
  console.log('[Analytics] Materialized views refreshed successfully');
}

async function refreshAllViews(): Promise<void> {
  if (refreshInFlight) {
    await refreshInFlight;
    return;
  }

  refreshInFlight = doRefresh().finally(() => {
    refreshInFlight = null;
  });

  await refreshInFlight;
}

export async function refreshIfStale(): Promise<{ refreshed: boolean; lastRefreshTime: number }> {
  if (Date.now() - lastRefreshTime < REFRESH_COOLDOWN_MS) {
    return { refreshed: false, lastRefreshTime };
  }

  try {
    await refreshAllViews();
    return { refreshed: true, lastRefreshTime };
  } catch (err) {
    console.error('[Analytics] On-demand refresh failed:', err);
    return { refreshed: false, lastRefreshTime };
  }
}

export function triggerDeferredRefresh(): void {
  if (deferredTimer) {
    clearTimeout(deferredTimer);
  }

  deferredTimer = setTimeout(async () => {
    deferredTimer = null;
    try {
      if (Date.now() - lastRefreshTime >= REFRESH_COOLDOWN_MS) {
        await refreshAllViews();
      }
    } catch (err) {
      console.error('[Analytics] Deferred refresh failed:', err);
    }
  }, 3000);
}

export function startScheduledRefresh(): void {
  if (scheduledTimer) return;

  console.log(`[Analytics] Starting scheduled refresh every ${SCHEDULED_INTERVAL_MS / 60000} minutes`);

  scheduledTimer = setInterval(async () => {
    try {
      await refreshAllViews();
    } catch (err) {
      console.error('[Analytics] Scheduled refresh failed:', err);
    }
  }, SCHEDULED_INTERVAL_MS);

  setTimeout(async () => {
    try {
      await refreshAllViews();
    } catch (err) {
      console.error('[Analytics] Initial refresh failed:', err);
    }
  }, 10000);
}

export function stopScheduledRefresh(): void {
  if (scheduledTimer) {
    clearInterval(scheduledTimer);
    scheduledTimer = null;
  }
  if (deferredTimer) {
    clearTimeout(deferredTimer);
    deferredTimer = null;
  }
}
