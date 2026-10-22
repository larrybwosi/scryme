import React from 'react'

export interface StatItem {
  value: string
  label: string
  subtext?: string
}

export interface StatsBarBlockProps {
  title?: string
  subtitle?: string
  stats?: StatItem[]
}

export const StatsBarBlock: React.FC<StatsBarBlockProps> = ({
  title,
  subtitle,
  stats = [],
}) => {
  return (
    <section className="py-16 bg-[var(--bg-main)] border-y border-[var(--card-border)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {(title || subtitle) && (
          <div className="text-center max-w-2xl mx-auto mb-12">
            {title && (
              <h2 className="font-serif-headline text-2xl sm:text-3xl font-normal text-[var(--text-main)]">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                {subtitle}
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className="glass-panel rounded-2xl p-6 flex flex-col items-center justify-center border border-white/5"
            >
              <div className="font-mono-label text-3xl sm:text-4xl lg:text-5xl font-bold text-[#d2ff3a] tracking-tight">
                {stat.value}
              </div>
              <div className="mt-2 font-semibold text-sm sm:text-base text-[var(--text-main)]">
                {stat.label}
              </div>
              {stat.subtext && (
                <div className="mt-1 text-xs text-[var(--text-muted)]">
                  {stat.subtext}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
