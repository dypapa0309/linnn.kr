// ─── Plan / User ──────────────────────────────────────────────────────────────

export type Plan = 'anonymous' | 'free' | 'pro'

export type ActorType = 'anonymous' | 'user' | 'system'

export interface Profile {
  id: string
  email: string
  plan: Plan
  created_at: string
  updated_at: string
}

// ─── Links ────────────────────────────────────────────────────────────────────

export type LinkMode = 'quick' | 'recommend' | 'custom'

export type CreatedByType = 'anonymous' | 'user'

export interface Link {
  id: string
  user_id: string | null
  original_url: string
  slug: string
  mode: LinkMode
  is_active: boolean
  expires_at: string | null
  click_count: number
  created_by_type: CreatedByType
  created_at: string
  updated_at: string
}

// ─── Anonymous usage ──────────────────────────────────────────────────────────

export interface AnonUsage {
  id: string
  anon_token_hash: string
  local_id_hash: string | null
  fingerprint_hash: string | null
  ip_hash: string | null
  day_bucket: string // YYYY-MM-DD
  create_count: number
  slug_check_count: number
  abuse_score: number
  last_seen_at: string
  created_at: string
  updated_at: string
}

// ─── Audit ────────────────────────────────────────────────────────────────────

export type AuditEventStatus = 'success' | 'blocked' | 'rate_limited' | 'captcha_required'

export type AuditReasonCode =
  | 'daily_quota_exceeded'
  | 'rate_limit_burst'
  | 'abuse_score_elevated'
  | 'slug_check_limit'
  | 'captcha_required'
  | 'ok'

export interface AuditEvent {
  id: string
  actor_type: ActorType
  actor_id: string | null
  anon_token_hash: string | null
  fingerprint_hash: string | null
  ip_hash: string | null
  event_type: string
  status: AuditEventStatus
  reason_code: AuditReasonCode | null
  metadata: Record<string, unknown> | null
  created_at: string
}

// ─── API shapes ───────────────────────────────────────────────────────────────

export interface CreateLinkRequest {
  originalUrl: string
  mode: LinkMode
  slug?: string // required for custom mode
  anonToken?: string
  localId?: string
  fingerprintHash?: string
}

export interface CreateLinkResponse {
  link?: Pick<Link, 'id' | 'slug' | 'original_url' | 'click_count' | 'created_at'>
  shortUrl?: string
  error?: string
  code?: 'quota_exceeded' | 'rate_limited' | 'captcha_required' | 'slug_taken' | 'invalid_url' | 'invalid_slug'
}

export interface SlugCheckResponse {
  available: boolean
  suggestions?: string[]
  error?: string
}

export interface InitAnonResponse {
  token: string
  usage: {
    createCount: number
    remaining: number
    limit: number
  }
}

export type AbuseLevel = 'normal' | 'suspicious' | 'very_suspicious'

export interface QuotaCheckResult {
  allowed: boolean
  remaining: number
  abuseLevel: AbuseLevel
  reason?: AuditReasonCode
}
