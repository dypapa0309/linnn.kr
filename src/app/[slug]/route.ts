import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

/**
 * GET /{slug}
 * Lightweight redirect handler. Keeps this path as fast as possible.
 * Analytics write is fire-and-forget (non-blocking).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  if (!slug || slug.length === 0) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  const supabase = createServiceClient()
  const { data: link } = await supabase
    .from('links')
    .select('id, original_url, is_active, expires_at, click_count')
    .eq('slug', slug.toLowerCase())
    .single()

  if (!link) {
    return NextResponse.redirect(new URL('/not-found?reason=unknown', req.url))
  }

  if (!link.is_active) {
    return NextResponse.redirect(new URL('/not-found?reason=inactive', req.url))
  }

  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    return NextResponse.redirect(new URL('/not-found?reason=expired', req.url))
  }

  // Fire-and-forget: increment click count and log event asynchronously
  // Using waitUntil if available (Vercel Edge), otherwise just don't await
  const analyticsPromise = (async () => {
    await supabase
      .from('links')
      .update({ click_count: link.click_count + 1 })
      .eq('id', link.id)

    // Lightweight click event
    const referrer = req.headers.get('referer') ?? null
    await supabase.from('link_click_events').insert({
      link_id: link.id,
      clicked_at: new Date().toISOString(),
      referrer: referrer ? referrer.slice(0, 256) : null,
      country_code: req.headers.get('x-vercel-ip-country') ?? null,
    })
  })()

  // Don't await — redirect immediately
  void analyticsPromise

  return NextResponse.redirect(link.original_url, { status: 302 })
}
