'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export default function Header() {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) =>
      setUser(session?.user ?? null)
    )
    return () => subscription.unsubscribe()
  }, [])

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-sm border-b border-gray-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-1.5 group">
          <span className="text-xl font-bold text-gray-900 tracking-tight group-hover:text-accent-600 transition-colors">
            링커
          </span>
        </Link>

        {/* Nav */}
        <nav className="hidden sm:flex items-center gap-6 text-sm text-gray-500">
          <Link href="#features" className="hover:text-gray-900 transition-colors">
            기능
          </Link>
          <Link href="/pricing" className="hover:text-gray-900 transition-colors">
            요금
          </Link>
        </nav>

        {/* CTA */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors hidden sm:block"
              >
                내 링크
              </Link>
              <Link href="/dashboard" className="btn-primary text-xs px-4 py-2">
                대시보드
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors hidden sm:block"
              >
                로그인
              </Link>
              <Link href="/#create" className="btn-primary text-xs px-4 py-2">
                예쁜 링크 만들기
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
