'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { LinkMode } from '@/types'
import { collectFingerprintClientSide } from '@/lib/anon/fingerprint'

const LOCAL_ID_KEY = 'linker_local_id'
const ANON_TOKEN_KEY = 'linker_anon_token'

function getOrCreateLocalId(): string {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem(LOCAL_ID_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(LOCAL_ID_KEY, id)
  }
  return id
}

type CreationResult = {
  shortUrl: string
  slug: string
  remaining?: number
}

export default function LinkCreator() {
  const [url, setUrl] = useState('')
  const [mode, setMode] = useState<LinkMode>('quick')
  const [customSlug, setCustomSlug] = useState('')
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null)
  const [slugError, setSlugError] = useState('')
  const [slugSuggestions, setSlugSuggestions] = useState<string[]>([])
  const [recommendations, setRecommendations] = useState<string[]>([])
  const [selectedRec, setSelectedRec] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingRecs, setLoadingRecs] = useState(false)
  const [result, setResult] = useState<CreationResult | null>(null)
  const [error, setError] = useState('')
  const [quotaExceeded, setQuotaExceeded] = useState(false)
  const [copied, setCopied] = useState(false)
  const [fingerprintHash, setFingerprintHash] = useState('')
  const slugCheckTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Init fingerprint
  useEffect(() => {
    const fp = collectFingerprintClientSide()
    const hash = Object.values(fp).join('|')
    setFingerprintHash(hash.slice(0, 64))

    // Sync anon token from cookie to localStorage for cross-check
    const cookieToken = document.cookie
      .split('; ')
      .find((c) => c.startsWith('anon_token='))
      ?.split('=')[1]
    if (cookieToken) {
      localStorage.setItem(ANON_TOKEN_KEY, cookieToken)
    }
  }, [])

  const fetchRecommendations = useCallback(async (targetUrl: string) => {
    if (!targetUrl.trim()) return
    setLoadingRecs(true)
    try {
      const res = await fetch('/api/links/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ originalUrl: targetUrl }),
      })
      if (res.ok) {
        const data = await res.json()
        setRecommendations(data.recommendations ?? [])
        setSelectedRec(data.recommendations?.[0] ?? '')
      }
    } catch {
      // silently fail
    } finally {
      setLoadingRecs(false)
    }
  }, [])

  // When switching to recommend mode, auto-fetch
  useEffect(() => {
    if (mode === 'recommend' && url.trim()) {
      fetchRecommendations(url)
    }
  }, [mode, url, fetchRecommendations])

  // Real-time slug check
  useEffect(() => {
    if (mode !== 'custom') return
    if (!customSlug.trim()) {
      setSlugAvailable(null)
      setSlugError('')
      return
    }
    if (slugCheckTimer.current) clearTimeout(slugCheckTimer.current)
    slugCheckTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/slugs/check?slug=${encodeURIComponent(customSlug)}`)
        const data = await res.json()
        setSlugAvailable(data.available)
        setSlugError(data.available ? '' : (data.error ?? '이미 사용 중인 링크예요.'))
        setSlugSuggestions(data.suggestions ?? [])
      } catch {
        setSlugAvailable(null)
      }
    }, 400)
  }, [customSlug, mode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return
    setLoading(true)
    setError('')
    setResult(null)

    const localId = getOrCreateLocalId()

    const slugForRequest =
      mode === 'custom'
        ? customSlug
        : mode === 'recommend'
        ? selectedRec
        : undefined

    try {
      const res = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalUrl: url,
          mode,
          slug: slugForRequest,
          localId,
          fingerprintHash,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.code === 'quota_exceeded') {
          setQuotaExceeded(true)
        }
        setError(data.error ?? '링크 생성에 실패했어요.')
        return
      }

      setResult({
        shortUrl: data.shortUrl,
        slug: data.link.slug,
        remaining: data.remaining,
      })
    } catch {
      setError('서버에 연결할 수 없어요. 잠시 후 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (!result) return
    navigator.clipboard.writeText(result.shortUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleReset = () => {
    setResult(null)
    setUrl('')
    setCustomSlug('')
    setRecommendations([])
    setSelectedRec('')
    setError('')
    setQuotaExceeded(false)
  }

  return (
    <div id="create" className="w-full max-w-xl mx-auto">
      {result ? (
        // ── Result card ──
        <div className="card p-6 animate-slide-up">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
              <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-700">짧은 링크가 만들어졌어요.</p>
          </div>

          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
            <span className="flex-1 text-sm font-medium text-accent-600 truncate">{result.shortUrl}</span>
            <button
              onClick={handleCopy}
              className="shrink-0 text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-white transition-colors font-medium text-gray-600"
            >
              {copied ? '복사됨 ✓' : '복사'}
            </button>
          </div>

          <p className="text-xs text-gray-400 mt-3">복사해서 바로 사용해보세요.</p>

          {result.remaining !== undefined && result.remaining <= 1 && (
            <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-100">
              <p className="text-xs text-amber-700">
                오늘 남은 생성 횟수: <strong>{result.remaining}회</strong>
                {result.remaining === 0 && (
                  <>
                    {' '}— <a href="/login" className="underline font-semibold">로그인하면 더 많이 만들 수 있어요.</a>
                  </>
                )}
              </p>
            </div>
          )}

          <button onClick={handleReset} className="mt-4 w-full btn-secondary text-sm">
            새 링크 만들기
          </button>
        </div>
      ) : quotaExceeded ? (
        // ── Quota wall ──
        <div className="card p-6 text-center animate-slide-up">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m0 0v2m0-2h2m-2 0H10m2-6a4 4 0 100-8 4 4 0 000 8z" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">무료 체험 횟수를 모두 사용했어요.</h3>
          <p className="text-sm text-gray-500 mb-6">
            로그인하면 링크를 저장하고 더 많이 만들 수 있어요.
          </p>
          <div className="flex flex-col gap-2">
            <a href="/login" className="btn-primary w-full text-sm">
              로그인하고 계속하기
            </a>
            <a href="/signup" className="btn-secondary w-full text-sm">
              무료로 가입하기
            </a>
          </div>
        </div>
      ) : (
        // ── Creation form ──
        <form onSubmit={handleSubmit} className="card p-5 sm:p-6 space-y-4">
          {/* URL input */}
          <div>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="긴 링크를 여기에 붙여넣으세요"
              className="input-base text-base"
              autoFocus
            />
          </div>

          {/* Mode selector */}
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { id: 'quick', label: '빠르게', sub: '자동 생성' },
                { id: 'recommend', label: '예쁘게', sub: '추천받기' },
                { id: 'custom', label: '직접', sub: '만들기' },
              ] as { id: LinkMode; label: string; sub: string }[]
            ).map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  mode === m.id
                    ? 'border-accent-400 bg-accent-50 text-accent-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                }`}
              >
                <p className={`text-sm font-semibold ${mode === m.id ? 'text-accent-700' : 'text-gray-800'}`}>
                  {m.label}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{m.sub}</p>
              </button>
            ))}
          </div>

          {/* Recommend mode: show chips */}
          {mode === 'recommend' && (
            <div>
              {loadingRecs ? (
                <div className="flex items-center gap-2 py-2">
                  <div className="w-4 h-4 border-2 border-accent-300 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-gray-400">추천 링크 분석 중...</span>
                </div>
              ) : recommendations.length > 0 ? (
                <div>
                  <p className="text-xs text-gray-500 mb-2">링크를 선택하세요</p>
                  <div className="flex flex-wrap gap-2">
                    {recommendations.map((rec) => (
                      <button
                        key={rec}
                        type="button"
                        onClick={() => setSelectedRec(rec)}
                        className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                          selectedRec === rec
                            ? 'border-accent-400 bg-accent-50 text-accent-700 font-medium'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        /{rec}
                      </button>
                    ))}
                  </div>
                </div>
              ) : url.trim() ? (
                <button
                  type="button"
                  onClick={() => fetchRecommendations(url)}
                  className="text-sm text-accent-600 hover:underline"
                >
                  추천 링크 불러오기
                </button>
              ) : (
                <p className="text-xs text-gray-400">위에 링크를 입력하면 추천 링크가 나타나요.</p>
              )}
            </div>
          )}

          {/* Custom mode: slug input */}
          {mode === 'custom' && (
            <div>
              <div className="flex items-center gap-0">
                <span className="px-3 py-3 bg-gray-50 border border-r-0 border-gray-200 rounded-l-xl text-sm text-gray-500 shrink-0">
                  linnn.kr/
                </span>
                <input
                  type="text"
                  value={customSlug}
                  onChange={(e) => setCustomSlug(e.target.value.toLowerCase())}
                  placeholder="my-link"
                  className="flex-1 px-3 py-3 border border-gray-200 rounded-r-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent transition-shadow"
                />
              </div>
              {customSlug && (
                <div className="mt-1.5 flex items-center gap-1.5">
                  {slugAvailable === true && (
                    <span className="text-xs text-green-600 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      사용 가능한 링크예요
                    </span>
                  )}
                  {slugAvailable === false && (
                    <div>
                      <span className="text-xs text-red-500">{slugError}</span>
                      {slugSuggestions.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          <span className="text-xs text-gray-400">이런 링크는 어떠세요?</span>
                          {slugSuggestions.map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setCustomSlug(s)}
                              className="text-xs px-2 py-1 rounded-lg border border-gray-200 text-gray-600 hover:border-accent-300 hover:text-accent-600 transition-colors"
                            >
                              /{s}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-xl">{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={
              loading ||
              !url.trim() ||
              (mode === 'custom' && (!customSlug || slugAvailable === false)) ||
              (mode === 'recommend' && !selectedRec)
            }
            className="btn-primary w-full"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                만드는 중...
              </span>
            ) : (
              '짧은 링크 만들기'
            )}
          </button>
        </form>
      )}
    </div>
  )
}
