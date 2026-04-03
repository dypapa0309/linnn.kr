'use client'

import { useState, useEffect } from 'react'

const EXAMPLES = [
  {
    long: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms/edit',
    short: 'linnn.kr/read-docs',
    label: '구글 스프레드시트',
  },
  {
    long: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&feature=youtu.be&list=PLbpi6ZahtOH6Ar_3GPy3b2aqhJLBjH1d',
    short: 'linnn.kr/daily-pick',
    label: '유튜브 영상',
  },
  {
    long: 'https://github.com/vercel/next.js/blob/canary/packages/next/src/server/app-render/app-render.tsx',
    short: 'linnn.kr/nextjs-guide',
    label: 'GitHub 파일',
  },
]

export default function ExampleStrip() {
  const [current, setCurrent] = useState(0)
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setAnimating(true)
      setTimeout(() => {
        setCurrent((c) => (c + 1) % EXAMPLES.length)
        setAnimating(false)
      }, 300)
    }, 3000)
    return () => clearInterval(timer)
  }, [])

  const ex = EXAMPLES[current]

  return (
    <div className="w-full max-w-xl mx-auto mb-8">
      <p className="text-xs text-gray-400 text-center mb-3">이런 링크가 만들어져요</p>

      <div
        className={`card p-4 transition-opacity duration-300 ${animating ? 'opacity-0' : 'opacity-100'}`}
      >
        {/* Long URL */}
        <div className="flex items-start gap-2.5 mb-3">
          <div className="w-5 h-5 rounded-md bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
            <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <p className="text-xs text-gray-400 break-all leading-relaxed line-clamp-2">{ex.long}</p>
        </div>

        {/* Arrow */}
        <div className="flex items-center gap-2 mb-3 pl-7">
          <div className="flex-1 h-px bg-gray-100" />
          <svg className="w-4 h-4 text-accent-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          <div className="flex-1 h-px bg-gray-100" />
        </div>

        {/* Short URL */}
        <div className="flex items-center gap-2.5 pl-0">
          <div className="w-5 h-5 rounded-md bg-accent-100 flex items-center justify-center shrink-0">
            <svg className="w-3 h-3 text-accent-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-accent-600">{ex.short}</p>
          <span className="ml-auto text-xs text-gray-300">{ex.label}</span>
        </div>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-1.5 mt-3">
        {EXAMPLES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-1.5 h-1.5 rounded-full transition-all ${
              i === current ? 'bg-accent-400 w-3' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
