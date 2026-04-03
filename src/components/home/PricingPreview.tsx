import Link from 'next/link'

export default function PricingPreview() {
  return (
    <section id="pricing-preview" className="py-16 bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">간단한 요금제</h2>
          <p className="text-gray-500 mt-2 text-sm sm:text-base">복잡하지 않아요. 필요한 만큼만.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* Free */}
          <div className="card p-6">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">무료</p>
            <p className="text-3xl font-bold text-gray-900 mb-1">
              ₩0
            </p>
            <p className="text-sm text-gray-500 mb-6">로그인 없이도 체험 가능</p>
            <ul className="space-y-2.5 mb-8 text-sm text-gray-600">
              {[
                '비로그인 일 5회 체험',
                '로그인 시 월 30개 생성',
                '링크 저장 및 관리',
                '기본 클릭 수 확인',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/signup" className="btn-secondary w-full text-sm block text-center">
              무료로 시작하기
            </Link>
          </div>

          {/* Pro */}
          <div className="card p-6 border-accent-200 bg-gradient-to-b from-accent-50/50">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold text-accent-600 uppercase tracking-widest">프로</p>
              <span className="text-xs px-2 py-1 rounded-full bg-accent-100 text-accent-700 font-medium">준비 중</span>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">
              곧 출시
            </p>
            <p className="text-sm text-gray-500 mb-6">더 넉넉한 한도와 기능</p>
            <ul className="space-y-2.5 mb-8 text-sm text-gray-600">
              {[
                '월 1,000개 이상 생성',
                '더 편한 링크 관리',
                '향후 고급 기능 제공 예정',
                '우선 지원',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-accent-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
            <button disabled className="btn-primary w-full text-sm opacity-50 cursor-not-allowed">
              프로로 업그레이드
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
