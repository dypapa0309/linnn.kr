import { createHmac } from 'crypto'
import { cookies } from 'next/headers'

const SECRET = process.env.ANON_TOKEN_SECRET || 'dev-secret'
const COOKIE_NAME = 'admin_session'
const SESSION_VALUE = 'authenticated'

export function signAdminSession(): string {
  const sig = createHmac('sha256', SECRET).update(SESSION_VALUE).digest('hex')
  return `${SESSION_VALUE}.${sig}`
}

export function verifyAdminSession(value: string): boolean {
  const [payload, sig] = value.split('.')
  if (!payload || !sig) return false
  const expected = createHmac('sha256', SECRET).update(payload).digest('hex')
  if (expected.length !== sig.length) return false
  let result = 0
  for (let i = 0; i < expected.length; i++) {
    result |= expected.charCodeAt(i) ^ sig.charCodeAt(i)
  }
  return result === 0 && payload === SESSION_VALUE
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  const val = cookieStore.get(COOKIE_NAME)?.value
  if (!val) return false
  return verifyAdminSession(val)
}

export const ADMIN_COOKIE = {
  name: COOKIE_NAME,
  options: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 8, // 8시간
    path: '/admin',
  },
}
