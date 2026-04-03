import { NextRequest, NextResponse } from 'next/server'
import { normalizeUrl } from '@/lib/url/normalizer'
import { generateQuickSlug } from '@/lib/slug/generator'
import { validateSlug } from '@/lib/slug/validator'
import { createServiceClient, createClient as createSupabaseClient } from '@/lib/supabase/server'
import {
  verifySignedToken,
  hashForStorage,
  hashIp,
  generateAnonToken,
  buildAnonCookies,
  ANON_COOKIE_OPTIONS,
  ANON_SIG_COOKIE_OPTIONS,
} from '@/lib/anon/session'
import { checkAndIncrementAnonQuota, logAuditEvent } from '@/lib/anon/quota'
import type { CreateLinkRequest } from '@/types'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://linnn.kr'

async function resolveUniqueSlug(baseSlug: string, supabase: ReturnType<typeof createServiceClient>): Promise<string> {
  let slug = baseSlug
  let attempt = 0
  while (attempt < 10) {
    const { data } = await supabase.from('links').select('id').eq('slug', slug).single()
    if (!data) return slug
    // Append random suffix to avoid collision
    slug = `${baseSlug}-${Math.random().toString(36).slice(2, 5)}`
    attempt++
  }
  // Last resort fallback
  return `${baseSlug}-${Date.now().toString(36)}`
}

/**
 * POST /api/links
 * Creates a new short link. Handles anonymous and authenticated users.
 */
export async function POST(req: NextRequest) {
  let body: CreateLinkRequest
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: '잘못된 요청이에요.' }, { status: 400 })
  }

  const { originalUrl, mode, slug: customSlug, localId, fingerprintHash } = body

  // 1. Validate and normalize URL
  const urlResult = normalizeUrl(originalUrl ?? '')
  if (!urlResult.ok) {
    return NextResponse.json({ error: urlResult.error, code: 'invalid_url' }, { status: 422 })
  }
  const cleanUrl = urlResult.url!

  // 2. Determine actor — logged-in user or anonymous
  const supabaseAuth = await createSupabaseClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()
  const supabase = createServiceClient()

  const rawIp = req.headers.get('x-forwarded-for')?.split(',')[0] ?? ''
  const ipHash = rawIp ? hashIp(rawIp) : null

  // ── Anonymous path ──────────────────────────────────────────────────────────
  if (!user) {
    const anonToken = req.cookies.get('anon_token')?.value
    const anonSig = req.cookies.get('anon_sig')?.value

    let token: string
    let isNewToken = false

    if (anonToken && anonSig && verifySignedToken(anonToken, anonSig)) {
      token = anonToken
    } else {
      token = generateAnonToken()
      isNewToken = true
    }

    const tokenHash = hashForStorage(token)
    const localIdHash = localId ? hashForStorage(localId) : null
    const fpHash = fingerprintHash ?? null

    // Check quota
    const quotaResult = await checkAndIncrementAnonQuota({
      anonTokenHash: tokenHash,
      localIdHash,
      fingerprintHash: fpHash,
      ipHash,
    })

    if (!quotaResult.allowed) {
      await logAuditEvent({
        actorType: 'anonymous',
        anonTokenHash: tokenHash,
        fingerprintHash: fpHash,
        ipHash,
        eventType: 'link_create',
        status: quotaResult.reason === 'rate_limit_burst' ? 'rate_limited' : 'blocked',
        reasonCode: quotaResult.reason,
      })

      const isRateLimit = quotaResult.reason === 'rate_limit_burst'
      return NextResponse.json(
        {
          error: isRateLimit
            ? '요청이 너무 많아요. 잠시 후 다시 시도해주세요.'
            : '무료 체험 생성 횟수를 모두 사용했어요. 로그인하면 링크를 저장하고 더 많이 만들 수 있어요.',
          code: isRateLimit ? 'rate_limited' : 'quota_exceeded',
          remaining: quotaResult.remaining,
        },
        { status: 429 }
      )
    }

    // Resolve slug
    let finalSlug: string
    if (mode === 'custom') {
      if (!customSlug) {
        return NextResponse.json({ error: '링크 주소를 입력해주세요.', code: 'invalid_slug' }, { status: 422 })
      }
      const validation = validateSlug(customSlug)
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error, code: 'invalid_slug' }, { status: 422 })
      }
      const lower = customSlug.toLowerCase().trim()
      const { data: existing } = await supabase.from('links').select('id').eq('slug', lower).single()
      if (existing) {
        return NextResponse.json({ error: '이미 사용 중인 링크예요.', code: 'slug_taken' }, { status: 409 })
      }
      finalSlug = lower
    } else if (mode === 'recommend') {
      // For recommend mode, the client picks from suggestions; treat the provided slug as the chosen one
      if (!customSlug) {
        return NextResponse.json({ error: '추천 링크를 선택해주세요.', code: 'invalid_slug' }, { status: 422 })
      }
      finalSlug = await resolveUniqueSlug(customSlug.toLowerCase().trim(), supabase)
    } else {
      // quick mode
      const base = generateQuickSlug(cleanUrl)
      finalSlug = await resolveUniqueSlug(base, supabase)
    }

    // Insert link
    const { data: link, error: insertError } = await supabase
      .from('links')
      .insert({
        user_id: null,
        original_url: cleanUrl,
        slug: finalSlug,
        mode,
        is_active: true,
        expires_at: null,
        click_count: 0,
        created_by_type: 'anonymous',
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: '링크 생성에 실패했어요. 다시 시도해주세요.' }, { status: 500 })
    }

    await logAuditEvent({
      actorType: 'anonymous',
      anonTokenHash: tokenHash,
      fingerprintHash: fpHash,
      ipHash,
      eventType: 'link_create',
      status: 'success',
      reasonCode: 'ok',
      metadata: { slug: finalSlug, mode },
    })

    const responseBody = {
      link: {
        id: link.id,
        slug: link.slug,
        original_url: link.original_url,
        click_count: 0,
        created_at: link.created_at,
      },
      shortUrl: `${APP_URL}/${link.slug}`,
      remaining: quotaResult.remaining,
    }

    const response = NextResponse.json(responseBody, { status: 201 })
    if (isNewToken) {
      const { tokenCookie, sigCookie } = buildAnonCookies(token)
      response.cookies.set(tokenCookie.name, tokenCookie.value, ANON_COOKIE_OPTIONS)
      response.cookies.set(sigCookie.name, sigCookie.value, ANON_SIG_COOKIE_OPTIONS)
    }
    return response
  }

  // ── Authenticated path ──────────────────────────────────────────────────────
  // Check plan quota
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single()

  const plan = profile?.plan ?? 'free'

  if (plan !== 'pro') {
    // Count this month's links
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)

    const { count } = await supabase
      .from('links')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', monthStart.toISOString())

    const MONTHLY_LIMIT = 30
    if ((count ?? 0) >= MONTHLY_LIMIT) {
      return NextResponse.json(
        {
          error: '이번 달 생성 한도에 도달했어요. 프로로 업그레이드하면 더 많이 만들 수 있어요.',
          code: 'quota_exceeded',
        },
        { status: 429 }
      )
    }
  }

  // Resolve slug for authenticated users
  let finalSlug: string
  if (mode === 'custom') {
    if (!customSlug) {
      return NextResponse.json({ error: '링크 주소를 입력해주세요.', code: 'invalid_slug' }, { status: 422 })
    }
    const validation = validateSlug(customSlug)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error, code: 'invalid_slug' }, { status: 422 })
    }
    const lower = customSlug.toLowerCase().trim()
    const { data: existing } = await supabase.from('links').select('id').eq('slug', lower).single()
    if (existing) {
      return NextResponse.json({ error: '이미 사용 중인 링크예요.', code: 'slug_taken' }, { status: 409 })
    }
    finalSlug = lower
  } else if (mode === 'recommend') {
    if (!customSlug) {
      return NextResponse.json({ error: '추천 링크를 선택해주세요.', code: 'invalid_slug' }, { status: 422 })
    }
    finalSlug = await resolveUniqueSlug(customSlug.toLowerCase().trim(), supabase)
  } else {
    const base = generateQuickSlug(cleanUrl)
    finalSlug = await resolveUniqueSlug(base, supabase)
  }

  const { data: link, error: insertError } = await supabase
    .from('links')
    .insert({
      user_id: user.id,
      original_url: cleanUrl,
      slug: finalSlug,
      mode,
      is_active: true,
      expires_at: null,
      click_count: 0,
      created_by_type: 'user',
    })
    .select()
    .single()

  if (insertError) {
    return NextResponse.json({ error: '링크 생성에 실패했어요. 다시 시도해주세요.' }, { status: 500 })
  }

  return NextResponse.json(
    {
      link: {
        id: link.id,
        slug: link.slug,
        original_url: link.original_url,
        click_count: 0,
        created_at: link.created_at,
      },
      shortUrl: `${APP_URL}/${link.slug}`,
    },
    { status: 201 }
  )
}

/**
 * GET /api/links
 * Returns the current user's links.
 */
export async function GET() {
  const supabaseAuth = await createSupabaseClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: '로그인이 필요해요.' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const { data: links, error } = await supabase
    .from('links')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) {
    return NextResponse.json({ error: '링크 목록을 불러오는 데 실패했어요.' }, { status: 500 })
  }

  return NextResponse.json({ links: links ?? [] })
}
