import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-12 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-gray-600">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">개인정보처리방침</h1>
          <p className="text-xs text-gray-400 mb-8">최종 수정일: 2026년 4월</p>
          <div className="space-y-6 text-sm leading-relaxed">
            <section>
              <h2 className="text-base font-semibold text-gray-800 mb-2">수집하는 정보</h2>
              <p>링커는 서비스 운영을 위해 다음 정보를 수집할 수 있습니다:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-gray-500">
                <li>이메일 주소 (로그인 시)</li>
                <li>입력하신 URL 정보</li>
                <li>클릭 수 및 사용 통계 (익명화 처리)</li>
                <li>서비스 안정성을 위한 비식별 기술 정보</li>
              </ul>
            </section>
            <section>
              <h2 className="text-base font-semibold text-gray-800 mb-2">정보 이용 목적</h2>
              <p className="text-gray-500">수집된 정보는 서비스 제공, 어뷰징 방지, 서비스 개선 목적으로만 사용됩니다. 제3자에게 판매하지 않습니다.</p>
            </section>
            <section>
              <h2 className="text-base font-semibold text-gray-800 mb-2">쿠키</h2>
              <p className="text-gray-500">링커는 익명 사용 추적 및 세션 관리를 위해 쿠키를 사용합니다.</p>
            </section>
            <section>
              <h2 className="text-base font-semibold text-gray-800 mb-2">정보 보관 및 삭제</h2>
              <p className="text-gray-500">계정 삭제 요청 시 관련 정보를 삭제합니다. 익명 사용 기록은 30일 이후 자동 삭제됩니다.</p>
            </section>
          </div>
          <div className="mt-8">
            <Link href="/" className="text-sm text-accent-600 hover:underline">← 홈으로</Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
