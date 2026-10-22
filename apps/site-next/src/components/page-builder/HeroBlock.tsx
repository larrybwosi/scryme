import React from 'react'
import { ArrowRight, CheckCircle2, Star } from 'lucide-react'
import { urlFor } from '../../sanity/image'

export interface HeroBlockProps {
  badge?: string
  headline: string
  subtitle?: string
  primaryCtaText?: string
  primaryCtaLink?: string
  secondaryCtaText?: string
  secondaryCtaLink?: string
  image?: any
  ratingText?: string
}

export const HeroBlock: React.FC<HeroBlockProps> = ({
  badge,
  headline,
  subtitle,
  primaryCtaText = 'Start Free Trial',
  primaryCtaLink = 'https://app.scryme.tech/signup',
  secondaryCtaText = 'Book Demo',
  secondaryCtaLink,
  image,
  ratingText,
}) => {
  const imageUrl = image ? urlFor(image)?.width(1200).height(800).url() : null

  return (
    <section className="relative overflow-hidden py-20 lg:py-28">
      <div className="absolute top-1/4 left-1/2 -z-10 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#d2ff3a]/10 blur-[120px] pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7">
            {badge && (
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#d2ff3a]/30 bg-[#d2ff3a]/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#d2ff3a]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#d2ff3a] animate-pulse" />
                {badge}
              </div>
            )}

            <h1 className="font-serif-headline text-4xl font-normal tracking-tight sm:text-5xl lg:text-6xl text-[var(--text-main)] leading-[1.1]">
              {headline}
            </h1>

            {subtitle && (
              <p className="mt-6 text-lg sm:text-xl text-[var(--text-muted)] max-w-2xl leading-relaxed">
                {subtitle}
              </p>
            )}

            <div className="mt-8 flex flex-wrap items-center gap-4">
              {primaryCtaText && (
                <a
                  href={primaryCtaLink}
                  className="inline-flex items-center gap-2 rounded-full bg-[#d2ff3a] px-7 py-3.5 text-base font-semibold text-[#090a0b] shadow-lg shadow-[#d2ff3a]/25 hover:bg-[#c2ef2a] hover:scale-[1.02] transition-all duration-200"
                >
                  {primaryCtaText}
                  <ArrowRight className="h-5 w-5" />
                </a>
              )}

              {secondaryCtaText && secondaryCtaLink && (
                <a
                  href={secondaryCtaLink}
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--card-border)] bg-[var(--card-bg)] px-7 py-3.5 text-base font-medium text-[var(--text-main)] hover:bg-white/10 transition-all duration-200"
                >
                  {secondaryCtaText}
                </a>
              )}
            </div>

            {ratingText && (
              <div className="mt-8 flex items-center gap-3 text-sm text-[var(--text-muted)]">
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400" />
                  ))}
                </div>
                <span>{ratingText}</span>
              </div>
            )}
          </div>

          <div className="lg:col-span-5">
            <div className="glass-panel-elevated relative rounded-2xl p-3 sm:p-4 overflow-hidden group">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={headline}
                  className="w-full rounded-xl object-cover shadow-2xl transition-transform duration-500 group-hover:scale-[1.02]"
                />
              ) : (
                <div className="aspect-[4/3] w-full rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 p-8 flex flex-col justify-between border border-white/5">
                  <div className="flex items-center justify-between">
                    <div className="h-3 w-16 rounded-full bg-[#d2ff3a]/40" />
                    <div className="h-2 w-8 rounded-full bg-white/20" />
                  </div>
                  <div className="space-y-3">
                    <div className="h-4 w-3/4 rounded bg-white/20" />
                    <div className="h-3 w-1/2 rounded bg-white/10" />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#d2ff3a]">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Real-time Enterprise Sync</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
