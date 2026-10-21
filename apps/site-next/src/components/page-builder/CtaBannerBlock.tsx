import React from 'react'
import { ArrowRight, Sparkles } from 'lucide-react'

export interface CtaBannerBlockProps {
  badge?: string
  title: string
  subtitle?: string
  primaryCtaText?: string
  primaryCtaLink?: string
  secondaryCtaText?: string
  secondaryCtaLink?: string
  theme?: 'lime' | 'dark' | 'gradient'
}

export const CtaBannerBlock: React.FC<CtaBannerBlockProps> = ({
  badge = 'Ready to Switch?',
  title,
  subtitle = 'No credit card required. Instant 14-day full access trial.',
  primaryCtaText = 'Start 14-Day Free Trial',
  primaryCtaLink = 'https://app.scryme.tech/signup',
  secondaryCtaText = 'Contact Sales',
  secondaryCtaLink = 'mailto:sales@scryme.tech',
  theme = 'lime',
}) => {
  return (
    <section className="py-16 sm:py-24 bg-[var(--bg-main)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="glass-panel-elevated relative overflow-hidden rounded-3xl p-8 sm:p-14 text-center border border-[#d2ff3a]/40 shadow-2xl">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-[#d2ff3a]/15 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 h-64 w-64 rounded-full bg-[#d2ff3a]/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto space-y-6">
            {badge && (
              <span className="inline-flex items-center gap-2 rounded-full border border-[#d2ff3a]/40 bg-[#d2ff3a]/10 px-4 py-1 text-xs font-mono-label text-[#d2ff3a] uppercase tracking-wider">
                <Sparkles className="h-3.5 w-3.5" />
                {badge}
              </span>
            )}

            <h2 className="font-serif-headline text-3xl sm:text-5xl font-normal text-[var(--text-main)] leading-tight">
              {title}
            </h2>

            {subtitle && (
              <p className="text-base sm:text-lg text-[var(--text-muted)] max-w-2xl mx-auto leading-relaxed">
                {subtitle}
              </p>
            )}

            <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
              {primaryCtaText && (
                <a
                  href={primaryCtaLink}
                  className="inline-flex items-center gap-2 rounded-full bg-[#d2ff3a] px-8 py-4 text-base font-semibold text-[#090a0b] shadow-xl shadow-[#d2ff3a]/25 hover:bg-[#c2ef2a] hover:scale-105 transition-all duration-200"
                >
                  {primaryCtaText}
                  <ArrowRight className="h-5 w-5" />
                </a>
              )}

              {secondaryCtaText && (
                <a
                  href={secondaryCtaLink}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-8 py-4 text-base font-medium text-[var(--text-main)] hover:bg-white/10 transition-all duration-200"
                >
                  {secondaryCtaText}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
