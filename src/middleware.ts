import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createHmac } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

const PROTECTED_ROUTES = ['/dashboard', '/settings']

function verifyAdminCookie(value: string): boolean {
  const secret = process.env.ANON_TOKEN_SECRET || 'dev-secret'
  const [payload, sig] = value.split('.')
  if (!payload || !sig || payload !== 'authenticated') return false
  const expected = createHmac('sha256', secret).update(payload).digest('hex')
  if (expected.length !== sig.length) return false
  let result = 0
  for (let i = 0; i < expected.length; i++) result |= expected.charCodeAt(i) ^ sig.charCodeAt(i)
  return result === 0
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })
  const pathname = request.nextUrl.pathname

  // Admin 보호: /admin/dashboard는 admin_session 쿠키 확인
  if (pathname.startsWith('/admin/')) {
    const adminSession = request.cookies.get('admin_session')?.value
    if (!adminSession || !verifyAdminCookie(adminSession)) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
    return response
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session
  const { data: { user } } = await supabase.auth.getUser()

  // Guard protected routes
  if (PROTECTED_ROUTES.some((p) => pathname.startsWith(p))) {
    if (!user) {
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Redirect logged-in users away from auth pages
  if ((pathname === '/login' || pathname === '/signup') && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
