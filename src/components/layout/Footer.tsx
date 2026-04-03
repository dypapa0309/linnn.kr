import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-gray-100 py-10 mt-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-gray-800">링커</p>
            <p className="text-xs text-gray-400 mt-0.5">linnn.kr</p>
          </div>
          <nav className="flex items-center gap-5 text-xs text-gray-400">
            <Link href="/terms" className="hover:text-gray-600 transition-colors">
              이용약관
            </Link>
            <Link href="/privacy" className="hover:text-gray-600 transition-colors">
              개인정보처리방침
            </Link>
          </nav>
        </div>
        <p className="text-xs text-gray-300 mt-6">
          © {new Date().getFullYear()} 링커. 빠르고, 덜 짜치는 짧은 링크.
        </p>
      </div>
    </footer>
  )
}
