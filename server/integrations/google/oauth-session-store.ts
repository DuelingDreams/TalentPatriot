import crypto from 'crypto';
import { supabase } from '../../lib/supabase';
import type { OAuthSession, InsertOAuthSession } from '@shared/schema';
import { toCamelCase, toSnakeCase } from '@shared/utils/caseConversion';

export interface OAuthSessionData {
  userId: string;
  orgId: string;
  returnTo: string;
  stateNonce: string;
  expiresAt: Date;
  redirectHost?: string;
}

export interface CreateSessionParams {
  userId: string;
  orgId: string;
  returnTo?: string;
  clientIp?: string;
  userAgent?: string;
  redirectHost?: string;
}

export class OAuthSessionStore {
  private static readonly SESSION_TTL_MS = 10 * 60 * 1000; // 10 minutes
  private static readonly CLEANUP_RETENTION_HOURS = 24;

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private generateNonce(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  async createSession(params: CreateSessionParams): Promise<{ sessionToken: string; stateNonce: string }> {
    const { userId, orgId, returnTo = '/settings/integrations', clientIp, userAgent, redirectHost } = params;

    const sessionToken = crypto.randomBytes(32).toString('hex');
    const sessionTokenHash = this.hashToken(sessionToken);
    const stateNonce = this.generateNonce();
    const expiresAt = new Date(Date.now() + OAuthSessionStore.SESSION_TTL_MS);

    const sessionData = {
      session_token_hash: sessionTokenHash,
      user_id: userId,
      org_id: orgId,
      return_to: returnTo,
      state_nonce: stateNonce,
      redirect_host: redirectHost || null,
      expires_at: expiresAt.toISOString(),
      created_ip: clientIp || null,
      user_agent: userAgent || null,
    };

    const { error } = await supabase
      .from('oauth_sessions')
      .insert(sessionData);

    if (error) {
      console.error('❌ [OAuthSession] Failed to create session:', error.message);
      throw new Error(`Failed to create OAuth session: ${error.message}`);
    }

    console.log(`🔐 [OAuthSession] Created session for user ${userId.substring(0, 8)}..., expires at ${expiresAt.toISOString()}`);

    return { sessionToken, stateNonce };
  }

  async consumeSession(sessionToken: string): Promise<OAuthSessionData | null> {
    const sessionTokenHash = this.hashToken(sessionToken);
    const now = new Date().toISOString();

    const { data: deletedSessions, error: deleteError } = await supabase
      .from('oauth_sessions')
      .delete()
      .eq('session_token_hash', sessionTokenHash)
      .is('consumed_at', null)
      .gt('expires_at', now)
      .select('*');

    if (deleteError) {
      console.error('❌ [OAuthSession] Failed to consume session:', deleteError.message);
      return null;
    }

    if (!deletedSessions || deletedSessions.length === 0) {
      console.warn(`⚠️ [OAuthSession] Session not found, already consumed, or expired: ${sessionToken.substring(0, 8)}...`);
      return null;
    }

    const session = toCamelCase(deletedSessions[0]) as OAuthSession;

    console.log(`✅ [OAuthSession] Session atomically consumed and deleted for user ${session.userId.substring(0, 8)}...`);

    return {
      userId: session.userId,
      orgId: session.orgId,
      returnTo: session.returnTo || '/settings/integrations',
      stateNonce: session.stateNonce,
      expiresAt: new Date(session.expiresAt),
      redirectHost: session.redirectHost || undefined,
    };
  }

  async verifyNonce(sessionToken: string, expectedNonce: string): Promise<boolean> {
    const sessionTokenHash = this.hashToken(sessionToken);

    const { data: sessions, error } = await supabase
      .from('oauth_sessions')
      .select('state_nonce')
      .eq('session_token_hash', sessionTokenHash)
      .limit(1);

    if (error || !sessions || sessions.length === 0) {
      return false;
    }

    return sessions[0].state_nonce === expectedNonce;
  }

  async cleanupExpiredSessions(): Promise<number> {
    const cutoffDate = new Date(Date.now() - OAuthSessionStore.CLEANUP_RETENTION_HOURS * 60 * 60 * 1000);
    const consumedCutoff = new Date(Date.now() - 60 * 60 * 1000); // 1 hour for consumed sessions

    const { data: expiredData, error: expiredError } = await supabase
      .from('oauth_sessions')
      .delete()
      .lt('expires_at', cutoffDate.toISOString())
      .select('id');

    const { data: consumedData, error: consumedError } = await supabase
      .from('oauth_sessions')
      .delete()
      .not('consumed_at', 'is', null)
      .lt('consumed_at', consumedCutoff.toISOString())
      .select('id');

    const expiredCount = expiredData?.length || 0;
    const consumedCount = consumedData?.length || 0;
    const totalDeleted = expiredCount + consumedCount;
    
    if (totalDeleted > 0) {
      console.log(`🧹 [OAuthSession] Cleaned up ${totalDeleted} expired/consumed sessions`);
    }

    return totalDeleted;
  }
}

export const oauthSessionStore = new OAuthSessionStore();

let cleanupIntervalId: NodeJS.Timeout | null = null;

export function startSessionCleanupJob(intervalMs: number = 5 * 60 * 1000): void {
  if (cleanupIntervalId) {
    console.warn('⚠️ [OAuthSession] Cleanup job already running');
    return;
  }

  cleanupIntervalId = setInterval(async () => {
    try {
      await oauthSessionStore.cleanupExpiredSessions();
    } catch (error) {
      console.error('❌ [OAuthSession] Cleanup job error:', error);
    }
  }, intervalMs);

  console.log(`🕐 [OAuthSession] Started cleanup job (interval: ${intervalMs / 1000}s)`);
}

export function stopSessionCleanupJob(): void {
  if (cleanupIntervalId) {
    clearInterval(cleanupIntervalId);
    cleanupIntervalId = null;
    console.log('🛑 [OAuthSession] Stopped cleanup job');
  }
}
