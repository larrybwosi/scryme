import React from 'react'
import { Check, X, HelpCircle, ShieldCheck, Zap } from 'lucide-react'
import { urlFor } from '../../sanity/image'

export interface FeatureRow {
  featureName: string
  featureDescription?: string
  scrymeSupport?: 'full' | 'partial' | 'none'
  scrymeValueText?: string
  competitorSupport?: 'full' | 'partial' | 'none'
  competitorValueText?: string
}

export interface FeatureCategory {
  categoryName: string
  features: FeatureRow[]
}

export interface ComparisonMatrixBlockProps {
  title?: string
  description?: string
  competitorName: string
  competitorLogo?: any
  scrymeBadge?: string
  categories?: FeatureCategory[]
  verdictTitle?: string
  verdictText?: string
}

export const ComparisonMatrixBlock: React.FC<ComparisonMatrixBlockProps> = ({
  title = 'Feature-by-Feature Head-to-Head Comparison',
  description,
  competitorName,
  competitorLogo,
  scrymeBadge = 'Winner • Next-Gen ERP',
  categories = [],
  verdictTitle,
  verdictText,
}) => {
  const competitorLogoUrl = competitorLogo ? urlFor(competitorLogo)?.width(160).url() : null

  const renderStatus = (support?: 'full' | 'partial' | 'none', note?: string, isScryme = false) => {
    if (support === 'full') {
      return (
        <div className="flex flex-col items-center justify-center gap-1 text-center">
          <div
            className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${
              isScryme
                ? 'bg-[#d2ff3a] text-[#090a0b] shadow-md shadow-[#d2ff3a]/20'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            }`}
          >
            <Check className="h-5 w-5 stroke-[3]" />
          </div>
          {note && <span className="text-xs text-[var(--text-muted)] font-medium mt-0.5">{note}</span>}
        </div>
      )
    }

    if (support === 'partial') {
      return (
        <div className="flex flex-col items-center justify-center gap-1 text-center">
          <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <HelpCircle className="h-4 w-4" />
          </div>
          {note && <span className="text-xs text-amber-400/90 font-medium">{note}</span>}
        </div>
      )
    }

    return (
      <div className="flex flex-col items-center justify-center gap-1 text-center">
        <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <X className="h-4 w-4 stroke-[2.5]" />
        </div>
        {note && <span className="text-xs text-rose-400/80 font-medium">{note}</span>}
      </div>
    )
  }

  return (
    <section className="py-20 bg-[var(--bg-main)] relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-mono-label uppercase text-[#d2ff3a] mb-4">
            <Zap className="h-3.5 w-3.5" /> Direct Head-to-Head
          </div>
          <h2 className="font-serif-headline text-3xl sm:text-4xl font-normal text-[var(--text-main)]">
            {title}
          </h2>
          {description && (
            <p className="mt-4 text-base sm:text-lg text-[var(--text-muted)] leading-relaxed">
              {description}
            </p>
          )}
        </div>

        <div className="glass-panel rounded-2xl overflow-hidden border border-[var(--card-border)] shadow-2xl">
          <div className="grid grid-cols-12 bg-white/5 border-b border-[var(--card-border)] p-4 sm:p-6 items-center sticky top-0 backdrop-blur-md z-10">
            <div className="col-span-6 sm:col-span-6 text-sm sm:text-base font-semibold text-[var(--text-main)]">
              Feature Capabilities
            </div>
            <div className="col-span-3 sm:col-span-3 text-center">
              <div className="inline-flex flex-col items-center">
                <span className="text-xs font-mono-label text-[#d2ff3a] uppercase tracking-wider mb-1">
                  {scrymeBadge}
                </span>
                <span className="text-lg sm:text-xl font-bold text-[var(--text-main)]">
                  Scryme
                </span>
              </div>
            </div>
            <div className="col-span-3 sm:col-span-3 text-center">
              <div className="inline-flex flex-col items-center">
                {competitorLogoUrl ? (
                  <img
                    src={competitorLogoUrl}
                    alt={competitorName}
                    className="h-6 sm:h-8 object-contain mb-1"
                  />
                ) : (
                  <span className="text-xs font-mono-label text-[var(--text-muted)] uppercase tracking-wider mb-1">
                    Competitor
                  </span>
                )}
                <span className="text-lg sm:text-xl font-bold text-[var(--text-muted)]">
                  {competitorName}
                </span>
              </div>
            </div>
          </div>

          <div className="divide-y divide-[var(--card-border)]">
            {categories.map((category, catIdx) => (
              <div key={catIdx} className="bg-transparent">
                <div className="bg-white/5 px-4 py-3 sm:px-6 text-xs font-mono-label uppercase tracking-widest text-[#d2ff3a] font-semibold">
                  {category.categoryName}
                </div>
                <div className="divide-y divide-[var(--card-border)]">
                  {category.features.map((feature, featIdx) => (
                    <div
                      key={featIdx}
                      className="grid grid-cols-12 p-4 sm:p-6 items-center hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="col-span-6 sm:col-span-6 pr-2">
                        <div className="font-medium text-sm sm:text-base text-[var(--text-main)]">
                          {feature.featureName}
                        </div>
                        {feature.featureDescription && (
                          <p className="text-xs text-[var(--text-muted)] mt-1 hidden sm:block">
                            {feature.featureDescription}
                          </p>
                        )}
                      </div>
                      <div className="col-span-3 sm:col-span-3 border-x border-[var(--card-border)]/50 py-1 bg-[#d2ff3a]/[0.02]">
                        {renderStatus(feature.scrymeSupport, feature.scrymeValueText, true)}
                      </div>
                      <div className="col-span-3 sm:col-span-3 py-1">
                        {renderStatus(feature.competitorSupport, feature.competitorValueText, false)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {(verdictTitle || verdictText) && (
          <div className="mt-12 glass-panel-elevated rounded-2xl p-6 sm:p-8 border border-[#d2ff3a]/30">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-3xl">
                <div className="inline-flex items-center gap-2 text-xs font-mono-label text-[#d2ff3a] uppercase">
                  <ShieldCheck className="h-4 w-4" /> Bottom Line Verdict
                </div>
                {verdictTitle && (
                  <h3 className="font-serif-headline text-xl sm:text-2xl font-normal text-[var(--text-main)]">
                    {verdictTitle}
                  </h3>
                )}
                {verdictText && (
                  <p className="text-sm sm:text-base text-[var(--text-muted)] leading-relaxed">
                    {verdictText}
                  </p>
                )}
              </div>
              <a
                href="https://app.scryme.tech/signup"
                className="shrink-0 rounded-full bg-[#d2ff3a] px-6 py-3 text-sm font-semibold text-[#090a0b] hover:bg-[#c2ef2a] transition-all"
              >
                Migrate to Scryme Free
              </a>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
