'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Link as LinkType, Plan } from '@/types'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://linnn.kr'

const MODE_LABELS: Record<string, string> = {
  quick: '빠르게',
  recommend: '추천',
  custom: '직접',
}

const PLAN_LABELS: Record<string, string> = {
  anonymous: '비로그인',
  free: '무료',
  pro: '프로',
}

interface Props {
  user: { id: string; email: string }
  links: LinkType[]
  plan: Plan
  monthCount: number
  monthlyLimit: number
}

export default function DashboardClient({ user, links: initialLinks, plan, monthCount, monthlyLimit }: Props) {
  const [links, setLinks] = useState(initialLinks)
  const [copying, setCopying] = useState<string | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleCopy = (slug: string) => {
    navigator.clipboard.writeText(`${APP_URL}/${slug}`)
    setCopying(slug)
    setTimeout(() => setCopying(null), 2000)
  }

  const handleToggleActive = useCallback(async (link: LinkType) => {
    setToggling(link.id)
    const res = await fetch(`/api/links/${link.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !link.is_active }),
    })
    if (res.ok) {
      setLinks((prev) => prev.map((l) => l.id === link.id ? { ...l, is_active: !l.is_active } : l))
    }
    setToggling(null)
  }, [])

  const handleDelete = useCallback(async (linkId: string) => {
    if (!confirm('이 링크를 삭제할까요?')) return
    const res = await fetch(`/api/links/${linkId}`, { method: 'DELETE' })
    if (res.ok) {
      setLinks((prev) => prev.filter((l) => l.id !== linkId))
    }
  }, [])

  const progressPct = Math.min(100, Math.round((monthCount / monthlyLimit) * 100))

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold text-gray-900">링커</Link>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 hidden sm:block">{user.email}</span>
            <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {/* Monthly usage */}
          <div className="card p-5">
            <p className="text-xs text-gray-500 mb-1">이번 달 생성 수</p>
            <div className="flex items-end gap-1.5 mb-2">
              <span className="text-2xl font-bold text-gray-900">{monthCount}</span>
              <span className="text-sm text-gray-400 pb-0.5">/ {monthlyLimit}개</span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${progressPct >= 90 ? 'bg-red-400' : 'bg-accent-500'}`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Plan */}
          <div className="card p-5">
            <p className="text-xs text-gray-500 mb-1">현재 플랜</p>
            <p className="text-2xl font-bold text-gray-900">{PLAN_LABELS[plan] ?? plan}</p>
            {plan !== 'pro' && (
              <button disabled className="mt-2 text-xs text-accent-500 opacity-50 cursor-not-allowed">
                프로 업그레이드 (준비 중)
              </button>
            )}
          </div>

          {/* Total links */}
          <div className="card p-5">
            <p className="text-xs text-gray-500 mb-1">총 링크 수</p>
            <p className="text-2xl font-bold text-gray-900">{links.length}</p>
            <p className="text-xs text-gray-400 mt-1">활성 {links.filter((l) => l.is_active).length}개</p>
          </div>
        </div>

        {/* Links section */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">내 링크</h2>
          <Link href="/#create" className="btn-primary text-xs px-4 py-2">
            + 새 링크 만들기
          </Link>
        </div>

        {links.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-700 mb-1">아직 만든 링크가 없어요.</p>
            <p className="text-xs text-gray-400 mb-5">홈에서 첫 번째 짧은 링크를 만들어보세요.</p>
            <Link href="/#create" className="btn-primary text-sm">
              첫 링크 만들기
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {links.map((link) => (
              <div
                key={link.id}
                className={`card p-4 transition-opacity ${!link.is_active ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start gap-3">
                  {/* Slug + status */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <a
                        href={`${APP_URL}/${link.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-semibold text-accent-600 hover:underline truncate"
                      >
                        linnn.kr/{link.slug}
                      </a>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        link.is_active ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'
                      }`}>
                        {link.is_active ? '활성' : '비활성'}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                        {MODE_LABELS[link.mode] ?? link.mode}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 truncate max-w-xs sm:max-w-md">
                      {link.original_url}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        {link.click_count.toLocaleString()}번 클릭
                      </span>
                      <span>{new Date(link.created_at).toLocaleDateString('ko-KR')}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleCopy(link.slug)}
                      title="복사"
                      className="p-2 rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-700 transition-colors"
                    >
                      {copying === link.slug ? (
                        <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>

                    <button
                      onClick={() => handleToggleActive(link)}
                      disabled={toggling === link.id}
                      title={link.is_active ? '비활성화' : '활성화'}
                      className="p-2 rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-700 transition-colors"
                    >
                      {link.is_active ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </button>

                    <a
                      href={link.original_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="원본 링크 열기"
                      className="p-2 rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-700 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>

                    <button
                      onClick={() => handleDelete(link.id)}
                      title="삭제"
                      className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
