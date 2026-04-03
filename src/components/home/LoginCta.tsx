import Link from 'next/link'

export default function LoginCta() {
  return (
    <section className="py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="card p-8 sm:p-12 text-center max-w-2xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
            링크를 저장하고 관리하려면 로그인하세요
          </h2>
          <p className="text-sm sm:text-base text-gray-500 mb-8">
            로그인하면 내가 만든 링크를 한눈에 보고, 클릭 수도 확인할 수 있어요.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/signup" className="btn-primary">
              무료로 가입하기
            </Link>
            <Link href="/login" className="btn-secondary">
              로그인
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
