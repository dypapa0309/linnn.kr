'use client'

import { useRouter } from 'next/navigation'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://linnn.kr'

type Stats = {
  users: {
    total: number
    today: number
    week: number
    month: number
    plans: { free: number; pro: number }
  }
  links: {
    total: number
    today: number
    week: number
    month: number
    anon: number
    modes: { quick: number; recommend: number; custom: number }
    top: { slug: string; original_url: string; click_count: number; created_at: string; created_by_type: string }[]
  }
  anon: { createsToday: number }
  audit: {
    blockedToday: number
    rateLimitedToday: number
    recent: { actor_type: string; event_type: string; status: string; reason_code: string | null; created_at: string; anon_token_hash: string | null }[]
  }
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-white">{typeof value === 'number' ? value.toLocaleString() : value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">{title}</h2>
      {children}
    </div>
  )
}

const STATUS_COLOR: Record<string, string> = {
  success: 'text-green-400',
  blocked: 'text-red-400',
  rate_limited: 'text-amber-400',
  captcha_required: 'text-purple-400',
}

export default function AdminDashboardClient({ stats }: { stats: Stats }) {
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin')
  }

  const totalModes = stats.links.modes.quick + stats.links.modes.recommend + stats.links.modes.custom || 1
  const pct = (n: number) => Math.round((n / totalModes) * 100)

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 h-14 flex items-center justify-between sticky top-0 bg-gray-950 z-40">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-white">링커 어드민</span>
          <span className="text-xs text-gray-600">|</span>
          <span className="text-xs text-gray-500">linnn.kr</span>
        </div>
        <button onClick={handleLogout} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
          로그아웃
        </button>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* ── 사용자 ── */}
        <Section title="사용자">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
            <StatCard label="총 가입자" value={stats.users.total} />
            <StatCard label="오늘 신규" value={stats.users.today} />
            <StatCard label="이번 주 신규" value={stats.users.week} />
            <StatCard label="이번 달 신규" value={stats.users.month} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
              <p className="text-xs text-gray-500 mb-3">플랜 분포</p>
              <div className="space-y-2">
                {[
                  { label: '무료', count: stats.users.plans.free, color: 'bg-gray-600' },
                  { label: '프로', count: stats.users.plans.pro, color: 'bg-accent-500' },
                ].map(({ label, count, color }) => {
                  const total = stats.users.total || 1
                  return (
                    <div key={label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-400">{label}</span>
                        <span className="text-gray-300">{count}명 ({Math.round((count / total) * 100)}%)</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-800 rounded-full">
                        <div className={`h-full rounded-full ${color}`} style={{ width: `${(count / total) * 100}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
              <p className="text-xs text-gray-500 mb-3">전환율</p>
              <p className="text-3xl font-bold text-accent-400">
                {stats.users.total > 0 ? ((stats.users.plans.pro / stats.users.total) * 100).toFixed(1) : '0.0'}%
              </p>
              <p className="text-xs text-gray-500 mt-1">무료 → 프로 전환</p>
            </div>
          </div>
        </Section>

        {/* ── 링크 ── */}
        <Section title="링크">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
            <StatCard label="총 링크" value={stats.links.total} />
            <StatCard label="오늘 생성" value={stats.links.today} />
            <StatCard label="이번 주 생성" value={stats.links.week} />
            <StatCard label="이번 달 생성" value={stats.links.month} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
              <p className="text-xs text-gray-500 mb-3">생성 방식 분포</p>
              <div className="space-y-2">
                {[
                  { label: '빠르게 (자동)', count: stats.links.modes.quick },
                  { label: '예쁘게 (추천)', count: stats.links.modes.recommend },
                  { label: '직접 만들기', count: stats.links.modes.custom },
                ].map(({ label, count }) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">{label}</span>
                      <span className="text-gray-300">{count}개 ({pct(count)}%)</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-800 rounded-full">
                      <div className="h-full rounded-full bg-accent-600" style={{ width: `${pct(count)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
              <p className="text-xs text-gray-500 mb-3">생성 주체</p>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-400">로그인 사용자</p>
                  <p className="text-xl font-bold text-white">{(stats.links.total - stats.links.anon).toLocaleString()}개</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">익명 사용자</p>
                  <p className="text-xl font-bold text-gray-400">{stats.links.anon.toLocaleString()}개</p>
                </div>
              </div>
            </div>
          </div>

          {/* Top links */}
          <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
            <p className="text-xs text-gray-500 mb-4">클릭 수 Top 10</p>
            {stats.links.top.length === 0 ? (
              <p className="text-sm text-gray-600">아직 클릭 데이터가 없어요.</p>
            ) : (
              <div className="space-y-2">
                {stats.links.top.map((link, i) => (
                  <div key={link.slug} className="flex items-center gap-3 py-2 border-b border-gray-800 last:border-0">
                    <span className="text-xs text-gray-600 w-5 text-right">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <a
                        href={`${APP_URL}/${link.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-accent-400 hover:underline"
                      >
                        /{link.slug}
                      </a>
                      <p className="text-xs text-gray-600 truncate">{link.original_url}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-white">{link.click_count.toLocaleString()}</p>
                      <p className="text-xs text-gray-600">클릭</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Section>

        {/* ── 익명 사용 ── */}
        <Section title="익명 사용">
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="오늘 익명 생성 수" value={stats.anon.createsToday} sub="일 한도: 5회/인" />
            <StatCard label="총 익명 생성 링크" value={stats.links.anon} />
          </div>
        </Section>

        {/* ── 어뷰즈 / 감사 로그 ── */}
        <Section title="어뷰즈 & 감사 로그">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <StatCard label="오늘 차단 건수" value={stats.audit.blockedToday} sub="quota_exceeded 등" />
            <StatCard label="오늘 레이트 리밋" value={stats.audit.rateLimitedToday} sub="버스트 초과" />
          </div>

          <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
            <p className="text-xs text-gray-500 mb-4">최근 감사 로그 (20건)</p>
            {stats.audit.recent.length === 0 ? (
              <p className="text-sm text-gray-600">로그가 없어요.</p>
            ) : (
              <div className="space-y-1.5">
                {stats.audit.recent.map((ev, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs py-1.5 border-b border-gray-800/50 last:border-0">
                    <span className={`font-semibold w-20 shrink-0 ${STATUS_COLOR[ev.status] ?? 'text-gray-400'}`}>
                      {ev.status}
                    </span>
                    <span className="text-gray-400 w-24 shrink-0">{ev.event_type}</span>
                    <span className="text-gray-600 w-36 shrink-0">{ev.reason_code ?? '-'}</span>
                    <span className="text-gray-600 truncate">{ev.actor_type}</span>
                    <span className="text-gray-700 shrink-0 ml-auto">
                      {new Date(ev.created_at).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Section>

      </main>
    </div>
  )
}
