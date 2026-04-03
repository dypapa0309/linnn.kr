import { isReservedSlug } from './reserved'

const SLUG_REGEX = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/

export interface SlugValidationResult {
  valid: boolean
  error?: string
}

/**
 * Validates a user-supplied custom slug.
 * Returns { valid: true } or { valid: false, error: '...' }
 */
export function validateSlug(slug: string): SlugValidationResult {
  if (!slug || slug.trim() === '') {
    return { valid: false, error: '링크 주소를 입력해주세요.' }
  }

  const s = slug.trim().toLowerCase()

  if (s.length < 3) {
    return { valid: false, error: '링크 주소는 3자 이상이어야 해요.' }
  }

  if (s.length > 32) {
    return { valid: false, error: '링크 주소는 32자 이하여야 해요.' }
  }

  if (!SLUG_REGEX.test(s)) {
    return {
      valid: false,
      error: '영문 소문자, 숫자, 하이픈(-)만 사용할 수 있어요. 하이픈으로 시작하거나 끝낼 수 없어요.',
    }
  }

  if (s.includes('--')) {
    return { valid: false, error: '하이픈을 연속으로 사용할 수 없어요.' }
  }

  if (isReservedSlug(s)) {
    return { valid: false, error: '사용할 수 없는 링크 주소예요.' }
  }

  return { valid: true }
}

/**
 * Cleans and normalizes a raw candidate slug from URL parsing.
 * Returns null if the result is unusable.
 */
export function normalizeSlugCandidate(raw: string): string | null {
  const s = raw
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32)

  if (s.length < 2) return null
  if (isReservedSlug(s)) return null
  return s
}

/**
 * Generates alternative slug suggestions when requested slug is taken.
 * e.g. "leaf" → ["leaf-2", "leaf-go", "leaf-link", "leaf-now"]
 */
export function generateAlternatives(base: string): string[] {
  const suffixes = ['2', 'go', 'link', 'now', 'here', 'kr', 'io']
  const results: string[] = []

  for (const suffix of suffixes) {
    const candidate = `${base}-${suffix}`
    if (candidate.length <= 32 && !isReservedSlug(candidate)) {
      results.push(candidate)
    }
    if (results.length >= 4) break
  }

  return results
}
