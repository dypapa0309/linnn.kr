import { createHmac, randomBytes, createHash } from 'crypto'

const SECRET = process.env.ANON_TOKEN_SECRET || 'dev-secret-change-in-production'

/** Generates a new random anonymous token (UUID-style) */
export function generateAnonToken(): string {
  return randomBytes(16).toString('hex')
}

/** Signs a token with HMAC-SHA256 using the app secret */
export function signToken(token: string): string {
  return createHmac('sha256', SECRET).update(token).digest('hex')
}

/** Verifies a cookie value against its signature */
export function verifySignedToken(token: string, signature: string): boolean {
  const expected = signToken(token)
  // Constant-time comparison to prevent timing attacks
  if (expected.length !== signature.length) return false
  let result = 0
  for (let i = 0; i < expected.length; i++) {
    result |= expected.charCodeAt(i) ^ signature.charCodeAt(i)
  }
  return result === 0
}

/** Hashes a token for safe storage in the DB (no raw tokens stored) */
export function hashForStorage(value: string): string {
  return createHash('sha256').update(value + SECRET).digest('hex')
}

/** Hashes an IP address for privacy-safe storage */
export function hashIp(ip: string): string {
  return createHash('sha256').update(ip + SECRET + 'ip-salt').digest('hex').slice(0, 32)
}

/** Builds the cookie pair: `anon_token` and `anon_sig` */
export function buildAnonCookies(token: string): {
  tokenCookie: { name: string; value: string }
  sigCookie: { name: string; value: string }
} {
  return {
    tokenCookie: { name: 'anon_token', value: token },
    sigCookie: { name: 'anon_sig', value: signToken(token) },
  }
}

/** Cookie options for anon session — 30 days */
export const ANON_COOKIE_OPTIONS = {
  httpOnly: false, // needs to be readable by JS for localStorage cross-check
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24 * 30,
  path: '/',
}

/** The sig cookie is httpOnly to prevent tampering */
export const ANON_SIG_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24 * 30,
  path: '/',
}
