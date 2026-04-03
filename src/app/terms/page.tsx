import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-12 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto prose prose-sm text-gray-600">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">이용약관</h1>
          <p className="text-xs text-gray-400 mb-8">최종 수정일: 2026년 4월</p>
          <p>링커(linnn.kr) 서비스를 이용해 주셔서 감사합니다. 이 약관은 서비스 이용에 관한 기본 규칙을 안내합니다.</p>
          <h2 className="text-base font-semibold text-gray-800 mt-6 mb-2">서비스 이용</h2>
          <p>링커는 URL 단축 서비스를 제공합니다. 불법적이거나 유해한 콘텐츠를 포함하는 링크 생성은 금지됩니다.</p>
          <h2 className="text-base font-semibold text-gray-800 mt-6 mb-2">면책 조항</h2>
          <p>링커는 단축된 링크의 목적지 콘텐츠에 대해 책임지지 않습니다. 서비스는 현 상태로 제공되며, 가용성을 보장하지 않습니다.</p>
          <h2 className="text-base font-semibold text-gray-800 mt-6 mb-2">문의</h2>
          <p>문의사항이 있으시면 이메일로 연락해주세요.</p>
          <div className="mt-8">
            <Link href="/" className="text-sm text-accent-600 hover:underline">← 홈으로</Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
