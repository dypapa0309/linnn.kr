import { extractUrlParts } from '../url/normalizer'
import { normalizeSlugCandidate } from './validator'
import { isReservedSlug } from './reserved'
import { FALLBACK_ADJECTIVES, FALLBACK_NOUNS } from './words'
import { generateVariantsForKeyword, generateCombinedVariants, DOMAIN_RULES, GENERIC_PATH_WORDS } from './variants'

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function clean(s: string): string | null {
  return normalizeSlugCandidate(s)
}

/**
 * Mode 1: 빠르게 만들기
 * URL에서 읽히는 슬러그 하나 즉시 반환.
 * 도메인 전용 규칙 → 의미있는 경로 → fallback 순.
 */
export function generateQuickSlug(url: string): string {
  const { domain, pathSegments } = extractUrlParts(url)

  // 도메인 전용 규칙 우선
  if (domain && DOMAIN_RULES[domain]) {
    const rule = DOMAIN_RULES[domain]
    const seg = pathSegments.find((s) => s.length >= 2 && !GENERIC_PATH_WORDS.has(s))
    const base = seg ? `${rule.prefix}-${seg}`.slice(0, 16) : rule.prefix
    const c = clean(base)
    if (c && !isReservedSlug(c)) return c
  }

  if (domain && domain.length >= 3) {
    const c = clean(domain)
    if (c && !isReservedSlug(c)) return c
  }

  // 의미있는 경로 (generic 단어 제외)
  for (const seg of pathSegments) {
    if (GENERIC_PATH_WORDS.has(seg)) continue
    if (seg.length >= 3 && seg.length <= 16) {
      const c = clean(seg)
      if (c && !isReservedSlug(c)) return c
    }
  }

  return `${pickRandom(FALLBACK_ADJECTIVES)}-${pickRandom(FALLBACK_NOUNS)}`
}

/**
 * Mode 2: 예쁘게 추천받기
 * 도메인 전용 규칙 → 키워드 변형 풀 → fallback 순.
 * generic 경로 단어는 키워드에서 제외.
 */
export function generateRecommendations(url: string): string[] {
  const { domain, subdomain, pathSegments } = extractUrlParts(url)

  const pool: string[] = []

  // 도메인 전용 규칙: 우선순위 높게
  if (domain && DOMAIN_RULES[domain]) {
    const rule = DOMAIN_RULES[domain]
    pool.push(...rule.suggestions)
    // 의미있는 경로 세그먼트와 조합
    const meaningfulSeg = pathSegments.find((s) => s.length >= 2 && !GENERIC_PATH_WORDS.has(s))
    if (meaningfulSeg) {
      pool.push(`${rule.prefix}-${meaningfulSeg}`.slice(0, 16))
      pool.push(`${meaningfulSeg}-${rule.prefix}`.slice(0, 16))
    }
  }

  // 키워드 수집 (generic 단어 제외)
  const keywords: string[] = []
  if (domain) keywords.push(domain)
  if (subdomain && subdomain !== 'www') keywords.push(subdomain)
  pathSegments
    .filter((s) => !GENERIC_PATH_WORDS.has(s))
    .slice(0, 3)
    .forEach((s) => keywords.push(s))

  for (const kw of keywords) {
    pool.push(...generateVariantsForKeyword(kw))
  }

  pool.push(...generateCombinedVariants(keywords))

  const filtered = Array.from(new Set(pool))
    .map((s) => clean(s))
    .filter((s): s is string => s !== null && s.length >= 3 && s.length <= 16 && !isReservedSlug(s))

  while (filtered.length < 6) {
    const c = `${pickRandom(FALLBACK_ADJECTIVES)}-${pickRandom(FALLBACK_NOUNS)}`
    if (!filtered.includes(c)) filtered.push(c)
  }

  return filtered
}
