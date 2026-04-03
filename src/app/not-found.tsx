import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">존재하지 않는 링크입니다.</h1>
        <p className="text-sm text-gray-500 mb-8">
          링크가 삭제됐거나, 만료됐거나, 주소가 잘못됐을 수 있어요.
        </p>
        <Link href="/" className="btn-primary">
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  )
}
