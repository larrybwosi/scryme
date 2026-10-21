import React from 'react'
import { Star, ArrowRightLeft } from 'lucide-react'
import { urlFor } from '../../sanity/image'

export interface TestimonialItem {
  quote: string
  authorName: string
  authorRole?: string
  companyName?: string
  avatar?: any
  rating?: number
  switchedFrom?: string
}

export interface TestimonialsBlockProps {
  badge?: string
  title?: string
  subtitle?: string
  items?: TestimonialItem[]
}

export const TestimonialsBlock: React.FC<TestimonialsBlockProps> = ({
  badge = 'Customer Reviews',
  title = 'Trusted by high-growth merchants across East Africa',
  subtitle,
  items = [],
}) => {
  return (
    <section className="py-20 bg-[var(--bg-main)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          {badge && (
            <span className="inline-block rounded-full border border-[#d2ff3a]/30 bg-[#d2ff3a]/10 px-3.5 py-1 text-xs font-mono-label text-[#d2ff3a] uppercase tracking-wider mb-4">
              {badge}
            </span>
          )}
          <h2 className="font-serif-headline text-3xl sm:text-4xl font-normal text-[var(--text-main)]">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-4 text-base sm:text-lg text-[var(--text-muted)] leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, idx) => {
            const avatarUrl = item.avatar ? urlFor(item.avatar)?.width(100).height(100).url() : null
            const ratingCount = item.rating || 5

            return (
              <div
                key={idx}
                className="glass-panel rounded-2xl p-6 sm:p-8 flex flex-col justify-between relative border border-[var(--card-border)] hover:border-white/20 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex text-amber-400">
                      {[...Array(ratingCount)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-amber-400" />
                      ))}
                    </div>
                    {item.switchedFrom && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#d2ff3a]/10 border border-[#d2ff3a]/20 px-2.5 py-0.5 text-[11px] font-mono-label text-[#d2ff3a]">
                        <ArrowRightLeft className="h-3 w-3" />
                        {item.switchedFrom}
                      </span>
                    )}
                  </div>

                  <p className="text-sm sm:text-base text-[var(--text-main)] leading-relaxed italic mb-6">
                    "{item.quote}"
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-[var(--card-border)]/50">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={item.authorName}
                      className="h-10 w-10 rounded-full object-cover border border-white/10"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 border border-white/10 flex items-center justify-center text-xs font-bold text-white">
                      {item.authorName.charAt(0)}
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-semibold text-[var(--text-main)]">
                      {item.authorName}
                    </div>
                    {(item.authorRole || item.companyName) && (
                      <div className="text-xs text-[var(--text-muted)]">
                        {item.authorRole}
                        {item.authorRole && item.companyName ? ' • ' : ''}
                        {item.companyName}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
