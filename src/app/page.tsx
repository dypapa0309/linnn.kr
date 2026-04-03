import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import LinkCreator from '@/components/home/LinkCreator'
import ExampleStrip from '@/components/home/ExampleStrip'
import TrustStrip from '@/components/home/TrustStrip'
import HowItWorks from '@/components/home/HowItWorks'
import PricingPreview from '@/components/home/PricingPreview'
import LoginCta from '@/components/home/LoginCta'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* ── Hero ── */}
        <section className="pt-16 pb-12 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 leading-tight tracking-tight mb-4">
              빠르고, 세련된
              <br className="sm:hidden" />
              {' '}짧은 링크.
            </h1>
            <p className="text-base sm:text-lg text-gray-500 max-w-xl mx-auto mb-10 leading-relaxed">
              랜덤 문자 대신 보기 좋은 링크를 추천하고,
              <br className="hidden sm:block" />
              {' '}원하는 링크는 직접 만들 수 있어요.
            </p>

            {/* Example */}
            <ExampleStrip />

            {/* Main card */}
            <LinkCreator />

            <p className="mt-4 text-xs text-gray-400">
              링크는 짧게, 인상은 깔끔하게.
            </p>
          </div>
        </section>

        {/* ── Trust strip ── */}
        <section className="py-10 px-4 sm:px-6">
          <TrustStrip />
        </section>

        {/* ── How it works ── */}
        <HowItWorks />

        {/* ── Pricing preview ── */}
        <PricingPreview />

        {/* ── Login CTA ── */}
        <LoginCta />
      </main>

      <Footer />
    </div>
  )
}
