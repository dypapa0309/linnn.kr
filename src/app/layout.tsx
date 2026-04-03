import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '링커 | 빠르고, 세련된 짧은 링크',
  description: '링커는 보기 좋은 짧은 링크를 빠르게 만드는 한국형 링크 단축 서비스입니다.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://linnn.kr'),
  openGraph: {
    title: '링커 | 빠르고, 세련된 짧은 링크',
    description: '링커는 보기 좋은 짧은 링크를 빠르게 만드는 한국형 링크 단축 서비스입니다.',
    url: 'https://linnn.kr',
    siteName: '링커',
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: '링커 | 빠르고, 세련된 짧은 링크',
    description: '링커는 보기 좋은 짧은 링크를 빠르게 만드는 한국형 링크 단축 서비스입니다.',
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: 'https://linnn.kr',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body>{children}</body>
    </html>
  )
}
