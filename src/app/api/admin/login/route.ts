import { NextRequest, NextResponse } from 'next/server'
import { signAdminSession, ADMIN_COOKIE } from '@/lib/admin/auth'

export async function POST(req: NextRequest) {
  const { id, password } = await req.json()

  const validId = process.env.ADMIN_ID
  const validPassword = process.env.ADMIN_PASSWORD

  if (!validId || !validPassword) {
    return NextResponse.json({ error: '서버 설정 오류' }, { status: 500 })
  }

  if (id !== validId || password !== validPassword) {
    return NextResponse.json({ error: '아이디 또는 비밀번호가 올바르지 않아요.' }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set(ADMIN_COOKIE.name, signAdminSession(), ADMIN_COOKIE.options)
  return response
}
