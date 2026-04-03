import { NextRequest, NextResponse } from 'next/server'
import { normalizeUrl } from '@/lib/url/normalizer'
import { generateRecommendations } from '@/lib/slug/generator'
import { createServiceClient } from '@/lib/supabase/server'

/**
 * POST /api/links/recommend
 * Returns 3–6 slug recommendations for a given URL.
 * Does NOT create a link — just generates suggestions.
 */
export async function POST(req: NextRequest) {
  let body: { originalUrl?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: '잘못된 요청이에요.' }, { status: 400 })
  }

  const urlResult = normalizeUrl(body.originalUrl ?? '')
  if (!urlResult.ok) {
    return NextResponse.json({ error: urlResult.error }, { status: 422 })
  }

  const recommendations = generateRecommendations(urlResult.url!)
  const supabase = createServiceClient()

  // Filter out slugs that are already taken
  const available: string[] = []
  for (const slug of recommendations) {
    const { data } = await supabase.from('links').select('id').eq('slug', slug).single()
    if (!data) available.push(slug)
  }

  // If all taken, generate more fallbacks
  const results = available.length >= 3 ? available : recommendations.map((s) => s + '-' + Math.random().toString(36).slice(2, 4))

  return NextResponse.json({ recommendations: results.slice(0, 6) })
}
