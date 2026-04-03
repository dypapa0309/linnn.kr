const steps = [
  {
    number: '01',
    title: '긴 링크 붙여넣기',
    desc: '단축하고 싶은 URL을 입력창에 넣어요.',
  },
  {
    number: '02',
    title: '만드는 방식 선택',
    desc: '자동 생성, 예쁜 추천, 직접 입력 중 하나를 골라요.',
  },
  {
    number: '03',
    title: '짧은 링크 복사',
    desc: '만들어진 링크를 복사해서 바로 사용하세요.',
  },
]

export default function HowItWorks() {
  return (
    <section id="features" className="py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">어떻게 사용하나요?</h2>
          <p className="text-gray-500 mt-2 text-sm sm:text-base">단 세 단계로 끝나요.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {steps.map((step, i) => (
            <div key={step.number} className="relative flex flex-col items-start">
              {i < steps.length - 1 && (
                <div className="hidden sm:block absolute top-5 left-[calc(100%-1rem)] w-8 h-px bg-gray-200 z-10" />
              )}
              <div className="w-10 h-10 rounded-2xl bg-accent-50 flex items-center justify-center mb-4">
                <span className="text-sm font-bold text-accent-600">{step.number}</span>
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">{step.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
