import { NextRequest, NextResponse } from 'next/server'
import { validateSlug, generateAlternatives } from '@/lib/slug/validator'
import { createServiceClient } from '@/lib/supabase/server'
import { verifySignedToken, hashForStorage } from '@/lib/anon/session'

const SLUG_CHECK_BURST_LIMIT = 10
const SLUG_CHECK_WINDOW_MS = 60_000

// In-memory rate limit for slug checks per anon token (simple, server-scoped)
const slugCheckCounts = new Map<string, { count: number; windowStart: number }>()

function checkSlugCheckRateLimit(key: string): boolean {
  const now = Date.now()
  const entry = slugCheckCounts.get(key)
  if (!entry || now - entry.windowStart > SLUG_CHECK_WINDOW_MS) {
    slugCheckCounts.set(key, { count: 1, windowStart: now })
    return true
  }
  if (entry.count >= SLUG_CHECK_BURST_LIMIT) return false
  entry.count++
  return true
}

/**
 * GET /api/slugs/check?slug=...
 * Checks slug availability and returns suggestions if taken.
 */
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug') ?? ''

  // Rate limit by anon token or IP
  const anonToken = req.cookies.get('anon_token')?.value
  const anonSig = req.cookies.get('anon_sig')?.value
  let rateLimitKey = req.headers.get('x-forwarded-for') ?? 'unknown'

  if (anonToken && anonSig && verifySignedToken(anonToken, anonSig)) {
    rateLimitKey = hashForStorage(anonToken)
  }

  if (!checkSlugCheckRateLimit(rateLimitKey)) {
    return NextResponse.json(
      { available: false, error: '요청이 너무 많아요. 잠시 후 다시 시도해주세요.' },
      { status: 429 }
    )
  }

  const validation = validateSlug(slug)
  if (!validation.valid) {
    return NextResponse.json({ available: false, error: validation.error })
  }

  const normalized = slug.toLowerCase().trim()
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('links')
    .select('id')
    .eq('slug', normalized)
    .single()

  if (data) {
    const suggestions = generateAlternatives(normalized)
    return NextResponse.json({
      available: false,
      error: '이미 사용 중인 링크예요.',
      suggestions,
    })
  }

  return NextResponse.json({ available: true })
}
