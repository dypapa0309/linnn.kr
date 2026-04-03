import { createServiceClient } from '../supabase/server'
import { hashIp } from './session'
import type { AbuseLevel, AuditReasonCode, QuotaCheckResult } from '@/types'

export const ANON_DAILY_CREATE_LIMIT = 5
export const ANON_BURST_LIMIT = 3        // max creates per minute
export const ANON_SLUG_CHECK_LIMIT = 10  // max slug checks per minute
export const FREE_MONTHLY_CREATE_LIMIT = 30
export const PRO_MONTHLY_CREATE_LIMIT = 1000

const todayBucket = () => new Date().toISOString().slice(0, 10) // YYYY-MM-DD

interface AnonSignals {
  anonTokenHash: string
  localIdHash?: string | null
  fingerprintHash?: string | null
  ipHash?: string | null
}

/**
 * Check whether an anonymous user may create a new link.
 * Also updates usage counters atomically.
 */
export async function checkAndIncrementAnonQuota(
  signals: AnonSignals
): Promise<QuotaCheckResult> {
  const supabase = createServiceClient()
  const day = todayBucket()

  // Upsert the usage row for today (ignore conflicts — we'll fetch fresh below)
  await supabase
    .from('anon_usage')
    .upsert(
      {
        anon_token_hash: signals.anonTokenHash,
        local_id_hash: signals.localIdHash ?? null,
        fingerprint_hash: signals.fingerprintHash ?? null,
        ip_hash: signals.ipHash ?? null,
        day_bucket: day,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: 'anon_token_hash,day_bucket', ignoreDuplicates: true }
    )

  // Fetch current row
  const { data: row } = await supabase
    .from('anon_usage')
    .select('*')
    .eq('anon_token_hash', signals.anonTokenHash)
    .eq('day_bucket', day)
    .single()

  const createCount: number = row?.create_count ?? 0
  const abuseScore: number = row?.abuse_score ?? 0

  // Classify abuse level
  let abuseLevel: AbuseLevel = 'normal'
  if (abuseScore >= 80) abuseLevel = 'very_suspicious'
  else if (abuseScore >= 40) abuseLevel = 'suspicious'

  // Daily cap check
  if (createCount >= ANON_DAILY_CREATE_LIMIT) {
    return {
      allowed: false,
      remaining: 0,
      abuseLevel,
      reason: 'daily_quota_exceeded',
    }
  }

  // Burst check: count creates in last 60 seconds
  const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString()
  const { count: recentCount } = await supabase
    .from('audit_events')
    .select('id', { count: 'exact', head: true })
    .eq('anon_token_hash', signals.anonTokenHash)
    .eq('event_type', 'link_create')
    .eq('status', 'success')
    .gte('created_at', oneMinuteAgo)

  if ((recentCount ?? 0) >= ANON_BURST_LIMIT) {
    // Increment abuse score on burst
    await supabase
      .from('anon_usage')
      .update({ abuse_score: Math.min(100, abuseScore + 20) })
      .eq('anon_token_hash', signals.anonTokenHash)
      .eq('day_bucket', day)

    return {
      allowed: false,
      remaining: ANON_DAILY_CREATE_LIMIT - createCount,
      abuseLevel: 'suspicious',
      reason: 'rate_limit_burst',
    }
  }

  // Increment create_count
  await supabase
    .from('anon_usage')
    .update({
      create_count: createCount + 1,
      last_seen_at: new Date().toISOString(),
    })
    .eq('anon_token_hash', signals.anonTokenHash)
    .eq('day_bucket', day)

  return {
    allowed: true,
    remaining: ANON_DAILY_CREATE_LIMIT - createCount - 1,
    abuseLevel,
  }
}

/**
 * Get current anonymous usage without incrementing.
 */
export async function getAnonUsage(
  anonTokenHash: string
): Promise<{ createCount: number; remaining: number }> {
  const supabase = createServiceClient()
  const day = todayBucket()

  const { data } = await supabase
    .from('anon_usage')
    .select('create_count')
    .eq('anon_token_hash', anonTokenHash)
    .eq('day_bucket', day)
    .single()

  const createCount = data?.create_count ?? 0
  return {
    createCount,
    remaining: Math.max(0, ANON_DAILY_CREATE_LIMIT - createCount),
  }
}

/**
 * Log an audit event for tracking.
 */
export async function logAuditEvent(params: {
  actorType: 'anonymous' | 'user' | 'system'
  actorId?: string | null
  anonTokenHash?: string | null
  fingerprintHash?: string | null
  ipHash?: string | null
  eventType: string
  status: 'success' | 'blocked' | 'rate_limited' | 'captcha_required'
  reasonCode?: AuditReasonCode | null
  metadata?: Record<string, unknown> | null
}) {
  const supabase = createServiceClient()
  await supabase.from('audit_events').insert({
    actor_type: params.actorType,
    actor_id: params.actorId ?? null,
    anon_token_hash: params.anonTokenHash ?? null,
    fingerprint_hash: params.fingerprintHash ?? null,
    ip_hash: params.ipHash ?? null,
    event_type: params.eventType,
    status: params.status,
    reason_code: params.reasonCode ?? null,
    metadata: params.metadata ?? null,
    created_at: new Date().toISOString(),
  })
}

export { hashIp }
