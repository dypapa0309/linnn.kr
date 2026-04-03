import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '요금제 | 링커',
  description: '링커의 요금제를 확인하세요. 무료로 시작하고, 필요할 때 업그레이드하세요.',
}

export default function PricingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">요금제</h1>
            <p className="text-gray-500 text-base sm:text-lg max-w-xl mx-auto">
              복잡하지 않아요. 무료로 시작하고 필요할 때 업그레이드하세요.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {/* Free */}
            <div className="card p-7">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-5">무료</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">₩0</span>
                <span className="text-gray-500 text-sm ml-1">/ 영원히</span>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  ['비로그인 일 5회 체험 생성', true],
                  ['로그인 시 월 30개 생성', true],
                  ['3가지 링크 생성 방식', true],
                  ['링크 저장 및 관리', true],
                  ['기본 클릭 수 확인', true],
                  ['링크 활성/비활성', true],
                ].map(([item]) => (
                  <li key={item as string} className="flex items-start gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4 text-green-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {item as string}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="btn-secondary w-full block text-center">
                로그인하고 더 많이 만들기
              </Link>
            </div>

            {/* Pro */}
            <div className="card p-7 border-accent-200 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-accent-500 text-white text-xs font-semibold px-3 py-1 rounded-bl-xl">
                준비 중
              </div>
              <p className="text-xs font-semibold text-accent-600 uppercase tracking-widest mb-5">프로</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">곧 출시</span>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  '월 1,000개 이상 생성',
                  '더 편한 링크 관리',
                  '향후 고급 분석 기능',
                  '향후 커스텀 도메인 (예정)',
                  '우선 이메일 지원',
                  '프리미엄 기능 우선 접근',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4 text-accent-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <button
                disabled
                className="btn-primary w-full opacity-50 cursor-not-allowed"
              >
                프로로 업그레이드
              </button>
              <p className="text-xs text-center text-gray-400 mt-3">출시 알림을 원하시면 로그인 후 기다려주세요.</p>
            </div>
          </div>

          {/* FAQ */}
          <div className="mt-16 max-w-2xl mx-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">자주 묻는 질문</h2>
            <div className="space-y-5">
              {[
                {
                  q: '비로그인으로도 사용할 수 있나요?',
                  a: '네, 로그인 없이도 하루 5번까지 무료로 단축 링크를 만들 수 있어요. 다만 링크를 저장하거나 관리하려면 로그인이 필요해요.',
                },
                {
                  q: '무료 플랜의 링크는 영구적인가요?',
                  a: '네, 만들어진 링크는 삭제하거나 비활성화하지 않는 한 계속 유효해요.',
                },
                {
                  q: '프로 플랜은 언제 출시되나요?',
                  a: '현재 준비 중이에요. 출시가 가까워지면 별도로 안내해드릴게요.',
                },
              ].map(({ q, a }) => (
                <div key={q} className="border-b border-gray-100 pb-5">
                  <p className="text-sm font-semibold text-gray-900 mb-1.5">{q}</p>
                  <p className="text-sm text-gray-500 leading-relaxed">{a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
