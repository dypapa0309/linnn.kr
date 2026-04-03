import { NextRequest, NextResponse } from 'next/server'
import { normalizeUrl } from '@/lib/url/normalizer'
import { generateRecommendations } from '@/lib/slug/generator'
import { createServiceClient } from '@/lib/supabase/server'
import { FALLBACK_ADJECTIVES, FALLBACK_NOUNS } from '@/lib/slug/words'

/**
 * POST /api/links/recommend
 * URL을 분석해서 읽히는 슬러그 추천 6개 반환.
 * 이미 사용 중인 슬러그는 건너뛰고, 후보 풀에서 available한 것만 선택.
 * 랜덤 문자열 suffix 없음.
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

  // 후보 풀 생성 (최대 수백 개)
  const candidates = generateRecommendations(urlResult.url!)
  const supabase = createServiceClient()

  // 병렬로 가용성 확인 (최대 30개까지만 체크해서 DB 부하 방지)
  const toCheck = candidates.slice(0, 30)
  const results = await Promise.all(
    toCheck.map(async (slug) => {
      const { data } = await supabase.from('links').select('id').eq('slug', slug).single()
      return { slug, available: !data }
    })
  )

  const available = results.filter((r) => r.available).map((r) => r.slug)

  // 6개 확보될 때까지 fallback adj-noun으로 채우기 (이것도 랜덤 아닌 조합)
  let attempts = 0
  while (available.length < 6 && attempts < 20) {
    attempts++
    const adj = FALLBACK_ADJECTIVES[Math.floor(Math.random() * FALLBACK_ADJECTIVES.length)]
    const noun = FALLBACK_NOUNS[Math.floor(Math.random() * FALLBACK_NOUNS.length)]
    const fallback = `${adj}-${noun}`
    if (available.includes(fallback)) continue
    const { data } = await supabase.from('links').select('id').eq('slug', fallback).single()
    if (!data) available.push(fallback)
  }

  return NextResponse.json({ recommendations: available.slice(0, 6) })
}
