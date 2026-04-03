const SAFE_SCHEMES = ['http:', 'https:']

/** Unsafe schemes that should never be shortened */
const BLOCKED_SCHEMES = ['javascript:', 'data:', 'file:', 'vbscript:', 'blob:']

export interface NormalizeResult {
  ok: boolean
  url?: string
  error?: string
}

/**
 * Normalizes and validates a user-supplied URL.
 * - Adds https:// if no scheme is present
 * - Rejects unsafe schemes
 * - Returns the cleaned URL or an error message
 */
export function normalizeUrl(raw: string): NormalizeResult {
  const trimmed = raw.trim()
  if (!trimmed) {
    return { ok: false, error: '올바른 URL을 입력해주세요.' }
  }

  // Check for explicitly blocked schemes first
  const lowerTrimmed = trimmed.toLowerCase()
  for (const scheme of BLOCKED_SCHEMES) {
    if (lowerTrimmed.startsWith(scheme)) {
      return { ok: false, error: '지원하지 않는 주소 형식입니다.' }
    }
  }

  // Add https:// if no scheme detected
  let candidate = trimmed
  if (!candidate.includes('://')) {
    candidate = 'https://' + candidate
  }

  let parsed: URL
  try {
    parsed = new URL(candidate)
  } catch {
    return { ok: false, error: '올바른 URL을 입력해주세요.' }
  }

  if (!SAFE_SCHEMES.includes(parsed.protocol)) {
    return { ok: false, error: '지원하지 않는 주소 형식입니다.' }
  }

  // Must have a valid hostname
  if (!parsed.hostname || parsed.hostname.length < 2) {
    return { ok: false, error: '올바른 URL을 입력해주세요.' }
  }

  // Prevent shortening our own domain (loop detection)
  const appHost = process.env.NEXT_PUBLIC_APP_URL
    ? new URL(process.env.NEXT_PUBLIC_APP_URL).hostname
    : 'linnn.kr'
  if (parsed.hostname === appHost || parsed.hostname.endsWith('.' + appHost)) {
    return { ok: false, error: 'linnn.kr 링크는 단축할 수 없어요.' }
  }

  return { ok: true, url: parsed.toString() }
}

/** Extracts meaningful URL segments for slug generation */
export function extractUrlParts(rawUrl: string): {
  domain: string
  subdomain: string | null
  pathSegments: string[]
  tld: string
} {
  let parsed: URL
  try {
    parsed = new URL(rawUrl)
  } catch {
    return { domain: '', subdomain: null, pathSegments: [], tld: '' }
  }

  const hostname = parsed.hostname
  const parts = hostname.split('.')
  const tld = parts.slice(-1)[0] || ''

  let domain = ''
  let subdomain: string | null = null

  if (parts.length >= 2) {
    // e.g. www.example.co.kr → domain=example, subdomain=www, tld=kr
    const knownTwoPart = ['co.kr', 'or.kr', 'ne.kr', 'go.kr', 'com.au', 'co.uk']
    const hostTwoPart = parts.slice(-2).join('.')
    if (knownTwoPart.includes(hostTwoPart) && parts.length >= 3) {
      domain = parts[parts.length - 3]
      if (parts.length >= 4) {
        subdomain = parts.slice(0, parts.length - 3).join('.')
      }
    } else {
      domain = parts[parts.length - 2]
      const sub = parts.slice(0, parts.length - 2).join('.')
      subdomain = sub && sub !== 'www' ? sub : null
    }
  }

  const rawPath = parsed.pathname
  const pathSegments = rawPath
    .split('/')
    .filter(Boolean)
    .map((s) => s.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''))
    .filter((s) => s.length > 0 && s.length <= 20)

  return { domain, subdomain, pathSegments, tld }
}
