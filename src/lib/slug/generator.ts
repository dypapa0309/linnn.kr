import { extractUrlParts } from '../url/normalizer'
import { normalizeSlugCandidate } from './validator'
import { isReservedSlug } from './reserved'
import { FALLBACK_ADJECTIVES, FALLBACK_NOUNS } from './words'
import { generateVariantsForKeyword, generateCombinedVariants } from './variants'

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function clean(s: string): string | null {
  return normalizeSlugCandidate(s)
}

/**
 * Mode 1: 빠르게 만들기
 * URL에서 읽히는 슬러그 하나 즉시 반환.
 */
export function generateQuickSlug(url: string): string {
  const { domain, pathSegments } = extractUrlParts(url)

  if (domain && domain.length >= 3) {
    const c = clean(domain)
    if (c && !isReservedSlug(c)) return c
  }

  for (const seg of pathSegments) {
    if (seg.length >= 3 && seg.length <= 16) {
      const c = clean(seg)
      if (c && !isReservedSlug(c)) return c
    }
  }

  return `${pickRandom(FALLBACK_ADJECTIVES)}-${pickRandom(FALLBACK_NOUNS)}`
}

/**
 * Mode 2: 예쁘게 추천받기
 * URL에서 키워드를 뽑고, 각 키워드의 읽히는 변형을 대량 생성.
 * 최대 후보 풀에서 앞에서부터 최대 6개 반환.
 * (실제 DB 중복 체크는 route 핸들러에서 수행)
 */
export function generateRecommendations(url: string): string[] {
  const { domain, subdomain, pathSegments } = extractUrlParts(url)

  // 키워드 수집
  const keywords: string[] = []
  if (domain) keywords.push(domain)
  if (subdomain && subdomain !== 'www') keywords.push(subdomain)
  pathSegments.slice(0, 3).forEach((s) => keywords.push(s))

  // 각 키워드의 변형 전부 생성
  const pool: string[] = []

  for (const kw of keywords) {
    const variants = generateVariantsForKeyword(kw)
    pool.push(...variants)
  }

  // 키워드 조합 변형
  pool.push(...generateCombinedVariants(keywords))

  // 필터: 예약어 제거, 길이 조건, 중복 제거
  const filtered = Array.from(new Set(pool))
    .map((s) => clean(s))
    .filter((s): s is string => s !== null && s.length >= 3 && s.length <= 16 && !isReservedSlug(s))

  // fallback: 항상 3개 이상 보장
  while (filtered.length < 6) {
    const c = `${pickRandom(FALLBACK_ADJECTIVES)}-${pickRandom(FALLBACK_NOUNS)}`
    if (!filtered.includes(c)) filtered.push(c)
  }

  return filtered
}
