import React from 'react'
import * as Icons from 'lucide-react'

export interface FeatureItem {
  icon?: string
  title: string
  description?: string
  tag?: string
}

export interface FeatureGridBlockProps {
  badge?: string
  title: string
  subtitle?: string
  columns?: '2' | '3' | '4'
  features?: FeatureItem[]
}

export const FeatureGridBlock: React.FC<FeatureGridBlockProps> = ({
  badge,
  title,
  subtitle,
  columns = '3',
  features = [],
}) => {
  const getIconComponent = (iconName?: string) => {
    if (!iconName) return Icons.Zap
    const IconComp = (Icons as any)[iconName]
    return IconComp || Icons.Zap
  }

  const gridColsClass =
    columns === '2'
      ? 'grid-cols-1 md:grid-cols-2'
      : columns === '4'
        ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
        : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'

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

        <div className={`grid gap-6 ${gridColsClass}`}>
          {features.map((item, idx) => {
            const Icon = getIconComponent(item.icon)
            return (
              <div
                key={idx}
                className="glass-panel group relative rounded-2xl p-6 sm:p-8 transition-all duration-300 hover:border-[#d2ff3a]/40 hover:-translate-y-1"
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#d2ff3a]/10 text-[#d2ff3a] border border-[#d2ff3a]/20 group-hover:bg-[#d2ff3a] group-hover:text-[#090a0b] transition-colors">
                    <Icon className="h-6 w-6" />
                  </div>
                  {item.tag && (
                    <span className="rounded-full bg-white/5 border border-white/10 px-2.5 py-1 text-[11px] font-mono-label text-[var(--text-muted)]">
                      {item.tag}
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-[var(--text-main)] mb-2">
                  {item.title}
                </h3>
                {item.description && (
                  <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                    {item.description}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
