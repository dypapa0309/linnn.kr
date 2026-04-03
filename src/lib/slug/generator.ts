import { extractUrlParts } from '../url/normalizer'
import { normalizeSlugCandidate } from './validator'
import { isReservedSlug } from './reserved'
import { FALLBACK_ADJECTIVES, FALLBACK_NOUNS } from './words'

/** Pseudo-random seeded from current time — deterministic per call for testing */
function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/**
 * Mode 1: 빠르게 만들기
 * Generates one readable slug from the URL.
 * Returns a string guaranteed to pass basic validation (not reserved, correct format).
 */
export function generateQuickSlug(url: string): string {
  const { domain, pathSegments } = extractUrlParts(url)

  // Try domain name first
  if (domain && domain.length >= 3) {
    const candidate = normalizeSlugCandidate(domain)
    if (candidate && candidate.length >= 3 && !isReservedSlug(candidate)) {
      return candidate
    }
  }

  // Try first meaningful path segment
  for (const seg of pathSegments) {
    if (seg.length >= 3 && seg.length <= 16) {
      const candidate = normalizeSlugCandidate(seg)
      if (candidate && !isReservedSlug(candidate)) {
        return candidate
      }
    }
  }

  // Fallback: adjective + noun
  const adj = pickRandom(FALLBACK_ADJECTIVES)
  const noun = pickRandom(FALLBACK_NOUNS)
  return `${adj}-${noun}`
}

/**
 * Mode 2: 예쁘게 추천받기
 * Generates 3–6 diverse slug recommendations from URL analysis.
 */
export function generateRecommendations(url: string): string[] {
  const { domain, subdomain, pathSegments } = extractUrlParts(url)
  const candidates: string[] = []

  // 1. Raw domain
  if (domain && domain.length >= 3) {
    const c = normalizeSlugCandidate(domain)
    if (c) candidates.push(c)
  }

  // 2. Subdomain + domain combo
  if (subdomain && subdomain !== 'www') {
    const combined = normalizeSlugCandidate(`${subdomain}-${domain}`)
    if (combined) candidates.push(combined)
  }

  // 3. Domain + first path segment
  if (domain && pathSegments.length > 0) {
    const seg = pathSegments[0]
    if (seg.length >= 2 && seg !== domain) {
      const c = normalizeSlugCandidate(`${domain}-${seg}`)
      if (c) candidates.push(c)
    }
  }

  // 4. First path segment alone
  if (pathSegments.length > 0) {
    const c = normalizeSlugCandidate(pathSegments[0])
    if (c && c.length >= 3 && !candidates.includes(c)) candidates.push(c)
  }

  // 5. Second path segment
  if (pathSegments.length > 1) {
    const c = normalizeSlugCandidate(pathSegments[1])
    if (c && c.length >= 3 && !candidates.includes(c)) candidates.push(c)
  }

  // 6. Fallback: adj-noun combinations (up to 2)
  const needed = 3 - candidates.length
  if (needed > 0) {
    for (let i = 0; i < needed + 2; i++) {
      const adj = pickRandom(FALLBACK_ADJECTIVES)
      const noun = pickRandom(FALLBACK_NOUNS)
      const c = `${adj}-${noun}`
      if (!candidates.includes(c)) {
        candidates.push(c)
        if (candidates.length >= 6) break
      }
    }
  }

  // Filter and deduplicate, cap at 6
  const unique = Array.from(new Set(candidates))
    .filter((s) => s.length >= 3 && s.length <= 16 && !isReservedSlug(s))
    .slice(0, 6)

  // Guarantee at least 3 by padding with fallbacks
  while (unique.length < 3) {
    const adj = pickRandom(FALLBACK_ADJECTIVES)
    const noun = pickRandom(FALLBACK_NOUNS)
    const c = `${adj}-${noun}`
    if (!unique.includes(c)) unique.push(c)
  }

  return unique
}
