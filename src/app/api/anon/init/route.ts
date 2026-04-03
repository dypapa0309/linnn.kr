import { NextRequest, NextResponse } from 'next/server'
import {
  generateAnonToken,
  hashForStorage,
  verifySignedToken,
  buildAnonCookies,
  ANON_COOKIE_OPTIONS,
  ANON_SIG_COOKIE_OPTIONS,
} from '@/lib/anon/session'
import { getAnonUsage } from '@/lib/anon/quota'
import { ANON_DAILY_CREATE_LIMIT } from '@/lib/anon/quota'

/**
 * GET /api/anon/init
 * Issues or refreshes an anonymous session token.
 * Returns current usage info.
 */
export async function GET(req: NextRequest) {
  const existingToken = req.cookies.get('anon_token')?.value
  const existingSig = req.cookies.get('anon_sig')?.value

  let token: string
  let isNew = false

  // Verify existing token
  if (existingToken && existingSig && verifySignedToken(existingToken, existingSig)) {
    token = existingToken
  } else {
    token = generateAnonToken()
    isNew = true
  }

  const tokenHash = hashForStorage(token)
  const { createCount, remaining } = await getAnonUsage(tokenHash)

  const response = NextResponse.json({
    token,
    usage: {
      createCount,
      remaining,
      limit: ANON_DAILY_CREATE_LIMIT,
    },
  })

  if (isNew) {
    const { tokenCookie, sigCookie } = buildAnonCookies(token)
    response.cookies.set(tokenCookie.name, tokenCookie.value, ANON_COOKIE_OPTIONS)
    response.cookies.set(sigCookie.name, sigCookie.value, ANON_SIG_COOKIE_OPTIONS)
  }

  return response
}
