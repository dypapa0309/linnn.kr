import { createHash } from 'crypto'

/**
 * Lightweight, privacy-conscious fingerprint hash.
 * Inputs should be collected client-side and sent to the server.
 * We do NOT store raw values — only a hash.
 */
export interface FingerprintData {
  ua: string        // user agent
  lang: string      // navigator.language
  tz: string        // Intl.DateTimeFormat().resolvedOptions().timeZone
  platform: string  // navigator.platform
  screen: string    // e.g. "1920x1080"
}

export function hashFingerprint(data: FingerprintData): string {
  const raw = [data.ua, data.lang, data.tz, data.platform, data.screen]
    .map((s) => (s || '').trim().toLowerCase())
    .join('|')
  return createHash('sha256').update(raw).digest('hex').slice(0, 32)
}

/**
 * Client-side fingerprint collector script (returned as a string to be used in useEffect).
 * Returns a FingerprintData object — no eval or dynamic execution needed.
 */
export function collectFingerprintClientSide(): FingerprintData {
  if (typeof window === 'undefined') {
    return { ua: '', lang: '', tz: '', platform: '', screen: '' }
  }
  return {
    ua: navigator.userAgent || '',
    lang: navigator.language || '',
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
    platform: navigator.platform || '',
    screen: `${window.screen.width}x${window.screen.height}`,
  }
}
